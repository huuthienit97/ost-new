import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Calendar, Shield, Globe, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ApiKey, PERMISSIONS } from "@shared/schema";

const createApiKeySchema = z.object({
  name: z.string().min(1, "Tên API key là bắt buộc"),
  permissions: z.array(z.string()).min(1, "Ít nhất một quyền hạn là bắt buộc"),
  expiresAt: z.string().optional(),
});

const updateApiKeySchema = z.object({
  permissions: z.array(z.string()).min(1, "Ít nhất một quyền hạn là bắt buộc"),
});

type CreateApiKeyData = z.infer<typeof createApiKeySchema>;
type UpdateApiKeyData = z.infer<typeof updateApiKeySchema>;

export default function ApiKeysPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);

  const form = useForm<CreateApiKeyData>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: "",
      permissions: [],
      expiresAt: "",
    },
  });

  const updateForm = useForm<UpdateApiKeyData>({
    resolver: zodResolver(updateApiKeySchema),
    defaultValues: {
      permissions: [],
    },
  });

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/admin/api-keys"],
    enabled: hasPermission("system:admin"),
  });

  // Create API key mutation
  const createApiKeyMutation = useMutation({
    mutationFn: async (data: CreateApiKeyData) => {
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...data,
          expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      setCreatedApiKey(response.apiKey);
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
        description: "Không thể tạo API key",
        variant: "destructive",
      });
    },
  });

  // Update API key permissions mutation
  const updateApiKeyMutation = useMutation({
    mutationFn: async (data: UpdateApiKeyData & { id: number }) => {
      const response = await fetch(`/api/admin/api-keys/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          permissions: data.permissions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      setIsUpdateModalOpen(false);
      setSelectedApiKey(null);
      updateForm.reset();
      toast({
        title: "Thành công",
        description: "Quyền hạn API key đã được cập nhật",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật quyền hạn API key",
        variant: "destructive",
      });
    },
  });

  // Delete API key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({
        title: "Thành công",
        description: "API key đã được xóa",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa API key",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: "API key đã được sao chép vào clipboard",
    });
  };

  if (!hasPermission("system:admin")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Không có quyền truy cập</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Bạn không có quyền quản lý API keys.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý API Keys</h1>
              <p className="mt-2 text-gray-600">
                Quản lý quyền truy cập cho ứng dụng thứ 3
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API Documentation Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Globe className="h-5 w-5" />
              <span>Hướng dẫn sử dụng API</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-blue-900">Endpoints có sẵn:</h4>
                <ul className="list-disc list-inside text-blue-800 space-y-1 ml-4">
                  <li><code>/api/external/stats</code> - Lấy thống kê hệ thống</li>
                  <li><code>/api/external/members</code> - Lấy danh sách thành viên</li>
                  <li><code>/api/external/achievements</code> - Lấy danh sách thành tích</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Cách sử dụng:</h4>
                <pre className="bg-blue-100 p-2 rounded text-blue-900 text-xs overflow-x-auto">
{`curl -H "x-api-key: YOUR_API_KEY" \\
     https://your-domain.com/api/external/stats`}
                </pre>
              </div>
              <div className="flex items-center space-x-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">
                  Lưu trữ API key an toàn và không chia sẻ với người không có thẩm quyền
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Danh sách API Keys</h2>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tạo API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tạo API Key mới</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => createApiKeyMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên mô tả</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: Mobile App API" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quyền hạn</FormLabel>
                        <FormControl>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {Object.entries(PERMISSIONS).map(([key, value]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <Checkbox
                                  id={key}
                                  checked={field.value.includes(value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, value]);
                                    } else {
                                      field.onChange(field.value.filter(p => p !== value));
                                    }
                                  }}
                                />
                                <label htmlFor={key} className="text-sm">
                                  {value}
                                </label>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày hết hạn (tùy chọn)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="flex-1"
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      disabled={createApiKeyMutation.isPending}
                      className="flex-1"
                    >
                      {createApiKeyMutation.isPending ? "Đang tạo..." : "Tạo"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Created API Key Display */}
        {createdApiKey && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">API Key đã được tạo thành công!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 bg-green-100 p-3 rounded">
                <code className="flex-1 text-green-900 font-mono text-sm">
                  {createdApiKey}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(createdApiKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-green-700 text-sm mt-2">
                ⚠️ Lưu API key này ngay! Bạn sẽ không thể xem lại sau này.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreatedApiKey(null)}
                className="mt-2"
              >
                Đã lưu
              </Button>
            </CardContent>
          </Card>
        )}

        {/* API Keys List */}
        <div className="grid gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : apiKeys.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có API key nào
                </h3>
                <p className="text-gray-600">
                  Tạo API key đầu tiên để cho phép ứng dụng thứ 3 truy cập hệ thống.
                </p>
              </CardContent>
            </Card>
          ) : (
            apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                        <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                          {apiKey.isActive ? "Hoạt động" : "Vô hiệu"}
                        </Badge>
                        {apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() && (
                          <Badge variant="destructive">Đã hết hạn</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Tạo: {new Date(apiKey.createdAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                        
                        {apiKey.lastUsed && (
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4" />
                            <span>Sử dụng lần cuối: {new Date(apiKey.lastUsed).toLocaleDateString("vi-VN")}</span>
                          </div>
                        )}
                        
                        {apiKey.expiresAt && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Hết hạn: {new Date(apiKey.expiresAt).toLocaleDateString("vi-VN")}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>Quyền hạn: {apiKey.permissions.length} quyền</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-1">
                        {apiKey.permissions.slice(0, 3).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {apiKey.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{apiKey.permissions.length - 3} khác
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApiKey(apiKey);
                          updateForm.setValue("permissions", apiKey.permissions);
                          setIsUpdateModalOpen(true);
                        }}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Cập nhật quyền
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteApiKeyMutation.mutate(apiKey.id)}
                        disabled={deleteApiKeyMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Update API Key Permissions Modal */}
        <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cập nhật quyền hạn</DialogTitle>
            </DialogHeader>
            {selectedApiKey && (
              <Form {...updateForm}>
                <form onSubmit={updateForm.handleSubmit((data) => 
                  updateApiKeyMutation.mutate({ ...data, id: selectedApiKey.id })
                )} className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Cập nhật quyền hạn cho: <strong>{selectedApiKey.name}</strong>
                  </div>

                  <FormField
                    control={updateForm.control}
                    name="permissions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quyền hạn</FormLabel>
                        <FormControl>
                          <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                            {Object.entries(PERMISSIONS).map(([key, value]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`update-${key}`}
                                  checked={field.value.includes(value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, value]);
                                    } else {
                                      field.onChange(field.value.filter(p => p !== value));
                                    }
                                  }}
                                />
                                <label htmlFor={`update-${key}`} className="text-sm">
                                  {value}
                                </label>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsUpdateModalOpen(false);
                        setSelectedApiKey(null);
                        updateForm.reset();
                      }}
                      className="flex-1"
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateApiKeyMutation.isPending}
                      className="flex-1"
                    >
                      {updateApiKeyMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}