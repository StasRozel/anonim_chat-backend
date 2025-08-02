export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
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