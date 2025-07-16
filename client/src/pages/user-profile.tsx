import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Camera, 
  Edit3, 
  MapPin, 
  Calendar,
  ExternalLink,
  Facebook,
  Instagram,
  Github,
  Linkedin,
  Youtube,
  User,
  Mail,
  Phone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  createdAt: string;
  postsCount?: number;
  friendsCount?: number;
  isOwnProfile?: boolean;
  isFriend?: boolean;
}

interface UserPost {
  id: number;
  content: string;
  imageUrls: string[];
  likes: number;
  comments: number;
  createdAt: string;
  author: {
    id: number;
    fullName: string;
    avatarUrl?: string;
  };
  isLiked?: boolean;
}

export default function UserProfile() {
  const { userId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newPost, setNewPost] = useState("");
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users/profile", userId],
  });

  // Fetch user posts
  const { data: posts = [], isLoading: postsLoading } = useQuery<UserPost[]>({
    queryKey: ["/api/users", userId, "posts"],
  });

  // Create new post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; images?: FileList }) => {
      const formData = new FormData();
      formData.append("content", data.content);
      
      if (data.images) {
        Array.from(data.images).forEach((file) => {
          formData.append("images", file);
        });
      }

      return apiRequest("/api/posts", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      setNewPost("");
      setSelectedImages(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "posts"] });
      toast({ title: "Đã đăng bài viết thành công!" });
    },
    onError: () => {
      toast({ 
        title: "Lỗi", 
        description: "Không thể đăng bài viết. Vui lòng thử lại.",
        variant: "destructive" 
      });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest(`/api/posts/${postId}/like`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "posts"] });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCreatePost = () => {
    if (!newPost.trim()) return;
    
    createPostMutation.mutate({
      content: newPost,
      images: selectedImages || undefined,
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedImages(e.target.files);
  };

  if (profileLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-40 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card className="text-center py-12">
          <CardContent>
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Không tìm thấy người dùng</h2>
            <p className="text-gray-500">Người dùng này có thể đã bị xóa hoặc không tồn tại.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.fullName)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{profile.fullName}</h1>
                <p className="text-gray-500">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-gray-700 mt-2">{profile.bio}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Tham gia {formatDate(profile.createdAt)}
                </div>
              </div>

              <div className="flex gap-4 text-sm">
                <Badge variant="secondary">
                  {profile.postsCount || 0} bài viết
                </Badge>
                <Badge variant="secondary">
                  {profile.friendsCount || 0} bạn bè
                </Badge>
              </div>

              {/* Social Media Links */}
              {(profile.facebookUrl || profile.instagramUrl || profile.githubUrl || 
                profile.linkedinUrl || profile.youtubeUrl) && (
                <div className="flex gap-2">
                  {profile.facebookUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer">
                        <Facebook className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.instagramUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer">
                        <Instagram className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.githubUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.linkedinUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.youtubeUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={profile.youtubeUrl} target="_blank" rel="noopener noreferrer">
                        <Youtube className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {profile.isOwnProfile ? (
                  <Button>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Chỉnh sửa hồ sơ
                  </Button>
                ) : (
                  <>
                    <Button variant={profile.isFriend ? "secondary" : "default"}>
                      {profile.isFriend ? "Bạn bè" : "Kết bạn"}
                    </Button>
                    <Button variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Nhắn tin
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Bài viết</TabsTrigger>
          <TabsTrigger value="about">Giới thiệu</TabsTrigger>
          <TabsTrigger value="friends">Bạn bè</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {/* Create Post (only for own profile) */}
          {profile.isOwnProfile && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Bạn đang nghĩ gì?"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[100px]"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <Camera className="h-4 w-4 mr-2" />
                          Thêm ảnh
                        </label>
                      </Button>
                      
                      {selectedImages && selectedImages.length > 0 && (
                        <span className="text-sm text-gray-500">
                          {selectedImages.length} ảnh đã chọn
                        </span>
                      )}
                    </div>
                    
                    <Button 
                      onClick={handleCreatePost}
                      disabled={!newPost.trim() || createPostMutation.isPending}
                    >
                      {createPostMutation.isPending ? "Đang đăng..." : "Đăng bài"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts List */}
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                        </div>
                      </div>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-gray-400 mb-4">
                  <Edit3 className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Chưa có bài viết nào</h3>
                <p className="text-gray-500">
                  {profile.isOwnProfile 
                    ? "Hãy chia sẻ bài viết đầu tiên của bạn!" 
                    : "Người dùng này chưa có bài viết nào."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Post Header */}
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.author.avatarUrl} />
                          <AvatarFallback>
                            {getInitials(post.author.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{post.author.fullName}</h4>
                          <p className="text-sm text-gray-500">
                            {formatDate(post.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="space-y-3">
                        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                        
                        {/* Post Images */}
                        {post.imageUrls && post.imageUrls.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {post.imageUrls.map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`Post image ${index + 1}`}
                                className="rounded-lg object-cover w-full h-48"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Post Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => likePostMutation.mutate(post.id)}
                            className={post.isLiked ? "text-red-500" : ""}
                          >
                            <Heart className={`h-4 w-4 mr-2 ${post.isLiked ? "fill-current" : ""}`} />
                            {post.likes}
                          </Button>
                          
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            {post.comments}
                          </Button>
                        </div>
                        
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Giới thiệu</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Thông tin cơ bản</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Tên đầy đủ:</strong> {profile.fullName}</p>
                  <p><strong>Email:</strong> {profile.email}</p>
                  {profile.phone && <p><strong>Số điện thoại:</strong> {profile.phone}</p>}
                  <p><strong>Tham gia vào:</strong> {formatDate(profile.createdAt)}</p>
                </div>
              </div>
              
              {profile.bio && (
                <div>
                  <h4 className="font-medium mb-2">Tiểu sử</h4>
                  <p className="text-sm text-gray-700">{profile.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Bạn bè ({profile.friendsCount || 0})</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                Tính năng danh sách bạn bè đang được phát triển...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}