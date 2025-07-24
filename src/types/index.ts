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
}

export interface WebAppInitData {
  user?: TelegramUser;
  chat_instance?: string;
  chat_type?: string;
  auth_date: number;
  hash: string;
}