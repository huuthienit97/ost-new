import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Mail, Phone, User, Building2, GraduationCap, Users, Edit, UserCheck } from "lucide-react";
import { MemberWithDepartment, MEMBER_TYPES } from "@shared/schema";
import { getInitials, getAvatarGradient } from "@/lib/utils";

interface MemberDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberWithDepartment | null;
  onEdit: (member: MemberWithDepartment) => void;
  canEdit: boolean;
}

export function MemberDetailsModal({ open, onOpenChange, member, onEdit, canEdit }: MemberDetailsModalProps) {
  if (!member) return null;

  const initials = getInitials(member.fullName);
  const gradient = getAvatarGradient(member.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12" style={{ background: gradient }}>
              <AvatarFallback className="text-white font-semibold text-lg" style={{ background: 'transparent' }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{member.fullName}</h3>
              <Badge variant={member.memberType === "active" ? "default" : "secondary"} className="mt-1">
                {MEMBER_TYPES[member.memberType as keyof typeof MEMBER_TYPES]}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="flex items-center gap-2 font-medium mb-4">
                <User className="h-4 w-4" />
                Thông tin cá nhân
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.studentId && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Mã học sinh:</span>
                    <span className="font-medium">{member.studentId}</span>
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="font-medium">{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Số điện thoại:</span>
                    <span className="font-medium">{member.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Lớp:</span>
                  <span className="font-medium">{member.class}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization Information */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="flex items-center gap-2 font-medium mb-4">
                <Building2 className="h-4 w-4" />
                Thông tin tổ chức
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.division && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Ban:</span>
                    <span className="font-medium">{member.division.name}</span>
                  </div>
                )}
                {member.position && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Chức vụ:</span>
                    <span className="font-medium">{member.position.displayName}</span>
                  </div>
                )}
                {member.academicYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Khóa học:</span>
                    <span className="font-medium">{member.academicYear.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Ngày gia nhập:</span>
                  <span className="font-medium">{member.joinDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(member.notes || member.user) && (
            <Card>
              <CardContent className="pt-6">
                <h4 className="flex items-center gap-2 font-medium mb-4">
                  <User className="h-4 w-4" />
                  Thông tin bổ sung
                </h4>
                {member.user && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-600">Tài khoản hệ thống:</span>
                    <div className="mt-1 p-2 bg-green-50 rounded-md">
                      <span className="text-green-700 font-medium">{member.user.username}</span>
                    </div>
                  </div>
                )}
                {member.notes && (
                  <div>
                    <span className="text-sm text-gray-600">Ghi chú:</span>
                    <p className="mt-1 text-gray-900">{member.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            {canEdit && (
              <Button onClick={() => onEdit(member)}>
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}