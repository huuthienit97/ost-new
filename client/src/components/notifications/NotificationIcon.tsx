import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface NotificationItemProps {
  notification: any;
  onMarkAsRead: (id: number) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const isUnread = !notification.status.readAt;
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'announcement': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-4 border-red-500';
      case 'high': return 'border-l-4 border-orange-500';
      case 'normal': return 'border-l-4 border-blue-500';
      default: return 'border-l-4 border-gray-300';
    }
  };

  return (
    <div 
      className={`p-3 rounded-lg ${isUnread ? 'bg-blue-50 dark:bg-blue-950' : 'bg-white dark:bg-gray-800'} ${getPriorityBorder(notification.notification.priority)} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => isUnread && onMarkAsRead(notification.notification.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`text-sm font-medium ${isUnread ? 'font-semibold' : ''}`}>
              {notification.notification.title}
            </h4>
            {isUnread && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {notification.notification.message}
          </p>
          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className={`text-xs ${getTypeColor(notification.notification.type)}`}
            >
              {notification.notification.type}
            </Badge>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(notification.notification.createdAt), { 
                addSuffix: true, 
                locale: vi 
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationIcon() {
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative p-2"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Thông báo</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {unreadCount} thông báo chưa đọc
            </p>
          )}
        </div>
        
        <ScrollArea className="max-h-96">
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Không có thông báo nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        
        {!isConnected && (
          <div className="p-3 border-t bg-yellow-50 dark:bg-yellow-950">
            <p className="text-xs text-yellow-800 dark:text-yellow-300">
              ⚠️ Mất kết nối thông báo realtime
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}