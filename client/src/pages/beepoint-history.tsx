import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Star, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function BeePointHistory() {
  const { user, hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Fetch user's own transaction history
  const { data: myTransactions = [], isLoading: myTransactionsLoading } = useQuery({
    queryKey: ["/api/bee-points/my-transactions"],
  });

  // Fetch all users (for admin)
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: hasPermission("user:view"),
  });

  // Fetch all transactions (for admin)
  const { data: allTransactions = [], isLoading: allTransactionsLoading } = useQuery({
    queryKey: ["/api/admin/bee-points/transactions", selectedUserId],
    enabled: hasPermission("beepoint:manage"),
  });

  // Fetch user's current BeePoints
  const { data: beePoints } = useQuery({
    queryKey: ["/api/bee-points/me"],
  });

  const canViewAllTransactions = hasPermission("beepoint:manage");
  const transactions = canViewAllTransactions ? allTransactions : myTransactions;
  const isLoading = canViewAllTransactions ? allTransactionsLoading : myTransactionsLoading;

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction: any) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || transaction.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "mission_reward":
        return <Star className="h-4 w-4 text-yellow-500" />;
      case "achievement_reward":
        return <Star className="h-4 w-4 text-purple-500" />;
      case "shop_redemption":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "admin_adjustment":
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <Star className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? "text-green-600" : "text-red-600";
  };

  const getTypeLabel = (type: string) => {
    const typeLabels = {
      mission_reward: "Thưởng nhiệm vụ",
      achievement_reward: "Thưởng thành tích",
      shop_redemption: "Đổi thưởng",
      admin_adjustment: "Điều chỉnh admin",
      bonus: "Thưởng khác",
      penalty: "Phạt",
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lịch sử BeePoints</h1>
        {beePoints && (
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold text-lg">
              {beePoints.currentPoints?.toLocaleString()} BeePoints
            </span>
          </div>
        )}
      </div>

      {/* Current Balance Card */}
      {beePoints && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Số dư hiện tại</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {beePoints.currentPoints?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600">BeePoints hiện tại</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {beePoints.totalEarned?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600">Tổng đã kiếm</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {beePoints.totalSpent?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600">Tổng đã chi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Bộ lọc</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tìm kiếm</label>
              <Input
                placeholder="Tìm theo mô tả hoặc loại giao dịch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Loại giao dịch</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="mission_reward">Thưởng nhiệm vụ</SelectItem>
                  <SelectItem value="achievement_reward">Thưởng thành tích</SelectItem>
                  <SelectItem value="shop_redemption">Đổi thưởng</SelectItem>
                  <SelectItem value="admin_adjustment">Điều chỉnh admin</SelectItem>
                  <SelectItem value="bonus">Thưởng khác</SelectItem>
                  <SelectItem value="penalty">Phạt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {canViewAllTransactions && (
              <div>
                <label className="text-sm font-medium mb-2 block">Thành viên</label>
                <Select
                  value={selectedUserId?.toString() || "all"}
                  onValueChange={(value) => setSelectedUserId(value === "all" ? null : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả thành viên</SelectItem>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.fullName} (@{user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Lịch sử giao dịch</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Đang tải lịch sử giao dịch...</p>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">
                          {getTypeLabel(transaction.type)}
                        </Badge>
                        {canViewAllTransactions && transaction.user && (
                          <span className="text-xs text-gray-500">
                            {transaction.user.fullName} (@{transaction.user.username})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(transaction.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-lg ${getTransactionColor(transaction.amount)}`}>
                      {transaction.amount > 0 ? "+" : ""}{transaction.amount.toLocaleString()} BP
                    </p>
                    {transaction.createdBy && (
                      <p className="text-xs text-gray-500">
                        Bởi: {transaction.createdByUser?.fullName || "Hệ thống"}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || filterType !== "all" 
                  ? "Không tìm thấy giao dịch nào phù hợp với bộ lọc"
                  : "Chưa có giao dịch BeePoints nào"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Summary by Type */}
      {!isLoading && filteredTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tổng kết theo loại giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(
                filteredTransactions.reduce((acc: any, transaction: any) => {
                  const type = transaction.type;
                  if (!acc[type]) {
                    acc[type] = { count: 0, total: 0 };
                  }
                  acc[type].count += 1;
                  acc[type].total += transaction.amount;
                  return acc;
                }, {})
              ).map(([type, data]: [string, any]) => (
                <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {getTypeLabel(type)}
                  </p>
                  <p className="text-lg font-bold">
                    {data.count} giao dịch
                  </p>
                  <p className={`text-sm ${getTransactionColor(data.total)}`}>
                    {data.total > 0 ? "+" : ""}{data.total.toLocaleString()} BP
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}