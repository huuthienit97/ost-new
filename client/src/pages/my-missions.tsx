import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Target, 
  Clock, 
  Award, 
  CheckCircle, 
  Play, 
  Upload, 
  Camera, 
  Calendar,
  AlertCircle,
  FileText
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";

interface MissionAssignment {
  id: number;
  status: string;
  assignedDate: string;
  startedDate?: string;
  completedDate?: string;
  submissionNote?: string;
  reviewNote?: string;
  pointsAwarded: number;
  mission: {
    id: number;
    title: string;
    description: string;
    beePointsReward: number;
    deadline?: string;
    requiresPhoto: boolean;
  };
}

export default function MyMissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMission, setSelectedMission] = useState<MissionAssignment | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [submissionNote, setSubmissionNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch my assigned missions
  const { data: myMissions = [], isLoading } = useQuery({
    queryKey: ["/api/missions/my"],
    enabled: !!user,
  });

  // Start mission mutation
  const startMissionMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return await apiRequest(`/api/missions/assignments/${assignmentId}/status`, "PATCH", { 
        status: "in_progress" 
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Bạn đã bắt đầu thực hiện nhiệm vụ",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/missions/my"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể bắt đầu nhiệm vụ",
        variant: "destructive",
      });
    },
  });

  // Submit mission mutation
  const submitMissionMutation = useMutation({
    mutationFn: async ({ missionId, submissionNote, photo }: { 
      missionId: number; 
      submissionNote: string; 
      photo?: File 
    }) => {
      const formData = new FormData();
      formData.append("submissionNote", submissionNote);
      if (photo) {
        formData.append("photo", photo);
      }

      return await apiRequest(`/api/missions/${missionId}/submit`, "POST", formData);
    },
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: data.message || "Đã nộp nhiệm vụ thành công",
      });
      setIsSubmitDialogOpen(false);
      setSelectedMission(null);
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { label: "Đã giao", variant: "secondary" as const, color: "bg-blue-100 text-blue-800" },
      in_progress: { label: "Đang thực hiện", variant: "default" as const, color: "bg-yellow-100 text-yellow-800" },
      submitted: { label: "Đã nộp", variant: "default" as const, color: "bg-purple-100 text-purple-800" },
      completed: { label: "Hoàn thành", variant: "default" as const, color: "bg-green-100 text-green-800" },
      rejected: { label: "Yêu cầu làm lại", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status] || statusConfig.assigned;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const handleStartMission = (assignment: MissionAssignment) => {
    startMissionMutation.mutate(assignment.id);
  };

  const handleSubmitMission = () => {
    if (!selectedMission) return;
    
    submitMissionMutation.mutate({
      missionId: selectedMission.mission?.id || 0,
      submissionNote,
      photo: selectedFile || undefined,
    });
  };

  const openSubmitDialog = (mission: MissionAssignment) => {
    setSelectedMission(mission);
    setSubmissionNote("");
    setSelectedFile(null);
    setIsSubmitDialogOpen(true);
  };

  const isDeadlineNear = (deadline?: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    return deadlineDate < now;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-lg">Đang tải nhiệm vụ...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const assignedMissions = myMissions.filter((m: any) => m.status === 'assigned');
  const inProgressMissions = myMissions.filter((m: any) => m.status === 'in_progress');
  const submittedMissions = myMissions.filter((m: any) => m.status === 'submitted');
  const completedMissions = myMissions.filter((m: any) => m.status === 'completed');
  const rejectedMissions = myMissions.filter((m: any) => m.status === 'rejected');

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Nhiệm vụ của tôi</h1>
            <p className="text-muted-foreground">Xem và quản lý các nhiệm vụ được giao</p>
          </div>
        </div>

        <Tabs defaultValue="assigned" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="assigned">
              Chờ thực hiện ({assignedMissions.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              Đang làm ({inProgressMissions.length})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              Đã nộp ({submittedMissions.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Hoàn thành ({completedMissions.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Làm lại ({rejectedMissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-4">
            {assignedMissions.map((assignment: any) => {
              const mission = assignment.mission;
              
              return (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          {mission.title}
                          {isOverdue(mission.deadline) && (
                            <Badge variant="destructive" className="ml-2">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Quá hạn
                            </Badge>
                          )}
                          {isDeadlineNear(mission.deadline) && !isOverdue(mission.deadline) && (
                            <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Gần hạn
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{mission.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(assignment.status)}
                        <Badge className="bg-yellow-500 text-white">
                          <Award className="h-3 w-3 mr-1" />
                          {mission.beePointsReward}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="font-medium">Ngày giao:</div>
                          <div>{new Date(assignment.assignedDate).toLocaleDateString('vi-VN')}</div>
                        </div>
                        {mission.deadline && (
                          <div className="space-y-1">
                            <div className="font-medium">Hạn cuối:</div>
                            <div className={isOverdue(mission.deadline) ? "text-red-600 font-medium" : ""}>
                              <Calendar className="h-4 w-4 inline mr-1" />
                              {new Date(mission.deadline).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        )}
                      </div>

                      {mission.requiresPhoto && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <Camera className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-blue-700">Nhiệm vụ này yêu cầu hình ảnh minh chứng</span>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleStartMission(assignment)}
                          disabled={startMissionMutation.isPending}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {startMissionMutation.isPending ? "Đang bắt đầu..." : "Bắt đầu thực hiện"}
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
                    <p className="text-muted-foreground">Không có nhiệm vụ nào chờ thực hiện</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-4">
            {inProgressMissions.map((assignment: any) => {
              const mission = assignment.mission;
              
              return (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          {mission.title}
                          {isOverdue(mission.deadline) && (
                            <Badge variant="destructive" className="ml-2">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Quá hạn
                            </Badge>
                          )}
                          {isDeadlineNear(mission.deadline) && !isOverdue(mission.deadline) && (
                            <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Gần hạn
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{mission.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(assignment.status)}
                        <Badge className="bg-yellow-500 text-white">
                          <Award className="h-3 w-3 mr-1" />
                          {mission.beePointsReward}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="font-medium">Ngày bắt đầu:</div>
                          <div>{assignment.startedDate ? new Date(assignment.startedDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
                        </div>
                        {mission.deadline && (
                          <div className="space-y-1">
                            <div className="font-medium">Hạn cuối:</div>
                            <div className={isOverdue(mission.deadline) ? "text-red-600 font-medium" : ""}>
                              <Calendar className="h-4 w-4 inline mr-1" />
                              {new Date(mission.deadline).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="font-medium">Thời gian thực hiện:</div>
                          <div>
                            {assignment.startedDate ? 
                              Math.ceil((new Date().getTime() - new Date(assignment.startedDate).getTime()) / (1000 * 3600 * 24)) 
                              : 0} ngày
                          </div>
                        </div>
                      </div>

                      {mission.requiresPhoto && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <Camera className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-blue-700">Nhiệm vụ này yêu cầu hình ảnh minh chứng</span>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          onClick={() => openSubmitDialog(assignment)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Nộp bài
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
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Không có nhiệm vụ nào đang thực hiện</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="submitted" className="space-y-4">
            {submittedMissions.map((assignment: any) => {
              const mission = assignment.mission;
              
              return (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {mission.title}
                        </CardTitle>
                        <CardDescription>{mission.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(assignment.status)}
                        <Badge className="bg-yellow-500 text-white">
                          <Award className="h-3 w-3 mr-1" />
                          {mission.beePointsReward}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="font-medium">Ngày nộp:</div>
                          <div>{assignment.completedDate ? new Date(assignment.completedDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium">Trạng thái:</div>
                          <div>Chờ giáo viên đánh giá</div>
                        </div>
                      </div>

                      {assignment.submissionNote && (
                        <div className="space-y-2">
                          <div className="font-medium text-sm">Ghi chú nộp bài:</div>
                          <div className="p-3 bg-muted rounded-md text-sm">
                            {assignment.submissionNote}
                          </div>
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
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Không có nhiệm vụ nào đã nộp</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedMissions.map((assignment: any) => {
              const mission = assignment.mission;
              
              return (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow border-green-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          {mission.title}
                        </CardTitle>
                        <CardDescription>{mission.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(assignment.status)}
                        <Badge className="bg-green-500 text-white">
                          <Award className="h-3 w-3 mr-1" />
                          {assignment.pointsAwarded || mission.beePointsReward}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="font-medium">Ngày hoàn thành:</div>
                          <div>{assignment.completedDate ? new Date(assignment.completedDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium">BeePoints nhận được:</div>
                          <div className="text-green-600 font-medium">+{assignment.pointsAwarded || mission.beePointsReward}</div>
                        </div>
                      </div>

                      {assignment.reviewNote && (
                        <div className="space-y-2">
                          <div className="font-medium text-sm">Nhận xét từ giáo viên:</div>
                          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm">
                            {assignment.reviewNote}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {completedMissions.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Chưa có nhiệm vụ nào hoàn thành</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedMissions.map((assignment: any) => {
              const mission = assignment.mission;
              
              return (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow border-red-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          {mission.title}
                        </CardTitle>
                        <CardDescription>{mission.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(assignment.status)}
                        <Badge className="bg-yellow-500 text-white">
                          <Award className="h-3 w-3 mr-1" />
                          {mission.beePointsReward}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {assignment.reviewNote && (
                        <div className="space-y-2">
                          <div className="font-medium text-sm">Nhận xét từ giáo viên:</div>
                          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm">
                            {assignment.reviewNote}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleStartMission(assignment)}
                          disabled={startMissionMutation.isPending}
                          variant="outline"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {startMissionMutation.isPending ? "Đang bắt đầu..." : "Làm lại"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {rejectedMissions.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Không có nhiệm vụ nào cần làm lại</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Submit Mission Dialog */}
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nộp bài nhiệm vụ</DialogTitle>
              <DialogDescription>
                Nộp bài cho nhiệm vụ: {selectedMission?.mission?.title || "N/A"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="submissionNote">Ghi chú nộp bài</Label>
                <Textarea
                  id="submissionNote"
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  placeholder="Mô tả về cách bạn hoàn thành nhiệm vụ..."
                  rows={4}
                />
              </div>

              {selectedMission?.mission?.requiresPhoto && (
                <div>
                  <Label htmlFor="photo">Hình ảnh minh chứng *</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Đã chọn: {selectedFile.name}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSubmitMission}
                  disabled={
                    submitMissionMutation.isPending || 
                    (selectedMission?.mission?.requiresPhoto && !selectedFile)
                  }
                  className="flex-1"
                >
                  {submitMissionMutation.isPending ? "Đang nộp..." : "Nộp bài"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsSubmitDialogOpen(false)}
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