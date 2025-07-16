import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Package, Plus, Edit, Trash2, Eye, ShoppingCart } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";

const productSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  description: z.string().min(1, "Mô tả là bắt buộc"),
  beePointsCost: z.number().min(1, "Giá phải lớn hơn 0"),
  category: z.string().min(1, "Danh mục là bắt buộc"),
  stockQuantity: z.number().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ProductForm = z.infer<typeof productSchema>;

export default function ShopAdmin() {
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      beePointsCost: 0,
      category: "",
      stockQuantity: undefined,
      imageUrl: "",
      isActive: true,
    },
  });

  // Fetch all products (admin view)
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/shop/products-admin"],
  });

  // Fetch all orders for admin
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/shop/orders"],
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      return await apiRequest("/api/shop/products", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Tạo sản phẩm thành công",
        description: "Sản phẩm đã được thêm vào cửa hàng",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/products-admin"] });
      setCreateDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi tạo sản phẩm",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProductForm }) => {
      return await apiRequest(`/api/shop/products/${id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật sản phẩm thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/products-admin"] });
      setEditDialog(false);
      setEditingProduct(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi cập nhật sản phẩm",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/shop/products/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Xóa sản phẩm thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/products-admin"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi xóa sản phẩm",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      return await apiRequest(`/api/shop/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status, notes }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật đơn hàng thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi cập nhật đơn hàng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: ProductForm) => {
    createMutation.mutate(data);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description,
      beePointsCost: product.beePointsCost,
      category: product.category,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl || "",
      isActive: product.isActive,
    });
    setEditDialog(true);
  };

  const handleUpdate = (data: ProductForm) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Chờ xử lý", variant: "secondary" as const },
      confirmed: { label: "Đã xác nhận", variant: "default" as const },
      delivered: { label: "Đã giao", variant: "default" as const },
      cancelled: { label: "Đã hủy", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quản lý cửa hàng</h1>
            <p className="text-muted-foreground">Quản lý sản phẩm và đơn hàng trong cửa hàng</p>
          </div>
          <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm sản phẩm
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm sản phẩm mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Tên sản phẩm</Label>
                  <Input {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="category">Danh mục</Label>
                  <Select onValueChange={(value) => form.setValue("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fashion">Thời trang</SelectItem>
                      <SelectItem value="accessories">Phụ kiện</SelectItem>
                      <SelectItem value="stationery">Văn phòng phẩm</SelectItem>
                      <SelectItem value="voucher">Voucher</SelectItem>
                      <SelectItem value="digital">Kỹ thuật số</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea {...form.register("description")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="beePointsCost">Giá BeePoints</Label>
                  <Input 
                    type="number" 
                    {...form.register("beePointsCost", { valueAsNumber: true })} 
                  />
                </div>
                <div>
                  <Label htmlFor="stockQuantity">Số lượng (để trống = không giới hạn)</Label>
                  <Input 
                    type="number" 
                    {...form.register("stockQuantity", { valueAsNumber: true })} 
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl">URL hình ảnh</Label>
                <Input {...form.register("imageUrl")} />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Đang tạo..." : "Tạo sản phẩm"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Sản phẩm trong cửa hàng</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <p>Đang tải sản phẩm...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product: any) => (
                <Card key={product.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-lg">{product.beePointsCost} BP</span>
                      {product.stockQuantity !== null && (
                        <span className="text-sm text-gray-500">
                          Còn: {product.stockQuantity}
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Quản lý đơn hàng</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <p>Đang tải đơn hàng...</p>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">Đơn hàng #{order.id}</h4>
                      <p className="text-sm text-gray-600">
                        Khách hàng: {order.user?.fullName || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Sản phẩm: {order.product?.name || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Số lượng: {order.quantity} - Tổng: {order.totalBeePointsCost} BP
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  
                  {order.deliveryInfo && (
                    <div className="mb-3">
                      <p className="text-sm font-medium">Thông tin giao hàng:</p>
                      <p className="text-sm text-gray-600">{order.deliveryInfo}</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {order.status === "pending" && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderMutation.mutate({ 
                            id: order.id, 
                            status: "confirmed", 
                            notes: "Đã xác nhận đơn hàng" 
                          })}
                        >
                          Xác nhận
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => updateOrderMutation.mutate({ 
                            id: order.id, 
                            status: "cancelled", 
                            notes: "Đơn hàng bị hủy" 
                          })}
                        >
                          Hủy đơn
                        </Button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <Button 
                        size="sm" 
                        onClick={() => updateOrderMutation.mutate({ 
                          id: order.id, 
                          status: "delivered", 
                          notes: "Đã giao hàng thành công" 
                        })}
                      >
                        Đánh dấu đã giao
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Chưa có đơn hàng nào
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Tên sản phẩm</Label>
                <Input {...form.register("name")} />
              </div>
              <div>
                <Label htmlFor="category">Danh mục</Label>
                <Select 
                  value={form.watch("category")} 
                  onValueChange={(value) => form.setValue("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fashion">Thời trang</SelectItem>
                    <SelectItem value="accessories">Phụ kiện</SelectItem>
                    <SelectItem value="stationery">Văn phòng phẩm</SelectItem>
                    <SelectItem value="voucher">Voucher</SelectItem>
                    <SelectItem value="digital">Kỹ thuật số</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea {...form.register("description")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="beePointsCost">Giá BeePoints</Label>
                <Input 
                  type="number" 
                  {...form.register("beePointsCost", { valueAsNumber: true })} 
                />
              </div>
              <div>
                <Label htmlFor="stockQuantity">Số lượng</Label>
                <Input 
                  type="number" 
                  {...form.register("stockQuantity", { valueAsNumber: true })} 
                />
              </div>
            </div>

            <div>
              <Label htmlFor="imageUrl">URL hình ảnh</Label>
              <Input {...form.register("imageUrl")} />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}