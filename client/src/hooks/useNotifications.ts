import { useState, useEffect } from 'react';
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
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) return;

    let ws: WebSocket;
    let reconnectInterval: NodeJS.Timeout;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Connected to notification WebSocket');
        // Clear any existing reconnection attempts
        if (reconnectInterval) {
          clearInterval(reconnectInterval);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            const notification = data.notification as Notification;
            
            // Add to notifications list
            setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
            setUnreadCount(prev => prev + 1);
            
            // Show toast notification for friend requests
            if (notification.metadata?.type === 'friend_request') {
              toast({
                title: notification.title,
                description: notification.message,
                variant: "default",
              });
            } else if (notification.metadata?.type === 'friend_request_response') {
              toast({
                title: notification.title,
                description: notification.message,
                variant: notification.metadata.responseAction === 'accept' ? "default" : "destructive",
              });
            } else {
              // General notifications
              toast({
                title: notification.title,
                description: notification.message,
                variant: notification.type === 'error' ? "destructive" : "default",
              });
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed, attempting to reconnect...');
        // Attempt to reconnect every 5 seconds
        reconnectInterval = setInterval(() => {
          if (ws.readyState === WebSocket.CLOSED) {
            connect();
          }
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
    };
  }, [isAuthenticated, toast]);

  const markAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAll
  };
}