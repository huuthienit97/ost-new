import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: any;
  createdAt: string;
  readAt?: string;
}

interface NotificationStatus {
  id: number;
  status: 'delivered' | 'read';
  readAt?: string;
}

interface NotificationWithStatus {
  notification: Notification;
  status: NotificationStatus;
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [notifications, setNotifications] = useState<NotificationWithStatus[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
      
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Auto-reconnect after a delay if not intentionally closed
        if (event.code !== 1000) {
          setTimeout(() => {
            if (user) connect();
          }, 3000);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      setWs(websocket);
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }, [user]);

  const disconnect = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close(1000, 'User disconnected');
    }
    setWs(null);
    setIsConnected(false);
  }, [ws]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'notifications':
        setNotifications(data.data || []);
        setUnreadCount(data.data?.filter((n: NotificationWithStatus) => !n.status.readAt).length || 0);
        break;

      case 'new_notification':
        const newNotification = data.data;
        
        // Add to notifications list
        setNotifications(prev => [{
          notification: newNotification,
          status: { id: 0, status: 'delivered' }
        }, ...prev]);
        
        setUnreadCount(prev => prev + 1);

        // Show toast notification
        toast({
          title: newNotification.title,
          description: newNotification.message,
          variant: newNotification.type === 'error' ? 'destructive' : 'default',
        });
        break;

      case 'pong':
        // Handle ping/pong for keep-alive
        break;

      case 'error':
        console.error('WebSocket error:', data.message);
        break;
    }
  };

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      // Send to server via WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'mark_read',
          notificationId
        }));
      }

      // Also make HTTP request as backup
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.notification.id === notificationId 
            ? { ...n, status: { ...n.status, status: 'read', readAt: new Date().toISOString() } }
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [ws]);

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.status.readAt);
    
    for (const notification of unreadNotifications) {
      await markAsRead(notification.notification.id);
    }
  }, [notifications, markAsRead]);

  const refreshNotifications = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'get_notifications' }));
    }
  }, [ws]);

  // Connect when user is available
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Ping every 30 seconds to keep connection alive
  useEffect(() => {
    if (!isConnected || !ws) return;

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected, ws]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    connect,
    disconnect
  };
}