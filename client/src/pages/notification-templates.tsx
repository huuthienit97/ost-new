import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bell, Plus, Edit, Trash2, Send } from "lucide-react";

interface NotificationTemplate {
  id: number;
  name: string;
  title: string;
  content: string;
  type: 'system' | 'mission' | 'achievement' | 'beepoint' | 'social' | 'custom';
  isActive: boolean;
  createdAt: string;
  usageCount: number;
}

interface NotificationTemplateForm {
  name: string;
  title: string;
  content: string;
  type: 'system' | 'mission' | 'achievement' | 'beepoint' | 'social' | 'custom';
  isActive: boolean;
}

const TEMPLATE_TYPES = [
  { value: 'system', label: 'Hệ thống', color: 'bg-blue-100 text-blue-800' },
  { value: 'mission', label: 'Nhiệm vụ', color: 'bg-green-100 text-green-800' },
  { value: 'achievement', label: 'Thành tích', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'beepoint', label: 'BeePoint', color: 'bg-orange-100 text-orange-800' },
  { value: 'social', label: 'Xã hội', color: 'bg-purple-100 text-purple-800' },
  { value: 'custom', label: 'Tùy chỉnh', color: 'bg-gray-100 text-gray-800' },
];

export default function NotificationTemplatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testTemplate, setTestTemplate] = useState<NotificationTemplate | null>(null);
  const [testUserId, setTestUserId] = useState("");
  const [formData, setFormData] = useState<NotificationTemplateForm>({
    name: "",
    title: "",
    content: "",
    type: "custom",
    isActive: true,
  });

  // Fetch notification templates
  const { data: templates = [], isLoading } = useQuery<NotificationTemplate[]>({
    queryKey: ["/api/notification-templates"],
  });

  // Fetch users for testing
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users/all"],
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: NotificationTemplateForm) => {
      return apiRequest("/api/notification-templates", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Đã tạo mẫu thông báo thành công!" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo mẫu thông báo",
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: NotificationTemplateForm }) => {
      return apiRequest(`/api/notification-templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] });
      setDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      toast({ title: "Đã cập nhật mẫu thông báo thành công!" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi", 
        description: error.message || "Không thể cập nhật mẫu thông báo",
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/notification-templates/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] });
      toast({ title: "Đã xóa mẫu thông báo thành công!" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa mẫu thông báo",
        variant: "destructive",
      });
    },
  });

  // Test notification mutation
  const testNotificationMutation = useMutation({
    mutationFn: async ({ templateId, userId }: { templateId: number; userId: number }) => {
      return apiRequest("/api/notifications/test-template", {
        method: "POST",
        body: JSON.stringify({ templateId, userId }),
      });
    },
    onSuccess: () => {
      setTestDialogOpen(false);
      setTestTemplate(null);
      setTestUserId("");
      toast({ title: "Đã gửi thông báo thử nghiệm thành công!" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi thông báo thử nghiệm",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      title: "",
      content: "",
      type: "custom",
      isActive: true,
    });
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      title: template.title,
      content: template.content,
      type: template.type,
      isActive: template.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa mẫu thông báo này?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleTest = (template: NotificationTemplate) => {
    setTestTemplate(template);
    setTestDialogOpen(true);
  };

  const getTypeInfo = (type: string) => {
    return TEMPLATE_TYPES.find(t => t.value === type) || TEMPLATE_TYPES[TEMPLATE_TYPES.length - 1];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Quản lý mẫu thông báo</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo mẫu mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Chỉnh sửa mẫu thông báo" : "Tạo mẫu thông báo mới"}
                </DialogTitle>
                <DialogDescription>
                  Tạo hoặc chỉnh sửa mẫu thông báo cho hệ thống. Sử dụng các biến như {"{userName}"}, {"{missionName}"}, {"{points}"} để cá nhân hóa thông báo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tên mẫu</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Vd: Chúc mừng hoàn thành nhiệm vụ"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Loại thông báo</label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Tiêu đề thông báo</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Vd: Chúc mừng bạn đã hoàn thành nhiệm vụ!"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nội dung thông báo</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Vd: Bạn đã hoàn thành nhiệm vụ {missionName} và nhận được {points} BeePoints!"
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sử dụng các biến: {"{userName}"}, {"{missionName}"}, {"{points}"}, {"{achievementName}"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActive" className="text-sm">Kích hoạt mẫu</label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleSave} disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}>
                    {(createTemplateMutation.isPending || updateTemplateMutation.isPending) ? "Đang lưu..." : "Lưu"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Grid - Fixed Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : templates.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có mẫu thông báo</h3>
              <p className="text-gray-500">Tạo mẫu thông báo đầu tiên của bạn</p>
            </div>
          ) : (
            templates.map((template) => {
              const typeInfo = getTypeInfo(template.type);
              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={typeInfo.color} variant="secondary">
                            {typeInfo.label}
                          </Badge>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Hoạt động" : "Tạm dừng"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Tiêu đề:</p>
                        <p className="text-sm text-gray-600">{template.title}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Nội dung:</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{template.content}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Đã dùng: {template.usageCount} lần</span>
                        <span>{formatDate(template.createdAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm" 
                          onClick={() => handleTest(template)}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Test Notification Dialog */}
        <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test thông báo</DialogTitle>
              <DialogDescription>
                Gửi thông báo thử nghiệm từ mẫu đã chọn đến người dùng cụ thể.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Mẫu: {testTemplate?.name}</p>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-medium">{testTemplate?.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{testTemplate?.content}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Gửi đến người dùng:</label>
                <Select value={testUserId} onValueChange={setTestUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn người dùng..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.fullName} (@{user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
                  Hủy
                </Button>
                <Button 
                  onClick={() => testTemplate && testUserId && testNotificationMutation.mutate({ 
                    templateId: testTemplate.id, 
                    userId: parseInt(testUserId) 
                  })}
                  disabled={!testUserId || testNotificationMutation.isPending}
                >
                  {testNotificationMutation.isPending ? "Đang gửi..." : "Gửi test"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}