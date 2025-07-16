import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, Eye, MessageSquare, Upload, Award, Calendar, Target } from "lucide-react";
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
  user: {
    id: number;
    fullName: string;
    username: string;
    email: string;
  };
  mission: {
    id: number;
    title: string;
    description: string;
    beePointsReward: number;
    deadline?: string;
  };
}

export default function MissionCompletionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedAssignment, setSelectedAssignment] = useState<MissionAssignment | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Fetch mission assignments for review
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["/api/missions/assignments"],
  });

  // Review mission mutation
  const reviewMissionMutation = useMutation({
    mutationFn: async ({ assignmentId, status, reviewNote }: { assignmentId: number; status: string; reviewNote: string }) => {
      return await apiRequest("POST", `/api/missions/assignments/${assignmentId}/review`, { status, reviewNote });
    },
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: data.message || "Duyệt nhiệm vụ thành công",
      });
      setIsReviewDialogOpen(false);
      setSelectedAssignment(null);
      setReviewNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/missions/assignments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể duyệt nhiệm vụ",
        variant: "destructive",
      });
    },
  });

  const handleReview = (assignment: MissionAssignment, status: "completed" | "rejected") => {
    setSelectedAssignment(assignment);
    setIsReviewDialogOpen(true);
    // Auto-set review note based on status
    if (status === "completed") {
      setReviewNote("Nhiệm vụ hoàn thành tốt!");
    } else {
      setReviewNote("Cần hoàn thiện thêm.");
    }
  };

  const submitReview = (status: "completed" | "rejected") => {
    if (!selectedAssignment) return;
    
    reviewMissionMutation.mutate({
      assignmentId: selectedAssignment.id,
      status,
      reviewNote
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "assigned":
        return <Badge variant="outline">Đã giao</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">Đang thực hiện</Badge>;
      case "submitted":
        return <Badge className="bg-orange-500">Chờ duyệt</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Hoàn thành</Badge>;
      case "rejected":
        return <Badge variant="destructive">Yêu cầu làm lại</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
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

  const submittedAssignments = assignments.filter((assignment: MissionAssignment) => assignment.status === 'submitted');
  const completedAssignments = assignments.filter((assignment: MissionAssignment) => assignment.status === 'completed');
  const rejectedAssignments = assignments.filter((assignment: MissionAssignment) => assignment.status === 'rejected');

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Duyệt nhiệm vụ</h1>
            <p className="text-muted-foreground">Xem xét và duyệt các nhiệm vụ đã nộp</p>
          </div>
        </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Chờ duyệt
            {submittedAssignments.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {submittedAssignments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="relative">
            Đã duyệt
            {completedAssignments.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {completedAssignments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="relative">
            Yêu cầu làm lại
            {rejectedAssignments.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {rejectedAssignments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4">
            {submittedAssignments.map((assignment: MissionAssignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {assignment.mission.title}
                      </CardTitle>
                      <CardDescription>{assignment.mission.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(assignment.status)}
                      <Badge className="bg-yellow-500 text-white">
                        <Award className="h-3 w-3 mr-1" />
                        {assignment.mission.beePointsReward}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="font-medium">Người thực hiện:</div>
                        <div>{assignment.user.fullName} ({assignment.user.username})</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">Ngày nộp:</div>
                        <div>{assignment.completedDate ? new Date(assignment.completedDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
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

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleReview(assignment, "rejected")}
                        disabled={reviewMissionMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Yêu cầu làm lại
                      </Button>
                      <Button
                        onClick={() => handleReview(assignment, "completed")}
                        disabled={reviewMissionMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Duyệt hoàn thành
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {submittedAssignments.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Không có nhiệm vụ nào chờ duyệt</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {completedAssignments.map((assignment: MissionAssignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        {assignment.mission.title}
                      </CardTitle>
                      <CardDescription>{assignment.mission.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(assignment.status)}
                      <Badge className="bg-green-500 text-white">
                        <Award className="h-3 w-3 mr-1" />
                        {assignment.pointsAwarded || assignment.mission.beePointsReward}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="font-medium">Người thực hiện:</div>
                        <div>{assignment.user.fullName}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">Ngày hoàn thành:</div>
                        <div>{assignment.completedDate ? new Date(assignment.completedDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">BeePoints đã thưởng:</div>
                        <div>{assignment.pointsAwarded || assignment.mission.beePointsReward}</div>
                      </div>
                    </div>

                    {assignment.reviewNote && (
                      <div className="space-y-2">
                        <div className="font-medium text-sm">Nhận xét:</div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm">
                          {assignment.reviewNote}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {completedAssignments.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Chưa có nhiệm vụ nào hoàn thành</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <div className="grid gap-4">
            {rejectedAssignments.map((assignment: MissionAssignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow border-red-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        {assignment.mission.title}
                      </CardTitle>
                      <CardDescription>{assignment.mission.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(assignment.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="font-medium">Người thực hiện:</div>
                        <div>{assignment.user.fullName}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">Ngày yêu cầu làm lại:</div>
                        <div>{assignment.completedDate ? new Date(assignment.completedDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
                      </div>
                    </div>

                    {assignment.reviewNote && (
                      <div className="space-y-2">
                        <div className="font-medium text-sm">Lý do yêu cầu làm lại:</div>
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm">
                          {assignment.reviewNote}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {rejectedAssignments.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Không có nhiệm vụ nào bị từ chối</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt nhiệm vụ</DialogTitle>
            <DialogDescription>
              Đánh giá nhiệm vụ "{selectedAssignment?.mission.title}" của {selectedAssignment?.user.fullName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nhận xét / Góp ý</label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Nhập nhận xét về nhiệm vụ..."
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsReviewDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                variant="outline"
                onClick={() => submitReview("rejected")}
                disabled={reviewMissionMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Yêu cầu làm lại
              </Button>
              <Button
                onClick={() => submitReview("completed")}
                disabled={reviewMissionMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Duyệt hoàn thành
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}