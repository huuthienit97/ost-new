import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Key, Copy, Trash2, Calendar, Shield, Activity } from "lucide-react";
import { createApiKeySchema, PUBLIC_API_PERMISSIONS } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

type CreateApiKeyData = z.infer<typeof createApiKeySchema>;

interface ApiKey {
  id: number;
  name: string;
  permissions: string[];
  isActive: boolean;
  rateLimit: number;
  lastUsed: string | null;
  createdAt: string;
  expiresAt: string | null;
  createdBy: number;
}

export default function ApiKeysPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newApiKeyData, setNewApiKeyData] = useState<{ key: string; name: string } | null>(null);

  const form = useForm<CreateApiKeyData>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: "",
      permissions: [],
      rateLimit: 1000,
    },
  });

  // Check permissions
  if (!hasPermission("system:admin")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có quyền truy cập</h3>
              <p className="mt-1 text-sm text-gray-500">
                Bạn cần quyền quản trị hệ thống để truy cập trang này.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/admin/api-keys"],
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async (data: CreateApiKeyData) => {
      const response = await apiRequest("POST", "/api/admin/api-keys", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      setNewApiKeyData({ key: data.apiKey.key, name: data.apiKey.name });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Thành công",
        description: "API key đã được tạo thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({
        title: "Thành công",
        description: "API key đã được xóa",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateApiKeyMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PUT", `/api/admin/api-keys/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({
        title: "Thành công",
        description: "API key đã được cập nhật",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateApiKeyData) => {
    createApiKeyMutation.mutate(data);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: "API key đã được sao chép vào clipboard",
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Không bao giờ";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getPermissionLabel = (permission: string) => {
    const labels: Record<string, string> = {
      [PUBLIC_API_PERMISSIONS.DEPARTMENTS_READ]: "Xem phòng ban",
      [PUBLIC_API_PERMISSIONS.STATS_READ]: "Xem thống kê",
      [PUBLIC_API_PERMISSIONS.ACHIEVEMENTS_READ]: "Xem thành tích",
      [PUBLIC_API_PERMISSIONS.MEMBERS_READ]: "Xem thành viên",
    };
    return labels[permission] || permission;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý API Keys</h1>
          <p className="text-gray-600 mt-2">
            Tạo và quản lý API keys cho external applications truy cập hệ thống
          </p>
        </div>

        {/* Header Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Tổng cộng: {apiKeys.length} API keys
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tạo API Key mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tạo API Key mới</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên API Key</FormLabel>
                        <FormControl>
                          <Input placeholder="Ví dụ: Mobile App API" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rateLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giới hạn request/giờ</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={10000} 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions"
                    render={() => (
                      <FormItem>
                        <FormLabel>Quyền hạn</FormLabel>
                        <div className="space-y-2">
                          {Object.entries(PUBLIC_API_PERMISSIONS).map(([key, value]) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name="permissions"
                              render={({ field }) => {
                                return (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(value)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, value])
                                            : field.onChange(
                                                field.value?.filter((val) => val !== value)
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {getPermissionLabel(value)}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" disabled={createApiKeyMutation.isPending}>
                      {createApiKeyMutation.isPending ? "Đang tạo..." : "Tạo API Key"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* New API Key Display Modal */}
        {newApiKeyData && (
          <Dialog open={!!newApiKeyData} onOpenChange={() => setNewApiKeyData(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>API Key đã được tạo thành công!</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    ⚠️ <strong>Quan trọng:</strong> Đây là lần duy nhất bạn có thể thấy API key này. 
                    Hãy sao chép và lưu trữ an toàn.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tên:</label>
                  <p className="text-lg font-semibold">{newApiKeyData.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">API Key:</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 p-2 bg-gray-100 border rounded text-sm font-mono break-all">
                      {newApiKeyData.key}
                    </code>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(newApiKeyData.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setNewApiKeyData(null)}>
                    Đã lưu API Key
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* API Keys List */}
        <div className="grid gap-6">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">Đang tải...</div>
              </CardContent>
            </Card>
          ) : apiKeys.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Key className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có API key nào</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Tạo API key đầu tiên để cho phép external applications truy cập hệ thống.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                        {apiKey.isActive ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => 
                          updateApiKeyMutation.mutate({ 
                            id: apiKey.id, 
                            isActive: !apiKey.isActive 
                          })
                        }
                      >
                        {apiKey.isActive ? "Tạm dừng" : "Kích hoạt"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteApiKeyMutation.mutate(apiKey.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Activity className="h-4 w-4 mr-1" />
                        Rate Limit
                      </div>
                      <p className="font-medium">{apiKey.rateLimit.toLocaleString()} req/giờ</p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        Sử dụng lần cuối
                      </div>
                      <p className="font-medium">{formatDate(apiKey.lastUsed)}</p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        Tạo lúc
                      </div>
                      <p className="font-medium">{formatDate(apiKey.createdAt)}</p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Shield className="h-4 w-4 mr-1" />
                        Quyền hạn
                      </div>
                      <p className="font-medium">{apiKey.permissions.length} quyền</p>
                    </div>
                  </div>
                  
                  {apiKey.permissions.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Quyền hạn được cấp:</p>
                      <div className="flex flex-wrap gap-1">
                        {apiKey.permissions.map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {getPermissionLabel(permission)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}