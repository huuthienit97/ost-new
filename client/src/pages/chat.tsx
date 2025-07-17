import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Plus, Send, Users, Search, Trash2, Smile, Settings } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ChatRoom {
  id: number;
  name?: string;
  type: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderDisplayName: string;
  };
  participants?: string[];
}

interface ChatMessage {
  id: number;
  content: string;
  createdAt: string;
  senderDisplayName: string;
  isFromCurrentUser: boolean;
  messageType: string;
}

interface User {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

// Emoji list for stickers
const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😊", "😍", "🥰", "😘", "😗", "😙", "😚", "🙂", "🤗", "🤔", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯", "😪", "😫", "🥱", "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑", "😲", "☹️", "🙁", "😖", "😞", "😟", "😤", "😢", "😭", "😦", "😧", "😨", "😩", "🤯", "😬", "😰", "😱", "🥵", "🥶", "😳", "🤪", "😵", "🥴", "😠", "😡", "🤬", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "😇", "🥳", "🥺", "🤠", "🤡", "🤥", "🤫", "🤭", "🧐", "🤓", "😈", "👿", "👹", "👺", "💀", "👻", "👽", "🤖", "💩", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"
];

export default function ChatPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  // Get chat rooms  
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: isSearching ? ["/api/chat/rooms/search", searchQuery] : ["/api/chat/rooms"],
    queryFn: async () => {
      if (isSearching && searchQuery.trim()) {
        return apiRequest(`/api/chat/rooms/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
      return apiRequest("/api/chat/rooms");
    },
    enabled: !isSearching || (isSearching && searchQuery.trim().length > 0),
  });

  // Auto-select first room when rooms are loaded
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  // Get available users for new chat
  const { data: availableUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/chat/users"],
  });

  // Get messages for selected room - using different approach
  const messagesQuery = useQuery<ChatMessage[]>({
    queryKey: selectedRoomId ? [`messages-${selectedRoomId}`] : ["no-room"],
    queryFn: async () => {
      if (!selectedRoomId) return [];
      return await apiRequest(`/api/chat/rooms/${selectedRoomId}/messages`);
    },
    enabled: !!selectedRoomId,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const messages = messagesQuery.data || [];
  const messagesLoading = messagesQuery.isLoading;
  const messagesError = messagesQuery.error;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Create private room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      return await apiRequest(`/api/chat/rooms/private`, {
        method: "POST",
        body: JSON.stringify({ targetUserId }),
      });
    },
    onSuccess: (room) => {
      setSelectedRoomId(room.id);
      setNewChatDialogOpen(false);
      setSelectedUserId("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      toast({
        title: "Thành công",
        description: "Đã tạo phòng chat mới",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo phòng chat",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ roomId, content }: { roomId: number; content: string }) => {
      return await apiRequest(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: (newMessage) => {
      setNewMessage("");
      // Refresh messages and rooms
      queryClient.invalidateQueries({ queryKey: [`messages-${selectedRoomId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      queryClient.refetchQueries({ queryKey: [`messages-${selectedRoomId}`] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể gửi tin nhắn",
        variant: "destructive",
      });
    },
  });

  // Delete chat room mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (roomId: number) => {
      return await apiRequest(`/api/chat/rooms/${roomId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      setSelectedRoomId(null);
      toast({ title: "Thành công", description: "Đã xóa cuộc trò chuyện" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa cuộc trò chuyện",
        variant: "destructive",
      });
    },
  });

  // Cleanup old messages mutation (admin only)
  const cleanupMessagesMutation = useMutation({
    mutationFn: async (days: number) => {
      return await apiRequest(`/api/chat/messages/cleanup?days=${days}`, {
        method: "DELETE",
      });
    },
    onSuccess: (data) => {
      toast({ 
        title: "Thành công", 
        description: `${data.message}` 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể dọn dẹp tin nhắn cũ",
        variant: "destructive",
      });
    },
  });

  // WebSocket connection for real-time messaging
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
    
    // Establishing WebSocket connection
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // WebSocket connected
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          // Refresh messages for the current room
          queryClient.invalidateQueries({ queryKey: [`messages-${selectedRoomId}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
          queryClient.refetchQueries({ queryKey: [`messages-${selectedRoomId}`] });
        }
      } catch (error) {
        // WebSocket message parsing error
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient, selectedRoomId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRoomId) return;

    sendMessageMutation.mutate({
      roomId: selectedRoomId,
      content: newMessage.trim(),
    });
  };

  const handleCreateChat = () => {
    if (!selectedUserId) return;
    createRoomMutation.mutate(parseInt(selectedUserId));
  };

  const handleDeleteChat = (roomId: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này?")) {
      deleteChatMutation.mutate(roomId);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setEmojiOpen(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.trim().length > 0);
  };

  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.name) return room.name;
    if (room.type === "support") return "Hỗ trợ khách";
    if (room.participants && room.participants.length > 0) {
      return room.participants.join(", ");
    }
    return "Chat riêng tư";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Chat</h1>
          </div>
          <Dialog open={newChatDialogOpen} onOpenChange={setNewChatDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Chat mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo chat mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Chọn người chat</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thành viên..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getInitials(user.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.fullName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewChatDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleCreateChat} disabled={!selectedUserId || createRoomMutation.isPending}>
                    {createRoomMutation.isPending ? "Đang tạo..." : "Tạo chat"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
          {/* Chat rooms list */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                Danh sách chat
              </CardTitle>
              {/* Search and admin controls */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Dọn dẹp
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Dọn dẹp tin nhắn cũ</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Xóa tin nhắn cũ hơn số ngày được chỉ định để giảm tải database.
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => cleanupMessagesMutation.mutate(30)}
                            disabled={cleanupMessagesMutation.isPending}
                            variant="outline"
                          >
                            30 ngày
                          </Button>
                          <Button 
                            onClick={() => cleanupMessagesMutation.mutate(60)}
                            disabled={cleanupMessagesMutation.isPending}
                            variant="outline"
                          >
                            60 ngày
                          </Button>
                          <Button 
                            onClick={() => cleanupMessagesMutation.mutate(90)}
                            disabled={cleanupMessagesMutation.isPending}
                            variant="outline"
                          >
                            90 ngày
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {roomsLoading ? (
                  <div className="p-4 text-center text-gray-500">Đang tải...</div>
                ) : rooms.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Chưa có phòng chat nào
                  </div>
                ) : (
                  <div className="space-y-1">
                    {rooms.map((room: ChatRoom) => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`w-full p-3 text-left hover:bg-gray-50 border-l-4 transition-colors ${
                          selectedRoomId === room.id 
                            ? "border-l-blue-500 bg-blue-50" 
                            : "border-l-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="text-xs">
                              {room.type === "support" ? "HT" : getInitials(getRoomDisplayName(room))}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {getRoomDisplayName(room)}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {room.lastMessage?.content || "Chưa có tin nhắn"}
                            </p>
                            {room.lastMessage && (
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(room.lastMessage.createdAt)}
                              </p>
                            )}
                          </div>
                          {room.type === "support" && (
                            <Badge variant="secondary" className="text-xs">Hỗ trợ</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat messages */}
          <Card className="lg:col-span-3">
            {selectedRoomId ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {rooms.find((r: ChatRoom) => r.id === selectedRoomId)?.name || "Chat"}
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteChat(selectedRoomId)}
                      disabled={deleteChatMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="p-0 flex flex-col h-[500px]">
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="text-center text-gray-500">Đang tải tin nhắn...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500">
                        Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.isFromCurrentUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                message.isFromCurrentUser
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              {!message.isFromCurrentUser && (
                                <p className="text-xs font-medium mb-1 opacity-75">
                                  {message.senderDisplayName}
                                </p>
                              )}
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  message.isFromCurrentUser ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                {formatDate(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                  <Separator />
                  <div className="p-4">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Nhập tin nhắn..."
                          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                          disabled={sendMessageMutation.isPending}
                          className="pr-10"
                        />
                        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            >
                              <Smile className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-2">
                            <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
                              {EMOJI_LIST.map((emoji, index) => (
                                <Button
                                  key={index}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-lg hover:bg-gray-100"
                                  onClick={() => handleEmojiSelect(emoji)}
                                >
                                  {emoji}
                                </Button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        size="icon"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chọn một phòng chat để bắt đầu trò chuyện</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}