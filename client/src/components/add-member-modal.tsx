import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { createMemberSchema, Department, MemberWithDepartment } from "@shared/schema";
import { z } from "zod";
import { Copy } from "lucide-react";

type CreateMemberData = z.infer<typeof createMemberSchema>;

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMember?: MemberWithDepartment | null;
}

export function AddMemberModal({ open, onOpenChange, editingMember }: AddMemberModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newUserInfo, setNewUserInfo] = useState<{username: string, password: string} | null>(null);

  const { data: positions = [] } = useQuery<any[]>({
    queryKey: ["/api/positions"],
  });

  const { data: divisions = [] } = useQuery<any[]>({
    queryKey: ["/api/divisions"],
  });

  const { data: academicYears = [] } = useQuery<any[]>({
    queryKey: ["/api/academic-years"],
  });

  const form = useForm<CreateMemberData>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      fullName: editingMember?.fullName || "",
      studentId: editingMember?.studentId || "",
      email: editingMember?.email || "",
      phone: editingMember?.phone || "",
      class: editingMember?.class || "",
      divisionId: editingMember?.divisionId || 0,
      positionId: editingMember?.positionId || 0,
      academicYearId: editingMember?.academicYearId || 0,
      memberType: (editingMember?.memberType as any) || "active",
      joinDate: editingMember?.joinDate || "",
      notes: editingMember?.notes || "",
      createUserAccount: false,
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: CreateMemberData) => {
      const response = await apiRequest("POST", "/api/members", data);
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      // Check if user account was created and show credentials
      if (result?.userCredentials) {
        setNewUserInfo({
          username: result.userCredentials.username,
          password: result.userCredentials.password
        });
      } else {
        toast({
          title: "Thành công",
          description: "Thành viên mới đã được thêm thành công",
        });
        onOpenChange(false);
      }
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi thêm thành viên",
        variant: "destructive",
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (data: CreateMemberData) => {
      const response = await apiRequest("PUT", `/api/members/${editingMember!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Thành công",
        description: "Thông tin thành viên đã được cập nhật",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật thành viên",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateMemberData) => {
    if (editingMember) {
      updateMemberMutation.mutate(data);
    } else {
      createMemberMutation.mutate(data);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setNewUserInfo(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Chỉnh sửa thành viên" : "Thêm thành viên mới"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ và tên *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập họ và tên" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã học sinh</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập mã học sinh" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="name@ost.edu.vn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Nhập số điện thoại" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lớp *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập lớp (ví dụ: 12A1)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="divisionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ban *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn ban" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(divisions as any[]).map((division: any) => (
                            <SelectItem key={division.id} value={division.id.toString()}>
                              {division.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="positionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chức vụ *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn chức vụ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {positions?.map((position: any) => (
                            <SelectItem key={position.id} value={position.id.toString()}>
                              {position.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="academicYearId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Khóa học *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn khóa học" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(academicYears as any[]).map((year: any) => (
                            <SelectItem key={year.id} value={year.id.toString()}>
                              {year.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="memberType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Đang hoạt động</SelectItem>
                          <SelectItem value="alumni">Cựu thành viên</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="joinDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày gia nhập *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Thông tin bổ sung về thành viên..." 
                        rows={3}
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!editingMember && (
                <FormField
                  control={form.control}
                  name="createUserAccount"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Tạo tài khoản đăng nhập
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Tạo tài khoản đăng nhập cho thành viên này để họ có thể truy cập hệ thống
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleOpenChange(false)}
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMemberMutation.isPending || updateMemberMutation.isPending}
                >
                  {editingMember ? "Cập nhật" : "Thêm thành viên"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog hiển thị thông tin đăng nhập */}
      <Dialog open={!!newUserInfo} onOpenChange={() => {
        setNewUserInfo(null);
        onOpenChange(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tài khoản đã được tạo thành công!</DialogTitle>
          </DialogHeader>
          {newUserInfo && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Thông tin đăng nhập:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tên đăng nhập:</span>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{newUserInfo.username}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(newUserInfo.username)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Mật khẩu:</span>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{newUserInfo.password}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(newUserInfo.password)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Hãy lưu lại thông tin này và chuyển cho thành viên. 
                  Thành viên sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => {
                  setNewUserInfo(null);
                  onOpenChange(false);
                }}>
                  Đã hiểu
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}