import * as React from 'react';
import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {io, Socket} from 'socket.io-client';
import {CHAT_LIST_MOCK, CHAT_MOCK, CHAT_MOCK_NEW} from '../mock/mockSms.js';
import dayjs from "dayjs";
import type {AxiosInstance} from "axios";
import type {AlertInfo, Chat, ChatMessage, ChatToList, File, UserData} from "../types/types.ts";
import type {UploadFile} from "antd";

interface ChatSocketContextType {
    connected: boolean;
    connectionStatus: string;
    refreshKey: number;
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

    userdata: UserData | null;
    setUserData: (data: UserData) => void;

    HTTP_HOST: string | null;
    SET_HTTP_HOST: (host: string) => void;
    CSRF_TOKEN: string | null;
    SET_CSRF_TOKEN: (token: string) => void;
    PRODMODE: boolean | null;
    SET_PRODMODE: (mode: boolean) => void;
    PROD_AXIOS_INSTANCE: AxiosInstance | null;
    SET_PROD_AXIOS_INSTANCE: (instance: AxiosInstance) => void;

    setFetchChatsListPath: (path: string | null) => void;
    setFetchChatMessagesPath: (path: string | null) => void;
    setSendSmsPath: (path: string | null) => void;
    setMarkMessagesAsReadPath: (path: string | null) => void;
}

interface toSendSms {
    to: number,
    text: string,
    files?: UploadFile[],
    answer: number | null,
    timestamp: number,
    from_id: number,
}

export const ChatSocketContext = createContext<ChatSocketContextType | undefined>(undefined);

export const ChatSocketProvider = ({ children, url }: { children: React.ReactNode, url: string, }) => {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState<boolean>(false);
    const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

    const [userdata, setUserData ] = useState<UserData | null>(null);
    const userdataRef = useRef<UserData | null>(userdata);

    const [HTTP_HOST, SET_HTTP_HOST] = useState<string>('');
    const [CSRF_TOKEN, SET_CSRF_TOKEN] = useState<string>('');
    const [PRODMODE, SET_PRODMODE] = useState<boolean>(false);
    const [PROD_AXIOS_INSTANCE, SET_PROD_AXIOS_INSTANCE] = useState<AxiosInstance | null>(null);

    const [fetchChatsListPath, setFetchChatsListPath] = useState<string | null>(null);
    const [fetchChatMessagesPath, setFetchChatMessagesPath] = useState<string | null>(null);
    const [sendSmsPath, setSendSmsPath] = useState<string | null>(null);
    const [markMessagesAsReadPath, setMarkMessagesAsReadPath] = useState<string | null>(null);

    const [chatsList, setChatsList] = useState<ChatToList[]>([]); // боковой список чатов (последнее сообщение)
    const chatsListRef = useRef(chatsList);
    const [chats, setChats] = useState<Chat[]>([]); // все чаты
    const chatsRef = useRef(chats);
    const [currentChatId, setCurrentChatId] = useState<number>(0); // открытый чат

    const [totalUnread, setTotalUnread] = useState<number>(0); // количество всех непрочитанных сообщений

    const [loadingChatList, setLoadingChatList] = useState<boolean>(false); // ожидаем ответа со списком чатов
    const [loadingChat, setLoadingChat] = useState<boolean>(false); // ожидаем ответа с чатом
    const [loadingSendSms, setLoadingSendSms] = useState<boolean>(false); // ожидаем ответа при отправке сообщения

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [isAlertVisibleKey, setIsAlertVisibleKey] = useState<number>(0);
    const [alertInfo, setAlertInfo] = useState<AlertInfo>({
        message: '',
        description: '',
        type: 'info',
    });

    const connect = useCallback(() => {
        if (!PRODMODE) return;
        if (socketRef.current?.connected) {
            return;
        }
        const socket = io(url, { transports: ['websocket', 'polling'], withCredentials: true });
        socketRef.current = socket;
        // --- подключение к ws и подписка ---
        socket.on('connect', () => {
            console.log('CHAT WEBSOCKET CONNECTED')
            setConnected(true);
            setConnectionStatus('connected');
            const userId = userdataRef.current?.user?.id;
            if (!userId) {
                console.error('User ID is undefined');
                return;
            }
            socket.emit('subscribeToChat', userId);
        });
        // --- получаем новое сообщение ---
        socket.on('new:sms', (data) => {
            console.log('WS new:sms', data);

            if (data.left) addMessageToChatList(data.left, false);
            if (data.left) setTotalUnread(data.left?.total_unread);
            if (data.right) addMessageToChat(data.right);
        });
        socket.on('update:sms', (data) => {
            console.log('WS update:sms', data);
            if (data.sms) updateMessageStatus(data.sms, data.sms.to, true);
        });
        socket.on('new:notification', (data) => {
            console.log('WS new:notification', data);
            setRefreshKey(dayjs().unix());
            setIsAlertVisibleKey(dayjs().unix());
            setAlertInfo({
                message: 'Новое уведомление.',
                description: data.message,
                type: 'info',
            });
        });
        socket.on('read:notification', () => {
            setRefreshKey(dayjs().unix());
        });
        socket.on('disconnect', () => {
            console.log('CHAT WEBSOCKET DISCONNECTED');
            setConnected(false);
            setConnectionStatus('disconnected');
        });
        socket.on('connect_error', () => {
            console.log('CHAT WEBSOCKET CONNECT ERROR');
        });
    }, [url]);

    useEffect(() => {
        if (userdata) {
            connect();
            return () => {
                socketRef.current?.disconnect();
            };
        }
    }, [userdata, connect]);
    useEffect(() => {
        console.log('BEFORE UPDATE CHATS chatsRef', chats);
        chatsRef.current = chats;
    }, [chats]);
    useEffect(() => {
        chatsListRef.current = chatsList;
    }, [chatsList]);

    const fetchChatsList = useCallback(async (search: string | null = null) => {
        setLoadingChatList(true);
        if (PRODMODE) {
            try {
                if (!PROD_AXIOS_INSTANCE || !fetchChatsListPath) return;
                const response = await PROD_AXIOS_INSTANCE.post(fetchChatsListPath, { /* `/api/sms` */
                    data: {search},
                    _token: CSRF_TOKEN,
                });
                if (response?.data?.content) {
                    setChatsList(response?.data?.content?.sms);
                    setTotalUnread(response?.data?.content?.total_unread);
                }
            } catch (e) {
                console.log(e);
            } finally {
                setLoadingChatList(false);
            }
        } else {
            setChatsList(CHAT_LIST_MOCK?.content?.sms);
            setTotalUnread(CHAT_LIST_MOCK?.content?.total_unread);
            setLoadingChatList(false);
        }
    }, [loadingChatList]);
    const fetchChatMessages = useCallback(async (chatId: number, lastMsg: number | null = null) => {
        if (loadingChat) return;
        setLoadingChat(true);
        if (PRODMODE) {
            try {
                if (!PROD_AXIOS_INSTANCE || !fetchChatMessagesPath) return;
                const response = await PROD_AXIOS_INSTANCE.post(fetchChatMessagesPath, { /* `/api/sms/${chatId}` */
                    data: {
                        last_id: lastMsg,
                    },
                    _token: CSRF_TOKEN,
                });
                if (response?.data?.content) {
                    setCurrentChatId(chatId);
                    setChatsPrepare({
                        chat_id: chatId,
                        who: response?.data?.content?.who,
                        messages: response?.data?.content?.messages,
                        total: response?.data?.content?.total,
                    });
                }
            } catch (e) {
                console.log(e);
            } finally {
                setLoadingChat(false);
            }
        } else {
            if (!lastMsg) {
                setCurrentChatId(chatId);
                setChatsPrepare({
                    chat_id: chatId,
                    who: CHAT_MOCK?.content?.who,
                    messages: CHAT_MOCK?.content?.messages,
                    total: CHAT_MOCK?.content?.total - CHAT_MOCK?.content?.messages?.length,
                });
            } else {
                setCurrentChatId(chatId);
                setChatsPrepare({
                    chat_id: chatId,
                    who: CHAT_MOCK_NEW?.content?.who,
                    messages: CHAT_MOCK_NEW?.content?.messages,
                    total: CHAT_MOCK_NEW?.content?.total - CHAT_MOCK_NEW?.content?.messages?.length,
                });
            }
            setLoadingChat(false);
        }
    }, [loadingChat]);
    const sendSms = useCallback(async ({ to, text, files, answer, timestamp, from_id }: toSendSms) => {
        insertMessagesToArrays({to, text, answer, timestamp, from_id});
        setLoadingSendSms(true);
        try {
            if (!PROD_AXIOS_INSTANCE || !sendSmsPath) return;
            const formData = new FormData();
            formData.append('_token', CSRF_TOKEN);
            formData.append(
                'data',
                JSON.stringify({
                    to,
                    text,
                    answer,
                    timestamp,
                })
            );
            if (files && files.length > 0) {
                files.forEach((uploadFile: UploadFile) => {
                    if (uploadFile.originFileObj) {
                        formData.append('file[]', uploadFile.originFileObj);
                    }
                });
            }
            console.log(to);
            const response = await PROD_AXIOS_INSTANCE.post(sendSmsPath, formData); /* '/api/sms/create/sms' */

            console.log('[useSendSms] Ответ от сервера:', response);

            if (response.data) {
                updateMessageId(response.data.id, response.data.timestamp, response.data.files, to);
                addMessageToChatList(response.data.left, true);
            }
        } catch (e) {
            console.error('[useSendSms] Ошибка:', e);
        } finally {
            setLoadingSendSms(false);
        }
    }, [loadingSendSms]);
    const markMessagesAsRead = useCallback(async (messageIds: (number | undefined)[]) => {
        for (const id of messageIds) {
            if (PRODMODE) {
                try {
                    if (!PROD_AXIOS_INSTANCE || !markMessagesAsReadPath) return;
                    const endpoint = `${markMessagesAsReadPath}/${id}`; /* '/api/sms/read' */
                    const response = await PROD_AXIOS_INSTANCE.post(endpoint, {
                        _token: CSRF_TOKEN,
                    });
                    if (response?.data) {
                        updateMessageStatus(response?.data?.sms, response?.data?.from, false);
                        updateChatListCountUnread(response?.data?.sms?.from, response?.data?.sms?.count_unread);
                        setTotalUnread(response?.data?.sms?.total_unread);
                    }
                } catch (e) {
                    console.log(e);
                }
            } else {
                console.log(`/api/sms/read/${id}`)
            }
        }
    }, []);

    const insertMessagesToArrays = ({to, text, answer, timestamp, from_id}: toSendSms) => {
        addMessageToChat({
            from_id: from_id,
            id: timestamp,
            text: text,
            files: [],
            created_at: timestamp,
            updated_at: timestamp,
            answer: answer,
            status: false,
            isLocal: true,
            isSending: true,
        }, to);
    };
    const setChatsPrepare = (newChat: Chat) => {
        const chat = chatsRef.current.find(chat => +chat.chat_id === +newChat.chat_id);
        if (!chat) {
            console.log('BEFORE UPDATE CHATS fetchChatMessages', chatsRef.current);
            setChats(prevChats => [...prevChats, newChat]);
        } else {
            const chatUpd = {
                ...chat,
                messages: [...newChat.messages, ...chat.messages],
            };
            setChats(prevChats => {
                return prevChats.map((chat) => {
                    if (chat.chat_id === chatUpd.chat_id) {
                        return chatUpd;
                    }
                    return chat;
                });
            });
        }
    };
    const addMessageToChatList = (msg: ChatToList, isSelfMsg: boolean = true) => {
        setChatsList(prevChatsList => {
            let chatIndex = -1;
            if (isSelfMsg) {
                chatIndex = prevChatsList.findIndex(chat => chat.chat_id === msg.chat_id);
            } else {
                chatIndex = prevChatsList.findIndex(chat => chat.chat_id === msg.from.id);
            }
            if (chatIndex === -1) {
                return [
                    prevChatsList[0],
                    msg,
                    ...prevChatsList.slice(1)
                ];
            } else {
                return prevChatsList.map((message, index) => {
                    if (index === chatIndex) {
                        return {
                            ...msg,
                            count_unread: isSelfMsg ? message.count_unread : msg.count_unread
                        };
                    }
                    return message;
                });
            }
        });
    };
    const addMessageToChat = (msg: ChatMessage, to: number | null = null) => {
        setChats(prevChats => {
            const chatIdToUpdate = to || msg.from_id;
            const chatIndex = prevChats.findIndex(chat => chat.chat_id === chatIdToUpdate);
            if (chatIndex === -1) {
                console.log('Chat not found, might need to fetch chats list');
                return prevChats;
            }
            return prevChats.map((chat, index) => {
                if (index === chatIndex) {
                    return {
                        ...chat,
                        messages: [...chat.messages, msg]
                    };
                }
                return chat;
            });
        });
    };
    const updateMessageId = (id: number, timestamp: number, files: File[], to: number) => {
        setChats(prevChats => {
            const chatIndex = prevChats.findIndex(chat => chat.chat_id === to);

            if (chatIndex === -1) {
                console.log('Chat not found, might need to fetch chats list');
                return prevChats;
            }

            return prevChats.map((chat, index) => {
                if (index === chatIndex) {
                    const updatedMessages = chat.messages.map(message => {
                        if (message.created_at === timestamp) {
                            return {
                                ...message,
                                id: id,
                                isSending: false,
                                files: files,
                            };
                        }
                        return message;
                    });
                    return {
                        ...chat,
                        messages: updatedMessages
                    };
                }
                return chat;
            });
        });
    };
    const updateMessageStatus = (msg: ChatMessage, to: number, isSelfMsg: boolean = true) => {
        setChats(prevChats => {
            let chatIndex = -1;
            if (isSelfMsg) {
                chatIndex = prevChats.findIndex(chat => chat.chat_id === to);
            } else {
                chatIndex = prevChats.findIndex(chat => chat.chat_id === msg.from);
            }

            if (chatIndex === -1) {
                console.log('Chat not found, might need to fetch chats list');
                return prevChats;
            }

            return prevChats.map((chat, index) => {
                if (index === chatIndex) {
                    const updatedMessages = chat.messages.map(message => {
                        if (message.created_at === msg.created_at) {
                            return {
                                ...message,
                                status: msg.status
                            };
                        }
                        return message;
                    });
                    return {
                        ...chat,
                        messages: updatedMessages
                    };
                }
                return chat;
            });
        });
    };
    const updateChatListCountUnread = (from: number, updCountUnread: number) => {
        setChatsList(prevChatsList => {
            let chatIndex = -1;
            chatIndex = prevChatsList.findIndex(chat => chat.chat_id === from);
            return prevChatsList.map((message, index) => {
                if (index === chatIndex) {
                    return {
                        ...message,
                        count_unread: updCountUnread
                    };
                }
                return message;
            });
        });
    };

    return (
        <ChatSocketContext.Provider
            value={{
                /* socket */
                connected,
                connectionStatus,
                refreshKey,
                isAlertVisibleKey,
                alertInfo,
                /* chats info */
                totalUnread,
                chatsList,
                chats,
                currentChatId,
                loadingChatList,
                loadingChat,
                loadingSendSms,
                /* methods */
                fetchChatsList,
                fetchChatMessages,
                sendSms,
                markMessagesAsRead,

                userdata,

                HTTP_HOST,
                CSRF_TOKEN,
                PRODMODE,
                PROD_AXIOS_INSTANCE,

                setUserData,

                SET_HTTP_HOST,
                SET_CSRF_TOKEN,
                SET_PRODMODE,
                SET_PROD_AXIOS_INSTANCE,

                setFetchChatsListPath,
                setFetchChatMessagesPath,
                setSendSmsPath,
                setMarkMessagesAsReadPath,
            }}
        >
            {children}
        </ChatSocketContext.Provider>
    );
};

export const useChatSocket = () => {
    const context = useContext(ChatSocketContext);
    if (!context) throw new Error('useChatSocket must be used within ChatSocketProvider');
    return context;
};
