export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  is_admin: boolean;
  is_banned: boolean;
  chat_nickname?: string;
}
export interface Message {
  id: string;
  text: string;
  user: TelegramUser;
  timestamp: Date;
  type: 'text' | 'system';
  chatId?: string;
  edited?: boolean;
  editedAt?: Date;
  isPinned: boolean;
  replyTo: string | null;
  // attachments removed
}

interface FileDocument {
  _id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string; // ID пользователя
  uploadedAt: Date;
  chatId: string;
}

export interface CreateMessageDto {
  text: string;
  user: TelegramUser;
  type: 'text' | 'system';
  chatId: string;
  replyToMessageId?: string | null;
  isPinned?: boolean;
}

export interface WebAppInitData {
  user?: TelegramUser;
  chat_instance?: string;
  chat_type?: string;
  auth_date: number;
  hash: string;
}