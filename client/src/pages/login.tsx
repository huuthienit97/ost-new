import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Lock, User } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [needsInit, setNeedsInit] = useState(false);
  const { toast } = useToast();

  // Check if system needs initialization
  const { data: initStatus } = useQuery<{ needsInit: boolean }>({
    queryKey: ["/api/auth/check-init"],
    retry: false,
  });

  React.useEffect(() => {
    if (initStatus?.needsInit) {
      setNeedsInit(true);
    } else if (initStatus?.needsInit === false) {
      setNeedsInit(false);
    }
  }, [initStatus]);

  const initMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/init", {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Khởi tạo thành công",
        description: `Tài khoản: ${data.username}, Mật khẩu: ${data.defaultPassword}`,
      });
      setUsername(data.username);
      setPassword(data.defaultPassword);
      setNeedsInit(false); // Hide init button after success
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể khởi tạo hệ thống",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
      });
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng ${data.user.fullName}`,
      });
      
      // Check if user must change password
      if (data.user.mustChangePassword) {
        window.location.href = "/change-password";
      } else {
        window.location.href = "/";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi đăng nhập",
        description: error.message || "Tên đăng nhập hoặc mật khẩu không đúng",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username?.trim() || !password?.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Users className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CLB Sáng Tạo</h1>
          <p className="text-gray-600 mt-2">Hệ thống quản lý thành viên</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Đăng nhập</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>

            {needsInit && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-gray-600 text-center mb-3">
                  Lần đầu sử dụng? Khởi tạo hệ thống
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => initMutation.mutate()}
                  disabled={initMutation.isPending}
                >
                  {initMutation.isPending ? "Đang khởi tạo..." : "Khởi tạo hệ thống"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}