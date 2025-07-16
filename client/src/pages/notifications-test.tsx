import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Send, Wifi, WifiOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

function apiRequest(url: string, options: any = {}) {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }).then(async (res) => {
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`${res.status}: ${error}`);
    }
    return res.json();
  });
}

export default function NotificationsTest() {
  const { toast } = useToast();
  const { notifications, unreadCount, isConnected, markAsRead, refreshNotifications } = useNotifications();
  const [testResults, setTestResults] = useState<any[]>([]);

  const testNotificationMutation = useMutation({
    mutationFn: () => apiRequest("/api/notifications/test", {
      method: "POST",
      body: JSON.stringify({})
    }),
    onSuccess: (data) => {
      toast({
        title: "Test thành công",
        description: "Notification test đã được gửi!",
        variant: "default",
      });
      setTestResults(prev => [...prev, {
        type: 'success',
        message: 'Test notification sent successfully',
        data,
        timestamp: new Date().toLocaleString('vi-VN')
      }]);
    },
    onError: (error) => {
      toast({
        title: "Test thất bại",
        description: error.message,
        variant: "destructive",
      });
      setTestResults(prev => [...prev, {
        type: 'error',
        message: error.message,
        timestamp: new Date().toLocaleString('vi-VN')
      }]);
    },
  });

  const clearTestResults = () => {
    setTestResults([]);
  };

  const testWebSocketConnection = () => {
    if (isConnected) {
      setTestResults(prev => [...prev, {
        type: 'success',
        message: 'WebSocket connection is active',
        timestamp: new Date().toLocaleString('vi-VN')
      }]);
    } else {
      setTestResults(prev => [...prev, {
        type: 'error',
        message: 'WebSocket connection is not active',
        timestamp: new Date().toLocaleString('vi-VN')
      }]);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Test Hệ Thống Thông Báo</h1>
            <p className="text-muted-foreground">Kiểm tra tính năng realtime notification</p>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Wifi className="w-3 h-3 mr-1" />
                Kết nối
              </Badge>
            ) : (
              <Badge variant="destructive">
                <WifiOff className="w-3 h-3 mr-1" />
                Mất kết nối
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Kiểm Tra Notification
              </CardTitle>
              <CardDescription>
                Test các tính năng của hệ thống thông báo realtime
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => testNotificationMutation.mutate()}
                disabled={testNotificationMutation.isPending}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {testNotificationMutation.isPending ? "Đang gửi..." : "Gửi Test Notification"}
              </Button>

              <Button 
                onClick={testWebSocketConnection}
                variant="outline"
                className="w-full"
              >
                <Wifi className="w-4 h-4 mr-2" />
                Kiểm tra WebSocket
              </Button>

              <Button 
                onClick={refreshNotifications}
                variant="outline"
                className="w-full"
              >
                Làm mới danh sách thông báo
              </Button>

              <Button 
                onClick={clearTestResults}
                variant="outline"
                className="w-full"
              >
                Xóa kết quả test
              </Button>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Trạng Thái Hiện Tại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Kết nối WebSocket:</span>
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Hoạt động" : "Mất kết nối"}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Thông báo chưa đọc:</span>
                <Badge variant="secondary">
                  {unreadCount}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Tổng thông báo:</span>
                <Badge variant="outline">
                  {notifications.length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Kết Quả Test</CardTitle>
              <CardDescription>
                Lịch sử các test đã thực hiện
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.type === 'success' 
                        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                        : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{result.message}</span>
                      <Badge variant={result.type === 'success' ? 'default' : 'destructive'}>
                        {result.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.timestamp}
                    </p>
                    {result.data && (
                      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Thông Báo Gần Đây</CardTitle>
            <CardDescription>
              Danh sách các thông báo đã nhận
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notifications.slice(0, 10).map((notification) => (
                  <div 
                    key={notification.notification.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                      !notification.status.readAt 
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' 
                        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                    }`}
                    onClick={() => !notification.status.readAt && markAsRead(notification.notification.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium">
                        {notification.notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.notification.type}
                        </Badge>
                        {!notification.status.readAt && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {notification.notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.notification.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}