import {createContext, useContext} from 'react';
import {AxiosInstance} from "axios";
import type {AlertInfo, Chat, ChatToList, toSendSms, UserData} from "../types/types.ts";

interface ChatSocketContextType {
    connected: boolean;
    connectionStatus: string;
    isAlertVisibleKey: number;
    alertInfo: AlertInfo;
    totalUnread: number;
    chatsList: ChatToList[];
    chats: Chat[];
    currentChatId: number;
    loadingChatList: boolean;
    loadingChat: boolean;
    loadingSendSms: boolean;

    fetchChatsList: (search: string | null) => void;
    fetchChatMessages: (chatId: number, lastMsg: number | null) => void;
    sendSms: ({ to, text, files, answer, timestamp, from_id }: toSendSms) => void;
    markMessagesAsRead: (messageIds: (number | undefined)[]) => void;

    setSubscribeToChat: (search: string | null) => void;
    setNewSms: (search: string | null) => void;
    setUpdateSms: (search: string | null) => void;

    userdata: UserData | null;
    setUserData: (data: UserData) => void;

    HTTP_HOST: string | null;
    SET_HTTP_HOST: (host: string) => void;
    CSRF_TOKEN: string | null;
    SET_CSRF_TOKEN: (token: string) => void;
    PRODMODE: boolean | null;
    SET_PRODMODE: (mode: boolean) => void;
    SET_BFF_PORT: (port: number) => void;
    PROD_AXIOS_INSTANCE: AxiosInstance | null;

    setFetchChatsListPath: (path: string | null) => void;
    setFetchChatMessagesPath: (path: string | null) => void;
    setSendSmsPath: (path: string | null) => void;
    setMarkMessagesAsReadPath: (path: string | null) => void;

    init: boolean;
    setInit: (bool: boolean) => void;
}

export const ChatSocketContext = createContext<ChatSocketContextType | undefined>(undefined);

export const useChatSocket = () => {
    const context = useContext(ChatSocketContext);
    if (!context) throw new Error('useChatSocket must be used within ChatSocketProvider');
    return context;
};
