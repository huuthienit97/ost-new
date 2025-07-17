import { eq, and, or, desc, asc, like, lt, sql } from "drizzle-orm";
import { db } from "./db";
import {
  chatRooms,
  chatRoomMembers,
  chatMessages,
  users,
  type ChatRoom,
  type ChatMessage,
  type InsertChatRoom,
  type InsertChatMessage,
  type InsertChatRoomMember,
  type User,
} from "@shared/schema";
import { generateId } from "./utils";

export interface ChatParticipant {
  id?: number;
  name: string;
  isGuest: boolean;
  guestId?: string;
}

export interface MessageWithSender extends ChatMessage {
  sender?: User;
  senderDisplayName: string;
  isFromCurrentUser?: boolean;
}

export interface RoomWithLastMessage extends ChatRoom {
  lastMessage?: MessageWithSender;
  unreadCount?: number;
  participants?: string[];
}

class ChatService {
  // Create or get existing support room for guest users
  async getOrCreateSupportRoom(guestId: string, guestName: string): Promise<ChatRoom> {
    // Check if guest already has a support room
    const existingMember = await db
      .select()
      .from(chatRoomMembers)
      .leftJoin(chatRooms, eq(chatRoomMembers.roomId, chatRooms.id))
      .where(
        and(
          eq(chatRoomMembers.guestId, guestId),
          eq(chatRooms.type, "support"),
          eq(chatRooms.isActive, true)
        )
      );

    if (existingMember.length > 0 && existingMember[0].chat_rooms) {
      return existingMember[0].chat_rooms;
    }

    // Create new support room
    const [room] = await db
      .insert(chatRooms)
      .values({
        name: `Hỗ trợ khách - ${guestName}`,
        description: `Phòng hỗ trợ cho khách ${guestName}`,
        type: "support",
        isPublic: false,
        isActive: true,
      })
      .returning();

    // Add guest as member
    await db.insert(chatRoomMembers).values({
      roomId: room.id,
      guestId,
      role: "member",
      isActive: true,
    });

    // Add all admin users to the support room
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.roleId, 7)); // Admin role ID

    for (const admin of adminUsers) {
      await db.insert(chatRoomMembers).values({
        roomId: room.id,
        userId: admin.id,
        role: "admin",
        isActive: true,
      });
    }

    return room;
  }

  // Create private room between two users
  async createPrivateRoom(userId1: number, userId2: number): Promise<ChatRoom> {
    // Check if private room already exists
    const existingRoom = await db
      .select()
      .from(chatRooms)
      .leftJoin(chatRoomMembers, eq(chatRooms.id, chatRoomMembers.roomId))
      .where(
        and(
          eq(chatRooms.type, "private"),
          eq(chatRooms.isActive, true)
        )
      );

    // Filter rooms that have both users
    for (const room of existingRoom) {
      const members = await db
        .select()
        .from(chatRoomMembers)
        .where(
          and(
            eq(chatRoomMembers.roomId, room.chat_rooms!.id),
            eq(chatRoomMembers.isActive, true)
          )
        );

      const userIds = members.map(m => m.userId).filter(Boolean);
      if (userIds.includes(userId1) && userIds.includes(userId2) && userIds.length === 2) {
        return room.chat_rooms!;
      }
    }

    // Create new private room
    const [room] = await db
      .insert(chatRooms)
      .values({
        type: "private",
        isPublic: false,
        isActive: true,
      })
      .returning();

    // Add both users as members
    await db.insert(chatRoomMembers).values([
      {
        roomId: room.id,
        userId: userId1,
        role: "member",
        isActive: true,
      },
      {
        roomId: room.id,
        userId: userId2,
        role: "member",
        isActive: true,
      },
    ]);

    return room;
  }

  // Get user's chat rooms
  async getUserRooms(userId: number): Promise<RoomWithLastMessage[]> {
    const rooms = await db
      .select()
      .from(chatRooms)
      .leftJoin(chatRoomMembers, eq(chatRooms.id, chatRoomMembers.roomId))
      .where(
        and(
          eq(chatRoomMembers.userId, userId),
          eq(chatRoomMembers.isActive, true),
          eq(chatRooms.isActive, true)
        )
      )
      .orderBy(desc(chatRooms.updatedAt));

    const roomsWithMessages = await Promise.all(
      rooms.map(async (room) => {
        const roomData = room.chat_rooms!;
        
        // Get last message
        const lastMessage = await this.getLastMessage(roomData.id);
        
        // Get participants names for display
        const participants = await this.getRoomParticipants(roomData.id);
        
        return {
          ...roomData,
          lastMessage,
          participants: participants.map(p => p.name),
        };
      })
    );

    return roomsWithMessages;
  }

  // Get room participants
  async getRoomParticipants(roomId: number): Promise<ChatParticipant[]> {
    const members = await db
      .select()
      .from(chatRoomMembers)
      .leftJoin(users, eq(chatRoomMembers.userId, users.id))
      .where(
        and(
          eq(chatRoomMembers.roomId, roomId),
          eq(chatRoomMembers.isActive, true)
        )
      );

    return members.map(member => ({
      id: member.users?.id,
      name: member.users?.fullName || `Khách ${member.chat_room_members.guestId}`,
      isGuest: !member.users,
      guestId: member.chat_room_members.guestId || undefined,
    }));
  }

  // Get messages for a room
  async getRoomMessages(roomId: number, limit: number = 50, offset: number = 0): Promise<MessageWithSender[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);

    return messages.map(msg => ({
      ...msg.chat_messages,
      sender: msg.users || undefined,
      senderDisplayName: msg.users?.fullName || msg.chat_messages.senderName || "Ẩn danh",
    })).reverse(); // Reverse to get chronological order
  }

  // Get last message for a room
  async getLastMessage(roomId: number): Promise<MessageWithSender | undefined> {
    const [lastMessage] = await db
      .select()
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);

    if (!lastMessage) return undefined;

    return {
      ...lastMessage.chat_messages,
      sender: lastMessage.users || undefined,
      senderDisplayName: lastMessage.users?.fullName || lastMessage.chat_messages.senderName || "Ẩn danh",
    };
  }

  // Send message
  async sendMessage(
    roomId: number,
    content: string,
    senderId?: number,
    guestId?: string,
    senderName?: string
  ): Promise<MessageWithSender> {
    const messageData: InsertChatMessage = {
      roomId,
      content,
      senderId,
      guestId,
      senderName,
      messageType: "text",
      createdAt: new Date(),
    };

    const [message] = await db.insert(chatMessages).values(messageData).returning();

    // Update room's updatedAt
    await db
      .update(chatRooms)
      .set({ updatedAt: new Date() })
      .where(eq(chatRooms.id, roomId));

    // Get sender info
    let sender: User | undefined;
    if (senderId) {
      [sender] = await db.select().from(users).where(eq(users.id, senderId));
    }

    return {
      ...message,
      sender,
      senderDisplayName: sender?.fullName || senderName || "Ẩn danh",
    };
  }

  // Check if user has access to room
  async hasRoomAccess(roomId: number, userId?: number, guestId?: string): Promise<boolean> {
    const member = await db
      .select()
      .from(chatRoomMembers)
      .where(
        and(
          eq(chatRoomMembers.roomId, roomId),
          eq(chatRoomMembers.isActive, true),
          userId ? eq(chatRoomMembers.userId, userId) : eq(chatRoomMembers.guestId, guestId!)
        )
      );

    return member.length > 0;
  }

  // Get available users for new chat (excluding current user)
  async getAvailableUsers(currentUserId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          // Exclude current user
          // Note: Using != instead of <> for PostgreSQL compatibility
        )
      )
      .orderBy(asc(users.fullName));
  }

  // Delete a chat room (soft delete by setting isActive to false)
  async deleteRoom(roomId: number, userId: number): Promise<void> {
    // Soft delete the room
    await db
      .update(chatRooms)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(chatRooms.id, roomId));

    // Also deactivate user's membership
    await db
      .update(chatRoomMembers)
      .set({ isActive: false })
      .where(
        and(
          eq(chatRoomMembers.roomId, roomId),
          eq(chatRoomMembers.userId, userId)
        )
      );
  }

  // Search user's chat rooms by name or participants
  async searchUserRooms(userId: number, query: string): Promise<RoomWithLastMessage[]> {
    const userRooms = await db
      .select()
      .from(chatRoomMembers)
      .leftJoin(chatRooms, eq(chatRoomMembers.roomId, chatRooms.id))
      .leftJoin(users, eq(chatRoomMembers.userId, users.id))
      .where(
        and(
          eq(chatRoomMembers.userId, userId),
          eq(chatRoomMembers.isActive, true),
          eq(chatRooms.isActive, true),
          or(
            like(chatRooms.name, `%${query}%`),
            like(chatRooms.description, `%${query}%`),
            like(users.fullName, `%${query}%`)
          )
        )
      )
      .orderBy(desc(chatRooms.updatedAt));

    const roomsWithMessages = await Promise.all(
      userRooms.map(async (room) => {
        const roomData = room.chat_rooms!;
        const lastMessage = await this.getLastMessage(roomData.id);
        const participants = await this.getRoomParticipants(roomData.id);
        
        return {
          ...roomData,
          lastMessage,
          participants: participants.map(p => p.name),
        };
      })
    );

    return roomsWithMessages;
  }

  // Delete old messages (hard delete) to clean up database
  async deleteOldMessages(daysOld: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await db
        .delete(chatMessages)
        .where(lt(chatMessages.createdAt, cutoffDate));

      return result.rowCount || 0;
    } catch (error) {
      console.error("Error deleting old messages:", error);
      return 0;
    }
  }
}

export const chatService = new ChatService();