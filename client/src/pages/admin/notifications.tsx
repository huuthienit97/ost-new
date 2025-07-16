import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bell, Plus, Send, Users, User, Building2, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface NotificationForm {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetType: 'all' | 'role' | 'division' | 'user';
  targetIds: string[];
}

const notificationTypes = [
  { value: 'info', label: 'Thông tin', icon: Info, color: 'bg-blue-100 text-blue-800' },
  { value: 'success', label: 'Thành công', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'warning', label: 'Cảnh báo', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'error', label: 'Lỗi', icon: AlertCircle, color: 'bg-red-100 text-red-800' },
  { value: 'announcement', label: 'Thông báo', icon: Bell, color: 'bg-purple-100 text-purple-800' }
];

const priorityLevels = [
  { value: 'low', label: 'Thấp', color: 'bg-gray-100 text-gray-800' },
  { value: 'normal', label: 'Bình thường', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'Cao', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' }
];

export default function NotificationsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    targetType: 'all',
    targetIds: []
  });

  // Fetch notifications history
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['/api/notifications/admin'],
  });

  // Fetch roles for targeting
  const { data: roles } = useQuery({
    queryKey: ['/api/roles'],
  });

  // Fetch divisions for targeting
  const { data: divisions } = useQuery({
    queryKey: ['/api/divisions'],
  });

  // Fetch users for targeting
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  const createNotificationMutation = useMutation({
    mutationFn: (data: NotificationForm) => apiRequest("/api/notifications", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Thông báo đã được gửi thành công!",
      });
      setIsCreateDialogOpen(false);
      setForm({
        title: '',
        message: '',
        type: 'info',
        priority: 'normal',
        targetType: 'all',
        targetIds: []
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/admin'] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi thông báo",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ tiêu đề và nội dung",
        variant: "destructive",
      });
      return;
    }
    createNotificationMutation.mutate(form);
  };

  const getTargetOptions = () => {
    switch (form.targetType) {
      case 'role':
        return roles?.data || [];
      case 'division':
        return divisions?.data || [];
      case 'user':
        return users?.data || [];
      default:
        return [];
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = notificationTypes.find(t => t.value === type);
    if (!typeConfig) return Info;
    return typeConfig.icon;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản Lý Thông Báo</h1>
            <p className="text-muted-foreground">Tạo và quản lý thông báo gửi đến thành viên</p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tạo Thông Báo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tạo Thông Báo Mới</DialogTitle>
                <DialogDescription>
                  Điền thông tin để gửi thông báo đến thành viên
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nhập tiêu đề thông báo..."
                    required
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">Nội dung *</Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Nhập nội dung thông báo..."
                    rows={4}
                    required
                  />
                </div>

                {/* Type and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Loại thông báo</Label>
                    <Select value={form.type} onValueChange={(value: any) => setForm(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {notificationTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              <type.icon className="w-4 h-4 mr-2" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Mức độ ưu tiên</Label>
                    <Select value={form.priority} onValueChange={(value: any) => setForm(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityLevels.map(priority => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Target Type */}
                <div className="space-y-2">
                  <Label>Gửi đến</Label>
                  <Select value={form.targetType} onValueChange={(value: any) => setForm(prev => ({ ...prev, targetType: value, targetIds: [] }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Tất cả thành viên
                        </div>
                      </SelectItem>
                      <SelectItem value="role">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Theo vai trò
                        </div>
                      </SelectItem>
                      <SelectItem value="division">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 mr-2" />
                          Theo ban/phòng
                        </div>
                      </SelectItem>
                      <SelectItem value="user">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Chọn thành viên
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Selection */}
                {form.targetType !== 'all' && (
                  <div className="space-y-2">
                    <Label>Chọn {form.targetType === 'role' ? 'vai trò' : form.targetType === 'division' ? 'ban/phòng' : 'thành viên'}</Label>
                    <Select 
                      value={form.targetIds[0] || ''} 
                      onValueChange={(value) => setForm(prev => ({ ...prev, targetIds: [value] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Chọn ${form.targetType === 'role' ? 'vai trò' : form.targetType === 'division' ? 'ban/phòng' : 'thành viên'}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {getTargetOptions().map((option: any) => (
                          <SelectItem key={option.id} value={option.id.toString()}>
                            {option.name || option.fullName || `${option.firstName} ${option.lastName}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={createNotificationMutation.isPending}>
                    <Send className="w-4 h-4 mr-2" />
                    {createNotificationMutation.isPending ? "Đang gửi..." : "Gửi Thông Báo"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Notifications History */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch Sử Thông Báo</CardTitle>
            <CardDescription>
              Danh sách các thông báo đã gửi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Đang tải...</p>
              </div>
            ) : !notifications?.data?.length ? (
              <div className="text-center py-8">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-muted-foreground">Chưa có thông báo</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bắt đầu bằng cách tạo thông báo đầu tiên
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.data.map((notification: any) => {
                  const TypeIcon = getTypeIcon(notification.type);
                  const typeConfig = notificationTypes.find(t => t.value === notification.type);
                  const priorityConfig = priorityLevels.find(p => p.value === notification.priority);

                  return (
                    <div key={notification.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-full ${typeConfig?.color || 'bg-gray-100'}`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={priorityConfig?.color}>
                              {priorityConfig?.label}
                            </Badge>
                            <Badge variant="outline">
                              {typeConfig?.label}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>Gửi lúc: {formatDate(notification.createdAt)}</span>
                          <span>
                            Người gửi: {notification.senderName || 'Hệ thống'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}