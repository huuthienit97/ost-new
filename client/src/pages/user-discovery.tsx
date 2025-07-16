import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Users, MessageCircle, Check, X, Clock } from "lucide-react";

interface User {
  id: number;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
}

interface FriendRequest {
  id: number;
  requestMessage?: string;
  requestedAt: string;
  requester: User;
}

interface Friend {
  connectionId: number;
  connectedAt: string;
  friend: User;
}

export default function UserDiscovery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [connectMessage, setConnectMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search users
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["/api/users/search", searchTerm],
    enabled: searchTerm.length >= 2,
  });

  // Get friend requests
  const { data: friendRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/users/requests"],
  });

  // Get friends list
  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ["/api/users/friends"],
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: number; message: string }) =>
      apiRequest(`/api/users/connect`, "POST", { userId, message }),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã gửi lời mời kết bạn" });
      setSelectedUser(null);
      setConnectMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/users/requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi lời mời kết bạn",
        variant: "destructive",
      });
    },
  });

  // Respond to friend request mutation
  const respondRequestMutation = useMutation({
    mutationFn: async ({ connectionId, action }: { connectionId: number; action: "accept" | "reject" }) =>
      apiRequest(`/api/users/respond/${connectionId}`, "POST", { action }),
    onSuccess: (data, variables) => {
      toast({
        title: "Thành công",
        description: variables.action === "accept" ? "Đã chấp nhận lời mời" : "Đã từ chối lời mời",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/friends"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xử lý lời mời",
        variant: "destructive",
      });
    },
  });

  // Create chat with friend mutation
  const createChatMutation = useMutation({
    mutationFn: async (friendId: number) =>
      apiRequest(`/api/users/chat/${friendId}`, "POST"),
    onSuccess: (room) => {
      toast({ title: "Thành công", description: "Đã tạo cuộc trò chuyện" });
      // Navigate to chat room (you can implement navigation here)
      console.log("Created chat room:", room);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo cuộc trò chuyện",
        variant: "destructive",
      });
    },
  });

  const handleSendRequest = () => {
    if (selectedUser) {
      sendRequestMutation.mutate({
        userId: selectedUser.id,
        message: connectMessage.trim(),
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Khám phá & Kết bạn</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Users */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Tìm kiếm người dùng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm theo tên, username hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-[400px]">
                {searchLoading ? (
                  <div className="text-center py-8 text-gray-500">Đang tìm kiếm...</div>
                ) : searchTerm.length < 2 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nhập ít nhất 2 ký tự để tìm kiếm
                  </div>
                ) : !searchResults || searchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Không tìm thấy người dùng nào
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map((user: User) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-medium">{user.fullName}</h3>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                            {user.bio && (
                              <p className="text-xs text-gray-400 mt-1">{user.bio}</p>
                            )}
                            <p className="text-xs text-gray-300 mt-1">
                              ID: {user.id} • Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setConnectMessage("");
                              }}
                              disabled={sendRequestMutation.isPending}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Kết bạn
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Gửi lời mời kết bạn</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={selectedUser?.avatarUrl} />
                                  <AvatarFallback>
                                    {selectedUser ? getInitials(selectedUser.fullName) : ""}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-medium">{selectedUser?.fullName}</h3>
                                  <p className="text-sm text-gray-500">@{selectedUser?.username}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  Lời nhắn (tùy chọn):
                                </label>
                                <Textarea
                                  placeholder="Xin chào! Tôi muốn kết bạn với bạn..."
                                  value={connectMessage}
                                  onChange={(e) => setConnectMessage(e.target.value)}
                                  rows={3}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleSendRequest}
                                disabled={sendRequestMutation.isPending}
                              >
                                {sendRequestMutation.isPending ? "Đang gửi..." : "Gửi lời mời"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Friend Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Lời mời kết bạn
                {friendRequests?.length > 0 && (
                  <Badge variant="destructive">{friendRequests.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {requestsLoading ? (
                  <div className="text-center py-8 text-gray-500">Đang tải...</div>
                ) : !friendRequests || friendRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Không có lời mời nào
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friendRequests.map((request: FriendRequest) => (
                      <div key={request.id} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={request.requester.avatarUrl} />
                            <AvatarFallback>
                              {getInitials(request.requester.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">
                              {request.requester.fullName}
                            </h4>
                            <p className="text-xs text-gray-500">
                              @{request.requester.username}
                            </p>
                          </div>
                        </div>
                        {request.requestMessage && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            "{request.requestMessage}"
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              respondRequestMutation.mutate({
                                connectionId: request.id,
                                action: "accept",
                              })
                            }
                            disabled={respondRequestMutation.isPending}
                            className="flex-1"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Chấp nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              respondRequestMutation.mutate({
                                connectionId: request.id,
                                action: "reject",
                              })
                            }
                            disabled={respondRequestMutation.isPending}
                            className="flex-1"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Từ chối
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Friends List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Danh sách bạn bè
              {friends?.length > 0 && (
                <Badge variant="secondary">{friends.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {friendsLoading ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : !friends || friends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chưa có bạn bè nào
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friendship: Friend) => (
                    <div key={friendship.connectionId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={friendship.friend.avatarUrl} />
                          <AvatarFallback>
                            {getInitials(friendship.friend.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium">{friendship.friend.fullName}</h3>
                          <p className="text-sm text-gray-500">@{friendship.friend.username}</p>
                          {friendship.friend.bio && (
                            <p className="text-xs text-gray-400 mt-1">
                              {friendship.friend.bio}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => createChatMutation.mutate(friendship.friend.id)}
                        disabled={createChatMutation.isPending}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Nhắn tin
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}