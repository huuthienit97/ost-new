import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Users, Shield, Settings, Coins, Award, Target, ShoppingCart, CheckCircle, TrendingUp, Activity, Clock, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BeePoint } from "@shared/schema";

export default function HomePage() {
  const { user, hasPermission } = useAuth();

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

        {/* Main Content Grid */}
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
  );
}