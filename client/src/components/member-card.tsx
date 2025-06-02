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
  canDelete?: boolean;
  canResetPassword?: boolean;
}

export function MemberCard({ member, index, onView, onEdit, onDelete, canDelete = false, canResetPassword = false }: MemberCardProps) {
  const initials = getInitials(member.fullName);
  const gradientClass = getAvatarGradient(index);
  const positionColor = getPositionColor(member.position);
  const memberTypeColor = getMemberTypeColor(member.memberType);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCredentials, setShowCredentials] = useState(false);

  // Query to get account info for this member
  const { data: accountInfo } = useQuery({
    queryKey: ["/api/members", member.id, "account"],
    enabled: !!member.id,
  });

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
        description: `Tên đăng nhập: ${data.username}\nMật khẩu mới: ${data.newPassword}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/members", member.id, "account"] });
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
              {POSITIONS[member.position as keyof typeof POSITIONS]}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Ban:</span>
            <span className="text-sm font-medium text-gray-900">{member.department.name}</span>
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
              {accountInfo?.hasAccount ? (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    {accountInfo.username}
                  </Badge>
                  {accountInfo.mustChangePassword ? (
                    <Badge variant="secondary" className="text-xs text-orange-600">
                      <Key className="h-3 w-3 mr-1" />
                      Chưa đổi MK
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-green-600">
                      <Key className="h-3 w-3 mr-1" />
                      Đã đổi MK
                    </Badge>
                  )}
                </div>
              ) : (
                <Badge variant="secondary" className="text-xs">
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
          <Button
            variant="default"
            size="sm"
            onClick={() => onEdit(member)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Sửa
          </Button>
          {canResetPassword && accountInfo?.hasAccount && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => resetPasswordMutation.mutate(accountInfo.userId)}
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
