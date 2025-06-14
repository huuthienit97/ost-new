import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Target, Calendar, Users, Award, Camera, UserPlus, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Mission {
  id: number;
  title: string;
  description: string;
  category: string;
  type: string;
  maxParticipants?: number;
  currentParticipants: number;
  beePointsReward: number;
  requiresPhoto: boolean;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  priority: string;
  status: string;
  tags: string[];
  createdBy: {
    id: number;
    fullName: string;
    username: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface MissionAssignment {
  id: number;
  missionId: number;
  userId: number;
  status: string;
  assignedAt: string;
}

export default function MissionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch missions
  const { data: missions = [], isLoading: missionsLoading } = useQuery({
    queryKey: ["/api/missions"],
  });

  // Fetch user's mission assignments
  const { data: userAssignments = [] } = useQuery({
    queryKey: ["/api/missions/my"],
  });

  // Self-assign mutation
  const selfAssignMutation = useMutation({
    mutationFn: async (missionId: number) => {
      return await apiRequest("POST", `/api/missions/${missionId}/self-assign`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Tự nhận nhiệm vụ thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/missions/my"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tự nhận nhiệm vụ",
        variant: "destructive",
      });
    },
  });

  const handleSelfAssign = (missionId: number) => {
    selfAssignMutation.mutate(missionId);
  };

  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const canSelfAssign = (mission: Mission) => {
    // Check if user is already assigned to this mission
    const isAssigned = Array.isArray(userAssignments) && 
      userAssignments.some((assignment: MissionAssignment) => assignment.missionId === mission.id);
    
    return mission.status === 'active' && 
           mission.isActive && 
           !isAssigned &&
           (!mission.maxParticipants || mission.currentParticipants < mission.maxParticipants);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "paused": return "bg-yellow-500";
      case "completed": return "bg-blue-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getAssignmentStatus = (mission: Mission) => {
    const assignment = Array.isArray(userAssignments) && 
      userAssignments.find((a: MissionAssignment) => a.missionId === mission.id);
    return assignment ? assignment.status : null;
  };

  if (missionsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-lg">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nhiệm vụ</h1>
          <p className="text-muted-foreground">Xem và tham gia các nhiệm vụ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/my-missions'}>
            <Eye className="h-4 w-4 mr-2" />
            Nhiệm vụ của tôi
          </Button>
          {user?.role?.permissions?.includes('mission:create') && (
            <Button variant="outline" onClick={() => window.location.href = '/mission-admin'}>
              <Target className="h-4 w-4 mr-2" />
              Quản lý nhiệm vụ
            </Button>
          )}
        </div>
      </div>

      {/* Mission Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(missions) && missions.map((mission: Mission) => {
          const isNearDeadline = mission.deadline && isDeadlineNear(mission.deadline);
          const assignmentStatus = getAssignmentStatus(mission);
          
          return (
            <Card key={mission.id} className={`h-full ${isNearDeadline ? 'border-red-500 bg-red-50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{mission.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`${getPriorityColor(mission.priority)} text-white`}>
                        {mission.priority === 'urgent' ? 'Khẩn cấp' : 
                         mission.priority === 'high' ? 'Cao' :
                         mission.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                      </Badge>
                      <Badge variant="outline" className={`${getStatusColor(mission.status)} text-white`}>
                        {mission.status === 'active' ? 'Đang hoạt động' :
                         mission.status === 'paused' ? 'Tạm dừng' :
                         mission.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-sm">
                  {mission.description}
                </CardDescription>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span>{mission.beePointsReward} BeePoints</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>
                      {mission.currentParticipants}
                      {mission.maxParticipants ? `/${mission.maxParticipants}` : ''} người tham gia
                    </span>
                  </div>
                  
                  {mission.requiresPhoto && (
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-purple-500" />
                      <span>Yêu cầu ảnh</span>
                    </div>
                  )}
                  
                  {mission.deadline && (
                    <div className={`flex items-center gap-2 ${isNearDeadline ? 'text-red-600 font-medium' : ''}`}>
                      <Calendar className="h-4 w-4" />
                      <span>
                        Hạn chót: {new Date(mission.deadline).toLocaleDateString('vi-VN')}
                        {isNearDeadline && (
                          <span className="ml-2 text-red-600 font-bold">
                            (Sắp hết hạn!)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  {assignmentStatus ? (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="sm" 
                      onClick={() => window.location.href = '/my-missions'}
                    >
                      {assignmentStatus === 'assigned' ? 'Đã nhận - Xem chi tiết' :
                       assignmentStatus === 'in_progress' ? 'Đang thực hiện' :
                       assignmentStatus === 'submitted' ? 'Đã nộp' :
                       assignmentStatus === 'completed' ? 'Hoàn thành' : 'Xem chi tiết'}
                    </Button>
                  ) : canSelfAssign(mission) ? (
                    <Button 
                      onClick={() => handleSelfAssign(mission.id)}
                      className="w-full"
                      size="sm"
                      disabled={selfAssignMutation.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {selfAssignMutation.isPending ? 'Đang xử lý...' : 'Tự nhận nhiệm vụ'}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="sm" 
                      disabled
                    >
                      {mission.currentParticipants >= (mission.maxParticipants || Infinity) 
                        ? 'Đã đủ người tham gia' 
                        : mission.status !== 'active' 
                        ? 'Nhiệm vụ không hoạt động'
                        : 'Không thể tham gia'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}