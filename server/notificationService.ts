import { db } from './db';
import { notifications, notificationStatus, users, members, roles } from '@shared/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import type { NotificationWebSocketServer } from './websocket';

interface NotificationData {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'announcement';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  targetType: 'all' | 'role' | 'division' | 'user' | 'custom';
  targetIds?: string[];
  metadata?: any;
}

class NotificationService {
  private wsServer?: NotificationWebSocketServer;

  setWebSocketServer(wsServer: NotificationWebSocketServer) {
    this.wsServer = wsServer;
  }

  async createNotification(senderId: number, data: NotificationData) {
    try {
      // Create notification record
      const [notification] = await db.insert(notifications).values({
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        priority: data.priority || 'normal',
        targetType: data.targetType,
        targetIds: data.targetIds || [],
        senderId,
        metadata: data.metadata || {},
        sentAt: new Date(),
      }).returning();

      // Get target user IDs
      const targetUserIds = await this.getTargetUserIds(data.targetType, data.targetIds);

      // Create notification status records for each target user
      const statusRecords = targetUserIds.map(userId => ({
        notificationId: notification.id,
        userId,
        status: 'delivered' as const,
        deliveredAt: new Date(),
      }));

      if (statusRecords.length > 0) {
        await db.insert(notificationStatus).values(statusRecords);
      }

      // Send real-time notifications via WebSocket
      if (this.wsServer) {
        const notificationData = {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
        };

        if (data.targetType === 'all') {
          await this.wsServer.broadcastNotification(notificationData);
        } else {
          await this.wsServer.sendNotificationToUsers(targetUserIds, notificationData);
        }
      }

      return {
        notification,
        recipientCount: targetUserIds.length
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  private async getTargetUserIds(targetType: string, targetIds?: string[]): Promise<number[]> {
    switch (targetType) {
      case 'all':
        const allUsers = await db.select({ id: users.id }).from(users).where(eq(users.isActive, true));
        return allUsers.map(u => u.id);

      case 'user':
        return targetIds?.map(id => parseInt(id)).filter(id => !isNaN(id)) || [];

      case 'role':
        if (!targetIds || targetIds.length === 0) return [];
        const roleIds = targetIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        const usersByRole = await db.select({ id: users.id })
          .from(users)
          .where(and(
            inArray(users.roleId, roleIds),
            eq(users.isActive, true)
          ));
        return usersByRole.map(u => u.id);

      case 'division':
        if (!targetIds || targetIds.length === 0) return [];
        const divisionIds = targetIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        const usersByDivision = await db.select({ userId: members.userId })
          .from(members)
          .innerJoin(users, eq(members.userId, users.id))
          .where(and(
            inArray(members.divisionId, divisionIds),
            eq(members.isActive, true),
            eq(users.isActive, true)
          ));
        return usersByDivision.map(u => u.userId).filter(id => id !== null) as number[];

      default:
        return [];
    }
  }

  async getUserNotifications(userId: number, limit: number = 50) {
    try {
      const userNotifications = await db.select({
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
          deliveredAt: notificationStatus.deliveredAt,
        }
      })
      .from(notificationStatus)
      .innerJoin(notifications, eq(notificationStatus.notificationId, notifications.id))
      .where(eq(notificationStatus.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

      return userNotifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  async markAsRead(userId: number, notificationId: number) {
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
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async getUnreadCount(userId: number): Promise<number> {
    try {
      const [result] = await db.select({
        count: sql<number>`count(*)`
      })
      .from(notificationStatus)
      .where(and(
        eq(notificationStatus.userId, userId),
        eq(notificationStatus.status, 'delivered')
      ));

      return result?.count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Quick notification methods for common scenarios
  async notifyMissionAssigned(recipientIds: number[], missionTitle: string, assignedBy: string) {
    return this.createNotification(1, { // System user ID
      title: 'Nhiệm vụ mới được giao',
      message: `Bạn được giao nhiệm vụ "${missionTitle}" bởi ${assignedBy}`,
      type: 'info',
      priority: 'normal',
      targetType: 'user',
      targetIds: recipientIds.map(id => id.toString()),
      metadata: { type: 'mission_assigned', missionTitle }
    });
  }

  async notifyMissionCompleted(recipientIds: number[], missionTitle: string, completedBy: string) {
    return this.createNotification(1, {
      title: 'Nhiệm vụ hoàn thành',
      message: `${completedBy} đã hoàn thành nhiệm vụ "${missionTitle}"`,
      type: 'success',
      priority: 'normal',
      targetType: 'user',
      targetIds: recipientIds.map(id => id.toString()),
      metadata: { type: 'mission_completed', missionTitle }
    });
  }

  async notifyMissionReviewed(recipientIds: number[], missionTitle: string, status: string, points: number) {
    return this.createNotification(1, {
      title: status === 'completed' ? 'Nhiệm vụ được duyệt' : 'Nhiệm vụ bị từ chối',
      message: status === 'completed' 
        ? `Nhiệm vụ "${missionTitle}" đã được duyệt. Bạn nhận ${points} BeePoints!`
        : `Nhiệm vụ "${missionTitle}" không được duyệt. Vui lòng kiểm tra lại.`,
      type: status === 'completed' ? 'success' : 'warning',
      priority: 'normal',
      targetType: 'user',
      targetIds: recipientIds.map(id => id.toString()),
      metadata: { type: 'mission_reviewed', missionTitle, status, points }
    });
  }

  async notifyBeePointsAwarded(recipientIds: number[], points: number, reason: string) {
    return this.createNotification(1, {
      title: 'Nhận BeePoints',
      message: `Bạn nhận được ${points} BeePoints! Lý do: ${reason}`,
      type: 'success',
      priority: 'normal',
      targetType: 'user',
      targetIds: recipientIds.map(id => id.toString()),
      metadata: { type: 'beepoints_awarded', points, reason }
    });
  }
}

export const notificationService = new NotificationService();