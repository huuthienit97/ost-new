import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Package, User, Calendar, Star, Eye, Edit } from "lucide-react";

export default function ShopOrderAdmin() {
  const [orderDialog, setOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderForm, setOrderForm] = useState({
    status: "",
    notes: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/shop/orders"],
  });

  // Update order mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/shop/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật đơn hàng thành công",
        description: "Trạng thái đơn hàng đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/orders"] });
      setOrderDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi cập nhật đơn hàng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Chờ xử lý", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "Đã xác nhận", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      delivered: { label: "Đã giao", variant: "default" as const, color: "bg-green-100 text-green-800" },
      cancelled: { label: "Đã hủy", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const openOrderDialog = (order: any) => {
    setSelectedOrder(order);
    setOrderForm({
      status: order.status,
      notes: order.notes || "",
    });
    setOrderDialog(true);
  };

  const handleUpdateOrder = () => {
    if (!selectedOrder) return;
    updateMutation.mutate({ id: selectedOrder.id, data: orderForm });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (ordersLoading) {
    return <div className="p-6">Đang tải đơn hàng...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý đơn hàng</h1>
        <div className="text-sm text-gray-600">
          Tổng cộng: {orders.length} đơn hàng
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Chờ xử lý", status: "pending", color: "border-yellow-200 bg-yellow-50" },
          { label: "Đã xác nhận", status: "confirmed", color: "border-blue-200 bg-blue-50" },
          { label: "Đã giao", status: "delivered", color: "border-green-200 bg-green-50" },
          { label: "Đã hủy", status: "cancelled", color: "border-red-200 bg-red-50" },
        ].map((stat) => (
          <Card key={stat.status} className={stat.color}>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {orders.filter((order: any) => order.status === stat.status).length}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
              <p className="text-gray-600">Các đơn đổi thưởng của thành viên sẽ hiển thị ở đây.</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order: any) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">Đơn hàng #{order.id}</h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openOrderDialog(order)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Quản lý
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Khách hàng</div>
                          <div className="font-medium">{order.user?.fullName || order.user?.username}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Sản phẩm</div>
                          <div className="font-medium">{order.product?.name}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <div>
                          <div className="text-sm text-gray-600">Tổng tiền</div>
                          <div className="font-medium">{order.totalBeePointsCost} BeePoints</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Ngày đặt</div>
                          <div className="font-medium">{formatDate(order.createdAt)}</div>
                        </div>
                      </div>
                    </div>

                    {order.deliveryInfo && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-600 mb-1">Thông tin giao hàng:</div>
                        <div className="text-sm">{order.deliveryInfo}</div>
                      </div>
                    )}

                    {order.notes && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <div className="text-sm text-gray-600 mb-1">Ghi chú admin:</div>
                        <div className="text-sm">{order.notes}</div>
                      </div>
                    )}

                    {order.processedAt && (
                      <div className="text-sm text-gray-600">
                        Xử lý bởi: <span className="font-medium">{order.processedBy?.fullName}</span> 
                        {" "}vào {formatDate(order.processedAt)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Order Management Dialog */}
      <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quản lý đơn hàng #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <div><strong>Khách hàng:</strong> {selectedOrder.user?.fullName || selectedOrder.user?.username}</div>
                <div><strong>Sản phẩm:</strong> {selectedOrder.product?.name}</div>
                <div><strong>Số lượng:</strong> {selectedOrder.quantity}</div>
                <div><strong>Tổng tiền:</strong> {selectedOrder.totalBeePointsCost} BeePoints</div>
                <div><strong>Ngày đặt:</strong> {formatDate(selectedOrder.createdAt)}</div>
                {selectedOrder.deliveryInfo && (
                  <div><strong>Thông tin giao hàng:</strong> {selectedOrder.deliveryInfo}</div>
                )}
              </div>

              <div>
                <Label htmlFor="status">Trạng thái đơn hàng</Label>
                <Select value={orderForm.status} onValueChange={(value) => setOrderForm({ ...orderForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                    <SelectItem value="delivered">Đã giao</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Ghi chú admin</Label>
                <Textarea
                  id="notes"
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  placeholder="Thêm ghi chú về đơn hàng..."
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <div className="flex space-x-2 pt-4">
            <Button onClick={() => setOrderDialog(false)} variant="outline" className="flex-1">
              Hủy
            </Button>
            <Button 
              onClick={handleUpdateOrder} 
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}