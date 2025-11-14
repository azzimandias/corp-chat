import * as React from 'react';
import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {io, Socket} from 'socket.io-client';
import {CHAT_LIST_MOCK, CHAT_MOCK, CHAT_MOCK_NEW} from '../mock/mockSms.js';
import dayjs from "dayjs";
import axios, {AxiosInstance} from "axios";
import type {AlertInfo, Chat, ChatMessage, ChatToList, File, UserData} from "../types/types.ts";
import type {UploadFile} from "antd";

interface ChatSocketContextType {
    connected: boolean;
    connectionStatus: string;
    //refreshKey: number;
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

interface toSendSms {
    to: number,
    text: string,
    files?: UploadFile[],
    answer: number | null,
    timestamp: number,
    from_id: number,
}

export const ChatSocketContext = createContext<ChatSocketContextType | undefined>(undefined);

export const ChatSocketProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState<boolean>(false);
    const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

    const [userdata, setUserData ] = useState<UserData | null>(null);
    const userdataRef = useRef<UserData | null>(userdata);

    const [HTTP_HOST, SET_HTTP_HOST] = useState<string>('');
    const [CSRF_TOKEN, SET_CSRF_TOKEN] = useState<string>('');
    const [PRODMODE, SET_PRODMODE] = useState<boolean>(false);
    const [BFF_PORT, SET_BFF_PORT] = useState<number>(0);
    const [PROD_AXIOS_INSTANCE, SET_PROD_AXIOS_INSTANCE] = useState<AxiosInstance | null>(null);

    const [fetchChatsListPath, setFetchChatsListPath] = useState<string | null>(null);
    const [fetchChatMessagesPath, setFetchChatMessagesPath] = useState<string | null>(null);
    const [sendSmsPath, setSendSmsPath] = useState<string | null>(null);
    const [markMessagesAsReadPath, setMarkMessagesAsReadPath] = useState<string | null>(null);

    const [subscribeToChat, setSubscribeToChat] = useState<string | null>(null);
    const [newSms, setNewSms] = useState<string | null>(null);
    const [updateSms, setUpdateSms] = useState<string | null>(null);

    const [chatsList, setChatsList] = useState<ChatToList[]>([]); // боковой список чатов (последнее сообщение)
    const chatsListRef = useRef(chatsList);
    const [chats, setChats] = useState<Chat[]>([]); // все чаты
    const chatsRef = useRef(chats);
    const [currentChatId, setCurrentChatId] = useState<number>(0); // открытый чат

    const [totalUnread, setTotalUnread] = useState<number>(0); // количество всех непрочитанных сообщений

    const [loadingChatList, setLoadingChatList] = useState<boolean>(false); // ожидаем ответа со списком чатов
    const [loadingChat, setLoadingChat] = useState<boolean>(false); // ожидаем ответа с чатом
    const [loadingSendSms, setLoadingSendSms] = useState<boolean>(false); // ожидаем ответа при отправке сообщения

    //const [refreshKey, setRefreshKey] = useState<number>(0);
    const [isAlertVisibleKey, setIsAlertVisibleKey] = useState<number>(0);
    const [alertInfo, setAlertInfo] = useState<AlertInfo>({
        message: '',
        description: '',
        type: 'info',
    });

    const [init, setInit] = useState<boolean>(false);

    const connect = useCallback(() => {
        console.log('connect start');
        if (!PRODMODE || !BFF_PORT || !HTTP_HOST || !CSRF_TOKEN || !PROD_AXIOS_INSTANCE) {
            console.log('connect false');
            return;
        }
        if (socketRef.current?.connected) {
            socketRef.current.disconnect();
            //return;
        }
        console.log('connect true');
        const socket = init ? io(`${HTTP_HOST}:${BFF_PORT}`, { transports: ['websocket', 'polling'], withCredentials: true }) : null;
        socketRef.current = socket;
        if (!socket) return;
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
            socket.emit(subscribeToChat ?? '', userId);
        });
        // --- получаем новое сообщение ---
        socket.on(newSms ?? '', (data) => {
            console.log(`WS ${newSms}`, data);

            if (data.left) addMessageToChatList(data.left, false);
            if (data.left) setTotalUnread(data.left?.total_unread);
            if (data.right) addMessageToChat(data.right);

            setIsAlertVisibleKey(dayjs().unix());
            setAlertInfo({
                message: 'Новое уведомление.',
                description: '',
                type: 'success',
            });
        });
        socket.on(updateSms ?? '', (data) => {
            console.log(`WS ${updateSms}`, data);
            if (data.sms) updateMessageStatus(data.sms, data.sms.to, true);

            setIsAlertVisibleKey(dayjs().unix());
            setAlertInfo({
                message: 'Новое уведомление.',
                description: '',
                type: 'success',
            });
        });
        socket.on('disconnect', () => {
            console.log('CHAT WEBSOCKET DISCONNECTED');
            setConnected(false);
            setConnectionStatus('disconnected');
        });
        socket.on('connect_error', () => {
            console.log('CHAT WEBSOCKET CONNECT ERROR');
        });
    }, [init, PRODMODE, BFF_PORT, HTTP_HOST, CSRF_TOKEN, PROD_AXIOS_INSTANCE, subscribeToChat, newSms, updateSms]);

    useEffect(() => {
        console.log('init', init)
        if (init && userdata && HTTP_HOST && BFF_PORT && CSRF_TOKEN) {
            console.log('Attempting to connect with:', { HTTP_HOST, BFF_PORT, userdata });
            const timer = setTimeout(() => {
                connect();
                fetchChatsList(null).then();
            },0);

            return () => {
                clearTimeout(timer);
                console.log('Cleaning up socket connection');
                socketRef.current?.disconnect();
            };
        } else {
            console.log('Connection conditions not met:', {
                hasUserdata: !!userdata,
                hasHTTP_HOST: !!HTTP_HOST,
                hasBFF_PORT: !!BFF_PORT,
                hasCSRF_TOKEN: !!CSRF_TOKEN
            });
        }
    }, [userdata, HTTP_HOST, BFF_PORT, CSRF_TOKEN, connect]);
    useEffect(() => {
        console.log('BEFORE UPDATE CHATS chatsRef', chats);
        chatsRef.current = chats;
    }, [chats]);
    useEffect(() => {
        chatsListRef.current = chatsList;
    }, [chatsList]);
    useEffect(() => {
        if (!HTTP_HOST) return;
        console.log('SET_PROD_AXIOS_INSTANCE')
        const instance = axios.create({
            baseURL: HTTP_HOST,
            timeout: 300000,
        });
        console.log(instance);
        SET_PROD_AXIOS_INSTANCE(instance);
    }, [HTTP_HOST]);
    useEffect(() => {
        if (!userdata) return;
        console.log('userdataRef')
        userdataRef.current = userdata;
    }, [userdata]);

    const fetchChatsList = useCallback(async (search: string | null = null) => {
        console.log('fetchChatsList');

        setLoadingChatList(true);
        if (PRODMODE) {
            try {
                if (!PROD_AXIOS_INSTANCE || !fetchChatsListPath || !CSRF_TOKEN) {
                    console.log('fetchChatsList false');
                    return;
                }
                console.log('fetchChatsList true');
                const response = await fetch(fetchChatsListPath, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': CSRF_TOKEN,
                    },
                    body: JSON.stringify({
                        data: { search },
                        _token: CSRF_TOKEN,
                    }),
                });
                const responseData = await response.json();
                console.log(responseData);
                if (responseData?.content) {
                    setChatsList(responseData?.content?.sms);
                    setTotalUnread(responseData?.content?.total_unread);
                }
            } catch (e) {
                console.log(e);
            } finally {
                setLoadingChatList(false);
            }
        } /*else {
            setChatsList(CHAT_LIST_MOCK?.content?.sms);
            setTotalUnread(CHAT_LIST_MOCK?.content?.total_unread);
            setLoadingChatList(false);
        }*/
    }, [loadingChatList, CSRF_TOKEN, PROD_AXIOS_INSTANCE, fetchChatsListPath]);
    const fetchChatMessages = useCallback(async (chatId: number, lastMsg: number | null = null) => {
        console.log('fetchChatMessages');
        if (loadingChat) return;
        setLoadingChat(true);
        if (PRODMODE) {
            try {
                if (!PROD_AXIOS_INSTANCE || !fetchChatMessagesPath || !CSRF_TOKEN) return;
                const endpoint = `${fetchChatMessagesPath}/${chatId}`;
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': CSRF_TOKEN,
                    },
                    body: JSON.stringify({
                        data: {
                            last_id: lastMsg,
                        },
                        _token: CSRF_TOKEN,
                    }),
                });
                const responseData = await response.json();
                if (responseData?.content) {
                    setCurrentChatId(chatId);
                    setChatsPrepare({
                        chat_id: chatId,
                        who: responseData?.content?.who,
                        messages: responseData?.content?.messages,
                        total: responseData?.content?.total,
                    });
                }
            } catch (e) {
                console.log(e);
            } finally {
                setLoadingChat(false);
            }
        } /*else {
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
        }*/
    }, [loadingChat, CSRF_TOKEN, PROD_AXIOS_INSTANCE, fetchChatMessagesPath]);
    const sendSms = useCallback(async ({ to, text, files, answer, timestamp, from_id }: toSendSms) => {
        console.log('sendSms');
        insertMessagesToArrays({to, text, answer, timestamp, from_id});
        setLoadingSendSms(true);
        try {
            if (!PROD_AXIOS_INSTANCE || !sendSmsPath || !CSRF_TOKEN) return;
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
            const response = await fetch(sendSmsPath, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': CSRF_TOKEN,
                },
                body: formData,
            });
            const responseData = await response.json();

            console.log('[useSendSms] Ответ от сервера:', responseData);

            if (responseData) {
                updateMessageId(responseData.id, responseData.timestamp, responseData.files, to);
                addMessageToChatList(responseData.left, true);
            }
        } catch (e) {
            console.error('[useSendSms] Ошибка:', e);
        } finally {
            setLoadingSendSms(false);
        }
    }, [loadingSendSms, CSRF_TOKEN, PROD_AXIOS_INSTANCE, sendSmsPath]);
    const markMessagesAsRead = useCallback(async (messageIds: (number | undefined)[]) => {
        console.log('markMessagesAsRead');
        for (const id of messageIds) {
            if (PRODMODE) {
                try {
                    if (!PROD_AXIOS_INSTANCE || !markMessagesAsReadPath || !CSRF_TOKEN) return;
                    const endpoint = `${markMessagesAsReadPath}/${id}`;
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': CSRF_TOKEN,
                        },
                        body: JSON.stringify({
                            _token: CSRF_TOKEN,
                        }),
                    });
                    const responseData = await response.json();
                    if (responseData) {
                        updateMessageStatus(responseData?.sms, responseData?.from, false);
                        updateChatListCountUnread(responseData?.sms?.from, responseData?.sms?.count_unread);
                        setTotalUnread(responseData?.sms?.total_unread);
                    }
                } catch (e) {
                    console.log(e);
                }
            } else {
                console.log(`/api/sms/read/${id}`)
            }
        }
    }, [CSRF_TOKEN, PROD_AXIOS_INSTANCE, markMessagesAsReadPath]);

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
                //refreshKey,
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
                SET_BFF_PORT,

                setFetchChatsListPath,
                setFetchChatMessagesPath,
                setSendSmsPath,
                setMarkMessagesAsReadPath,

                setSubscribeToChat,
                setNewSms,
                setUpdateSms,

                init,
                setInit,
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
