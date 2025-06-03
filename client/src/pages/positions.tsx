import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, UserCheck, User, Shield, Star } from "lucide-react";

// Position type
type Position = {
  id: number;
  name: string;
  displayName: string;
  level: number;
  description?: string;
  color: string;
  isActive: boolean;
  isLeadership?: boolean;
  isDepartmentLevel?: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function Positions() {
  const { data: positions, isLoading } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const getPositionIcon = (name: string) => {
    switch (name) {
      case "president":
        return <Crown className="h-5 w-5" />;
      case "vice-president":
        return <Shield className="h-5 w-5" />;
      case "secretary":
        return <UserCheck className="h-5 w-5" />;
      case "head":
        return <Users className="h-5 w-5" />;
      case "vice-head":
        return <Star className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 90) return "bg-red-500";
    if (level >= 70) return "bg-orange-500";
    if (level >= 50) return "bg-yellow-500";
    return "bg-gray-500";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Hệ thống chức vụ</h1>
        <p className="text-gray-600">Danh sách chức vụ được chuẩn hóa trong câu lạc bộ</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {positions?.map((position) => (
          <Card key={position.id} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getLevelColor(position.level)} text-white`}>
                  {getPositionIcon(position.name)}
                </div>
                <div>
                  <div>{position.displayName}</div>
                  <div className="text-sm font-normal text-gray-500">({position.name})</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Cấp độ: {position.level}
                  </Badge>
                  {position.isLeadership && (
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      Lãnh đạo CLB
                    </Badge>
                  )}
                  {position.isDepartmentLevel && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      Lãnh đạo ban
                    </Badge>
                  )}
                </div>
                
                {position.description && (
                  <p className="text-sm text-gray-700">{position.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {positions && positions.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có chức vụ nào</h3>
          <p className="text-gray-600">Hệ thống chức vụ sẽ được tự động tạo</p>
        </div>
      )}
    </div>
  );
}