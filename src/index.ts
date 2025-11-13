// src/index.ts - точка входа для библиотеки
export { default as Chat } from './Chat';
export { default as ChatBtn } from './CHAT/ChatBtn';
export { ChatSocketProvider, useChatSocket } from './CHAT/context/ChatSocketContext';
export type { ChatParams } from './CHAT/types/types.ts';

// Default export
export { default } from './Chat';