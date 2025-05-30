import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Users, GraduationCap, Calendar, Phone } from "lucide-react";
import { MemberWithDepartment, POSITIONS, MEMBER_TYPES } from "@shared/schema";
import { getInitials, getAvatarGradient, getPositionColor, getMemberTypeColor } from "@/lib/utils";

interface MemberCardProps {
  member: MemberWithDepartment;
  index: number;
  onView: (member: MemberWithDepartment) => void;
  onEdit: (member: MemberWithDepartment) => void;
}

export function MemberCard({ member, index, onView, onEdit }: MemberCardProps) {
  const initials = getInitials(member.fullName);
  const gradientClass = getAvatarGradient(index);
  const positionColor = getPositionColor(member.position);
  const memberTypeColor = getMemberTypeColor(member.memberType);

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
        </div>
      </CardContent>
    </Card>
  );
}
