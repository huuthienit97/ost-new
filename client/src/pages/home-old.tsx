import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Users, Shield, UserPlus, LogOut, Settings, Coins, User, Award, Key, Calendar, Building, Crown, Target, ShoppingCart, CheckCircle, TrendingUp, Activity, Clock, Star } from "lucide-react";
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

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ["/api/stats/dashboard"],
    enabled: !!user,
  });

  // Fetch recent activities
  const { data: recentActivities = [] } = useQuery({
    queryKey: ["/api/activities/recent"],
    enabled: !!user,
  });

  // Fetch my missions
  const { data: myMissions = [] } = useQuery({
    queryKey: ["/api/missions/my"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  const pendingMissions = myMissions.filter((m: any) => m.assignment?.status === 'assigned').length;
  const inProgressMissions = myMissions.filter((m: any) => m.assignment?.status === 'in_progress').length;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Xin chào, {user.fullName}! 👋
            </h1>
            <p className="text-muted-foreground mt-2">
              Chào mừng bạn quay trở lại với CLB Sáng Tạo
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300">
              <Coins className="h-4 w-4 mr-1" />
              {beePoints?.currentPoints || 0} BeePoints
            </Badge>
            <Badge variant="outline">
              {user.role?.displayName}
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="BeePoints hiện tại"
            value={beePoints?.currentPoints || 0}
            description="Điểm tích lũy của bạn"
            icon={<Coins className="h-4 w-4 text-yellow-500" />}
            onClick={() => window.location.href = "/shop"}
            className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
          />
          <StatsCard
            title="Nhiệm vụ đang chờ"
            value={pendingMissions}
            description="Nhiệm vụ cần thực hiện"
            icon={<Clock className="h-4 w-4 text-orange-500" />}
            onClick={() => window.location.href = "/my-missions"}
            className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
          />
          <StatsCard
            title="Đang thực hiện"
            value={inProgressMissions}
            description="Nhiệm vụ đang làm"
            icon={<Activity className="h-4 w-4 text-blue-500" />}
            onClick={() => window.location.href = "/my-missions"}
            className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
          />
          <StatsCard
            title="Thành tích đạt được"
            value={stats?.userAchievements || 0}
            description="Tổng thành tích"
            icon={<Star className="h-4 w-4 text-purple-500" />}
            onClick={() => window.location.href = "/achievements"}
            className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recent Missions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Nhiệm vụ gần đây</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myMissions.slice(0, 3).map((mission: any) => (
                  <div key={mission.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{mission.mission.title}</h4>
                      <p className="text-sm text-muted-foreground">{mission.mission.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={mission.assignment?.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {mission.assignment?.status === 'assigned' && 'Đã giao'}
                        {mission.assignment?.status === 'in_progress' && 'Đang làm'}
                        {mission.assignment?.status === 'completed' && 'Hoàn thành'}
                        {mission.assignment?.status === 'submitted' && 'Chờ duyệt'}
                      </Badge>
                      <span className="text-sm font-medium text-yellow-600">
                        {mission.mission.beePointsReward} BP
                      </span>
                    </div>
                  </div>
                ))}
                {myMissions.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Chưa có nhiệm vụ nào được giao
                  </p>
                )}
                <div className="pt-2">
                  <Button variant="outline" onClick={() => window.location.href = "/my-missions"} className="w-full">
                    Xem tất cả nhiệm vụ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <span>Thao tác nhanh</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = "/missions"} 
                  className="w-full justify-start"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Xem nhiệm vụ
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = "/shop"} 
                  className="w-full justify-start"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cửa hàng
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = "/achievements"} 
                  className="w-full justify-start"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Thành tích
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = "/members"} 
                  className="w-full justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Thành viên
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        {hasPermission("mission:create") && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/mission-admin"}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span>Quản lý nhiệm vụ</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Tạo và giao nhiệm vụ cho thành viên
                </p>
              </CardContent>
            </Card>

            {hasPermission("mission:review") && (
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/mission-completion"}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Duyệt nhiệm vụ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Xem xét và duyệt kết quả nhiệm vụ
                  </p>
                </CardContent>
              </Card>
            )}

            {(user.role?.name === 'admin' || user.role?.name === 'super_admin') && (
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/admin"}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    <span>Quản trị hệ thống</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Quản lý vai trò và phân quyền
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
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

          {/* User Management - Only for admin users */}
          {(user.role?.name === 'admin' || user.role?.name === 'super_admin') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/user-management"}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <span>Quản lý tài khoản</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Quản lý thông tin đăng nhập và tài khoản người dùng
                </p>
              </CardContent>
            </Card>
          )}

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

          {/* Shop Admin - Available for shop managers */}
          {hasPermission("shop:manage") && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/shop-admin"}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  <span>Quản lý cửa hàng</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Quản lý sản phẩm, đơn hàng và hệ thống cửa hàng
                </p>
              </CardContent>
            </Card>
          )}

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