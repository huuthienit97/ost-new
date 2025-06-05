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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { Plus, Edit, Trash2, Package, Eye, Settings } from "lucide-react";

const productFormSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  description: z.string().min(1, "Mô tả là bắt buộc"),
  beePointsCost: z.number().min(1, "Chi phí BeePoints phải lớn hơn 0"),
  category: z.string().min(1, "Danh mục là bắt buộc"),
  stockQuantity: z.number().optional(),
  imageUrl: z.string().url("URL hình ảnh không hợp lệ").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function ShopAdmin() {
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
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

  // Fetch all shop products (including inactive ones for admin)
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/admin/shop/products"],
  });

  // Fetch all shop orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/admin/shop/orders"],
  });

  // Fetch BeePoint circulation
  const { data: circulation } = useQuery({
    queryKey: ["/api/admin/bee-points/circulation"],
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      return await apiRequest("/api/admin/shop/products", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo sản phẩm mới",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/products"] });
      setProductDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProductFormData> }) => {
      return await apiRequest(`/api/admin/shop/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật sản phẩm",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/products"] });
      setProductDialog(false);
      setEditingProduct(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/shop/products/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa sản phẩm",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      return await apiRequest(`/api/admin/shop/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status, notes }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái đơn hàng",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProductSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleEditProduct = (product: any) => {
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
    setProductDialog(true);
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      deleteProductMutation.mutate(id);
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý cửa hàng</h1>
        <Dialog open={productDialog} onOpenChange={setProductDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingProduct(null);
              form.reset();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm sản phẩm
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProductSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên sản phẩm</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="beePointsCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chi phí BeePoints</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Danh mục</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn danh mục" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stationery">Văn phòng phẩm</SelectItem>
                            <SelectItem value="electronics">Điện tử</SelectItem>
                            <SelectItem value="books">Sách</SelectItem>
                            <SelectItem value="clothing">Quần áo</SelectItem>
                            <SelectItem value="food">Thực phẩm</SelectItem>
                            <SelectItem value="other">Khác</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số lượng tồn kho (để trống nếu không giới hạn)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL hình ảnh</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Hiển thị sản phẩm</FormLabel>
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setProductDialog(false)}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                    className="flex-1"
                  >
                    {editingProduct ? "Cập nhật" : "Tạo mới"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* BeePoint Circulation Overview */}
      {circulation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Thống kê BeePoint</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {circulation.totalSupply?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600">Tổng cung</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {circulation.distributedPoints?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600">Đã phát hành</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {circulation.redeemedPoints?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600">Đã đổi thưởng</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {((circulation.distributedPoints - circulation.redeemedPoints) || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Đang lưu thông</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Danh sách sản phẩm</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <p>Đang tải...</p>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product: any) => (
                <Card key={product.id} className={`${!product.isActive ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{product.name}</CardTitle>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{product.category}</Badge>
                      <span className="font-semibold">{product.beePointsCost} BP</span>
                    </div>
                    {product.stockQuantity !== null && (
                      <p className="text-xs text-gray-500">Còn lại: {product.stockQuantity}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Hiển thị" : "Ẩn"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Chưa có sản phẩm nào</p>
          )}
        </CardContent>
      </Card>

      {/* Orders Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Quản lý đơn hàng</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <p>Đang tải...</p>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">Đơn hàng #{order.id}</p>
                    <p className="text-sm text-gray-600">
                      {order.quantity} sản phẩm - {order.totalBeePointsCost} BeePoints
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </p>
                    {order.deliveryInfo && (
                      <p className="text-xs text-gray-600 mt-1">
                        Giao hàng: {order.deliveryInfo}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    {getStatusBadge(order.status)}
                    <div className="flex space-x-2">
                      <Select
                        onValueChange={(status) => 
                          updateOrderMutation.mutate({ id: order.id, status })
                        }
                        defaultValue={order.status}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Chờ xử lý</SelectItem>
                          <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                          <SelectItem value="delivered">Đã giao</SelectItem>
                          <SelectItem value="cancelled">Đã hủy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Chưa có đơn hàng nào</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}