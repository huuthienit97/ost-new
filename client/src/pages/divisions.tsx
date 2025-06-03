import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Edit2, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const createDivisionSchema = z.object({
  name: z.string().min(1, "Tên ban là bắt buộc"),
  description: z.string().optional(),
  color: z.string().default("#3B82F6"),
  icon: z.string().default("Users"),
});

type CreateDivisionForm = z.infer<typeof createDivisionSchema>;

export default function Divisions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const form = useForm<CreateDivisionForm>({
    resolver: zodResolver(createDivisionSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3B82F6",
      icon: "Users",
    },
  });

  const { data: divisions, isLoading } = useQuery({
    queryKey: ["/api/divisions"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateDivisionForm) => {
      const response = await fetch("/api/divisions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Không thể tạo ban");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/divisions"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Thành công",
        description: "Đã tạo ban mới",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo ban",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateDivisionForm) => {
    createMutation.mutate(data);
  };

  const colorOptions = [
    { value: "#3B82F6", label: "Xanh dương", class: "bg-blue-500" },
    { value: "#EF4444", label: "Đỏ", class: "bg-red-500" },
    { value: "#10B981", label: "Xanh lá", class: "bg-green-500" },
    { value: "#F59E0B", label: "Vàng", class: "bg-yellow-500" },
    { value: "#8B5CF6", label: "Tím", class: "bg-purple-500" },
    { value: "#EC4899", label: "Hồng", class: "bg-pink-500" },
  ];

  const iconOptions = [
    { value: "Users", label: "Người dùng" },
    { value: "Megaphone", label: "Loa" },
    { value: "Calendar", label: "Lịch" },
    { value: "Settings", label: "Cài đặt" },
    { value: "Briefcase", label: "Cặp" },
    { value: "Award", label: "Giải thưởng" },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý ban</h1>
          <p className="text-gray-600">Quản lý các ban trong câu lạc bộ</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo ban mới
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tạo ban mới</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên ban *</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Ban Truyền thông" {...field} />
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
                        <Textarea placeholder="Mô tả về nhiệm vụ của ban..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Màu sắc</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-2">
                          {colorOptions.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              className={`p-3 rounded-lg border-2 ${
                                field.value === color.value ? 'border-gray-900' : 'border-gray-200'
                              }`}
                              onClick={() => field.onChange(color.value)}
                            >
                              <div className={`w-full h-6 rounded ${color.class}`}></div>
                              <span className="text-xs mt-1 block">{color.label}</span>
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biểu tượng</FormLabel>
                      <FormControl>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-md"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          {iconOptions.map((icon) => (
                            <option key={icon.value} value={icon.value}>
                              {icon.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Đang tạo..." : "Tạo ban"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {divisions?.map((division: any) => (
          <Card key={division.id} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: division.color + '20', color: division.color }}
                >
                  <Users className="h-5 w-5" />
                </div>
                <span>{division.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {division.description && (
                  <p className="text-sm text-gray-700">{division.description}</p>
                )}
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" style={{ borderColor: division.color, color: division.color }}>
                    {division.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </Badge>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm">
                    <Edit2 className="h-4 w-4 mr-1" />
                    Sửa
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Xóa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {divisions?.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có ban nào</h3>
          <p className="text-gray-600 mb-4">Tạo ban đầu tiên để bắt đầu tổ chức</p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo ban đầu tiên
          </Button>
        </div>
      )}
    </div>
  );
}