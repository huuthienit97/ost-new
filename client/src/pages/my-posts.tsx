import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Trash2, MessageCircle, Heart, Globe, Users, Lock, Edit, Pin } from "lucide-react";
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

interface MyPost {
  id: number;
  content: string;
  images?: string[];
  visibility: 'public' | 'friends' | 'private';
  isPinned: boolean;
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

export default function MyPostsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's posts
  const { data: posts = [], isLoading } = useQuery<MyPost[]>({
    queryKey: ["/api/posts/my-posts"],
    staleTime: 30000,
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest(`/api/posts/${postId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/newsfeed"] });
      toast({ title: "Đã xóa bài viết thành công!" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa bài viết",
        variant: "destructive",
      });
    },
  });

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="h-4 w-4 text-green-500" />;
      case 'friends': return <Users className="h-4 w-4 text-blue-500" />;
      case 'private': return <Lock className="h-4 w-4 text-gray-500" />;
      default: return <Globe className="h-4 w-4 text-green-500" />;
    }
  };

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'Công khai';
      case 'friends': return 'Bạn bè';
      case 'private': return 'Riêng tư';
      default: return 'Công khai';
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Badge variant="default" className="bg-green-100 text-green-800">Công khai</Badge>;
      case "friends":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Bạn bè</Badge>;
      case "private":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Riêng tư</Badge>;
      default:
        return <Badge variant="outline">{visibility}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài viết của bạn...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bài viết của tôi</h1>
          <p className="text-gray-600 mt-2">
            Quản lý tất cả bài viết mà bạn đã đăng
          </p>
        </div>

        <div className="grid gap-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Bạn chưa có bài viết nào</p>
                <Button className="mt-4" onClick={() => window.location.href = '/newsfeed'}>
                  Tạo bài viết đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            posts.map((post: MyPost) => (
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
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}
                          </span>
                          <span className="text-gray-300">•</span>
                          {getVisibilityIcon(post.visibility)}
                          <span className="text-sm text-gray-500">{getVisibilityText(post.visibility)}</span>
                          {post.isPinned && (
                            <>
                              <span className="text-gray-300">•</span>
                              <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">
                                <Pin className="h-3 w-3 mr-1" />
                                Đã ghim
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getVisibilityBadge(post.visibility)}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa bài viết</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deletePostMutation.mutate(post.id)}
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
                  <p className="whitespace-pre-wrap mb-4">{post.content}</p>
                  
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {post.images.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Post image ${index + 1}`}
                          className="rounded-lg w-full h-48 object-cover"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1 text-gray-600">
                        <Heart className="h-4 w-4" />
                        <span>{post._count.likes}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-gray-600">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post._count.comments}</span>
                      </span>
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