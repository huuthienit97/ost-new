import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Thông báo</span>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll}
              className="text-xs h-auto p-1"
            >
              Xóa tất cả
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Không có thông báo nào
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem 
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                    <span className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { 
                        addSuffix: true, 
                        locale: vi 
                      })}
                    </span>
                  </div>
                  {notification.type === 'success' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full ml-2 mt-1" />
                  )}
                  {notification.type === 'error' && (
                    <div className="w-2 h-2 bg-red-500 rounded-full ml-2 mt-1" />
                  )}
                  {notification.type === 'warning' && (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full ml-2 mt-1" />
                  )}
                  {notification.type === 'info' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}