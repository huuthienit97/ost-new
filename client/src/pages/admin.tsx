import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Users, Settings, Plus, Edit, Trash2, Key } from "lucide-react";
import { Role, User, UserWithRole, PERMISSIONS } from "@shared/schema";

interface UserRoleEditorProps {
  user: UserWithRole;
  roles: Role[];
  onClose: () => void;
}

function UserRoleEditor({ user, roles, onClose }: UserRoleEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState(user.roleId);
  const [isActive, setIsActive] = useState(user.isActive);

  const updateUserMutation = useMutation({
    mutationFn: async (data: { roleId: number; isActive: boolean }) => {
      return await apiRequest(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cập nhật thông tin người dùng thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin người dùng",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateUserMutation.mutate({
      roleId: selectedRoleId,
      isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="user-role">Vai trò</Label>
        <Select value={selectedRoleId.toString()} onValueChange={(value) => setSelectedRoleId(parseInt(value))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id.toString()}>
                {role.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="user-active"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked as boolean)}
        />
        <Label htmlFor="user-active">Tài khoản hoạt động</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button onClick={handleSave} disabled={updateUserMutation.isPending}>
          {updateUserMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}

function UserRoleDialog({ user, roles }: { user: UserWithRole; roles: Role[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="pt-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Edit className="h-4 w-4 mr-2" />
            Phân quyền
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phân quyền cho {user.fullName}</DialogTitle>
          </DialogHeader>
          <UserRoleEditor user={user} roles={roles} onClose={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);

  // Role form state
  const [roleName, setRoleName] = useState("");
  const [roleDisplayName, setRoleDisplayName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // User form state
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRoleId, setUserRoleId] = useState(0);

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  // Fetch users with roles
  const { data: users, isLoading: usersLoading } = useQuery<UserWithRole[]>({
    queryKey: ["/api/users"],
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      return await apiRequest("/api/roles", {
        method: "POST",
        body: JSON.stringify(roleData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Tạo vai trò thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setIsRoleModalOpen(false);
      resetRoleForm();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo vai trò",
        variant: "destructive",
      });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest("/api/users", {
        method: "POST",
        body: JSON.stringify(userData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Tạo người dùng thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserModalOpen(false);
      resetUserForm();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo người dùng",
        variant: "destructive",
      });
    },
  });

  const resetRoleForm = () => {
    setRoleName("");
    setRoleDisplayName("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setEditingRole(null);
  };

  const resetUserForm = () => {
    setUserName("");
    setUserEmail("");
    setUserFullName("");
    setUserPassword("");
    setUserRoleId(0);
    setEditingUser(null);
  };

  const handleCreateRole = () => {
    if (!roleName || !roleDisplayName || selectedPermissions.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    createRoleMutation.mutate({
      name: roleName,
      displayName: roleDisplayName,
      description: roleDescription,
      permissions: selectedPermissions,
      isSystem: false,
    });
  };

  const handleCreateUser = () => {
    if (!userName || !userEmail || !userFullName || !userPassword || !userRoleId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({
      username: userName,
      email: userEmail,
      fullName: userFullName,
      password: userPassword,
      roleId: userRoleId,
      isActive: true,
    });
  };

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permission]);
    } else {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
    }
  };

  const permissionGroups = {
    "Thành viên": [
      PERMISSIONS.MEMBER_VIEW,
      PERMISSIONS.MEMBER_CREATE,
      PERMISSIONS.MEMBER_EDIT,
      PERMISSIONS.MEMBER_DELETE,
    ],
    "Ban/Phòng": [
      PERMISSIONS.DEPARTMENT_VIEW,
      PERMISSIONS.DEPARTMENT_CREATE,
      PERMISSIONS.DEPARTMENT_EDIT,
      PERMISSIONS.DEPARTMENT_DELETE,
    ],
    "Phân ban": [
      PERMISSIONS.DIVISION_VIEW,
      PERMISSIONS.DIVISION_CREATE,
      PERMISSIONS.DIVISION_EDIT,
      PERMISSIONS.DIVISION_DELETE,
    ],
    "Chức vụ": [
      PERMISSIONS.POSITION_VIEW,
      PERMISSIONS.POSITION_CREATE,
      PERMISSIONS.POSITION_EDIT,
      PERMISSIONS.POSITION_DELETE,
    ],
    "Khóa học": [
      PERMISSIONS.ACADEMIC_YEAR_VIEW,
      PERMISSIONS.ACADEMIC_YEAR_CREATE,
      PERMISSIONS.ACADEMIC_YEAR_EDIT,
      PERMISSIONS.ACADEMIC_YEAR_DELETE,
      PERMISSIONS.ACADEMIC_YEAR_ACTIVATE,
    ],
    "Người dùng": [
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_EDIT,
      PERMISSIONS.USER_DELETE,
    ],
    "Vai trò": [
      PERMISSIONS.ROLE_VIEW,
      PERMISSIONS.ROLE_CREATE,
      PERMISSIONS.ROLE_EDIT,
      PERMISSIONS.ROLE_DELETE,
    ],
    "BeePoint": [
      PERMISSIONS.BEEPOINT_VIEW,
      PERMISSIONS.BEEPOINT_MANAGE,
      PERMISSIONS.BEEPOINT_AWARD,
      PERMISSIONS.BEEPOINT_CONFIG,
      PERMISSIONS.BEEPOINT_TRANSACTION_VIEW,
    ],
    "Thành tích": [
      PERMISSIONS.ACHIEVEMENT_VIEW,
      PERMISSIONS.ACHIEVEMENT_CREATE,
      PERMISSIONS.ACHIEVEMENT_EDIT,
      PERMISSIONS.ACHIEVEMENT_DELETE,
      PERMISSIONS.ACHIEVEMENT_AWARD,
    ],
    "API Keys": [
      PERMISSIONS.API_KEY_VIEW,
      PERMISSIONS.API_KEY_CREATE,
      PERMISSIONS.API_KEY_EDIT,
      PERMISSIONS.API_KEY_DELETE,
    ],
    "Cài đặt": [
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_EDIT,
    ],
    "Upload": [
      PERMISSIONS.UPLOAD_CREATE,
      PERMISSIONS.UPLOAD_VIEW,
      PERMISSIONS.UPLOAD_DELETE,
    ],
    "Hệ thống": [
      PERMISSIONS.SYSTEM_ADMIN,
      PERMISSIONS.STATS_VIEW,
    ],
  };

  const getPermissionDisplayName = (permission: string) => {
    const names: Record<string, string> = {
      [PERMISSIONS.MEMBER_VIEW]: "Xem thành viên",
      [PERMISSIONS.MEMBER_CREATE]: "Tạo thành viên",
      [PERMISSIONS.MEMBER_EDIT]: "Sửa thành viên",
      [PERMISSIONS.MEMBER_DELETE]: "Xóa thành viên",
      [PERMISSIONS.DEPARTMENT_VIEW]: "Xem ban",
      [PERMISSIONS.DEPARTMENT_CREATE]: "Tạo ban",
      [PERMISSIONS.DEPARTMENT_EDIT]: "Sửa ban",
      [PERMISSIONS.DEPARTMENT_DELETE]: "Xóa ban",
      [PERMISSIONS.DIVISION_VIEW]: "Xem phân ban",
      [PERMISSIONS.DIVISION_CREATE]: "Tạo phân ban",
      [PERMISSIONS.DIVISION_EDIT]: "Sửa phân ban",
      [PERMISSIONS.DIVISION_DELETE]: "Xóa phân ban",
      [PERMISSIONS.POSITION_VIEW]: "Xem chức vụ",
      [PERMISSIONS.POSITION_CREATE]: "Tạo chức vụ",
      [PERMISSIONS.POSITION_EDIT]: "Sửa chức vụ",
      [PERMISSIONS.POSITION_DELETE]: "Xóa chức vụ",
      [PERMISSIONS.ACADEMIC_YEAR_VIEW]: "Xem khóa học",
      [PERMISSIONS.ACADEMIC_YEAR_CREATE]: "Tạo khóa học",
      [PERMISSIONS.ACADEMIC_YEAR_EDIT]: "Sửa khóa học",
      [PERMISSIONS.ACADEMIC_YEAR_DELETE]: "Xóa khóa học",
      [PERMISSIONS.ACADEMIC_YEAR_ACTIVATE]: "Kích hoạt khóa học",
      [PERMISSIONS.USER_VIEW]: "Xem người dùng",
      [PERMISSIONS.USER_CREATE]: "Tạo người dùng",
      [PERMISSIONS.USER_EDIT]: "Sửa người dùng",
      [PERMISSIONS.USER_DELETE]: "Xóa người dùng",
      [PERMISSIONS.ROLE_VIEW]: "Xem vai trò",
      [PERMISSIONS.ROLE_CREATE]: "Tạo vai trò",
      [PERMISSIONS.ROLE_EDIT]: "Sửa vai trò",
      [PERMISSIONS.ROLE_DELETE]: "Xóa vai trò",
      [PERMISSIONS.BEEPOINT_VIEW]: "Xem BeePoint",
      [PERMISSIONS.BEEPOINT_MANAGE]: "Quản lý BeePoint",
      [PERMISSIONS.BEEPOINT_AWARD]: "Trao thưởng BeePoint",
      [PERMISSIONS.BEEPOINT_CONFIG]: "Cấu hình BeePoint",
      [PERMISSIONS.BEEPOINT_TRANSACTION_VIEW]: "Xem giao dịch BeePoint",
      [PERMISSIONS.ACHIEVEMENT_VIEW]: "Xem thành tích",
      [PERMISSIONS.ACHIEVEMENT_CREATE]: "Tạo thành tích",
      [PERMISSIONS.ACHIEVEMENT_EDIT]: "Sửa thành tích",
      [PERMISSIONS.ACHIEVEMENT_DELETE]: "Xóa thành tích",
      [PERMISSIONS.ACHIEVEMENT_AWARD]: "Trao thành tích",
      [PERMISSIONS.API_KEY_VIEW]: "Xem API Keys",
      [PERMISSIONS.API_KEY_CREATE]: "Tạo API Keys",
      [PERMISSIONS.API_KEY_EDIT]: "Sửa API Keys",
      [PERMISSIONS.API_KEY_DELETE]: "Xóa API Keys",
      [PERMISSIONS.SETTINGS_VIEW]: "Xem cài đặt",
      [PERMISSIONS.SETTINGS_EDIT]: "Sửa cài đặt",
      [PERMISSIONS.UPLOAD_CREATE]: "Upload file",
      [PERMISSIONS.UPLOAD_VIEW]: "Xem file",
      [PERMISSIONS.UPLOAD_DELETE]: "Xóa file",
      [PERMISSIONS.SYSTEM_ADMIN]: "Quản trị hệ thống",
      [PERMISSIONS.STATS_VIEW]: "Xem thống kê",
    };
    return names[permission] || permission;
  };

  // Chỉ Super Admin và Admin mới được truy cập trang này
  if (!user || (user.role?.name !== 'admin' && user.role?.name !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
            <p className="text-gray-600">Chỉ có quản trị viên mới được truy cập trang này</p>
            <div className="mt-4">
              <a href="/" className="text-blue-600 hover:text-blue-800">← Quay về trang chủ</a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản trị hệ thống</h1>
          <p className="text-gray-600 mt-2">Quản lý vai trò và người dùng</p>
        </div>

        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList>
            <TabsTrigger value="roles">Vai trò</TabsTrigger>
            <TabsTrigger value="users">Người dùng</TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Quản lý vai trò</h2>
              <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetRoleForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm vai trò
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Tạo vai trò mới</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="role-name">Tên vai trò</Label>
                      <Input
                        id="role-name"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        placeholder="admin, manager, member..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="role-display-name">Tên hiển thị</Label>
                      <Input
                        id="role-display-name"
                        value={roleDisplayName}
                        onChange={(e) => setRoleDisplayName(e.target.value)}
                        placeholder="Quản trị viên, Quản lý, Thành viên..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="role-description">Mô tả</Label>
                      <Textarea
                        id="role-description"
                        value={roleDescription}
                        onChange={(e) => setRoleDescription(e.target.value)}
                        placeholder="Mô tả vai trò và quyền hạn..."
                      />
                    </div>
                    <div>
                      <Label>Quyền hạn</Label>
                      <div className="space-y-4 max-h-60 overflow-y-auto border rounded p-4">
                        {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                          <div key={groupName}>
                            <h4 className="font-medium text-sm mb-2">{groupName}</h4>
                            <div className="grid grid-cols-2 gap-2 ml-4">
                              {permissions.map((permission) => (
                                <div key={permission} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={permission}
                                    checked={selectedPermissions.includes(permission)}
                                    onCheckedChange={(checked) => handlePermissionToggle(permission, checked as boolean)}
                                  />
                                  <Label htmlFor={permission} className="text-xs">
                                    {getPermissionDisplayName(permission)}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>
                        Hủy
                      </Button>
                      <Button onClick={handleCreateRole} disabled={createRoleMutation.isPending}>
                        {createRoleMutation.isPending ? "Đang tạo..." : "Tạo vai trò"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles?.map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{role.displayName}</CardTitle>
                      {role.isSystem && (
                        <Badge variant="secondary">Hệ thống</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Quyền hạn:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {role.permissions.slice(0, 3).map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {getPermissionDisplayName(permission)}
                            </Badge>
                          ))}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} khác
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Quản lý người dùng</h2>
              <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetUserForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm người dùng
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tạo người dùng mới</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user-name">Tên đăng nhập</Label>
                      <Input
                        id="user-name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-email">Email</Label>
                      <Input
                        id="user-email"
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-full-name">Họ và tên</Label>
                      <Input
                        id="user-full-name"
                        value={userFullName}
                        onChange={(e) => setUserFullName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-password">Mật khẩu</Label>
                      <Input
                        id="user-password"
                        type="password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        placeholder="Mật khẩu"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-role">Vai trò</Label>
                      <Select value={userRoleId.toString()} onValueChange={(value) => setUserRoleId(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles?.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
                        Hủy
                      </Button>
                      <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? "Đang tạo..." : "Tạo người dùng"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users?.map((user) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{user.fullName}</CardTitle>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Hoạt động" : "Không hoạt động"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Email:</span> {user.email}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Vai trò:</span> {user.role.displayName}
                      </div>
                      <UserRoleDialog user={user} roles={roles || []} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}