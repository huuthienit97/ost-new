import { useState, useEffect } from "react";
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
      return await apiRequest("PUT", `/api/users/${user.id}`, data);
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

  // Position management state
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [positionForm, setPositionForm] = useState({
    name: "",
    displayName: "",
    level: 1,
    isLeadership: false,
    isDepartmentLevel: false,
    description: ""
  });

  // Division management state
  const [isCreatingDivision, setIsCreatingDivision] = useState(false);
  const [editingDivision, setEditingDivision] = useState<any>(null);
  const [divisionForm, setDivisionForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    icon: "Users"
  });

  // BeePoint configuration state
  const [beePointSettings, setBeePointSettings] = useState({
    totalSupply: 1000000,
    welcomeBonus: 100,
    exchangeRate: 1.0,
    activityMultiplier: 1.0
  });

  const [transactionForm, setTransactionForm] = useState({
    userId: "",
    type: "",
    amount: "",
    description: ""
  });

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  // Fetch users with roles
  const { data: users, isLoading: usersLoading } = useQuery<UserWithRole[]>({
    queryKey: ["/api/users"],
  });

  // Fetch permissions dynamically from API
  const { data: permissionsData } = useQuery<{
    groupedPermissions: Record<string, Array<{
      name: string;
      description: string;
      category: string;
    }>>;
    permissions: Array<{
      name: string;
      description: string;
      category: string;
    }>;
  }>({
    queryKey: ["/api/permissions"],
  });

  // Fetch positions and divisions for admin management
  const { data: positions } = useQuery<Array<{
    id: number;
    name: string;
    displayName: string;
    level: number;
    isLeadership: boolean;
    isDepartmentLevel: boolean;
    description?: string;
  }>>({
    queryKey: ["/api/positions"],
  });

  const { data: divisions } = useQuery<Array<{
    id: number;
    name: string;
    description?: string;
    color: string;
    icon: string;
    isActive: boolean;
  }>>({
    queryKey: ["/api/divisions"],
  });

  // Fetch BeePoint configuration
  const { data: beePointConfig } = useQuery<{
    totalSupply: number;
    welcomeBonus: number;
    exchangeRate: number;
    activityMultiplier: number;
  }>({
    queryKey: ["/api/beepoint/config"],
  });

  // Fetch BeePoint statistics
  const { data: beePointStats } = useQuery<{
    totalIssued: number;
    totalSpent: number;
    activeUsers: number;
    monthlyTransactions: number;
    recentTransactions: Array<{
      id: number;
      amount: number;
      description: string;
      createdAt: string;
      user: { fullName: string };
    }>;
  }>({
    queryKey: ["/api/beepoint/stats"],
  });

  // Fetch all users for BeePoint transaction management
  const { data: allUsers } = useQuery({
    queryKey: ["/api/users/all"],
    select: (data: any) => data?.users || []
  });

  // Update settings when config data loads
  useEffect(() => {
    if (beePointConfig) {
      setBeePointSettings({
        totalSupply: beePointConfig.totalSupply || 1000000,
        welcomeBonus: beePointConfig.welcomeBonus || 100,
        exchangeRate: beePointConfig.exchangeRate || 1.0,
        activityMultiplier: beePointConfig.activityMultiplier || 1.0
      });
    }
  }, [beePointConfig]);

  // BeePoint configuration mutation
  const updateBeePointConfigMutation = useMutation({
    mutationFn: async (configData: any) => {
      return await apiRequest("PUT", "/api/beepoint/config", configData);
    },
    onSuccess: () => {
      // Force immediate cache invalidation and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/beepoint/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/beepoint/stats"] });
      queryClient.refetchQueries({ queryKey: ["/api/beepoint/config"] });
      toast({
        title: "Thành công",
        description: "Cập nhật cấu hình BeePoint thành công",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật cấu hình BeePoint",
        variant: "destructive",
      });
    },
  });

  // BeePoint transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      return await apiRequest("POST", "/api/beepoint/transaction", transactionData);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Tạo giao dịch BeePoint thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/beepoint/stats"] });
      setTransactionForm({ userId: "", type: "", amount: "", description: "" });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo giao dịch BeePoint",
        variant: "destructive",
      });
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      return await apiRequest("POST", "/api/roles", roleData);
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

  // Position management mutations
  const createPositionMutation = useMutation({
    mutationFn: async (positionData: any) => {
      return await apiRequest("POST", "/api/positions", positionData);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Tạo chức vụ thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo chức vụ",
        variant: "destructive",
      });
    },
  });

  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, ...positionData }: any) => {
      return await apiRequest("PUT", `/api/positions/${id}`, positionData);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cập nhật chức vụ thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật chức vụ",
        variant: "destructive",
      });
    },
  });

  const deletePositionMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/positions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Xóa chức vụ thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa chức vụ",
        variant: "destructive",
      });
    },
  });

  // Division management mutations
  const createDivisionMutation = useMutation({
    mutationFn: async (divisionData: any) => {
      return await apiRequest("POST", "/api/divisions", divisionData);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Tạo ban thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/divisions"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo ban",
        variant: "destructive",
      });
    },
  });

  const updateDivisionMutation = useMutation({
    mutationFn: async ({ id, ...divisionData }: any) => {
      return await apiRequest("PUT", `/api/divisions/${id}`, divisionData);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cập nhật ban thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/divisions"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật ban",
        variant: "destructive",
      });
    },
  });

  const deleteDivisionMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/divisions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Xóa ban thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/divisions"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa ban",
        variant: "destructive",
      });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest("POST", "/api/users", userData);
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

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PUT", `/api/roles/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cập nhật vai trò thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setIsRoleModalOpen(false);
      resetRoleForm();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật vai trò",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/roles/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Xóa vai trò thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa vai trò",
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

    const roleData = {
      name: roleName,
      displayName: roleDisplayName,
      description: roleDescription,
      permissions: selectedPermissions,
      isSystem: false,
    };

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data: roleData });
    } else {
      createRoleMutation.mutate(roleData);
    }
  };

  const handleEditRole = (role: Role) => {
    setRoleName(role.name);
    setRoleDisplayName(role.displayName);
    setRoleDescription(role.description || "");
    setSelectedPermissions(role.permissions);
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (role.isSystem) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa vai trò hệ thống",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa vai trò "${role.displayName}"?`)) {
      deleteRoleMutation.mutate(role.id);
    }
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

  // Use dynamic permission groups from API, fallback to hardcoded if API not available
  const permissionGroups = permissionsData?.groupedPermissions || {
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
    "Nhiệm vụ": [
      PERMISSIONS.MISSION_VIEW,
      PERMISSIONS.MISSION_CREATE,
      PERMISSIONS.MISSION_EDIT,
      PERMISSIONS.MISSION_DELETE,
      PERMISSIONS.MISSION_ASSIGN,
      PERMISSIONS.MISSION_SUBMIT,
      PERMISSIONS.MISSION_REVIEW,
    ],
    "Cửa hàng": [
      PERMISSIONS.SHOP_VIEW,
      PERMISSIONS.SHOP_PURCHASE,
      PERMISSIONS.SHOP_MANAGE,
      PERMISSIONS.SHOP_PRODUCT_CREATE,
      PERMISSIONS.SHOP_PRODUCT_EDIT,
      PERMISSIONS.SHOP_PRODUCT_DELETE,
      PERMISSIONS.SHOP_ORDER_VIEW,
      PERMISSIONS.SHOP_ORDER_MANAGE,
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
            <TabsTrigger value="positions">Chức vụ</TabsTrigger>
            <TabsTrigger value="divisions">Ban</TabsTrigger>
            <TabsTrigger value="beepoint">Cấu hình BeePoint</TabsTrigger>
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
                    <DialogTitle>{editingRole ? "Chỉnh sửa vai trò" : "Tạo vai trò mới"}</DialogTitle>
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
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditRole(role)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Sửa
                        </Button>
                        {!role.isSystem && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteRole(role)}
                            className="flex-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Xóa
                          </Button>
                        )}
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

          <TabsContent value="positions">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Quản lý chức vụ</h2>
                  <p className="text-gray-600">Quản lý các chức vụ trong tổ chức</p>
                </div>
                <Button onClick={() => {
                  setPositionForm({
                    name: "",
                    displayName: "",
                    level: 1,
                    isLeadership: false,
                    isDepartmentLevel: false,
                    description: ""
                  });
                  setEditingPosition(null);
                  setIsCreatingPosition(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm chức vụ
                </Button>
              </div>

              <div className="grid gap-4">
                {positions?.map((position) => (
                  <Card key={position.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{position.displayName}</h3>
                            <Badge variant="secondary">Level {position.level}</Badge>
                            {position.isLeadership && <Badge variant="default">Lãnh đạo</Badge>}
                            {position.isDepartmentLevel && <Badge variant="outline">Cấp ban</Badge>}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">Code: {position.name}</p>
                          {position.description && (
                            <p className="text-sm text-gray-500">{position.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setPositionForm({
                                name: position.name,
                                displayName: position.displayName,
                                level: position.level,
                                isLeadership: position.isLeadership,
                                isDepartmentLevel: position.isDepartmentLevel,
                                description: position.description || ""
                              });
                              setEditingPosition(position);
                              setIsCreatingPosition(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa chức vụ "${position.displayName}"?`)) {
                                deletePositionMutation.mutate(position.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Dialog open={isCreatingPosition} onOpenChange={setIsCreatingPosition}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingPosition ? "Cập nhật chức vụ" : "Thêm chức vụ mới"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Mã chức vụ</Label>
                      <Input
                        value={positionForm.name}
                        onChange={(e) => setPositionForm(prev => ({...prev, name: e.target.value}))}
                        placeholder="president, vice-president, secretary..."
                      />
                    </div>
                    <div>
                      <Label>Tên hiển thị</Label>
                      <Input
                        value={positionForm.displayName}
                        onChange={(e) => setPositionForm(prev => ({...prev, displayName: e.target.value}))}
                        placeholder="Chủ nhiệm, Phó chủ nhiệm..."
                      />
                    </div>
                    <div>
                      <Label>Cấp độ (Level)</Label>
                      <Input
                        type="number"
                        value={positionForm.level}
                        onChange={(e) => setPositionForm(prev => ({...prev, level: parseInt(e.target.value) || 1}))}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <Label>Mô tả</Label>
                      <Textarea
                        value={positionForm.description}
                        onChange={(e) => setPositionForm(prev => ({...prev, description: e.target.value}))}
                        placeholder="Mô tả về chức vụ..."
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isLeadership"
                          checked={positionForm.isLeadership}
                          onCheckedChange={(checked) => setPositionForm(prev => ({...prev, isLeadership: !!checked}))}
                        />
                        <Label htmlFor="isLeadership">Chức vụ lãnh đạo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isDepartmentLevel"
                          checked={positionForm.isDepartmentLevel}
                          onCheckedChange={(checked) => setPositionForm(prev => ({...prev, isDepartmentLevel: !!checked}))}
                        />
                        <Label htmlFor="isDepartmentLevel">Cấp ban</Label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (editingPosition) {
                            updatePositionMutation.mutate({...positionForm, id: editingPosition.id});
                          } else {
                            createPositionMutation.mutate(positionForm);
                          }
                          setIsCreatingPosition(false);
                        }}
                        disabled={!positionForm.name || !positionForm.displayName}
                      >
                        {editingPosition ? "Cập nhật" : "Tạo"}
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreatingPosition(false)}>
                        Hủy
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          <TabsContent value="divisions">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Quản lý ban</h2>
                  <p className="text-gray-600">Quản lý các ban trong tổ chức</p>
                </div>
                <Button onClick={() => {
                  setDivisionForm({
                    name: "",
                    description: "",
                    color: "#3B82F6",
                    icon: "Users"
                  });
                  setEditingDivision(null);
                  setIsCreatingDivision(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm ban
                </Button>
              </div>

              <div className="grid gap-4">
                {divisions?.map((division) => (
                  <Card key={division.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: division.color }}
                            />
                            <h3 className="font-medium">{division.name}</h3>
                            <Badge variant="secondary">{division.icon}</Badge>
                            {division.isActive && <Badge variant="default">Hoạt động</Badge>}
                          </div>
                          {division.description && (
                            <p className="text-sm text-gray-500">{division.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setDivisionForm({
                                name: division.name,
                                description: division.description || "",
                                color: division.color,
                                icon: division.icon
                              });
                              setEditingDivision(division);
                              setIsCreatingDivision(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa ban "${division.name}"?`)) {
                                deleteDivisionMutation.mutate(division.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Dialog open={isCreatingDivision} onOpenChange={setIsCreatingDivision}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingDivision ? "Cập nhật ban" : "Thêm ban mới"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Tên ban</Label>
                      <Input
                        value={divisionForm.name}
                        onChange={(e) => setDivisionForm(prev => ({...prev, name: e.target.value}))}
                        placeholder="Ban Sự kiện..."
                      />
                    </div>
                    <div>
                      <Label>Mô tả</Label>
                      <Textarea
                        value={divisionForm.description}
                        onChange={(e) => setDivisionForm(prev => ({...prev, description: e.target.value}))}
                        placeholder="Mô tả về ban..."
                      />
                    </div>
                    <div>
                      <Label>Màu sắc</Label>
                      <Input
                        type="color"
                        value={divisionForm.color}
                        onChange={(e) => setDivisionForm(prev => ({...prev, color: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label>Icon</Label>
                      <Input
                        value={divisionForm.icon}
                        onChange={(e) => setDivisionForm(prev => ({...prev, icon: e.target.value}))}
                        placeholder="Users, Calendar, Settings..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (editingDivision) {
                            updateDivisionMutation.mutate({...divisionForm, id: editingDivision.id});
                          } else {
                            createDivisionMutation.mutate(divisionForm);
                          }
                          setIsCreatingDivision(false);
                        }}
                        disabled={!divisionForm.name}
                      >
                        {editingDivision ? "Cập nhật" : "Tạo"}
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreatingDivision(false)}>
                        Hủy
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Quản lý thông báo</h2>
                  <p className="text-gray-600">Tạo và gửi thông báo đẩy cho thành viên</p>
                </div>
                <Button onClick={() => setIsCreatingNotification(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo thông báo
                </Button>
              </div>

              <div className="grid gap-4">
                {notificationsList?.notifications?.map((notification: any) => (
                  <Card key={notification.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{notification.title}</h3>
                            <Badge variant={notification.type === 'urgent' ? 'destructive' : 'secondary'}>
                              {notification.priority}
                            </Badge>
                            <Badge variant={notification.sentAt ? 'default' : 'outline'}>
                              {notification.sentAt ? 'Đã gửi' : 'Chờ gửi'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="text-xs text-gray-500">
                            <div>Gửi đến: {notification.targetType === 'all' ? 'Tất cả thành viên' : notification.targetType}</div>
                            <div>Người gửi: {notification.sender?.fullName}</div>
                            <div>Tạo lúc: {new Date(notification.createdAt).toLocaleString('vi-VN')}</div>
                            {notification.sentAt && (
                              <div>Gửi lúc: {new Date(notification.sentAt).toLocaleString('vi-VN')}</div>
                            )}
                            <div className="mt-1">
                              Thống kê: {notification.readCount}/{notification.totalRecipients} đã đọc 
                              ({notification.totalRecipients > 0 ? Math.round((notification.readCount / notification.totalRecipients) * 100) : 0}%)
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!notification.sentAt && (
                            <Button 
                              size="sm" 
                              onClick={() => sendNotificationMutation.mutate(notification.id)}
                              disabled={sendNotificationMutation.isPending}
                            >
                              Gửi ngay
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa thông báo "${notification.title}"?`)) {
                                deleteNotificationMutation.mutate(notification.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Dialog open={isCreatingNotification} onOpenChange={setIsCreatingNotification}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Tạo thông báo mới</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Tiêu đề</Label>
                      <Input
                        value={notificationForm.title}
                        onChange={(e) => setNotificationForm(prev => ({...prev, title: e.target.value}))}
                        placeholder="Nhập tiêu đề thông báo..."
                      />
                    </div>
                    <div>
                      <Label>Nội dung</Label>
                      <Textarea
                        value={notificationForm.message}
                        onChange={(e) => setNotificationForm(prev => ({...prev, message: e.target.value}))}
                        placeholder="Nhập nội dung thông báo..."
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Loại thông báo</Label>
                        <Select 
                          value={notificationForm.type} 
                          onValueChange={(value) => setNotificationForm(prev => ({...prev, type: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Thông tin</SelectItem>
                            <SelectItem value="success">Thành công</SelectItem>
                            <SelectItem value="warning">Cảnh báo</SelectItem>
                            <SelectItem value="error">Lỗi</SelectItem>
                            <SelectItem value="announcement">Thông báo quan trọng</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Mức độ ưu tiên</Label>
                        <Select 
                          value={notificationForm.priority} 
                          onValueChange={(value) => setNotificationForm(prev => ({...prev, priority: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Thấp</SelectItem>
                            <SelectItem value="normal">Bình thường</SelectItem>
                            <SelectItem value="high">Cao</SelectItem>
                            <SelectItem value="urgent">Khẩn cấp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Gửi đến</Label>
                      <Select 
                        value={notificationForm.targetType} 
                        onValueChange={(value) => setNotificationForm(prev => ({...prev, targetType: value, targetIds: []}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả thành viên</SelectItem>
                          <SelectItem value="role">Theo vai trò</SelectItem>
                          <SelectItem value="division">Theo ban</SelectItem>
                          <SelectItem value="user">Người dùng cụ thể</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {notificationForm.targetType === 'role' && (
                      <div>
                        <Label>Chọn vai trò</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {roles?.map((role) => (
                            <div key={role.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`role-${role.id}`}
                                checked={notificationForm.targetIds.includes(role.id.toString())}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNotificationForm(prev => ({
                                      ...prev, 
                                      targetIds: [...prev.targetIds, role.id.toString()]
                                    }));
                                  } else {
                                    setNotificationForm(prev => ({
                                      ...prev, 
                                      targetIds: prev.targetIds.filter(id => id !== role.id.toString())
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor={`role-${role.id}`}>{role.displayName}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {notificationForm.targetType === 'division' && (
                      <div>
                        <Label>Chọn ban</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {divisions?.map((division) => (
                            <div key={division.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`division-${division.id}`}
                                checked={notificationForm.targetIds.includes(division.id.toString())}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNotificationForm(prev => ({
                                      ...prev, 
                                      targetIds: [...prev.targetIds, division.id.toString()]
                                    }));
                                  } else {
                                    setNotificationForm(prev => ({
                                      ...prev, 
                                      targetIds: prev.targetIds.filter(id => id !== division.id.toString())
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor={`division-${division.id}`}>{division.name}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {notificationForm.targetType === 'user' && (
                      <div>
                        <Label>Chọn người dùng</Label>
                        <div className="max-h-40 overflow-y-auto mt-2 space-y-2">
                          {users?.map((user) => (
                            <div key={user.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`user-${user.id}`}
                                checked={notificationForm.targetIds.includes(user.id.toString())}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNotificationForm(prev => ({
                                      ...prev, 
                                      targetIds: [...prev.targetIds, user.id.toString()]
                                    }));
                                  } else {
                                    setNotificationForm(prev => ({
                                      ...prev, 
                                      targetIds: prev.targetIds.filter(id => id !== user.id.toString())
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor={`user-${user.id}`}>{user.fullName} ({user.email})</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <Label>Lên lịch gửi (tùy chọn)</Label>
                      <Input
                        type="datetime-local"
                        value={notificationForm.scheduledAt}
                        onChange={(e) => setNotificationForm(prev => ({...prev, scheduledAt: e.target.value}))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          createNotificationMutation.mutate(notificationForm);
                          setIsCreatingNotification(false);
                        }}
                        disabled={!notificationForm.title || !notificationForm.message || createNotificationMutation.isPending}
                      >
                        {notificationForm.scheduledAt ? "Lên lịch gửi" : "Gửi ngay"}
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreatingNotification(false)}>
                        Hủy
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          <TabsContent value="beepoint">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Cấu hình BeePoint</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Cài đặt điểm thưởng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Tổng cung BeePoint</Label>
                      <Input 
                        type="number" 
                        value={beePointSettings.totalSupply} 
                        placeholder="1000000" 
                        onChange={(e) => setBeePointSettings(prev => ({...prev, totalSupply: parseInt(e.target.value) || 0}))}
                      />
                    </div>
                    <div>
                      <Label>Điểm thưởng chào mừng</Label>
                      <Input 
                        type="number" 
                        value={beePointSettings.welcomeBonus} 
                        placeholder="100" 
                        onChange={(e) => setBeePointSettings(prev => ({...prev, welcomeBonus: parseInt(e.target.value) || 0}))}
                      />
                    </div>
                    <div>
                      <Label>Tỷ lệ đổi thưởng</Label>
                      <Input 
                        type="number" 
                        step="0.1"
                        value={beePointSettings.exchangeRate} 
                        placeholder="1.0" 
                        onChange={(e) => setBeePointSettings(prev => ({...prev, exchangeRate: parseFloat(e.target.value) || 0}))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Giá trị quy đổi 1 BeePoint = ? VND (ví dụ: 1.0 = 1 BeePoint = 1000 VND)
                      </p>
                    </div>
                    <div>
                      <Label>Hệ số nhân hoạt động</Label>
                      <Input 
                        type="number" 
                        step="0.1"
                        value={beePointSettings.activityMultiplier} 
                        placeholder="1.0" 
                        onChange={(e) => setBeePointSettings(prev => ({...prev, activityMultiplier: parseFloat(e.target.value) || 0}))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Hệ số nhân điểm thưởng cho hoạt động (ví dụ: 1.5 = tăng 50% điểm thưởng)
                      </p>
                    </div>
                    <Button 
                      onClick={() => updateBeePointConfigMutation.mutate(beePointSettings)}
                      disabled={updateBeePointConfigMutation.isPending}
                    >
                      {updateBeePointConfigMutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Thống kê BeePoint
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm">
                      <span className="font-medium">Tổng điểm đã phát:</span> {beePointStats?.totalIssued?.toLocaleString() || 0} BeePoint
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Tổng điểm đã tiêu:</span> {beePointStats?.totalSpent?.toLocaleString() || 0} BeePoint
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Người dùng hoạt động:</span> {beePointStats?.activeUsers || 0} người
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Giao dịch trong tháng:</span> {beePointStats?.monthlyTransactions || 0} giao dịch
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Quản lý giao dịch
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Người dùng</Label>
                      <Select value={transactionForm.userId} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, userId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn người dùng" />
                        </SelectTrigger>
                        <SelectContent>
                          {users?.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.fullName} ({user.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Loại giao dịch</Label>
                      <Select value={transactionForm.type} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reward">Trao thưởng</SelectItem>
                          <SelectItem value="penalty">Phạt</SelectItem>
                          <SelectItem value="bonus">Thưởng thêm</SelectItem>
                          <SelectItem value="admin_adjustment">Điều chỉnh</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Số điểm</Label>
                      <Input 
                        type="number" 
                        placeholder="Nhập số điểm (+ cho thưởng, - cho phạt)"
                        value={transactionForm.amount}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Mô tả</Label>
                      <Input 
                        placeholder="Mô tả lý do giao dịch"
                        value={transactionForm.description}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        if (!transactionForm.userId || !transactionForm.type || !transactionForm.amount || !transactionForm.description) {
                          toast({
                            title: "Lỗi",
                            description: "Vui lòng điền đầy đủ thông tin",
                            variant: "destructive",
                          });
                          return;
                        }
                        createTransactionMutation.mutate({
                          userId: parseInt(transactionForm.userId),
                          type: transactionForm.type,
                          amount: parseFloat(transactionForm.amount),
                          description: transactionForm.description
                        });
                      }}
                      disabled={createTransactionMutation.isPending}
                    >
                      {createTransactionMutation.isPending ? "Đang xử lý..." : "Thực hiện giao dịch"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Lịch sử giao dịch gần đây
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {beePointStats?.recentTransactions?.length > 0 ? (
                        beePointStats.recentTransactions.map((transaction: any) => (
                          <div key={transaction.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">{transaction.user?.fullName || 'Người dùng'}</p>
                              <p className="text-sm text-gray-600">{transaction.description}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount} BP
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.createdAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          Chưa có giao dịch nào
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}