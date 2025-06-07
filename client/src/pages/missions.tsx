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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Target, Calendar, Users, Award, Camera, Send, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

const createMissionSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  description: z.string().optional(),
  category: z.enum(["daily", "weekly", "monthly", "special", "project"]),
  type: z.enum(["one_time", "repeatable"]),
  maxParticipants: z.number().optional(),
  beePointsReward: z.number().min(0, "Điểm thưởng không được âm").default(0),
  requiresPhoto: z.boolean().default(false),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  tags: z.array(z.string()).default([]),
});

type CreateMissionData = z.infer<typeof createMissionSchema>;

const submitMissionSchema = z.object({
  submissionNote: z.string().optional(),
});

type SubmitMissionData = z.infer<typeof submitMissionSchema>;

const reviewMissionSchema = z.object({
  status: z.enum(["completed", "rejected"]),
  reviewNote: z.string().optional(),
  pointsAwarded: z.number().optional(),
});

type ReviewMissionData = z.infer<typeof reviewMissionSchema>;

export default function MissionsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createForm = useForm<CreateMissionData>({
    resolver: zodResolver(createMissionSchema),
    defaultValues: {
      category: "special",
      type: "one_time",
      priority: "medium",
      beePointsReward: 0,
      requiresPhoto: false,
      tags: [],
    },
  });

  const submitForm = useForm<SubmitMissionData>({
    resolver: zodResolver(submitMissionSchema),
  });

  const reviewForm = useForm<ReviewMissionData>({
    resolver: zodResolver(reviewMissionSchema),
  });

  // Fetch all missions
  const { data: missions = [], isLoading: missionsLoading } = useQuery({
    queryKey: ["/api/missions"],
  });

  // Fetch user's missions
  const { data: userMissions = [], isLoading: userMissionsLoading } = useQuery({
    queryKey: ["/api/missions/my"],
  });

  // Create mission mutation
  const createMissionMutation = useMutation({
    mutationFn: async (data: CreateMissionData) => {
      return await apiRequest("POST", "/api/missions", data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Tạo nhiệm vụ thành công",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/missions"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Lỗi",
        description: "Không thể tạo nhiệm vụ",
        variant: "destructive",
      });
    },
  });

  // Submit mission mutation
  const submitMissionMutation = useMutation({
    mutationFn: async ({ missionId, data, file }: { missionId: number; data: SubmitMissionData; file?: File }) => {
      const formData = new FormData();
      formData.append("submissionNote", data.submissionNote || "");
      if (file) {
        formData.append("photo", file);
      }

      return await fetch(`/api/missions/${missionId}/submit`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error("Submit failed");
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Nộp nhiệm vụ thành công",
      });
      setIsSubmitDialogOpen(false);
      setSelectedFile(null);
      submitForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/missions/my"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Lỗi",
        description: "Không thể nộp nhiệm vụ",
        variant: "destructive",
      });
    },
  });

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
      case "completed": return "bg-green-500";
      case "submitted": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "assigned": return "bg-purple-500";
      case "rejected": return "bg-red-500";
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

  const onCreateSubmit = (data: CreateMissionData) => {
    createMissionMutation.mutate(data);
  };

  const onSubmitMission = (data: SubmitMissionData) => {
    if (selectedMission) {
      submitMissionMutation.mutate({
        missionId: selectedMission.mission.id,
        data,
        file: selectedFile || undefined,
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Hệ thống nhiệm vụ</h1>
          <p className="text-muted-foreground">Quản lý và thực hiện các nhiệm vụ để nhận điểm thưởng</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo nhiệm vụ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo nhiệm vụ mới</DialogTitle>
              <DialogDescription>
                Tạo nhiệm vụ mới cho thành viên tham gia và nhận điểm thưởng
              </DialogDescription>
            </DialogHeader>
            
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Tiêu đề nhiệm vụ</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tiêu đề nhiệm vụ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Mô tả</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Mô tả chi tiết nhiệm vụ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Danh mục</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn danh mục" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Hàng ngày</SelectItem>
                            <SelectItem value="weekly">Hàng tuần</SelectItem>
                            <SelectItem value="monthly">Hàng tháng</SelectItem>
                            <SelectItem value="special">Đặc biệt</SelectItem>
                            <SelectItem value="project">Dự án</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loại nhiệm vụ</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="one_time">Một lần</SelectItem>
                            <SelectItem value="repeatable">Lặp lại</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số lượng tham gia tối đa</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Không giới hạn" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="beePointsReward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Điểm thưởng BeePoints</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Độ ưu tiên</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn độ ưu tiên" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Thấp</SelectItem>
                            <SelectItem value="medium">Trung bình</SelectItem>
                            <SelectItem value="high">Cao</SelectItem>
                            <SelectItem value="urgent">Khẩn cấp</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={createMissionMutation.isPending}>
                    {createMissionMutation.isPending ? "Đang tạo..." : "Tạo nhiệm vụ"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
              {missions?.map((mission: any) => (
                <Card key={mission.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(mission.category)}
                        <Badge variant="outline">{mission.category}</Badge>
                      </div>
                      <Badge className={getPriorityColor(mission.priority)} variant="default">
                        {mission.priority}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{mission.title}</CardTitle>
                    <CardDescription>{mission.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <span>{mission.beePointsReward} BeePoints</span>
                      </div>
                      {mission.maxParticipants && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{mission.currentParticipants}/{mission.maxParticipants} người tham gia</span>
                        </div>
                      )}
                      {mission.requiresPhoto && (
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          <span>Yêu cầu hình ảnh</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(mission.status)} variant="default">
                          {mission.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my" className="space-y-4">
          {userMissionsLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userMissions?.map((item: any) => (
                <Card key={item.assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(item.mission.category)}
                        <Badge variant="outline">{item.mission.category}</Badge>
                      </div>
                      <Badge className={getStatusColor(item.assignment.status)} variant="default">
                        {item.assignment.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{item.mission.title}</CardTitle>
                    <CardDescription>{item.mission.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <span>{item.mission.beePointsReward} BeePoints</span>
                      </div>
                      {item.mission.requiresPhoto && (
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          <span>Yêu cầu hình ảnh</span>
                        </div>
                      )}
                      {item.assignment.pointsAwarded > 0 && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Đã nhận {item.assignment.pointsAwarded} điểm</span>
                        </div>
                      )}
                    </div>
                    
                    {item.assignment.status === "assigned" && (
                      <Button 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => {
                          setSelectedMission(item);
                          setIsSubmitDialogOpen(true);
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Nộp bài
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submit Mission Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nộp nhiệm vụ</DialogTitle>
            <DialogDescription>
              {selectedMission?.mission.title}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...submitForm}>
            <form onSubmit={submitForm.handleSubmit(onSubmitMission)} className="space-y-4">
              {selectedMission?.mission.requiresPhoto && (
                <div>
                  <Label htmlFor="photo">Hình ảnh minh chứng</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                </div>
              )}
              
              <FormField
                control={submitForm.control}
                name="submissionNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ghi chú về việc thực hiện nhiệm vụ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={submitMissionMutation.isPending}>
                  {submitMissionMutation.isPending ? "Đang nộp..." : "Nộp bài"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}