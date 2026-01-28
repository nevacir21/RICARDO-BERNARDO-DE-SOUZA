
export type Priority = 'low' | 'medium' | 'high';
export type Recurrence = 'none' | 'daily';

export interface AgendaEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
  priority: Priority;
  category: 'work' | 'personal' | 'health' | 'finance' | 'other';
  reminderMinutes?: number; // Minutes before start to notify
  recurrence?: Recurrence;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AssistantConfig {
  voiceEnabled: boolean;
  name: string;
}

export interface AppNotification {
  id: string;
  eventId: string;
  title: string;
  message: string;
  timestamp: Date;
}

export interface ShoppingItem {
  id: string;
  name: string;
  value: number;
  quantity: number;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completed: boolean;
  progress: number; // 0 to 100
  category: string;
}
