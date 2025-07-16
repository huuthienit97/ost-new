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
      return await apiRequest(`/api/missions/assignments/${assignmentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "in_progress" })
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
      console.error("Start mission error:", error);
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

      // For FormData, we need to use fetch directly to let browser set Content-Type
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/missions/${missionId}/submit`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }

      return await response.json();
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
      console.error("Submit mission error:", error);
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

  const handleStartMission = (assignment: any) => {
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

  const openSubmitDialog = (missionData: any) => {
    setSelectedMission(missionData);
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

  const assignedMissions = myMissions.filter((m: any) => m.assignment?.status === 'assigned');
  const inProgressMissions = myMissions.filter((m: any) => m.assignment?.status === 'in_progress');
  const submittedMissions = myMissions.filter((m: any) => m.assignment?.status === 'submitted');
  const completedMissions = myMissions.filter((m: any) => m.assignment?.status === 'completed');
  const rejectedMissions = myMissions.filter((m: any) => m.assignment?.status === 'rejected');

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
            {assignedMissions.map((missionData: any) => {
              const assignment = missionData.assignment;
              const mission = missionData.mission;
              
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
            {inProgressMissions.map((missionData: any) => {
              const assignment = missionData.assignment;
              const mission = missionData.mission;
              
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
                          onClick={() => openSubmitDialog(missionData)}
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
            {submittedMissions.map((missionData: any) => {
              const assignment = missionData.assignment;
              const mission = missionData.mission;
              
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
            {completedMissions.map((missionData: any) => {
              const assignment = missionData.assignment;
              const mission = missionData.mission;
              
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
            {rejectedMissions.map((missionData: any) => {
              const assignment = missionData.assignment;
              const mission = missionData.mission;
              
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-blue-600">Nộp bài nhiệm vụ</DialogTitle>
              <DialogDescription>
                Nộp bài cho nhiệm vụ: {selectedMission?.mission?.title || "N/A"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="font-semibold text-blue-800">{selectedMission?.mission?.title || "N/A"}</div>
              <div className="text-blue-600 text-sm mt-1">{selectedMission?.mission?.description}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-yellow-500 text-white">
                  <Award className="h-3 w-3 mr-1" />
                  {selectedMission?.mission?.beePointsReward} BeePoints
                </Badge>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="submissionNote" className="text-base font-medium">Chi tiết hoàn thành nhiệm vụ *</Label>
                <Textarea
                  id="submissionNote"
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  placeholder="Mô tả chi tiết về cách bạn hoàn thành nhiệm vụ, những khó khăn gặp phải, kết quả đạt được..."
                  rows={6}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Hãy mô tả rõ ràng quá trình thực hiện và kết quả để giáo viên dễ đánh giá
                </p>
              </div>

              <div>
                <Label htmlFor="photo" className="text-base font-medium">
                  Hình ảnh minh chứng {selectedMission?.mission?.requiresPhoto ? "*" : "(Tùy chọn)"}
                </Label>
                <div className="mt-2 space-y-3">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">Đã chọn file:</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">{selectedFile.name}</p>
                      <p className="text-xs text-green-600">
                        Kích thước: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      <strong>Hỗ trợ:</strong> Hình ảnh (JPG, PNG), Video (MP4), Tài liệu (PDF, Word)
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Kích thước tối đa: 10MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Lưu ý quan trọng:</p>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• Đảm bảo mô tả chi tiết và chính xác</li>
                      <li>• File đính kèm phải rõ ràng, có chất lượng tốt</li>
                      <li>• Sau khi nộp, bạn không thể chỉnh sửa</li>
                      <li>• Giáo viên sẽ review và cho điểm trong 3-5 ngày</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsSubmitDialogOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmitMission}
                  disabled={
                    submitMissionMutation.isPending || 
                    !submissionNote.trim() ||
                    (selectedMission?.mission?.requiresPhoto && !selectedFile)
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {submitMissionMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang nộp...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Nộp bài ngay
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}