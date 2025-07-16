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
import { Plus, Target, Calendar, Users, Award, Camera, Send, CheckCircle, XCircle, Clock, Eye, UserPlus, AlertCircle, Edit, Trash2, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";

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
  status: string;
  assignedDate: string;
  startedDate?: string;
  completedDate?: string;
  submissionNote?: string;
  reviewNote?: string;
  pointsAwarded: number;
  user?: {
    id: number;
    fullName: string;
    username: string;
    email: string;
  };
}

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
}

export default function MissionAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<MissionAssignment | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("missions");
  const [reviewForm, setReviewForm] = useState({
    status: "completed",
    reviewNote: "",
    pointsAwarded: 0,
  });
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
    isMandatory: false,
  });

  // Fetch missions
  const { data: missions = [], isLoading: missionsLoading } = useQuery({
    queryKey: ["/api/missions"],
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users/all"],
  });

  // Fetch mission assignments for review
  const { data: assignments = [] } = useQuery({
    queryKey: ["/api/missions/assignments"],
    queryFn: async () => {
      const response = await fetch("/api/missions/assignments", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch assignments");
      return response.json();
    },
  });

  // Create mission mutation
  const createMissionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/missions", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          maxParticipants: data.maxParticipants ? parseInt(data.maxParticipants) : null,
          beePointsReward: parseInt(data.beePointsReward) || 0,
        })
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

  // Bulk assign mission mutation
  const assignMissionMutation = useMutation({
    mutationFn: async ({ missionId, userIds }: { missionId: number; userIds: number[] }) => {
      return await apiRequest(`/api/missions/${missionId}/assign-bulk`, {
        method: "POST",
        body: JSON.stringify({ userIds })
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Giao nhiệm vụ thành công",
      });
      setIsAssignDialogOpen(false);
      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/missions/assignments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể giao nhiệm vụ",
        variant: "destructive",
      });
    },
  });

  // Review assignment mutation
  const reviewAssignmentMutation = useMutation({
    mutationFn: async (data: { assignmentId: number; status: string; reviewNote: string; pointsAwarded: number }) => {
      return await apiRequest(`/api/missions/assignments/${data.assignmentId}/review`, {
        method: "POST",
        body: JSON.stringify({
          status: data.status,
          reviewNote: data.reviewNote,
          pointsAwarded: data.pointsAwarded,
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đánh giá nhiệm vụ thành công",
      });
      setIsReviewDialogOpen(false);
      setSelectedAssignment(null);
      queryClient.invalidateQueries({ queryKey: ["/api/missions/assignments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể đánh giá nhiệm vụ",
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
      isMandatory: false,
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

  const handleReviewAssignment = () => {
    if (!selectedAssignment) return;
    reviewAssignmentMutation.mutate({
      assignmentId: selectedAssignment.id,
      status: reviewForm.status,
      reviewNote: reviewForm.reviewNote,
      pointsAwarded: reviewForm.pointsAwarded,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "paused": return "bg-yellow-500";
      case "completed": return "bg-blue-500";
      case "cancelled": return "bg-red-500";
      case "assigned": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "submitted": return "bg-purple-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "assigned": return "Đã giao";
      case "in_progress": return "Đang thực hiện";
      case "completed": return "Hoàn thành";
      case "submitted": return "Đã nộp";
      case "rejected": return "Từ chối";
      case "active": return "Hoạt động";
      case "paused": return "Tạm dừng";
      case "cancelled": return "Hủy bỏ";
      default: return status;
    }
  };

  if (missionsLoading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-lg">Đang tải...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quản trị Nhiệm vụ</h1>
            <p className="text-muted-foreground">Quản lý toàn bộ nhiệm vụ và phân công công việc</p>
          </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo nhiệm vụ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo nhiệm vụ mới</DialogTitle>
              <DialogDescription>
                Tạo nhiệm vụ mới cho thành viên trong câu lạc bộ
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={missionForm.title}
                  onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })}
                  placeholder="Nhập tiêu đề nhiệm vụ"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={missionForm.description}
                  onChange={(e) => setMissionForm({ ...missionForm, description: e.target.value })}
                  placeholder="Mô tả chi tiết nhiệm vụ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Danh mục</Label>
                  <Select
                    value={missionForm.category}
                    onValueChange={(value) => setMissionForm({ ...missionForm, category: value })}
                  >
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
                  <Label>Loại</Label>
                  <Select
                    value={missionForm.type}
                    onValueChange={(value) => setMissionForm({ ...missionForm, type: value })}
                  >
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
                  <Label htmlFor="maxParticipants">Số người tối đa</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={missionForm.maxParticipants}
                    onChange={(e) => setMissionForm({ ...missionForm, maxParticipants: e.target.value })}
                    placeholder="Không giới hạn"
                  />
                </div>

                <div>
                  <Label htmlFor="beePointsReward">Điểm thưởng</Label>
                  <Input
                    id="beePointsReward"
                    type="number"
                    value={missionForm.beePointsReward}
                    onChange={(e) => setMissionForm({ ...missionForm, beePointsReward: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label>Độ ưu tiên</Label>
                <Select
                  value={missionForm.priority}
                  onValueChange={(value) => setMissionForm({ ...missionForm, priority: value })}
                >
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
                  <Label htmlFor="startDate">Ngày bắt đầu</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={missionForm.startDate}
                    onChange={(e) => setMissionForm({ ...missionForm, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Ngày kết thúc</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={missionForm.endDate}
                    onChange={(e) => setMissionForm({ ...missionForm, endDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="deadline">Hạn chót</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={missionForm.deadline}
                    onChange={(e) => setMissionForm({ ...missionForm, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiresPhoto"
                    checked={missionForm.requiresPhoto}
                    onCheckedChange={(checked) => 
                      setMissionForm({ ...missionForm, requiresPhoto: checked as boolean })
                    }
                  />
                  <Label htmlFor="requiresPhoto">Yêu cầu tải lên hình ảnh</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isMandatory"
                    checked={missionForm.isMandatory}
                    onCheckedChange={(checked) => 
                      setMissionForm({ ...missionForm, isMandatory: checked as boolean })
                    }
                  />
                  <Label htmlFor="isMandatory">Nhiệm vụ bắt buộc (BCN giao)</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateMission}
                  disabled={createMissionMutation.isPending}
                  className="flex-1"
                >
                  {createMissionMutation.isPending ? "Đang tạo..." : "Tạo nhiệm vụ"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="missions">Danh sách nhiệm vụ</TabsTrigger>
          <TabsTrigger value="assignments">Phân công & Đánh giá</TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="space-y-4">
          <div className="grid gap-4">
            {missions.map((mission: Mission) => (
              <Card key={mission.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {mission.title}
                      </CardTitle>
                      <CardDescription>{mission.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getPriorityColor(mission.priority)} text-white`}>
                        {mission.priority}
                      </Badge>
                      <Badge className={`${getStatusColor(mission.status)} text-white`}>
                        {getStatusText(mission.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span>{mission.beePointsReward} BeePoints</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>
                          {mission.currentParticipants}
                          {mission.maxParticipants && `/${mission.maxParticipants}`} người
                        </span>
                      </div>
                      {mission.requiresPhoto && (
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-green-500" />
                          <span>Cần hình ảnh</span>
                        </div>
                      )}
                      {mission.deadline && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-500" />
                          <span>Hạn: {new Date(mission.deadline).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Tạo bởi: {mission.createdBy?.fullName || 'N/A'} • {new Date(mission.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMission(mission);
                            setIsAssignDialogOpen(true);
                          }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Giao việc
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {missions.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Chưa có nhiệm vụ nào</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="grid gap-4">
            {assignments.map((assignment: any) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        {assignment.mission?.title}
                      </CardTitle>
                      <CardDescription>
                        Được giao cho: {assignment.user?.fullName} ({assignment.user?.username})
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(assignment.status)} text-white`}>
                      {getStatusText(assignment.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Ngày giao:</span> {new Date(assignment.assignedDate).toLocaleDateString('vi-VN')}
                      </div>
                      {assignment.startedDate && (
                        <div>
                          <span className="font-medium">Bắt đầu:</span> {new Date(assignment.startedDate).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                      {assignment.completedDate && (
                        <div>
                          <span className="font-medium">Hoàn thành:</span> {new Date(assignment.completedDate).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>

                    {assignment.submissionNote && (
                      <div>
                        <span className="font-medium">Ghi chú nộp bài:</span>
                        <p className="text-sm text-muted-foreground mt-1">{assignment.submissionNote}</p>
                      </div>
                    )}

                    {assignment.reviewNote && (
                      <div>
                        <span className="font-medium">Nhận xét:</span>
                        <p className="text-sm text-muted-foreground mt-1">{assignment.reviewNote}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">Điểm thưởng:</span> {assignment.pointsAwarded} BeePoints
                      </div>
                      {assignment.status === 'submitted' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setReviewForm({
                              status: "completed",
                              reviewNote: "",
                              pointsAwarded: assignment.mission?.beePointsReward || 0,
                            });
                            setIsReviewDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Đánh giá
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {assignments.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Chưa có phân công nào</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Giao nhiệm vụ</DialogTitle>
            <DialogDescription>
              Chọn thành viên để giao nhiệm vụ: {selectedMission?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {users.map((user: User) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                  />
                  <Label htmlFor={`user-${user.id}`} className="flex-1">
                    {user.fullName} ({user.username})
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAssignMission}
                disabled={assignMissionMutation.isPending || selectedUsers.length === 0}
                className="flex-1"
              >
                {assignMissionMutation.isPending ? "Đang giao..." : "Giao nhiệm vụ"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAssignDialogOpen(false);
                  setSelectedUsers([]);
                }}
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đánh giá nhiệm vụ</DialogTitle>
            <DialogDescription>
              Đánh giá việc hoàn thành nhiệm vụ: {selectedAssignment?.mission?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Trạng thái</Label>
              <Select
                value={reviewForm.status}
                onValueChange={(value) => setReviewForm({ ...reviewForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pointsAwarded">Điểm thưởng</Label>
              <Input
                id="pointsAwarded"
                type="number"
                value={reviewForm.pointsAwarded}
                onChange={(e) => setReviewForm({ ...reviewForm, pointsAwarded: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="reviewNote">Nhận xét</Label>
              <Textarea
                id="reviewNote"
                value={reviewForm.reviewNote}
                onChange={(e) => setReviewForm({ ...reviewForm, reviewNote: e.target.value })}
                placeholder="Nhận xét về việc hoàn thành nhiệm vụ"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleReviewAssignment}
                disabled={reviewAssignmentMutation.isPending}
                className="flex-1"
              >
                {reviewAssignmentMutation.isPending ? "Đang đánh giá..." : "Hoàn tất đánh giá"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsReviewDialogOpen(false)}
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}