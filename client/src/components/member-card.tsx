import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Users, GraduationCap, Calendar, Phone, Trash2, User, Key, RotateCcw } from "lucide-react";
import { MemberWithDepartment, POSITIONS, MEMBER_TYPES } from "@shared/schema";
import { getInitials, getAvatarGradient, getPositionColor, getMemberTypeColor } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface MemberCardProps {
  member: MemberWithDepartment;
  index: number;
  onView: (member: MemberWithDepartment) => void;
  onEdit: (member: MemberWithDepartment) => void;
  onDelete: (member: MemberWithDepartment) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canResetPassword?: boolean;
}

export function MemberCard({ member, index, onView, onEdit, onDelete, canEdit = false, canDelete = false, canResetPassword = false }: MemberCardProps) {
  const initials = getInitials(member.fullName);
  const gradientClass = getAvatarGradient(index);
  // Get position info from positionId 
  const getPositionInfo = (positionId: number) => {
    const positionMap: Record<number, { name: string; displayName: string; color: string }> = {
      1: { name: "president", displayName: "Chủ nhiệm", color: "bg-purple-100 text-purple-800" },
      2: { name: "vice-president", displayName: "Phó chủ nhiệm", color: "bg-blue-100 text-blue-800" },
      3: { name: "secretary", displayName: "Thư ký", color: "bg-amber-100 text-amber-800" },
      4: { name: "head", displayName: "Trưởng ban", color: "bg-green-100 text-green-800" },
      5: { name: "vice-head", displayName: "Phó ban", color: "bg-indigo-100 text-indigo-800" },
      6: { name: "member", displayName: "Thành viên", color: "bg-gray-100 text-gray-800" },
    };
    return positionMap[positionId] || positionMap[6]; // Default to member
  };
  
  const positionInfo = getPositionInfo(member.positionId);
  const positionColor = positionInfo.color;
  const memberTypeColor = getMemberTypeColor(member.memberType);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCredentials, setShowCredentials] = useState(false);

  // Account info is now included in the member object via user field

  // Mutation to reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reset mật khẩu thành công",
        description: `Tên đăng nhập: ${data.username}\nMật khẩu mới: ${data.newPassword}\nUser phải đổi mật khẩu khi đăng nhập lần đầu.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể reset mật khẩu",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <div className={`w-12 h-12 ${gradientClass} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-semibold text-lg">{initials}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 truncate">{member.fullName}</h3>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(member)}
                  className="text-gray-400 hover:text-primary p-1 h-auto"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(member)}
                  className="text-gray-400 hover:text-primary p-1 h-auto"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-2">ID: {member.studentId}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Chức vụ:</span>
            <Badge className={`text-xs font-medium ${positionColor}`}>
              {positionInfo.displayName}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Ban:</span>
            <span className="text-sm font-medium text-gray-900">{member.division?.name || 'Không có'}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Trạng thái:</span>
            <Badge className={`text-xs font-medium ${memberTypeColor}`}>
              {MEMBER_TYPES[member.memberType as keyof typeof MEMBER_TYPES]}
            </Badge>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
            <span>{member.class}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>Tham gia: {new Date(member.joinDate).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}</span>
          </div>

          {member.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2 text-gray-400" />
              <span>{member.phone}</span>
            </div>
          )}

          {/* Account Information */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tài khoản:</span>
              {member.user && member.user !== null ? (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    {member.user.username}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                    <Key className="h-3 w-3 mr-1" />
                    Có tài khoản
                  </Badge>
                </div>
              ) : (
                <Badge variant="secondary" className="text-xs text-red-600 bg-red-50 border-red-200">
                  Chưa có tài khoản
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(member)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Xem
          </Button>
          {canEdit && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onEdit(member)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-1" />
              Sửa
            </Button>
          )}
          {canResetPassword && member.user && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => resetPasswordMutation.mutate(member.user!.id)}
              disabled={resetPasswordMutation.isPending}
              className="px-3"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(member)}
              className="px-3"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
