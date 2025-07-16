import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Package, Plus, Edit, Trash2, Star, Eye } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function ShopProductAdmin() {
  const [editDialog, setEditDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    beePointsCost: 0,
    imageUrl: "",
    category: "",
    stockQuantity: null as number | null,
    isActive: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all products (including inactive)
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/shop/products-admin"],
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/shop/products", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Tạo sản phẩm thành công",
        description: "Sản phẩm mới đã được thêm vào cửa hàng",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/products-admin"] });
      setCreateDialog(false);
      resetForm();
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
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/shop/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật sản phẩm thành công",
        description: "Thông tin sản phẩm đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/products-admin"] });
      setEditDialog(false);
      resetForm();
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
      return await apiRequest(`/api/shop/products/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Xóa sản phẩm thành công",
        description: "Sản phẩm đã được xóa khỏi cửa hàng",
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

  const resetForm = () => {
    setProductForm({
      name: "",
      description: "",
      beePointsCost: 0,
      imageUrl: "",
      category: "",
      stockQuantity: null,
      isActive: true,
    });
    setSelectedProduct(null);
  };

  const handleCreate = () => {
    createMutation.mutate(productForm);
  };

  const handleUpdate = () => {
    if (!selectedProduct) return;
    updateMutation.mutate({ id: selectedProduct.id, data: productForm });
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (product: any) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      beePointsCost: product.beePointsCost,
      imageUrl: product.imageUrl || "",
      category: product.category || "",
      stockQuantity: product.stockQuantity,
      isActive: product.isActive,
    });
    setEditDialog(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialog(true);
  };

  if (productsLoading) {
    return (
      <AppLayout>
        <div className="p-6">Đang tải sản phẩm...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý sản phẩm</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product: any) => (
          <Card key={product.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <div className="flex items-center space-x-1">
                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? "Hoạt động" : "Tạm dừng"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {product.imageUrl && (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-md mb-3"
                />
              )}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Giá:</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="font-semibold">{product.beePointsCost}</span>
                  </div>
                </div>
                
                {product.stockQuantity !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Tồn kho:</span>
                    <span className={`font-semibold ${product.stockQuantity === 0 ? 'text-red-500' : ''}`}>
                      {product.stockQuantity}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Danh mục:</span>
                  <span className="text-sm">{product.category || "Chưa phân loại"}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openEditDialog(product)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Sửa
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDelete(product.id)}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Xóa
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Product Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm sản phẩm mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tên sản phẩm</Label>
              <Input
                id="name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Nhập tên sản phẩm"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Nhập mô tả sản phẩm"
              />
            </div>
            
            <div>
              <Label htmlFor="beePointsCost">Giá (BeePoints)</Label>
              <Input
                id="beePointsCost"
                type="number"
                value={productForm.beePointsCost}
                onChange={(e) => setProductForm({ ...productForm, beePointsCost: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label htmlFor="imageUrl">URL hình ảnh</Label>
              <Input
                id="imageUrl"
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            
            <div>
              <Label htmlFor="category">Danh mục</Label>
              <Input
                id="category"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                placeholder="Nhập danh mục"
              />
            </div>
            
            <div>
              <Label htmlFor="stockQuantity">Số lượng tồn kho (để trống = không giới hạn)</Label>
              <Input
                id="stockQuantity"
                type="number"
                value={productForm.stockQuantity || ""}
                onChange={(e) => setProductForm({ 
                  ...productForm, 
                  stockQuantity: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Không giới hạn"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={productForm.isActive}
                onCheckedChange={(checked) => setProductForm({ ...productForm, isActive: checked })}
              />
              <Label htmlFor="isActive">Sản phẩm hoạt động</Label>
            </div>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button onClick={() => setCreateDialog(false)} variant="outline" className="flex-1">
              Hủy
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? "Đang tạo..." : "Tạo sản phẩm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Tên sản phẩm</Label>
              <Input
                id="edit-name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Nhập tên sản phẩm"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Nhập mô tả sản phẩm"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-beePointsCost">Giá (BeePoints)</Label>
              <Input
                id="edit-beePointsCost"
                type="number"
                value={productForm.beePointsCost}
                onChange={(e) => setProductForm({ ...productForm, beePointsCost: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-imageUrl">URL hình ảnh</Label>
              <Input
                id="edit-imageUrl"
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            
            <div>
              <Label htmlFor="edit-category">Danh mục</Label>
              <Input
                id="edit-category"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                placeholder="Nhập danh mục"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-stockQuantity">Số lượng tồn kho</Label>
              <Input
                id="edit-stockQuantity"
                type="number"
                value={productForm.stockQuantity || ""}
                onChange={(e) => setProductForm({ 
                  ...productForm, 
                  stockQuantity: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Không giới hạn"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={productForm.isActive}
                onCheckedChange={(checked) => setProductForm({ ...productForm, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Sản phẩm hoạt động</Label>
            </div>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button onClick={() => setEditDialog(false)} variant="outline" className="flex-1">
              Hủy
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}