import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Medal, Award, Trophy, Star, Users } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_LEVELS } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";

const createAchievementSchema = z.object({
  title: z.string().min(1, "Tiêu đề thành tích là bắt buộc"),
  description: z.string().optional(),
  category: z.enum(["academic", "creative", "leadership", "participation", "special"]),
  level: z.enum(["bronze", "silver", "gold", "special"]),
  badgeIcon: z.string().optional(),
  badgeColor: z.string().default("#3B82F6"),
  pointsReward: z.number().min(0, "Điểm thưởng phải là số dương"),
});

const awardAchievementSchema = z.object({
  userId: z.number().min(1, "Vui lòng chọn thành viên"),
  achievementId: z.number().min(1, "Vui lòng chọn thành tích"),
  notes: z.string().optional(),
});

type CreateAchievementForm = z.infer<typeof createAchievementSchema>;
type AwardAchievementForm = z.infer<typeof awardAchievementSchema>;

const achievementIcons = {
  academic: "📚",
  creative: "🎨", 
  leadership: "👑",
  participation: "🤝",
  special: "⭐"
};

const levelColors = {
  bronze: "#CD7F32",
  silver: "#C0C0C0", 
  gold: "#FFD700",
  special: "#FF69B4"
};

export default function AchievementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);

  // Check permissions
  const canManageAchievements = user?.role?.permissions?.includes("achievement:create") || user?.role?.permissions?.includes("system:admin");
  const canAwardAchievements = user?.role?.permissions?.includes("achievement:award") || user?.role?.permissions?.includes("system:admin");

  // Fetch achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/achievements"],
  });

  // Fetch my achievements
  const { data: myAchievements = [], isLoading: myAchievementsLoading } = useQuery({
    queryKey: ["/api/achievements/me"],
  });

  // Fetch users for awarding achievements
  const { data: members = [] } = useQuery({
    queryKey: ["/api/members-with-accounts"],
    enabled: canAwardAchievements,
  });

  const form = useForm<CreateAchievementForm>({
    resolver: zodResolver(createAchievementSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "participation",
      level: "bronze",
      badgeIcon: "",
      badgeColor: "#3B82F6",
      pointsReward: 10,
    },
  });

  const awardForm = useForm<AwardAchievementForm>({
    resolver: zodResolver(awardAchievementSchema),
    defaultValues: {
      userId: 0,
      achievementId: 0,
      notes: "",
    },
  });

  const createAchievementMutation = useMutation({
    mutationFn: async (data: CreateAchievementForm) => {
      const response = await fetch("/api/achievements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Không thể tạo thành tích");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Thành công",
        description: "Tạo thành tích mới thành công",
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
      const response = await fetch("/api/achievements/award", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Không thể trao thành tích");
      }
      return response.json();
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
    return <div>Đang tải...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Award className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Thành tích</h1>
              <p className="text-gray-600">Quản lý và xem thành tích của thành viên</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {canAwardAchievements && (
              <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Award className="h-4 w-4 mr-2" />
                    Trao thành tích
                  </Button>
                </DialogTrigger>
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
                                    {achievement.title} ({achievement.level})
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
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ghi chú</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Ghi chú về việc trao thành tích..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setAwardDialogOpen(false)}>
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
            )}
            {canManageAchievements && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo thành tích mới
                  </Button>
                </DialogTrigger>
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
            )}
          </div>
        </div>

        {/* My Achievements Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Thành tích của tôi ({(myAchievements as any[]).length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(myAchievements as any[]).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Bạn chưa có thành tích nào</p>
                <p className="text-sm">Hãy tham gia các hoạt động để nhận thành tích!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(myAchievements as any[]).map((userAchievement: any) => (
                  <Card key={userAchievement.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{userAchievement.achievement.title}</h4>
                          {userAchievement.achievement.description && (
                            <p className="text-sm text-gray-600 mt-1">{userAchievement.achievement.description}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Badge className="bg-blue-100 text-blue-800">
                              {userAchievement.achievement.category && (
                                <>
                                  {achievementIcons[userAchievement.achievement.category as keyof typeof achievementIcons]}{" "}
                                  {ACHIEVEMENT_CATEGORIES[userAchievement.achievement.category as keyof typeof ACHIEVEMENT_CATEGORIES]}
                                </>
                              )}
                            </Badge>
                            <Badge style={{ backgroundColor: levelColors[userAchievement.achievement.level as keyof typeof levelColors], color: 'white' }}>
                              {ACHIEVEMENT_LEVELS[userAchievement.achievement.level as keyof typeof ACHIEVEMENT_LEVELS]}
                            </Badge>
                          </div>
                          {userAchievement.achievement.pointsReward > 0 && (
                            <div className="flex items-center text-sm text-green-600">
                              <Trophy className="h-3 w-3 mr-1" />
                              +{userAchievement.achievement.pointsReward} BeePoints
                            </div>
                          )}
                        </div>
                        {getLevelIcon(userAchievement.achievement.level)}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Nhận ngày: {new Date(userAchievement.awardedDate).toLocaleDateString('vi-VN')}
                      </div>
                      {userAchievement.notes && (
                        <div className="text-xs text-gray-600 mt-1 italic">
                          "{userAchievement.notes}"
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Achievements Section */}
        {(canManageAchievements || canAwardAchievements) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span>Tất cả thành tích ({(achievements as any[]).length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {achievementsLoading ? (
                <div>Đang tải...</div>
              ) : (achievements as any[]).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Chưa có thành tích nào</p>
                  <p className="text-sm">Hãy tạo thành tích đầu tiên!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(achievements as any[]).map((achievement: any) => (
                    <Card key={achievement.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{achievement.title}</h4>
                            {achievement.description && (
                              <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                            )}
                            <div className="flex gap-2 mt-2">
                              <Badge className="bg-blue-100 text-blue-800">
                                {achievement.category && (
                                  <>
                                    {achievementIcons[achievement.category as keyof typeof achievementIcons]}{" "}
                                    {ACHIEVEMENT_CATEGORIES[achievement.category as keyof typeof ACHIEVEMENT_CATEGORIES]}
                                  </>
                                )}
                              </Badge>
                              <Badge style={{ backgroundColor: levelColors[achievement.level as keyof typeof levelColors], color: 'white' }}>
                                {ACHIEVEMENT_LEVELS[achievement.level as keyof typeof ACHIEVEMENT_LEVELS]}
                              </Badge>
                            </div>
                            {achievement.pointsReward > 0 && (
                              <div className="flex items-center text-sm text-green-600">
                                <Trophy className="h-3 w-3 mr-1" />
                                +{achievement.pointsReward} BeePoints
                              </div>
                            )}
                          </div>
                          {getLevelIcon(achievement.level)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}