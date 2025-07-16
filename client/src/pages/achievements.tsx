import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Medal, Award, Trophy, Star, Users } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Achievement schema for form validation
const createAchievementSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().optional(),
  category: z.string().min(1, "Danh mục không được để trống"),
  level: z.string().min(1, "Cấp độ không được để trống"),
  badgeIcon: z.string().optional(),
  pointsReward: z.number().min(0, "Điểm thưởng phải ≥ 0"),
});

const awardAchievementSchema = z.object({
  userId: z.number().min(1, "Vui lòng chọn thành viên"),
  achievementId: z.number().min(1, "Vui lòng chọn thành tích"),
  note: z.string().optional(),
});

type CreateAchievementForm = z.infer<typeof createAchievementSchema>;
type AwardAchievementForm = z.infer<typeof awardAchievementSchema>;

// Constants for achievement categories and levels
const ACHIEVEMENT_CATEGORIES = {
  academic: "Học tập",
  leadership: "Lãnh đạo",
  creativity: "Sáng tạo",
  teamwork: "Đồng đội",
  participation: "Tham gia",
  community: "Cộng đồng",
  special: "Đặc biệt"
};

const ACHIEVEMENT_LEVELS = {
  bronze: "Đồng",
  silver: "Bạc", 
  gold: "Vàng",
  special: "Đặc biệt"
};

const achievementIcons = {
  academic: "📚",
  leadership: "👑",
  creativity: "🎨",
  teamwork: "🤝",
  participation: "🙋",
  community: "🌟",
  special: "⭐"
};

const levelColors = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  special: "#FF6B6B"
};

export default function AchievementsPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);

  const canManageAchievements = hasPermission("ACHIEVEMENT_CREATE") || hasPermission("ACHIEVEMENT_EDIT");
  const canAwardAchievements = hasPermission("ACHIEVEMENT_AWARD");

  // Fetch achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/achievements"],
  });

  // Fetch user's achievements 
  const { data: myAchievements = [], isLoading: myAchievementsLoading } = useQuery({
    queryKey: ["/api/achievements/me"],
    enabled: !!user,
  });

  // Fetch members for award dialog
  const { data: members = [] } = useQuery({
    queryKey: ["/api/members"],
    enabled: canAwardAchievements,
  });

  // Form setup
  const form = useForm<CreateAchievementForm>({
    resolver: zodResolver(createAchievementSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      level: "",
      badgeIcon: "",
      pointsReward: 0,
    },
  });

  const awardForm = useForm<AwardAchievementForm>({
    resolver: zodResolver(awardAchievementSchema),
    defaultValues: {
      userId: 0,
      achievementId: 0,
      note: "",
    },
  });

  // Mutations
  const createAchievementMutation = useMutation({
    mutationFn: async (data: CreateAchievementForm) => {
      return await apiRequest("/api/achievements", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Thành công",
        description: "Đã tạo thành tích mới thành công!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo thành tích",
        variant: "destructive",
      });
    },
  });

  const awardAchievementMutation = useMutation({
    mutationFn: async (data: AwardAchievementForm) => {
      return await apiRequest("/api/achievements/award", {
        method: "POST", 
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setAwardDialogOpen(false);
      awardForm.reset();
      toast({
        title: "Thành công",
        description: `Đã trao thành tích thành công! ${data.pointsAwarded > 0 ? `+${data.pointsAwarded} BeePoints` : ""}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể trao thành tích",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateAchievementForm) => {
    createAchievementMutation.mutate(data);
  };

  const handleAwardSubmit = (data: AwardAchievementForm) => {
    awardAchievementMutation.mutate(data);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "bronze": return <Medal className="h-4 w-4" style={{ color: levelColors.bronze }} />;
      case "silver": return <Medal className="h-4 w-4" style={{ color: levelColors.silver }} />;
      case "gold": return <Medal className="h-4 w-4" style={{ color: levelColors.gold }} />;
      case "special": return <Star className="h-4 w-4" style={{ color: levelColors.special }} />;
      default: return <Medal className="h-4 w-4" />;
    }
  };

  if (achievementsLoading || myAchievementsLoading) {
    return (
      <AppLayout>
        <div className="p-6">Đang tải...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Thành tích</h1>
            <p className="text-muted-foreground">
              Quản lý và trao thành tích cho thành viên
            </p>
          </div>
          <div className="flex gap-2">
            {canAwardAchievements && (
              <Button variant="outline" onClick={() => setAwardDialogOpen(true)}>
                <Award className="h-4 w-4 mr-2" />
                Trao thành tích
              </Button>
            )}
            {canManageAchievements && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo thành tích
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Tất cả thành tích</TabsTrigger>
            <TabsTrigger value="my">Thành tích của tôi</TabsTrigger>
            {canManageAchievements && <TabsTrigger value="manage">Quản lý</TabsTrigger>}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement: any) => (
                <Card key={achievement.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        {getLevelIcon(achievement.level)}
                        <span className="text-lg">{achievement.title}</span>
                      </CardTitle>
                      <Badge variant="outline" style={{ color: levelColors[achievement.level as keyof typeof levelColors] }}>
                        {ACHIEVEMENT_LEVELS[achievement.level as keyof typeof ACHIEVEMENT_LEVELS]}
                      </Badge>
                    </div>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Phân loại:</span>
                        <Badge variant="secondary">
                          {achievementIcons[achievement.category as keyof typeof achievementIcons]} {ACHIEVEMENT_CATEGORIES[achievement.category as keyof typeof ACHIEVEMENT_CATEGORIES]}
                        </Badge>
                      </div>
                      {achievement.pointsReward > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Điểm thưởng:</span>
                          <span className="font-medium text-yellow-600">+{achievement.pointsReward} BeePoints</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Đã trao:</span>
                        <span className="font-medium">{achievement.awardCount || 0} lần</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myAchievements.map((userAchievement: any) => (
                <Card key={userAchievement.id} className="hover:shadow-md transition-shadow border-l-4" 
                      style={{ borderLeftColor: levelColors[userAchievement.achievement.level as keyof typeof levelColors] }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        {getLevelIcon(userAchievement.achievement.level)}
                        <span className="text-lg">{userAchievement.achievement.title}</span>
                      </CardTitle>
                      <Badge variant="outline" style={{ color: levelColors[userAchievement.achievement.level as keyof typeof levelColors] }}>
                        {ACHIEVEMENT_LEVELS[userAchievement.achievement.level as keyof typeof ACHIEVEMENT_LEVELS]}
                      </Badge>
                    </div>
                    <CardDescription>{userAchievement.achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Ngày nhận:</span>
                        <span className="font-medium">
                          {new Date(userAchievement.awardedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      {userAchievement.pointsAwarded > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Điểm đã nhận:</span>
                          <span className="font-medium text-yellow-600">+{userAchievement.pointsAwarded} BeePoints</span>
                        </div>
                      )}
                      {userAchievement.note && (
                        <div className="text-sm">
                          <span className="text-gray-600">Ghi chú:</span>
                          <p className="text-gray-800 mt-1">{userAchievement.note}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {myAchievements.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Bạn chưa có thành tích nào</p>
              </div>
            )}
          </TabsContent>

          {canManageAchievements && (
            <TabsContent value="manage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quản lý thành tích</CardTitle>
                  <CardDescription>
                    Tạo mới và quản lý các thành tích trong hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo thành tích mới
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Award Achievement Dialog */}
        <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Trao thành tích cho thành viên</DialogTitle>
            </DialogHeader>
            <Form {...awardForm}>
              <form onSubmit={awardForm.handleSubmit(handleAwardSubmit)} className="space-y-4">
                <FormField
                  control={awardForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chọn thành viên *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn thành viên" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(members as any[]).map((user: any) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.fullName || user.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={awardForm.control}
                  name="achievementId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chọn thành tích *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn thành tích" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(achievements as any[]).map((achievement: any) => (
                            <SelectItem key={achievement.id} value={achievement.id.toString()}>
                              <div className="flex items-center space-x-2">
                                {getLevelIcon(achievement.level)}
                                <span>{achievement.title}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={awardForm.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ghi chú</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Lý do trao thành tích hoặc ghi chú thêm..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAwardDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={awardAchievementMutation.isPending}>
                    {awardAchievementMutation.isPending ? "Đang trao..." : "Trao thành tích"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Create Achievement Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Tạo thành tích mới</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiêu đề thành tích *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tiêu đề thành tích" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Mô tả chi tiết về thành tích..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Danh mục *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn danh mục" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, value]) => (
                              <SelectItem key={key} value={key}>
                                {achievementIcons[key as keyof typeof achievementIcons]} {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cấp độ *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn cấp độ" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(ACHIEVEMENT_LEVELS).map(([key, value]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center space-x-2">
                                  {getLevelIcon(key)}
                                  <span>{value}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="badgeIcon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biểu tượng (emoji hoặc tên icon)</FormLabel>
                        <FormControl>
                          <Input placeholder="🏆 hoặc trophy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pointsReward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Điểm thưởng *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={createAchievementMutation.isPending}>
                    {createAchievementMutation.isPending ? "Đang tạo..." : "Tạo thành tích"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}