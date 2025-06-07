import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Target, Calendar, Users, Award, Camera, Send, CheckCircle, XCircle, Clock, Eye, Play, Upload, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Mission {
  id: number;
  title: string;
  description: string;
  category: string;
  type: string;
  beePointsReward: number;
  requiresPhoto: boolean;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  priority: string;
  tags: string[];
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
  mission: Mission;
}

export default function MyMissionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<MissionAssignment | null>(null);
  const [submissionNote, setSubmissionNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch user's missions
  const { data: myMissions = [], isLoading: missionsLoading } = useQuery({
    queryKey: ["/api/missions/my"],
  });

  // Update assignment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: number; status: string }) => {
      return await apiRequest("PATCH", `/api/missions/assignments/${assignmentId}/status`, { status });
    },
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: data.message || "Cập nhật trạng thái thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/missions/my"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    },
  });

  // Submit mission mutation
  const submitMissionMutation = useMutation({
    mutationFn: async ({ missionId, submissionNote, file }: { missionId: number; submissionNote: string; file?: File }) => {
      const formData = new FormData();
      formData.append("submissionNote", submissionNote);
      if (file) {
        formData.append("photo", file);
      }

      const response = await fetch(`/api/missions/${missionId}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit mission");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Nộp nhiệm vụ thành công",
      });
      setIsSubmitDialogOpen(false);
      setSelectedAssignment(null);
      setSubmissionNote("");
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/missions/my"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể nộp nhiệm vụ",
        variant: "destructive",
      });
    },
  });

  const handleStartMission = (assignment: MissionAssignment) => {
    updateStatusMutation.mutate({
      assignmentId: assignment.id,
      status: "in_progress"
    });
  };

  const handleSubmitMission = () => {
    if (!selectedAssignment) return;

    if (selectedAssignment.mission.requiresPhoto && !selectedFile) {
      toast({
        title: "Lỗi",
        description: "Nhiệm vụ này yêu cầu tải lên hình ảnh",
        variant: "destructive",
      });
      return;
    }

    submitMissionMutation.mutate({
      missionId: selectedAssignment.mission.id,
      submissionNote,
      file: selectedFile || undefined,
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
      case "assigned": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "completed": return "bg-green-500";
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
      default: return status;
    }
  };

  const isDeadlineNear = (deadline?: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    return deadlineDate < now;
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  const assignedMissions = myMissions.filter((item: any) => item.assignment.status === 'assigned');
  const inProgressMissions = myMissions.filter((item: any) => item.assignment.status === 'in_progress');
  const submittedMissions = myMissions.filter((item: any) => ['submitted', 'completed', 'rejected'].includes(item.assignment.status));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nhiệm vụ của tôi</h1>
          <p className="text-muted-foreground">Theo dõi và hoàn thành các nhiệm vụ được giao</p>
        </div>
      </div>

      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assigned" className="relative">
            Được giao
            {assignedMissions.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {assignedMissions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="relative">
            Đang thực hiện
            {inProgressMissions.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {inProgressMissions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="relative">
            Đã hoàn thành
            {submittedMissions.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {submittedMissions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          <div className="grid gap-4">
            {assignedMissions.map((item: any) => {
              const assignment = item.assignment;
              const mission = item.mission;
              const daysUntilDeadline = getDaysUntilDeadline(mission.deadline);

              return (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          {mission.title}
                          {isOverdue(mission.deadline) && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </CardTitle>
                        <CardDescription>{mission.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getPriorityColor(mission.priority)} text-white`}>
                          {mission.priority}
                        </Badge>
                        <Badge className={`${getStatusColor(assignment.status)} text-white`}>
                          {getStatusText(assignment.status)}
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
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span>Giao: {new Date(assignment.assignedDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        {mission.requiresPhoto && (
                          <div className="flex items-center gap-2">
                            <Camera className="h-4 w-4 text-green-500" />
                            <span>Cần hình ảnh</span>
                          </div>
                        )}
                        {mission.deadline && (
                          <div className="flex items-center gap-2">
                            <Clock className={`h-4 w-4 ${isOverdue(mission.deadline) ? 'text-red-500' : isDeadlineNear(mission.deadline) ? 'text-orange-500' : 'text-blue-500'}`} />
                            <span className={isOverdue(mission.deadline) ? 'text-red-500 font-medium' : isDeadlineNear(mission.deadline) ? 'text-orange-500 font-medium' : ''}>
                              {isOverdue(mission.deadline) 
                                ? `Quá hạn ${Math.abs(daysUntilDeadline!)} ngày`
                                : daysUntilDeadline === 0 
                                ? 'Hạn hôm nay' 
                                : `Còn ${daysUntilDeadline} ngày`
                              }
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end">
                        <Button
                          onClick={() => handleStartMission(assignment)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Bắt đầu thực hiện
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {assignedMissions.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Không có nhiệm vụ mới được giao</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          <div className="grid gap-4">
            {inProgressMissions.map((item: any) => {
              const assignment = item.assignment;
              const mission = item.mission;
              const daysUntilDeadline = getDaysUntilDeadline(mission.deadline);

              return (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          {mission.title}
                          {isOverdue(mission.deadline) && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </CardTitle>
                        <CardDescription>{mission.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getPriorityColor(mission.priority)} text-white`}>
                          {mission.priority}
                        </Badge>
                        <Badge className={`${getStatusColor(assignment.status)} text-white`}>
                          {getStatusText(assignment.status)}
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
                          <Calendar className="h-4 w-4 text-green-500" />
                          <span>Bắt đầu: {assignment.startedDate ? new Date(assignment.startedDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                        </div>
                        {mission.requiresPhoto && (
                          <div className="flex items-center gap-2">
                            <Camera className="h-4 w-4 text-green-500" />
                            <span>Cần hình ảnh</span>
                          </div>
                        )}
                        {mission.deadline && (
                          <div className="flex items-center gap-2">
                            <Clock className={`h-4 w-4 ${isOverdue(mission.deadline) ? 'text-red-500' : isDeadlineNear(mission.deadline) ? 'text-orange-500' : 'text-blue-500'}`} />
                            <span className={isOverdue(mission.deadline) ? 'text-red-500 font-medium' : isDeadlineNear(mission.deadline) ? 'text-orange-500 font-medium' : ''}>
                              {isOverdue(mission.deadline) 
                                ? `Quá hạn ${Math.abs(daysUntilDeadline!)} ngày`
                                : daysUntilDeadline === 0 
                                ? 'Hạn hôm nay' 
                                : `Còn ${daysUntilDeadline} ngày`
                              }
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end">
                        <Button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setIsSubmitDialogOpen(true);
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Nộp nhiệm vụ
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {inProgressMissions.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Không có nhiệm vụ đang thực hiện</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {submittedMissions.map((item: any) => {
              const assignment = item.assignment;
              const mission = item.mission;

              return (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
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
                        <Badge className={`${getStatusColor(assignment.status)} text-white`}>
                          {getStatusText(assignment.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span>{assignment.pointsAwarded || mission.beePointsReward} BeePoints</span>
                        </div>
                        {assignment.completedDate && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Hoàn thành: {new Date(assignment.completedDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        )}
                        {assignment.status === 'submitted' && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-500" />
                            <span>Chờ đánh giá</span>
                          </div>
                        )}
                      </div>

                      {assignment.submissionNote && (
                        <div>
                          <span className="font-medium text-sm">Ghi chú nộp bài:</span>
                          <p className="text-sm text-muted-foreground mt-1">{assignment.submissionNote}</p>
                        </div>
                      )}

                      {assignment.reviewNote && (
                        <div>
                          <span className="font-medium text-sm">Nhận xét:</span>
                          <p className="text-sm text-muted-foreground mt-1">{assignment.reviewNote}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {submittedMissions.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Chưa có nhiệm vụ nào hoàn thành</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit Mission Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nộp nhiệm vụ</DialogTitle>
            <DialogDescription>
              Nộp bài cho nhiệm vụ: {selectedAssignment?.mission.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="submissionNote">Ghi chú</Label>
              <Textarea
                id="submissionNote"
                value={submissionNote}
                onChange={(e) => setSubmissionNote(e.target.value)}
                placeholder="Mô tả về việc hoàn thành nhiệm vụ..."
                rows={4}
              />
            </div>

            {selectedAssignment?.mission.requiresPhoto && (
              <div>
                <Label htmlFor="photo">Hình ảnh {selectedAssignment.mission.requiresPhoto && "(Bắt buộc)"}</Label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Đã chọn: {selectedFile.name}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleSubmitMission}
                disabled={submitMissionMutation.isPending || (selectedAssignment?.mission.requiresPhoto && !selectedFile)}
                className="flex-1"
              >
                {submitMissionMutation.isPending ? "Đang nộp..." : "Nộp nhiệm vụ"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSubmitDialogOpen(false);
                  setSelectedAssignment(null);
                  setSubmissionNote("");
                  setSelectedFile(null);
                }}
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}