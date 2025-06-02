import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings2, Upload, FileImage, Trash2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  // Settings queries
  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  // Uploads queries
  const { data: uploads = [], isLoading: uploadsLoading } = useQuery({
    queryKey: ["/api/uploads"],
  });

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

  const getSetting = (key: string): string => {
    const setting = (settings as Setting[]).find((s: Setting) => s.key === key);
    return setting?.value || "";
  };

  const handleSettingChange = (key: string, value: string, description?: string) => {
    settingMutation.mutate({ key, value, description });
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
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Settings2 className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Cài đặt hệ thống</h1>
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
                  defaultValue={getSetting("app_name")}
                  placeholder="Tên câu lạc bộ sáng tạo"
                  onBlur={(e) => handleSettingChange("app_name", e.target.value, "Tên hiển thị của ứng dụng")}
                />
              </div>
              <div>
                <Label htmlFor="app-description">Mô tả</Label>
                <Textarea
                  id="app-description"
                  defaultValue={getSetting("app_description")}
                  placeholder="Mô tả về câu lạc bộ..."
                  rows={3}
                  onBlur={(e) => handleSettingChange("app_description", e.target.value, "Mô tả về ứng dụng")}
                />
              </div>
              <div>
                <Label htmlFor="school-name">Tên trường</Label>
                <Input
                  id="school-name"
                  defaultValue={getSetting("school_name")}
                  placeholder="THPT ABC"
                  onBlur={(e) => handleSettingChange("school_name", e.target.value, "Tên trường học")}
                />
              </div>
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
                  defaultValue={getSetting("logo_url")}
                  placeholder="/uploads/logo.png"
                  onBlur={(e) => handleSettingChange("logo_url", e.target.value, "Đường dẫn đến logo")}
                />
              </div>
              <div>
                <Label htmlFor="favicon-url">Favicon URL</Label>
                <Input
                  id="favicon-url"
                  defaultValue={getSetting("favicon_url")}
                  placeholder="/uploads/favicon.ico"
                  onBlur={(e) => handleSettingChange("favicon_url", e.target.value, "Đường dẫn đến favicon")}
                />
              </div>
              <div>
                <Label htmlFor="logo-text">Text logo</Label>
                <Input
                  id="logo-text"
                  defaultValue={getSetting("logo_text")}
                  placeholder="CLB Sáng tạo"
                  onBlur={(e) => handleSettingChange("logo_text", e.target.value, "Text hiển thị khi không có logo")}
                />
              </div>
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
                Danh sách các file trong hệ thống
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
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(upload.path, "_blank")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUploadMutation.mutate(upload.id)}
                          disabled={deleteUploadMutation.isPending}
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
  );
}