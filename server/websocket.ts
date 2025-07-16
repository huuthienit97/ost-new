import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { verifyToken } from './auth';
import { db } from './db';
import { notifications, notificationStatus, users } from '@shared/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  username?: string;
}

class NotificationWebSocketServer {
  private wss: WebSocketServer;
  private connectedClients: Map<number, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private verifyClient(info: any): boolean {
    try {
      const url = new URL(info.req.url, `http://${info.req.headers.host}`);
      const token = url.searchParams.get('token');
      
      console.log('WebSocket verification - URL:', info.req.url);
      console.log('WebSocket verification - Token present:', !!token);
      
      if (!token) {
        console.log('WebSocket verification failed: No token');
        return false;
      }

      const decoded = verifyToken(token);
      console.log('WebSocket verification - Token valid:', !!decoded);
      if (decoded) {
        console.log('WebSocket verification - User ID:', decoded.id);
      }
      
      return !!decoded;
    } catch (error) {
      console.error('WebSocket verification failed:', error);
      return false;
    }
  }

  private async handleConnection(ws: AuthenticatedWebSocket, request: any) {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(4001, 'No token provided');
        return;
      }

      const decoded = verifyToken(token);
      if (!decoded || !decoded.id) {
        ws.close(4002, 'Invalid token');
        return;
      }

      ws.userId = decoded.id;
      ws.username = decoded.username;

      // Add to connected clients
      if (!this.connectedClients.has(decoded.id)) {
        this.connectedClients.set(decoded.id, new Set());
      }
      this.connectedClients.get(decoded.id)!.add(ws);

      console.log(`WebSocket connected: User ${decoded.username} (ID: ${decoded.id})`);

      // Send initial data
      await this.sendUnreadNotifications(ws);

      // Handle incoming messages
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnection(ws);
      });

    } catch (error) {
      console.error('Error in WebSocket connection:', error);
      ws.close(4003, 'Connection error');
    }
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: any) {
    switch (message.type) {
      case 'mark_read':
        await this.markNotificationAsRead(ws.userId!, message.notificationId);
        break;
      case 'get_notifications':
        await this.sendUnreadNotifications(ws);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    if (ws.userId) {
      const clientSet = this.connectedClients.get(ws.userId);
      if (clientSet) {
        clientSet.delete(ws);
        if (clientSet.size === 0) {
          this.connectedClients.delete(ws.userId);
        }
      }
      console.log(`WebSocket disconnected: User ${ws.username} (ID: ${ws.userId})`);
    }
  }

  private async sendUnreadNotifications(ws: AuthenticatedWebSocket) {
    if (!ws.userId) return;

    try {
      const unreadNotifications = await db.select({
        notification: {
          id: notifications.id,
          title: notifications.title,
          message: notifications.message,
          type: notifications.type,
          priority: notifications.priority,
          metadata: notifications.metadata,
          createdAt: notifications.createdAt,
        },
        status: {
          id: notificationStatus.id,
          status: notificationStatus.status,
          readAt: notificationStatus.readAt,
        }
      })
      .from(notificationStatus)
      .innerJoin(notifications, eq(notificationStatus.notificationId, notifications.id))
      .where(and(
        eq(notificationStatus.userId, ws.userId),
        eq(notificationStatus.status, 'delivered'),
        eq(notificationStatus.readAt, null)
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

      ws.send(JSON.stringify({
        type: 'notifications',
        data: unreadNotifications
      }));
    } catch (error) {
      console.error('Error sending unread notifications:', error);
    }
  }

  private async markNotificationAsRead(userId: number, notificationId: number) {
    try {
      await db.update(notificationStatus)
        .set({ 
          status: 'read',
          readAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(notificationStatus.userId, userId),
          eq(notificationStatus.notificationId, notificationId)
        ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Public methods for sending notifications
  public async sendNotificationToUser(userId: number, notification: any) {
    const clientSet = this.connectedClients.get(userId);
    if (clientSet && clientSet.size > 0) {
      const message = JSON.stringify({
        type: 'new_notification',
        data: notification
      });

      clientSet.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  public async sendNotificationToUsers(userIds: number[], notification: any) {
    const message = JSON.stringify({
      type: 'new_notification',
      data: notification
    });

    userIds.forEach(userId => {
      const clientSet = this.connectedClients.get(userId);
      if (clientSet && clientSet.size > 0) {
        clientSet.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        });
      }
    });
  }

  public async broadcastNotification(notification: any) {
    const message = JSON.stringify({
      type: 'new_notification',
      data: notification
    });

    this.connectedClients.forEach((clientSet) => {
      clientSet.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    });
  }

  public getConnectedUsersCount(): number {
    return this.connectedClients.size;
  }

  public getConnectedUsers(): number[] {
    return Array.from(this.connectedClients.keys());
  }
}

export { NotificationWebSocketServer };