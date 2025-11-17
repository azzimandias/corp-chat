// src/index.ts - точка входа для библиотеки
export { default as Chat } from './Chat';
export { default as ChatBtn } from './CHAT/ChatBtn';
export { useChatSocket } from './CHAT/context/ChatSocketContext';
export { ChatSocketProvider } from './CHAT/provider/ChatSocketProvider';
export type { ChatParams } from './CHAT/types/types.ts';

// Default export
export { default } from './Chat';