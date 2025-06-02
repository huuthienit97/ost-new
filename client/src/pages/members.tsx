import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Users, UserCheck, GraduationCap, Building2, Bell, LogOut } from "lucide-react";
import { MemberCard } from "@/components/member-card";
import { AddMemberModal } from "@/components/add-member-modal";
import { getInitials, getAvatarGradient } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { MemberWithDepartment, Department, PERMISSIONS } from "@shared/schema";

interface Stats {
  totalMembers: number;
  activeMembers: number;
  alumniMembers: number;
  totalDepartments: number;
}

export default function MembersPage() {
  const { user, logout, hasPermission } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberWithDepartment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [deletingMember, setDeletingMember] = useState<MemberWithDepartment | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<MemberWithDepartment[]>({
    queryKey: ["/api/members", { 
      search: searchQuery,
      type: selectedType === "all" ? "" : selectedType,
      department: selectedDepartment === "all" ? "" : selectedDepartment,
      position: selectedPosition === "all" ? "" : selectedPosition,
    }],
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      await apiRequest("DELETE", `/api/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Thành công",
        description: "Đã xóa thành viên thành công",
      });
      setDeletingMember(null);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa thành viên",
        variant: "destructive",
      });
    },
  });

  const handleViewMember = (member: MemberWithDepartment) => {
    // For now, just edit on view
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleEditMember = (member: MemberWithDepartment) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleDeleteMember = (member: MemberWithDepartment) => {
    setDeletingMember(member);
  };

  const handleConfirmDelete = () => {
    if (deletingMember) {
      deleteMemberMutation.mutate(deletingMember.id);
    }
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedDepartment("all");
    setSelectedPosition("all");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">CLB Sáng Tạo</h1>
                  <p className="text-xs text-gray-500">Trường THPT ABC</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right mr-3">
                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-500">{user?.role.displayName}</p>
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.fullName ? getInitials(user.fullName) : "A"}
                </span>
              </div>
              {user && hasPermission("system_admin") && (
                <Button variant="ghost" size="sm" asChild>
                  <a href="/admin">Quản trị</a>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={logout} title="Đăng xuất">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quản lý thành viên</h2>
              <p className="text-gray-600 mt-1">Quản lý thông tin và tổ chức thành viên câu lạc bộ</p>
            </div>
            {hasPermission("member_create") && (
              <div className="mt-4 sm:mt-0">
                <Button onClick={handleAddMember} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm thành viên
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng Thành Viên</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalMembers || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Thành Viên Hiện Tại</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats?.activeMembers || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cựu Thành Viên</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats?.alumniMembers || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Số Ban</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalDepartments || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm thành viên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="active">Thành viên hiện tại</SelectItem>
                    <SelectItem value="alumni">Cựu thành viên</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Tất cả ban" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả ban</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Tất cả chức vụ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả chức vụ</SelectItem>
                    <SelectItem value="president">Chủ nhiệm</SelectItem>
                    <SelectItem value="vice-president">Phó chủ nhiệm</SelectItem>
                    <SelectItem value="secretary">Thư ký</SelectItem>
                    <SelectItem value="head">Trưởng ban</SelectItem>
                    <SelectItem value="vice-head">Phó ban</SelectItem>
                    <SelectItem value="member">Thành viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(searchQuery || selectedType !== "all" || selectedDepartment !== "all" || selectedPosition !== "all") && (
                <Button variant="outline" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Members Grid */}
        {membersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4 mb-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : members.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy thành viên</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedType !== "all" || selectedDepartment !== "all" || selectedPosition !== "all"
                  ? "Không có thành viên nào phù hợp với tiêu chí tìm kiếm."
                  : "Chưa có thành viên nào trong câu lạc bộ."
                }
              </p>
              {hasPermission("member_create") && (
                <Button onClick={handleAddMember}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm thành viên đầu tiên
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {members.map((member, index) => (
              <MemberCard
                key={member.id}
                member={member}
                index={index}
                onView={handleViewMember}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
                canDelete={hasPermission(PERMISSIONS.MEMBER_DELETE)}
                canResetPassword={hasPermission(PERMISSIONS.SYSTEM_ADMIN)}
              />
            ))}
          </div>
        )}

        {/* Pagination placeholder */}
        {members.length > 0 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">1</span> đến{" "}
              <span className="font-medium">{members.length}</span> trong tổng số{" "}
              <span className="font-medium">{members.length}</span> thành viên
            </div>
          </div>
        )}
      </div>

      <AddMemberModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        editingMember={editingMember}
      />

      <AlertDialog open={!!deletingMember} onOpenChange={() => setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa thành viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thành viên "{deletingMember?.fullName}"? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMemberMutation.isPending}
            >
              {deleteMemberMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
