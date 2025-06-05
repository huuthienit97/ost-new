import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, UserPlus, LogOut, Settings, Coins, User, Award, Key, Calendar, Building, Crown, Target } from "lucide-react";
import { Link } from "wouter";
import { getInitials } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { BeePoint } from "@shared/schema";

export default function HomePage() {
  const { user, logout, hasPermission } = useAuth();

  // Fetch user's BeePoints
  const { data: beePoints } = useQuery<BeePoint>({
    queryKey: ["/api/bee-points/me"],
    enabled: !!user,
  });

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
              <Link href="/profile">
                <Button variant="ghost" size="sm" title="Thông tin cá nhân">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
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
          <h2 className="text-2xl font-bold text-gray-900">Xin chào, {user.fullName}!</h2>
          <p className="text-gray-600 mt-2">Chào mừng bạn đến với hệ thống quản lý CLB Sáng Tạo</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Members Management - Available for all users */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/members"}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Quản lý thành viên</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Xem và quản lý danh sách thành viên câu lạc bộ
              </p>
            </CardContent>
          </Card>

          {/* Admin Panel - Only for admin users */}
          {(user.role?.name === 'admin' || user.role?.name === 'super_admin') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/admin"}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span>Quản trị hệ thống</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Quản lý người dùng, vai trò và hệ thống
                </p>
              </CardContent>
            </Card>
          )}

          {/* Settings - Only for admin users */}
          {(user.role?.name === 'admin' || user.role?.name === 'super_admin') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/settings"}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <span>Cài đặt hệ thống</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Quản lý thông tin app, logo và file upload
                </p>
              </CardContent>
            </Card>
          )}

          {/* API Keys Management - Only for admin users */}
          {(user.role?.name === 'admin' || user.role?.name === 'super_admin') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/api-keys"}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-indigo-600" />
                  <span>Quản lý API Keys</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Tạo và quản lý API keys cho ứng dụng thứ 3
                </p>
              </CardContent>
            </Card>
          )}

          {/* Academic Years Management - Only for admin users */}
          {(user.role?.name === 'admin' || user.role?.name === 'super_admin') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/academic-years"}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <span>Quản lý khóa học</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Quản lý khóa học từ tháng 11 đến tháng 11 năm sau
                </p>
              </CardContent>
            </Card>
          )}

          {/* Divisions Management - Only for admin users */}
          {(user.role?.name === 'admin' || user.role?.name === 'super_admin') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/divisions"}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-orange-600" />
                  <span>Quản lý ban</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Quản lý các ban trong câu lạc bộ
                </p>
              </CardContent>
            </Card>
          )}

          {/* Positions Management - Available for viewing */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/positions"}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-purple-600" />
                <span>Hệ thống chức vụ</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Xem danh sách chức vụ được chuẩn hóa
              </p>
            </CardContent>
          </Card>

          {/* Missions - Available for all users */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/missions"}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-indigo-600" />
                <span>Nhiệm vụ</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Tham gia nhiệm vụ và nhận điểm thưởng BeePoints
              </p>
            </CardContent>
          </Card>

          {/* Shop - Available for all users */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/shop"}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <span>Cửa hàng</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Đổi thưởng với BeePoints và xem lịch sử đơn hàng
              </p>
            </CardContent>
          </Card>

          {/* Achievements - Available for all users */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/achievements"}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span>Thành tích</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Xem thành tích cá nhân và quản lý khen thưởng
              </p>
            </CardContent>
          </Card>

          {/* Statistics - Available for all users */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <span>Thống kê câu lạc bộ</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng thành viên:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thành viên hoạt động:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cựu thành viên:</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Documentation - Only for admin users */}
          {(user.role?.name === 'admin' || user.role?.name === 'super_admin') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open("/api-docs", "_blank")}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Tài liệu API</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Xem tài liệu API và thử nghiệm endpoints
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* User Info */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Họ và tên</p>
                  <p className="text-gray-600">{user.fullName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Tên đăng nhập</p>
                  <p className="text-gray-600">{user.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-gray-600">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Vai trò</p>
                  <p className="text-gray-600">{user.role.displayName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BeePoint Card */}
        <div className="mt-6">
          <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-amber-800">
                <Coins className="h-5 w-5" />
                <span>BeePoint của bạn</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {(beePoints as BeePoint)?.currentPoints ?? 0}
                  </div>
                  <div className="text-sm text-amber-700">Điểm hiện tại</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {(beePoints as BeePoint)?.totalEarned ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">Tổng kiếm được</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {(beePoints as BeePoint)?.totalSpent ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">Đã sử dụng</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-amber-200">
                <p className="text-xs text-amber-600 text-center">
                  Tích lũy điểm qua các hoạt động và sử dụng để đổi phần thưởng
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}