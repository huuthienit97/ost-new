import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, LayoutGrid, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";

// Category type definition
interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form schema
const categorySchema = z.object({
  name: z.string().min(1, "Tên danh mục là bắt buộc").max(255),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Màu sắc không hợp lệ"),
  icon: z.string().min(1, "Icon là bắt buộc"),
  isActive: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// Icon options
const iconOptions = [
  { value: "package", label: "Gói hàng" },
  { value: "gift", label: "Quà tặng" },
  { value: "shirt", label: "Quần áo" },
  { value: "book", label: "Sách" },
  { value: "coffee", label: "Đồ uống" },
  { value: "gamepad", label: "Game" },
  { value: "headphones", label: "Phụ kiện" },
  { value: "smartphone", label: "Điện tử" },
];

export default function ShopCategoryAdmin() {
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#6366f1",
      icon: "package",
      isActive: true,
    },
  });

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/shop/categories"],
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      apiRequest("/api/shop/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Tạo danh mục thành công",
        description: "Danh mục mới đã được thêm vào hệ thống",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/categories"] });
      setCategoryDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi tạo danh mục",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryFormData }) =>
      apiRequest(`/api/shop/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Cập nhật danh mục thành công",
        description: "Thông tin danh mục đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/categories"] });
      setCategoryDialog(false);
      form.reset();
      setSelectedCategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi cập nhật danh mục",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/shop/categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({
        title: "Xóa danh mục thành công",
        description: "Danh mục đã được xóa khỏi hệ thống",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi xóa danh mục",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (selectedCategory) {
      updateMutation.mutate({ id: selectedCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    form.reset({
      name: category.name,
      description: category.description || "",
      color: category.color,
      icon: category.icon,
      isActive: category.isActive,
    });
    setCategoryDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    form.reset();
    setSelectedCategory(null);
    setCategoryDialog(false);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6">Đang tải danh mục...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quản lý danh mục sản phẩm</h1>
            <p className="text-muted-foreground">
              Quản lý các danh mục sản phẩm trong cửa hàng BeePoints
            </p>
          </div>
          <Button onClick={() => setCategoryDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm danh mục
          </Button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category: Category) => (
            <Card key={category.id} className="relative group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      <LayoutGrid className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Hiển thị
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Ẩn
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {category.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Add/Edit Category Dialog */}
        <Dialog open={categoryDialog} onOpenChange={(open) => {
          if (!open) resetForm();
          setCategoryDialog(open);
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
              </DialogTitle>
              <DialogDescription>
                {selectedCategory 
                  ? "Cập nhật thông tin danh mục sản phẩm" 
                  : "Tạo danh mục mới cho cửa hàng BeePoints"
                }
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên danh mục</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nhập tên danh mục" />
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
                        <Textarea 
                          {...field} 
                          placeholder="Mô tả danh mục (tùy chọn)"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Màu sắc</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input {...field} type="color" className="w-12 h-10 p-1" />
                            <Input {...field} placeholder="#6366f1" className="flex-1" />
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
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn icon" />
                            </SelectTrigger>
                            <SelectContent>
                              {iconOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Trạng thái</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Hiển thị danh mục trong cửa hàng
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Đang xử lý..." 
                      : selectedCategory 
                        ? "Cập nhật" 
                        : "Tạo danh mục"
                    }
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}