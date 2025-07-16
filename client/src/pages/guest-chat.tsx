import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, HelpCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ChatMessage {
  id: number;
  content: string;
  createdAt: string;
  senderDisplayName: string;
  isFromCurrentUser: boolean;
  messageType: string;
}

export default function GuestChatPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestId, setGuestId] = useState<string>("");
  const [roomId, setRoomId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSetup, setIsSetup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate guest ID on component mount
  useEffect(() => {
    const savedGuestId = localStorage.getItem("guestChatId");
    if (savedGuestId) {
      setGuestId(savedGuestId);
    } else {
      const newGuestId = "guest_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("guestChatId", newGuestId);
      setGuestId(newGuestId);
    }

    const savedGuestName = localStorage.getItem("guestChatName");
    if (savedGuestName) {
      setGuestName(savedGuestName);
      setIsSetup(true);
    }

    const savedRoomId = localStorage.getItem("guestChatRoomId");
    if (savedRoomId) {
      setRoomId(parseInt(savedRoomId));
    }
  }, []);

  // Get messages for the support room
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/rooms", roomId, "messages", { guestId }],
    enabled: !!roomId && !!guestId,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Create support room mutation
  const createSupportRoomMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/chat/rooms/support`, {
        method: "POST",
        body: { guestId, guestName },
      });
    },
    onSuccess: (room) => {
      setRoomId(room.id);
      localStorage.setItem("guestChatRoomId", room.id.toString());
      localStorage.setItem("guestChatName", guestName);
      setIsSetup(true);
      toast({
        title: "Kết nối thành công",
        description: "Đã kết nối với ban chủ nhiệm. Hãy đặt câu hỏi của bạn!",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể kết nối với ban chủ nhiệm",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        body: { content, guestId, guestName },
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ 
        queryKey: ["/api/chat/rooms", roomId, "messages"] 
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể gửi tin nhắn",
        variant: "destructive",
      });
    },
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartChat = () => {
    if (!guestName.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên của bạn",
        variant: "destructive",
      });
      return;
    }
    createSupportRoomMutation.mutate();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !roomId) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const resetChat = () => {
    localStorage.removeItem("guestChatId");
    localStorage.removeItem("guestChatName");
    localStorage.removeItem("guestChatRoomId");
    setIsSetup(false);
    setRoomId(null);
    setGuestName("");
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating chat button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg bg-blue-600 hover:bg-blue-700"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* Chat dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md h-[500px] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              Hỗ trợ khách hàng
            </DialogTitle>
          </DialogHeader>

          {!isSetup ? (
            // Setup screen
            <div className="flex-1 p-4 flex flex-col justify-center">
              <div className="text-center mb-6">
                <HelpCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chào mừng bạn!</h3>
                <p className="text-sm text-gray-600">
                  Để được hỗ trợ tốt nhất, vui lòng cho chúng tôi biết tên của bạn.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tên của bạn</label>
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nhập tên của bạn..."
                    onKeyPress={(e) => e.key === "Enter" && handleStartChat()}
                  />
                </div>
                <Button 
                  onClick={handleStartChat} 
                  className="w-full"
                  disabled={!guestName.trim() || createSupportRoomMutation.isPending}
                >
                  {createSupportRoomMutation.isPending ? "Đang kết nối..." : "Bắt đầu chat"}
                </Button>
              </div>
            </div>
          ) : (
            // Chat screen
            <>
              <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="text-center text-gray-500">Đang tải tin nhắn...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Chưa có tin nhắn nào.</p>
                      <p className="text-sm">Hãy gửi câu hỏi đầu tiên!</p>
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
                            className={`max-w-[80%] rounded-lg p-3 ${
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

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 text-center">
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={resetChat}
                      className="text-xs text-gray-500"
                    >
                      Bắt đầu cuộc trò chuyện mới
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}