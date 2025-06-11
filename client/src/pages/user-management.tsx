import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, UserPlus, Settings, Key, Trash2, UserCheck, UserX, RefreshCw, Eye, EyeOff, Copy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface UserWithDetails {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin: string | null;
  createdAt: string;
  role: {
    id: number;
    name: string;
    displayName: string;
  };
  member: {
    id: number;
    studentId: string;
    fullName: string;
    email: string;
    phone: string;
    isActive: boolean;
    division: {
      id: number;
      name: string;
    };
    position: {
      id: number;
      name: string;
      displayName: string;
    };
  } | null;
}

interface Member {
  id: number;
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  userId: number | null;
  division?: {
    name: string;
  };
  position?: {
    displayName: string;
  };
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{username: string; password: string} | null>(null);

  // Fetch all users with details
  const { data: usersData = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Fetch members for creating accounts
  const { data: membersData = [] } = useQuery({
    queryKey: ["/api/members"],
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("POST", `/api/users/${userId}/reset-password`);
    },
    onSuccess: (data) => {
      setNewCredentials({
        username: data.username,
        password: data.newPassword
      });
      setShowPasswordDialog(true);
      toast({
        title: "Thành công",
        description: "Đặt lại mật khẩu thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể đặt lại mật khẩu",
        variant: "destructive",
      });
    },
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("POST", `/api/users/${userId}/toggle-status`);
    },
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thay đổi trạng thái tài khoản",
        variant: "destructive",
      });
    },
  });

  // Create user account mutation
  const createUserMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return await apiRequest("POST", `/api/admin/members/${memberId}/create-user`);
    },
    onSuccess: (data) => {
      setNewCredentials({
        username: data.user.username,
        password: data.user.password
      });
      setShowPasswordDialog(true);
      toast({
        title: "Thành công",
        description: "Tạo tài khoản đăng nhập thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo tài khoản đăng nhập",
        variant: "destructive",
      });
    },
  });

  // Delete user account mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa tài khoản đăng nhập",
        variant: "destructive",
      });
    },
  });

  const handleResetPassword = (userId: number) => {
    resetPasswordMutation.mutate(userId);
  };

  const handleToggleStatus = (userId: number) => {
    toggleStatusMutation.mutate(userId);
  };

  const handleCreateUser = (memberId: number) => {
    createUserMutation.mutate(memberId);
  };

  const handleDeleteUser = (userId: number) => {
    deleteUserMutation.mutate(userId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: "Đã sao chép vào clipboard",
    });
  };

  const getStatusBadge = (user: UserWithDetails) => {
    if (!user.isActive) {
      return <Badge variant="destructive">Vô hiệu hóa</Badge>;
    }
    if (user.mustChangePassword) {
      return <Badge variant="outline">Cần đổi mật khẩu</Badge>;
    }
    return <Badge variant="default">Hoạt động</Badge>;
  };

  const getMembersWithoutAccounts = () => {
    return Array.isArray(membersData) ? membersData.filter((member: Member) => !member.userId) : [];
  };

  if (usersLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-lg">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Tài khoản Đăng nhập</h1>
          <p className="text-muted-foreground">Quản lý thông tin đăng nhập của thành viên</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Tài khoản Hiện tại</TabsTrigger>
          <TabsTrigger value="create">Tạo Tài khoản Mới</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Danh sách Tài khoản ({Array.isArray(usersData) ? usersData.length : 0})
              </CardTitle>
              <CardDescription>
                Quản lý tất cả tài khoản đăng nhập trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên đăng nhập</TableHead>
                    <TableHead>Tên đầy đủ</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Thành viên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Đăng nhập cuối</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(usersData) && usersData.map((user: UserWithDetails) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role?.displayName || user.role?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.member ? (
                          <div className="text-sm">
                            <div>{user.member.fullName}</div>
                            <div className="text-muted-foreground">
                              {user.member.division?.name} - {user.member.position?.displayName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Không có</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell>
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString('vi-VN')
                          : "Chưa đăng nhập"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(user.id)}
                            disabled={resetPasswordMutation.isPending}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user.id)}
                            disabled={toggleStatusMutation.isPending}
                          >
                            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          {user.role?.name !== 'admin' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xác nhận xóa tài khoản</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc chắn muốn xóa tài khoản đăng nhập của {user.fullName}? 
                                    Hành động này không thể hoàn tác.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Xóa tài khoản
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Tạo Tài khoản Đăng nhập
              </CardTitle>
              <CardDescription>
                Tạo tài khoản đăng nhập cho thành viên chưa có tài khoản
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã học sinh</TableHead>
                    <TableHead>Tên đầy đủ</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Điện thoại</TableHead>
                    <TableHead>Ban</TableHead>
                    <TableHead>Chức vụ</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getMembersWithoutAccounts().map((member: Member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.studentId || "N/A"}</TableCell>
                      <TableCell className="font-medium">{member.fullName}</TableCell>
                      <TableCell>{member.email || "N/A"}</TableCell>
                      <TableCell>{member.phone || "N/A"}</TableCell>
                      <TableCell>{member.division?.name || "N/A"}</TableCell>
                      <TableCell>{member.position?.displayName || "N/A"}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleCreateUser(member.id)}
                          disabled={createUserMutation.isPending}
                          size="sm"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Tạo tài khoản
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {getMembersWithoutAccounts().length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Tất cả thành viên đã có tài khoản đăng nhập
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Password Display Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thông tin Đăng nhập Mới</DialogTitle>
            <DialogDescription>
              Lưu lại thông tin đăng nhập này. Mật khẩu sẽ không hiển thị lại.
            </DialogDescription>
          </DialogHeader>
          {newCredentials && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên đăng nhập</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-muted rounded font-mono">
                    {newCredentials.username}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(newCredentials.username)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mật khẩu</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-muted rounded font-mono">
                    {newCredentials.password}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(newCredentials.password)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Người dùng sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu.
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setShowPasswordDialog(false)}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}