import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Save,
  Upload,
  Eye,
  EyeOff
} from "lucide-react";

interface UserSettings {
  id: number;
  notifications: {
    email: boolean;
    push: boolean;
    missions: boolean;
    achievements: boolean;
    social: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showEmail: boolean;
    showPhone: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: 'vi' | 'en';
  };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Fetch user settings
  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ["/api/user-settings"],
    enabled: !!user,
    staleTime: 0,
    retry: 3,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      return apiRequest("/api/user-settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-settings"] });
      toast({ title: "Đã lưu cài đặt!" });
    },
    onError: () => {
      toast({ 
        title: "Lỗi", 
        description: "Không thể lưu cài đặt.",
        variant: "destructive" 
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Đã đổi mật khẩu thành công!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Lỗi", 
        description: error.message || "Không thể đổi mật khẩu.",
        variant: "destructive" 
      });
    },
  });

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({ 
        title: "Lỗi", 
        description: "Mật khẩu xác nhận không khớp.",
        variant: "destructive" 
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({ 
        title: "Lỗi", 
        description: "Mật khẩu mới phải có ít nhất 6 ký tự.",
        variant: "destructive" 
      });
      return;
    }
    changePasswordMutation.mutate();
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    if (!settings) return;
    updateSettingsMutation.mutate({
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
      privacy: settings.privacy,
      preferences: settings.preferences,
    });
  };

  const handlePrivacyChange = (key: string, value: any) => {
    if (!settings) return;
    updateSettingsMutation.mutate({
      notifications: settings.notifications,
      privacy: {
        ...settings.privacy,
        [key]: value,
      },
      preferences: settings.preferences,
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Cài đặt</h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Hồ sơ
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Thông báo
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Riêng tư
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Bảo mật
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tên đầy đủ</Label>
                    <Input value={user?.fullName || ""} disabled />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={user?.email || ""} disabled />
                  </div>
                </div>
                <div>
                  <Label>Tên đăng nhập</Label>
                  <Input value={user?.username || ""} disabled />
                </div>
                <p className="text-sm text-gray-500">
                  Để thay đổi thông tin cá nhân, vui lòng liên hệ với quản trị viên.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt thông báo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Thông báo email</Label>
                    <p className="text-sm text-gray-500">Nhận thông báo qua email</p>
                  </div>
                  <Switch 
                    checked={settings?.notifications?.email || false}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Thông báo đẩy</Label>
                    <p className="text-sm text-gray-500">Nhận thông báo trên trình duyệt</p>
                  </div>
                  <Switch 
                    checked={settings?.notifications?.push || false}
                    onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Thông báo nhiệm vụ</Label>
                    <p className="text-sm text-gray-500">Thông báo về nhiệm vụ mới và hoàn thành</p>
                  </div>
                  <Switch 
                    checked={settings?.notifications?.missions || false}
                    onCheckedChange={(checked) => handleNotificationChange('missions', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Thông báo thành tích</Label>
                    <p className="text-sm text-gray-500">Thông báo về thành tích mới</p>
                  </div>
                  <Switch 
                    checked={settings?.notifications?.achievements || false}
                    onCheckedChange={(checked) => handleNotificationChange('achievements', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Thông báo xã hội</Label>
                    <p className="text-sm text-gray-500">Thông báo về bạn bè và tương tác</p>
                  </div>
                  <Switch 
                    checked={settings?.notifications?.social || false}
                    onCheckedChange={(checked) => handleNotificationChange('social', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt riêng tư</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Quyền riêng tư hồ sơ</Label>
                  <p className="text-sm text-gray-500 mb-2">Ai có thể xem hồ sơ của bạn?</p>
                  <select 
                    className="w-full p-2 border rounded"
                    value={settings?.privacy?.profileVisibility || 'public'}
                    onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                  >
                    <option value="public">Công khai</option>
                    <option value="friends">Chỉ bạn bè</option>
                    <option value="private">Riêng tư</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Hiển thị email</Label>
                    <p className="text-sm text-gray-500">Cho phép người khác xem email của bạn</p>
                  </div>
                  <Switch 
                    checked={settings?.privacy?.showEmail || false}
                    onCheckedChange={(checked) => handlePrivacyChange('showEmail', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Hiển thị số điện thoại</Label>
                    <p className="text-sm text-gray-500">Cho phép người khác xem số điện thoại của bạn</p>
                  </div>
                  <Switch 
                    checked={settings?.privacy?.showPhone || false}
                    onCheckedChange={(checked) => handlePrivacyChange('showPhone', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Đổi mật khẩu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Mật khẩu hiện tại</Label>
                  <div className="relative">
                    <Input 
                      type={showPasswords.current ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Mật khẩu mới</Label>
                  <div className="relative">
                    <Input 
                      type={showPasswords.new ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Xác nhận mật khẩu mới</Label>
                  <div className="relative">
                    <Input 
                      type={showPasswords.confirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={handlePasswordChange}
                  disabled={!currentPassword || !newPassword || !confirmPassword || changePasswordMutation.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {changePasswordMutation.isPending ? "Đang đổi..." : "Đổi mật khẩu"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}