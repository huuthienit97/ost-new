import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Pin, PinOff, Eye, Trash2, MessageCircle, Heart } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminPost {
  id: number;
  content: string;
  images?: string[];
  visibility: string;
  isPinned: boolean;
  pinnedAt?: string;
  createdAt: string;
  author: {
    id: number;
    fullName: string;
    avatarUrl?: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

export default function PostManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);

  // Fetch all posts for admin
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/admin/posts"],
    queryFn: () => apiRequest("/api/admin/posts"),
  });

  // Pin/Unpin post mutation
  const pinMutation = useMutation({
    mutationFn: async ({ postId, pin }: { postId: number; pin: boolean }) => {
      return apiRequest(`/api/posts/${postId}/pin`, {
        method: "POST",
        body: { pin },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái ghim bài viết thành công",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái ghim bài viết",
        variant: "destructive",
      });
    },
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest(`/api/posts/${postId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      toast({
        title: "Thành công",
        description: "Xóa bài viết thành công",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài viết",
        variant: "destructive",
      });
    },
  });

  const handlePin = (post: AdminPost) => {
    pinMutation.mutate({ postId: post.id, pin: !post.isPinned });
  };

  const handleDelete = (postId: number) => {
    deleteMutation.mutate(postId);
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Badge variant="default">Công khai</Badge>;
      case "friends":
        return <Badge variant="secondary">Bạn bè</Badge>;
      case "private":
        return <Badge variant="outline">Riêng tư</Badge>;
      default:
        return <Badge variant="outline">{visibility}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách bài viết...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Quản lý bài viết</h1>
            <p className="text-gray-600 mt-2">
              Quản lý tất cả bài viết trong hệ thống, ghim bài viết quan trọng và xóa nội dung vi phạm
            </p>
          </div>

          <div className="grid gap-4">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">Chưa có bài viết nào trong hệ thống</p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post: AdminPost) => (
                <Card key={post.id} className={post.isPinned ? "border-blue-500 bg-blue-50" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={post.author.avatarUrl} alt={post.author.fullName} />
                          <AvatarFallback className="bg-blue-500 text-white">
                            {post.author.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">{post.author.fullName}</h3>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm text-gray-500">
                              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}
                            </p>
                            {getVisibilityBadge(post.visibility)}
                            {post.isPinned && (
                              <Badge variant="default" className="bg-blue-600">
                                <Pin className="w-3 h-3 mr-1" />
                                Đã ghim
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePin(post)}
                          disabled={pinMutation.isPending}
                        >
                          {post.isPinned ? (
                            <>
                              <PinOff className="w-4 h-4 mr-1" />
                              Bỏ ghim
                            </>
                          ) : (
                            <>
                              <Pin className="w-4 h-4 mr-1" />
                              Ghim
                            </>
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Xóa
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa bài viết</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(post.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                      
                      {post.images && post.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {post.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Ảnh ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{post._count.likes} lượt thích</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post._count.comments} bình luận</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
    </AppLayout>
  );
}