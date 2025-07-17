import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Camera, 
  Send,
  PinIcon,
  Globe,
  Users,
  Lock,
  MoreHorizontal,
  Trash2,
  Edit,
  Pin,
  PinOff
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Post {
  id: number;
  content: string;
  imageUrls?: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isPinned: boolean;
  visibility: 'public' | 'friends' | 'private';
  createdAt: string;
  author: {
    id: number;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
  comments?: Comment[];
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export default function NewsfeedPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPostContent, setNewPostContent] = useState("");
  const [postImages, setPostImages] = useState<FileList | null>(null);
  const [commentContent, setCommentContent] = useState<{ [key: number]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch newsfeed posts
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts/newsfeed"],
    staleTime: 30000, // 30 seconds
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; images?: FileList; visibility?: string }) => {
      const formData = new FormData();
      formData.append("content", data.content);
      formData.append("visibility", data.visibility || "public");
      
      if (data.images) {
        Array.from(data.images).forEach((file) => {
          formData.append("images", file);
        });
      }

      return apiRequest("/api/posts", {
        method: "POST",
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/newsfeed"] });
      setNewPostContent("");
      setPostImages(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({ title: "Đã đăng bài viết!" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể đăng bài viết",
        variant: "destructive",
      });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest(`/api/posts/${postId}/like`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/newsfeed"] });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      return apiRequest(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/newsfeed"] });
      setCommentContent(prev => ({ ...prev, [variables.postId]: "" }));
    },
  });

  // Pin/Unpin post (admin only)
  const pinPostMutation = useMutation({
    mutationFn: async ({ postId, pin }: { postId: number; pin: boolean }) => {
      return apiRequest(`/api/posts/${postId}/pin`, {
        method: "PUT",
        body: JSON.stringify({ isPinned: pin }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/newsfeed"] });
      toast({ title: pin ? "Đã ghim bài viết" : "Đã bỏ ghim bài viết" });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Lỗi",
        description: "Nội dung bài viết không được để trống",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      content: newPostContent,
      images: postImages || undefined,
      visibility: "public",
    });
  };

  const handleLikePost = (postId: number) => {
    likePostMutation.mutate(postId);
  };

  const handleAddComment = (postId: number) => {
    const content = commentContent[postId];
    if (!content?.trim()) return;

    addCommentMutation.mutate({ postId, content });
  };

  const handlePinPost = (postId: number, currentlyPinned: boolean) => {
    pinPostMutation.mutate({ postId, pin: !currentlyPinned });
  };

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

  const isAdmin = user?.role?.name === 'SUPER_ADMIN' || user?.role?.name === 'ADMIN';

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Separate pinned and regular posts
  const pinnedPosts = posts.filter(post => post.isPinned).slice(0, 3);
  const regularPosts = posts.filter(post => !post.isPinned && post.visibility === 'public');

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Bảng tin</h1>

        {/* Create Post */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                <AvatarFallback>
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Bạn đang nghĩ gì?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[80px] resize-none border-none focus:ring-0 p-0"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPostImages(e.target.files)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Ảnh
                </Button>
                {postImages && postImages.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {postImages.length} ảnh đã chọn
                  </span>
                )}
              </div>
              <Button
                onClick={handleCreatePost}
                disabled={createPostMutation.isPending}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Đăng
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pinned Posts */}
        {pinnedPosts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <PinIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-blue-600">Bài viết ghim</h2>
            </div>
            {pinnedPosts.map((post) => (
              <Card key={post.id} className="border-blue-200 bg-blue-50/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={post.author.avatarUrl} alt={post.author.fullName} />
                        <AvatarFallback>
                          {post.author.fullName?.charAt(0) || post.author.username?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold">{post.author.fullName}</p>
                          <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">
                            <Pin className="h-3 w-3 mr-1" />
                            Ghim
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}</span>
                          <span>•</span>
                          {getVisibilityIcon(post.visibility)}
                          <span>{getVisibilityText(post.visibility)}</span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePinPost(post.id, post.isPinned)}
                      >
                        <PinOff className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap mb-4">{post.content}</p>
                  
                  {post.imageUrls && post.imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {post.imageUrls.map((url, index) => (
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikePost(post.id)}
                        className={post.isLiked ? "text-red-500" : ""}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} />
                        {post.likesCount}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {post.commentsCount}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4 mr-1" />
                        Chia sẻ
                      </Button>
                    </div>
                  </div>

                  {/* Comments */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="space-y-3 mt-4 pt-4 border-t">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.author.avatarUrl} alt={comment.author.fullName} />
                            <AvatarFallback className="text-xs">
                              {comment.author.fullName?.charAt(0) || comment.author.username?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-gray-100 rounded-lg p-3">
                            <p className="font-semibold text-sm">{comment.author.fullName}</p>
                            <p className="text-sm">{comment.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="flex space-x-3 mt-4 pt-4 border-t">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                      <AvatarFallback className="text-xs">
                        {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex space-x-2">
                      <Input
                        placeholder="Viết bình luận..."
                        value={commentContent[post.id] || ""}
                        onChange={(e) => setCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentContent[post.id]?.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Separator className="my-6" />
          </div>
        )}

        {/* Regular Posts */}
        <div className="space-y-6">
          {regularPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={post.author.avatarUrl} alt={post.author.fullName} />
                      <AvatarFallback>
                        {post.author.fullName?.charAt(0) || post.author.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{post.author.fullName}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}</span>
                        <span>•</span>
                        {getVisibilityIcon(post.visibility)}
                        <span>{getVisibilityText(post.visibility)}</span>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePinPost(post.id, post.isPinned)}
                    >
                      <Pin className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap mb-4">{post.content}</p>
                
                {post.imageUrls && post.imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {post.imageUrls.map((url, index) => (
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikePost(post.id)}
                      className={post.isLiked ? "text-red-500" : ""}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} />
                      {post.likesCount}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {post.commentsCount}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      Chia sẻ
                    </Button>
                  </div>
                </div>

                {/* Comments */}
                {post.comments && post.comments.length > 0 && (
                  <div className="space-y-3 mt-4 pt-4 border-t">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.author.avatarUrl} alt={comment.author.fullName} />
                          <AvatarFallback className="text-xs">
                            {comment.author.fullName?.charAt(0) || comment.author.username?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-gray-100 rounded-lg p-3">
                          <p className="font-semibold text-sm">{comment.author.fullName}</p>
                          <p className="text-sm">{comment.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                <div className="flex space-x-3 mt-4 pt-4 border-t">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                    <AvatarFallback className="text-xs">
                      {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex space-x-2">
                    <Input
                      placeholder="Viết bình luận..."
                      value={commentContent[post.id] || ""}
                      onChange={(e) => setCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(post.id)}
                      disabled={!commentContent[post.id]?.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {posts.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có bài viết nào</h3>
              <p className="text-gray-500">Hãy tạo bài viết đầu tiên để chia sẻ với mọi người!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}