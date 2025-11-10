import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {io} from 'socket.io-client';
import {CHAT_LIST_MOCK, CHAT_MOCK, CHAT_MOCK_NEW} from '../mock/mockSms.js';
import dayjs from "dayjs";


export const ChatSocketContext = createContext(null);

export const ChatSocketProvider = ({ children, url }) => {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');


    const [CSRF_TOKEN, SET_CSRF_TOKEN] = useState('');
    const [PRODMODE, SET_PRODMODE] = useState(false);
    const [PROD_AXIOS_INSTANCE, SET_PROD_AXIOS_INSTANCE] = useState(null);
    const [HTTP_HOST, SET_HTTP_HOST] = useState(null);
    const [BFF_PORT, SET_BFF_PORT] = useState(null);
    const [userdata, setUserData ] = useState(null);
    const userdataRef = useRef(userdata);

    const [chatsList, setChatsList] = useState([]); // боковой список чатов (последнее сообщение)
    const chatsListRef = useRef(chatsList);
    const [chats, setChats] = useState([]); // все чаты
    const chatsRef = useRef(chats);
    const [currentChatId, setCurrentChatId] = useState(0); // открытый чат

    const [totalUnread, setTotalUnread] = useState(0); // количество всех непрочитанных сообщений

    const [loadingChatList, setLoadingChatList] = useState(false); // ожидаем ответа со списком чатов
    const [loadingChat, setLoadingChat] = useState(false); // ожидаем ответа с чатом
    const [loadingSendSms, setLoadingSendSms] = useState(false); // ожидаем ответа при отправке сообщения

    const [refreshKey, setRefreshKey] = useState(0);
    const [isAlertVisibleKey, setIsAlertVisibleKey] = useState(0);
    const [alertInfo, setAlertInfo] = useState({
        message: '',
        description: '',
        type: 'info', //"success" | "info" | "warning" | "error"
    });

    const listeners = useRef({});

    // --- WS события ---
    const on = useCallback((event, handler) => {
        if (!listeners.current[event]) listeners.current[event] = new Set();
        listeners.current[event].add(handler);
    }, []);

    const off = useCallback((event, handler) => {
        listeners.current[event]?.delete(handler);
    }, []);

    const emitToListeners = useCallback((event, payload) => {
        listeners.current[event]?.forEach((h) => h(payload));
    }, []);

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
            socket.emit('subscribeToNotification', userId);
        });
        // --- получаем новое сообщение ---
        socket.on('new:sms', (data) => {
            console.log('WS new:sms', data);

            if (data.left) addMessageToChatList(data.left, false);
            if (data.left) setTotalUnread(data.left?.total_unread);
            if (data.right) addMessageToChat(data.right);

            if (data.right)  emitToListeners('message:new', data.right);
            emitToListeners('new:sms', data);
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
        socket.on('disconnect', (reason) => {
            console.log('CHAT WEBSOCKET DISCONNECTED');
            setConnected(false);
            setConnectionStatus('disconnected');
        });
        socket.on('connect_error', (error) => {
            console.log('CHAT WEBSOCKET CONNECT ERROR');
        });
    }, [url, emitToListeners]);

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

    const fetchChatsList = useCallback(async (search) => {
        setLoadingChatList(true);
        if (PRODMODE) {
            try {
                const endpoint = `/api/sms`;
                const response = await PROD_AXIOS_INSTANCE.post(endpoint, {
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
    const fetchChatMessages = useCallback(async (chatId, lastMsg = null) => {
        if (loadingChat) return;
        setLoadingChat(true);
        if (PRODMODE) {
            try {
                const endpoint = `/api/sms/${chatId}`;
                const response = await PROD_AXIOS_INSTANCE.post(endpoint, {
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
    const sendSms = useCallback(async ({ to, text, files, answer, timestamp, from_id }) => {
        insertMessagesToArrays(to, text, files, answer, timestamp, from_id);
        setLoadingSendSms(true);
        try {
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
                files.forEach((uploadFile) => {
                    if (uploadFile.originFileObj) {
                        formData.append('file[]', uploadFile.originFileObj);
                    }
                    /*else if (uploadFile.url) {
                        console.log('Файл уже загружен:', uploadFile.url);
                    }*/
                });
            }
            console.log(to);
            const response = await PROD_AXIOS_INSTANCE.post('/api/sms/create/sms', formData);

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
    const markMessagesAsRead = useCallback(async (messageIds, chatId) => {
        for (const id of messageIds) {
            if (PRODMODE) {
                try {
                    const endpoint = `/api/sms/read/${id}`;
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

    const insertMessagesToArrays = (to, text, files, answer, timestamp, from_id) => {
        addMessageToChat({
            from_id: from_id,
            id: timestamp,
            text: text,
            files: files,
            created_at: timestamp,
            updated_at: timestamp,
            answer: null,
            isLocal: true,
            isSending: true,
        }, to);
    };
    const setChatsPrepare = (newChat) => {
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
                //[...prevChats, newChat]
                return prevChats.map((chat, index) => {
                    if (chat.chat_id === chatUpd.chat_id) {
                        return chatUpd;
                    }
                    return chat;
                });
            });
        }
    };
    const addMessageToChatList = (msg, isSelfMsg = true) => {
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
    const addMessageToChat = (msg, to = null) => {
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
    const updateMessageId = (id, timestamp, files, to) => {
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
    const updateMessageStatus = (msg, to, isSelfMsg = true) => {
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
    const updateChatListCountUnread = (from, updCountUnread) => {
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
                on,
                off,
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

                setUserData,
                SET_CSRF_TOKEN,
                SET_PRODMODE,
                SET_PROD_AXIOS_INSTANCE,
                SET_HTTP_HOST,
                SET_BFF_PORT,
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
