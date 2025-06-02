import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings2, Upload, FileImage, Trash2, Download, Save, Copy, Users, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";

interface Setting {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
  updatedAt: string;
}

interface Upload {
  id: number;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedBy: number | null;
  createdAt: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("app");
  const { user, logout } = useAuth();
  
  // Form states
  const [appSettings, setAppSettings] = useState({
    app_name: "",
    app_description: "",
    school_name: "",
  });
  
  const [brandingSettings, setBrandingSettings] = useState({
    logo_url: "",
    favicon_url: "",
    logo_text: "",
  });

  // Settings queries
  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  // Uploads queries
  const { data: uploads = [], isLoading: uploadsLoading } = useQuery({
    queryKey: ["/api/uploads"],
  });

  // Initialize form when settings are loaded
  useEffect(() => {
    if (settings && Array.isArray(settings) && settings.length > 0) {
      const settingsMap = (settings as Setting[]).reduce((acc, setting) => {
        acc[setting.key] = setting.value || "";
        return acc;
      }, {} as Record<string, string>);
      
      setAppSettings({
        app_name: settingsMap.app_name || "",
        app_description: settingsMap.app_description || "",
        school_name: settingsMap.school_name || "",
      });
      
      setBrandingSettings({
        logo_url: settingsMap.logo_url || "",
        favicon_url: settingsMap.favicon_url || "",
        logo_text: settingsMap.logo_text || "",
      });
    }
  }, [settings]);

  // Setting mutation
  const settingMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      await apiRequest("POST", `/api/settings`, { key, value, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Thành công",
        description: "Cài đặt đã được lưu",
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

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      toast({
        title: "Thành công",
        description: "File đã được upload",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete upload mutation
  const deleteUploadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/uploads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      toast({
        title: "Thành công",
        description: "File đã được xóa",
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Đã copy",
        description: "Đường dẫn đã được copy vào clipboard",
      });
    });
  };

  const saveAppSettings = () => {
    Object.entries(appSettings).forEach(([key, value]) => {
      settingMutation.mutate({ key, value, description: getSettingDescription(key) });
    });
  };

  const saveBrandingSettings = () => {
    Object.entries(brandingSettings).forEach(([key, value]) => {
      settingMutation.mutate({ key, value, description: getSettingDescription(key) });
    });
  };

  const getSettingDescription = (key: string): string => {
    const descriptions = {
      app_name: "Tên hiển thị của ứng dụng",
      app_description: "Mô tả về ứng dụng",
      school_name: "Tên trường học",
      logo_url: "Đường dẫn đến logo",
      favicon_url: "Đường dẫn đến favicon",
      logo_text: "Text hiển thị khi không có logo",
    };
    return descriptions[key as keyof typeof descriptions] || "";
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
      event.target.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeIcon = (mimetype: string) => {
    if (mimetype.startsWith("image/")) {
      return <FileImage className="h-4 w-4" />;
    }
    return <Upload className="h-4 w-4" />;
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Users className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CLB Sáng Tạo</h1>
                <p className="text-sm text-gray-600">Hệ thống quản lý thành viên</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right mr-3">
                <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                <p className="text-xs text-gray-500">{user.role.displayName}</p>
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.fullName ? getInitials(user.fullName) : "A"}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} title="Đăng xuất">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings2 className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h2>
                <p className="text-gray-600 mt-1">Quản lý thông tin ứng dụng và tài nguyên</p>
              </div>
            </div>
            
            <nav className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  Trang chủ
                </Button>
              </Link>
              <Link href="/members">
                <Button variant="ghost" size="sm">
                  Thành viên
                </Button>
              </Link>
              <Link href="/roles">
                <Button variant="ghost" size="sm">
                  Vai trò
                </Button>
              </Link>
            </nav>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="app">Thông tin ứng dụng</TabsTrigger>
            <TabsTrigger value="branding">Nhận diện thương hiệu</TabsTrigger>
            <TabsTrigger value="uploads">Quản lý file</TabsTrigger>
          </TabsList>

          <TabsContent value="app" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
                <CardDescription>
                  Cấu hình tên và mô tả ứng dụng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="app-name">Tên ứng dụng</Label>
                  <Input
                    id="app-name"
                    value={appSettings.app_name}
                    placeholder="Tên câu lạc bộ sáng tạo"
                    onChange={(e) => setAppSettings({ ...appSettings, app_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="app-description">Mô tả</Label>
                  <Textarea
                    id="app-description"
                    value={appSettings.app_description}
                    placeholder="Mô tả về câu lạc bộ..."
                    rows={3}
                    onChange={(e) => setAppSettings({ ...appSettings, app_description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="school-name">Tên trường</Label>
                  <Input
                    id="school-name"
                    value={appSettings.school_name}
                    placeholder="THPT ABC"
                    onChange={(e) => setAppSettings({ ...appSettings, school_name: e.target.value })}
                  />
                </div>
                <Button 
                  onClick={saveAppSettings} 
                  disabled={settingMutation.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {settingMutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logo và hình ảnh</CardTitle>
                <CardDescription>
                  Cấu hình logo, favicon và các hình ảnh khác
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logo-url">Logo URL</Label>
                  <Input
                    id="logo-url"
                    value={brandingSettings.logo_url}
                    placeholder="/uploads/logo.png"
                    onChange={(e) => setBrandingSettings({ ...brandingSettings, logo_url: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="favicon-url">Favicon URL</Label>
                  <Input
                    id="favicon-url"
                    value={brandingSettings.favicon_url}
                    placeholder="/uploads/favicon.ico"
                    onChange={(e) => setBrandingSettings({ ...brandingSettings, favicon_url: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="logo-text">Text logo</Label>
                  <Input
                    id="logo-text"
                    value={brandingSettings.logo_text}
                    placeholder="CLB Sáng tạo"
                    onChange={(e) => setBrandingSettings({ ...brandingSettings, logo_text: e.target.value })}
                  />
                </div>
                <Button 
                  onClick={saveBrandingSettings} 
                  disabled={settingMutation.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {settingMutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uploads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload file mới</CardTitle>
                <CardDescription>
                  Upload logo, favicon và các file khác cho hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Kéo thả file hoặc click để chọn
                    </p>
                    <p className="text-xs text-gray-500">
                      Hỗ trợ: JPG, PNG, GIF, PDF, DOC, XLS, PPT (tối đa 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  />
                  <Button
                    onClick={() => document.getElementById("file-upload")?.click()}
                    disabled={uploadMutation.isPending}
                    className="mt-4"
                  >
                    {uploadMutation.isPending ? "Đang upload..." : "Chọn file"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>File đã upload</CardTitle>
                <CardDescription>
                  Danh sách các file trong hệ thống. Click copy để sao chép đường dẫn.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadsLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (uploads as Upload[]).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Chưa có file nào được upload</p>
                ) : (
                  <div className="space-y-2">
                    {(uploads as Upload[]).map((upload: Upload) => (
                      <div key={upload.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getFileTypeIcon(upload.mimetype)}
                          <div>
                            <p className="font-medium">{upload.originalName}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{formatFileSize(upload.size)}</span>
                              <Badge variant="secondary">{upload.mimetype}</Badge>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{upload.path}</code>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(upload.path)}
                            title="Copy đường dẫn"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(upload.path, "_blank")}
                            title="Xem file"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteUploadMutation.mutate(upload.id)}
                            disabled={deleteUploadMutation.isPending}
                            title="Xóa file"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}