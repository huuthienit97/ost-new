import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Target, Calendar, Users, Award, Camera, Send, CheckCircle, XCircle, Clock, Eye, UserPlus, AlertCircle } from "lucide-react";
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
  createdBy: number;
  isActive: boolean;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
}

export default function MissionsPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  const [missionForm, setMissionForm] = useState({
    title: "",
    description: "",
    category: "special",
    type: "one_time",
    maxParticipants: "",
    beePointsReward: "0",
    requiresPhoto: false,
    startDate: "",
    endDate: "",
    deadline: "",
    priority: "medium",
  });

  // Fetch missions
  const { data: missions = [], isLoading: missionsLoading } = useQuery<Mission[]>({
    queryKey: ["/api/missions"],
  });

  // Fetch all users for assignment
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users/all"],
    select: (data: any) => data?.users || [],
  });

  // Create mission mutation
  const createMissionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/missions", {
        ...data,
        maxParticipants: data.maxParticipants ? parseInt(data.maxParticipants) : null,
        beePointsReward: parseInt(data.beePointsReward) || 0,
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Tạo nhiệm vụ thành công",
      });
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo nhiệm vụ",
        variant: "destructive",
      });
    },
  });

  // Assign mission mutation
  const assignMissionMutation = useMutation({
    mutationFn: async ({ missionId, userIds }: { missionId: number; userIds: number[] }) => {
      return await apiRequest("POST", `/api/missions/${missionId}/assign`, { userIds });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Giao nhiệm vụ thành công",
      });
      setIsAssignDialogOpen(false);
      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể giao nhiệm vụ",
        variant: "destructive",
      });
    },
  });

  // Self-assign mission mutation
  const selfAssignMutation = useMutation({
    mutationFn: async (missionId: number) => {
      return await apiRequest("POST", `/api/missions/${missionId}/self-assign`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã nhận nhiệm vụ thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể nhận nhiệm vụ",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setMissionForm({
      title: "",
      description: "",
      category: "special",
      type: "one_time",
      maxParticipants: "",
      beePointsReward: "0",
      requiresPhoto: false,
      startDate: "",
      endDate: "",
      deadline: "",
      priority: "medium",
    });
  };

  const handleCreateMission = () => {
    if (!missionForm.title) {
      toast({
        title: "Lỗi",
        description: "Tiêu đề nhiệm vụ là bắt buộc",
        variant: "destructive",
      });
      return;
    }
    createMissionMutation.mutate(missionForm);
  };

  const handleAssignMission = () => {
    if (!selectedMission || selectedUsers.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất một người dùng",
        variant: "destructive",
      });
      return;
    }
    assignMissionMutation.mutate({
      missionId: selectedMission.id,
      userIds: selectedUsers,
    });
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "daily": return <Calendar className="h-4 w-4" />;
      case "weekly": return <Calendar className="h-4 w-4" />;
      case "monthly": return <Calendar className="h-4 w-4" />;
      case "special": return <Target className="h-4 w-4" />;
      case "project": return <Users className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const isDeadlineApproaching = (deadline?: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0;
  };

  const canSelfAssign = (mission: Mission) => {
    if (!mission.maxParticipants) return true;
    return mission.currentParticipants < mission.maxParticipants;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý nhiệm vụ</h1>
            <p className="text-gray-600 mt-1">Tạo, giao và theo dõi nhiệm vụ của thành viên</p>
          </div>
          
          {hasPermission("mission:create") && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo nhiệm vụ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tạo nhiệm vụ mới</DialogTitle>
                  <DialogDescription>
                    Tạo nhiệm vụ mới cho thành viên câu lạc bộ
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>Tiêu đề nhiệm vụ</Label>
                    <Input
                      value={missionForm.title}
                      onChange={(e) => setMissionForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Nhập tiêu đề nhiệm vụ"
                    />
                  </div>
                  
                  <div>
                    <Label>Mô tả</Label>
                    <Textarea
                      value={missionForm.description}
                      onChange={(e) => setMissionForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Mô tả chi tiết nhiệm vụ"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Loại nhiệm vụ</Label>
                      <Select value={missionForm.category} onValueChange={(value) => setMissionForm(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Hàng ngày</SelectItem>
                          <SelectItem value="weekly">Hàng tuần</SelectItem>
                          <SelectItem value="monthly">Hàng tháng</SelectItem>
                          <SelectItem value="special">Đặc biệt</SelectItem>
                          <SelectItem value="project">Dự án</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Kiểu thực hiện</Label>
                      <Select value={missionForm.type} onValueChange={(value) => setMissionForm(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one_time">Một lần</SelectItem>
                          <SelectItem value="repeatable">Lặp lại</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Số người tham gia tối đa</Label>
                      <Input
                        type="number"
                        value={missionForm.maxParticipants}
                        onChange={(e) => setMissionForm(prev => ({ ...prev, maxParticipants: e.target.value }))}
                        placeholder="Để trống nếu không giới hạn"
                      />
                    </div>
                    
                    <div>
                      <Label>Điểm thưởng BeePoint</Label>
                      <Input
                        type="number"
                        value={missionForm.beePointsReward}
                        onChange={(e) => setMissionForm(prev => ({ ...prev, beePointsReward: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Độ ưu tiên</Label>
                    <Select value={missionForm.priority} onValueChange={(value) => setMissionForm(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Thấp</SelectItem>
                        <SelectItem value="medium">Trung bình</SelectItem>
                        <SelectItem value="high">Cao</SelectItem>
                        <SelectItem value="urgent">Khẩn cấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Ngày bắt đầu</Label>
                      <Input
                        type="datetime-local"
                        value={missionForm.startDate}
                        onChange={(e) => setMissionForm(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Ngày kết thúc</Label>
                      <Input
                        type="datetime-local"
                        value={missionForm.endDate}
                        onChange={(e) => setMissionForm(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Deadline</Label>
                      <Input
                        type="datetime-local"
                        value={missionForm.deadline}
                        onChange={(e) => setMissionForm(prev => ({ ...prev, deadline: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresPhoto"
                      checked={missionForm.requiresPhoto}
                      onCheckedChange={(checked) => setMissionForm(prev => ({ ...prev, requiresPhoto: !!checked }))}
                    />
                    <Label htmlFor="requiresPhoto">Yêu cầu chụp ảnh minh chứng</Label>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateMission} disabled={createMissionMutation.isPending}>
                      {createMissionMutation.isPending ? "Đang tạo..." : "Tạo nhiệm vụ"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Hủy
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">Tất cả nhiệm vụ</TabsTrigger>
            <TabsTrigger value="my">Nhiệm vụ của tôi</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {missionsLoading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {missions.map((mission) => (
                  <Card key={mission.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(mission.category)}
                          <Badge variant="outline">{mission.category}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getPriorityColor(mission.priority)} text-white`}>
                            {mission.priority}
                          </Badge>
                          {mission.deadline && isDeadlineApproaching(mission.deadline) && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-lg">{mission.title}</CardTitle>
                      {mission.description && (
                        <CardDescription className="line-clamp-2">
                          {mission.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          {mission.beePointsReward} BeePoint
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {mission.currentParticipants}{mission.maxParticipants ? `/${mission.maxParticipants}` : ""}
                        </span>
                      </div>
                      
                      {mission.deadline && (
                        <div className="text-sm text-gray-600">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Deadline: {new Date(mission.deadline).toLocaleString("vi-VN")}
                        </div>
                      )}
                      
                      {mission.requiresPhoto && (
                        <div className="text-sm text-blue-600">
                          <Camera className="h-4 w-4 inline mr-1" />
                          Yêu cầu ảnh minh chứng
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        {hasPermission("mission:assign") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMission(mission);
                              setIsAssignDialogOpen(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Giao
                          </Button>
                        )}
                        
                        {canSelfAssign(mission) && (
                          <Button
                            size="sm"
                            onClick={() => selfAssignMutation.mutate(mission.id)}
                            disabled={selfAssignMutation.isPending}
                          >
                            Nhận nhiệm vụ
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my" className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              Tính năng nhiệm vụ của tôi sẽ được triển khai sau
            </div>
          </TabsContent>
        </Tabs>

        {/* Assignment Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Giao nhiệm vụ</DialogTitle>
              <DialogDescription>
                Chọn thành viên để giao nhiệm vụ "{selectedMission?.title}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {allUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers(prev => [...prev, user.id]);
                        } else {
                          setSelectedUsers(prev => prev.filter(id => id !== user.id));
                        }
                      }}
                    />
                    <Label htmlFor={`user-${user.id}`} className="text-sm">
                      {user.fullName} ({user.username})
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleAssignMission} disabled={assignMissionMutation.isPending}>
                  {assignMissionMutation.isPending ? "Đang giao..." : "Giao nhiệm vụ"}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsAssignDialogOpen(false);
                  setSelectedUsers([]);
                }}>
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}