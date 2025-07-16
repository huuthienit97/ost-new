import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShoppingCart, Package, History, Star } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function Shop() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchaseDialog, setPurchaseDialog] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch shop products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/shop/products"],
  });

  // Fetch user's order history
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/shop/my-orders"],
  });

  // Fetch user's BeePoints
  const { data: beePoints } = useQuery({
    queryKey: ["/api/bee-points/me"],
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/shop/purchase", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Đổi thưởng thành công",
        description: `Còn lại ${data.remainingBeePoints} BeePoints`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bee-points/me"] });
      setPurchaseDialog(false);
      setQuantity(1);
      setDeliveryInfo("");
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi đổi thưởng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePurchase = () => {
    if (!selectedProduct) return;

    purchaseMutation.mutate({
      productId: selectedProduct.id,
      quantity,
      deliveryInfo,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Chờ xử lý", variant: "secondary" },
      confirmed: { label: "Đã xác nhận", variant: "default" },
      delivered: { label: "Đã giao", variant: "default" },
      cancelled: { label: "Đã hủy", variant: "destructive" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
          <div>
            <h1 className="text-2xl font-bold">Cửa hàng đổi thưởng</h1>
            <p className="text-muted-foreground">
              Đổi BeePoints lấy các phần thưởng hấp dẫn
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">
              {beePoints?.currentPoints || 0} BeePoints
            </span>
          </div>
        </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <CardTitle className="text-lg">{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {product.description}
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold text-lg">
                    {product.beePointsCost}
                  </span>
                </div>
                <Badge variant="outline">{product.category}</Badge>
              </div>
              {product.stockQuantity !== null && (
                <p className="text-sm text-gray-500 mb-3">
                  Còn lại: {product.stockQuantity}
                </p>
              )}
              <Button
                onClick={() => {
                  setSelectedProduct(product);
                  setPurchaseDialog(true);
                }}
                disabled={
                  !product.isActive ||
                  (product.stockQuantity !== null && product.stockQuantity <= 0) ||
                  (beePoints?.currentPoints || 0) < product.beePointsCost
                }
                className="w-full"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Đổi thưởng
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Chưa có sản phẩm nào trong cửa hàng</p>
        </div>
      )}

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Lịch sử đổi thưởng</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <p>Đang tải lịch sử...</p>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">Đơn hàng #{order.id}</p>
                    <p className="text-sm text-gray-600">
                      {order.quantity} x {order.totalBeePointsCost} BeePoints
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                    {order.notes && (
                      <p className="text-xs text-gray-500 mt-1">{order.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Chưa có đơn đổi thưởng nào
            </p>
          )}
        </CardContent>
      </Card>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialog} onOpenChange={setPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đổi thưởng</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedProduct.name}</h3>
                <p className="text-sm text-gray-600">{selectedProduct.description}</p>
              </div>
              
              <div>
                <Label htmlFor="quantity">Số lượng</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedProduct.stockQuantity || 999}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>

              <div>
                <Label htmlFor="delivery">Thông tin giao hàng</Label>
                <Textarea
                  id="delivery"
                  placeholder="Địa chỉ, số điện thoại liên hệ..."
                  value={deliveryInfo}
                  onChange={(e) => setDeliveryInfo(e.target.value)}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Tổng chi phí:</span>
                  <span className="font-semibold text-lg">
                    {(selectedProduct.beePointsCost * quantity).toLocaleString()} BeePoints
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Số dư hiện tại:</span>
                  <span>{(beePoints?.currentPoints || 0).toLocaleString()} BeePoints</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Còn lại sau khi đổi:</span>
                  <span className={
                    (beePoints?.currentPoints || 0) - (selectedProduct.beePointsCost * quantity) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }>
                    {((beePoints?.currentPoints || 0) - (selectedProduct.beePointsCost * quantity)).toLocaleString()} BeePoints
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setPurchaseDialog(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handlePurchase}
                  disabled={
                    purchaseMutation.isPending ||
                    (beePoints?.currentPoints || 0) < (selectedProduct.beePointsCost * quantity)
                  }
                  className="flex-1"
                >
                  {purchaseMutation.isPending ? "Đang xử lý..." : "Xác nhận đổi thưởng"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}