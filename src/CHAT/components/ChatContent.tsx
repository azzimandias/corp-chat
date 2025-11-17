import styles from '../styles/chat_styles.module.css';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import dayjs from 'dayjs';
import {Empty, FloatButton, Layout, type UploadFile} from 'antd';
import { ChatInput } from './ChatInput';
import { ChatDivider } from './ChatDivider';
import ChatSelfMsg from './ChatSelfMsg';
import ChatIncomingMsg from './ChatIncomingMsg';
import { useChatSocket } from "../context/ChatSocketContext";
import { useMarkMessagesRead } from '../hooks/useMarkMessagesRead';
import { useInfiniteScrollUp } from "../hooks/useInfiniteScrollUp";
import { useScrollDown } from "../hooks/useScrollDown";
import {
    ArrowDownOutlined,
    FileExcelFilled, FileFilled,
    FileImageFilled, FileMarkdownFilled,
    FilePdfFilled, FilePptFilled, FileTextFilled,
    FileWordFilled, FileZipFilled,
    LoadingOutlined
} from "@ant-design/icons";
import type {Chat, ChatMessage, messagesWithDividersInterface} from "../types/types.ts";

export default function ChatContent({ chatId }: { chatId: number }) {
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const MemoChatSelfMsg = React.memo(ChatSelfMsg);
    const MemoChatIncomingMsg = React.memo(ChatIncomingMsg);
    const MemoChatDivider = React.memo(ChatDivider);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const { Content, Footer } = Layout;
    const [chat, setChat] = useState<Chat>({
        chat_id: 0,
        who: '',
        messages: [],
        total: 0,
    });
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState<boolean>(false);
    const [isShowScrollButton, setIsShowScrollButton] = useState<boolean>(false);


    const normalizeMessage = useCallback((msg: ChatMessage) => {
        return {
            fromId: msg.from_id,
            id: msg.id,
            text: msg.text,
            files: msg.files,
            timestamp: msg.created_at,
            isSelf: msg.from_id === currentUserId,
            senderName: currentUserId && (+currentUserId !== +msg.from_id) ? chat.who : 'Вы',
            isLocal: msg.isLocal || false,
            isSending: msg.isSending || false,
            status: msg.status || false,
            _raw: msg,
        };
    }, [chat.who, currentUserId]);
    const allMessages = useMemo(() => {
        const combined = [...chat.messages];
        const existingIds = new Set();
        const uniqueMessages = combined.filter((msg) => {
            const id = msg.id;
            if (existingIds.has(id?.toString())) {
                return false;
            }
            existingIds.add(id?.toString());
            return true;
        });
        return uniqueMessages.map(normalizeMessage);
    }, [chat, normalizeMessage]);
    const messagesWithDividers = useMemo(() => {
        if (!allMessages || allMessages.length === 0) return [];
        const isDesc = allMessages.length > 1 && Number(allMessages[0].timestamp) > Number(allMessages[allMessages.length - 1].timestamp);
        const sorted = isDesc ? [...allMessages].slice().reverse() : [...allMessages];
        const items = [];
        let lastDayKey = null;
        for (const msg of sorted) {
            const dayKey = dayjs(Number(msg.timestamp) * 1000).format('DD.MM.YY');
            if (lastDayKey !== dayKey) {
                items.push({ type: 'divider', id: `divider-${dayKey}`, timestamp: msg.timestamp });
                lastDayKey = dayKey;
            }
            items.push({ type: 'msg', id: msg.id.toString(), message: msg });
        }
        return isDesc ? items.slice().reverse() : items;
    }, [allMessages]);
    const countOfUnreadMessages = useMemo(() => {
        /*console.log(allMessages)*/
        if (!currentUserId) return [];
        return allMessages.filter((msg) => (!msg.status && +msg.fromId !== +currentUserId))?.length;
    }, [allMessages, currentUserId]);

    const {
        /* info */
        chats,  			// [] - список чатов
        loadingChat,		// загрузка сообщений
        loadingSendSms,		// ожидание ответа от сервера при отправке сообщения
        /* methods */
        fetchChatMessages,	// подгрузить чат с сообщениями
        sendSms,			// отправить сообщение
        markMessagesAsRead,
        userdata,
    } = useChatSocket();

    useMarkMessagesRead({
        messagesWithDividers,                               // сообщения с разделителями
        currentUserId,                                      // id пользователя
        chatId,                                             // id открытого чата
        containerRef: messagesContainerRef,                 // контейнер с сообщениями, за которым следим
        markMessagesAsRead                                  // метод срабатываемый при попадании непрочитанного сообщения во вьюпорт контейнера со скроллом
    });

    useInfiniteScrollUp({
        containerRef: messagesContainerRef,                 // контейнер с сообщениями, за которым следим
        fetchMoreMessages: () => {
            fetchChatMessages(chatId, chat.messages[0].id); // метод выполняемый в точке офсета
        },
        hasMore,                                            // флаг надо ли еще реагировать на офсет
        offset: 500,                                        // офсет, расстояние до топа контейнера, в котором срабатывает метод
    });

    useScrollDown({
        messagesWithDividers,                               // сообщения с разделителями
        containerRef: messagesContainerRef,                 // контейнер с сообщениями, за которым следим
        offset: 500,                                        // офсет, расстояние до низа контейнера
    });

    useEffect(() => {
        const foundedChat = chats.find(chat => chat.chat_id === chatId);
        if (!foundedChat && chatId&& !loadingChat && !loadingSendSms) {
            /*console.log('Fetching chat messages for:', chatId);*/
            messagesWithDividers.length = 0;
            fetchChatMessages(chatId, null);
        } else if (foundedChat) {
            /*console.log('Chat found:', foundedChat);*/
            setChat(foundedChat);
        }
    }, [chats, chatId, loadingChat, loadingSendSms, messagesWithDividers, fetchChatMessages]);
    useEffect(() => {
        if (userdata && userdata?.user) {
            setCurrentUserId(userdata?.user?.id);
        }
    }, [userdata]);
    useEffect(() => {
        if (messagesContainerRef.current && allMessages.length > 0 && !isScrolledToBottom) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            setIsScrolledToBottom(true);
        }
    }, [allMessages, isScrolledToBottom]);
    useEffect(() => {
        setIsScrolledToBottom(false);
    }, [chatId]);
    useEffect(() => {
        setHasMore( (chat?.total - chat?.messages?.length) > 0);
    }, [chat]);
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const checkScrollPosition = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            setIsShowScrollButton(scrollHeight - scrollTop - clientHeight > 200);
        };

        container.addEventListener('scroll', checkScrollPosition);
        return () => container.removeEventListener('scroll', checkScrollPosition);
    }, []);

    const handleSend = (trimmed: string, fileList: UploadFile[]) => {
        if (!currentUserId) return;
        sendSms({
            to: chatId,
            text: trimmed,
            files: fileList,
            answer: null,
            timestamp: Number(dayjs().unix()),
            from_id: currentUserId
        });
    };

    const pasteFileIcon = (extension: string) => {
        switch (extension) {
            // Изображения
            case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': case 'webp': case 'svg':
            case 'tiff': case 'ico': case 'psd': case 'ai':
                return <FileImageFilled style={{fontSize: '25px', color: '#555555'}}/>;
            // Документы
            case 'pdf':
                return <FilePdfFilled style={{fontSize: '25px', color: '#555555'}}/>;
            case 'doc': case 'docx': case 'rtf': case 'odt':
                return <FileWordFilled style={{fontSize: '25px', color: '#555555'}}/>;
            case 'xls': case 'xlsx': case 'csv': case 'ods':
                return <FileExcelFilled style={{fontSize: '25px', color: '#555555'}}/>;
            case 'ppt': case 'pptx': case 'odp':
                return <FilePptFilled style={{fontSize: '25px', color: '#555555'}}/>;
            case 'md': case 'markdown':
                return <FileMarkdownFilled style={{fontSize: '25px', color: '#555555'}}/>;
            // Архивы
            case 'zip': case 'rar': case '7z': case 'tar': case 'gz':
                return <FileZipFilled style={{fontSize: '25px', color: '#555555'}}/>;
            // Текстовые файлы
            case 'txt': case 'log': case 'ini': case 'xml': case 'json': case 'yaml':
                return <FileTextFilled style={{fontSize: '25px', color: '#555555'}}/>;
            // Остальное - общая иконка
            default:
                return <FileFilled style={{fontSize: '25px', color: '#555555'}}/>;
        }
    };

    return (
        <Layout className={styles.chatcontentLayout}>
            <Content className={styles.chat_content}>
                <div className={styles.chat_header}>
                    <span>{!userdata ? 'Загрузка...' : chat.who ? chat.who : 'Неизвестный собеседник'}</span>
                    {loadingChat ? (<LoadingOutlined />) : (<span>{chatId}</span>)}
                </div>
                <div className={styles.chat_body} ref={messagesContainerRef}>
                    {(messagesWithDividers && messagesWithDividers.length > 0) ? messagesWithDividers.map((item: messagesWithDividersInterface) =>
                        (item.type === 'divider' && !item?.message) ? (
                            <MemoChatDivider key={item.id}>
                                {item.timestamp ? dayjs(+item.timestamp * 1000).format('DD.MM.YY').toString() : ''}
                            </MemoChatDivider>
                        ) : item?.message?.fromId && currentUserId && (+item?.message?.fromId === +currentUserId) ? (
                            <MemoChatSelfMsg key={item?.message?.id}
                                             message={item?.message}
                                             pasteFileIcon={pasteFileIcon}
                            />
                        ) : (
                            <MemoChatIncomingMsg key={item?.message?.id}
                                                 message={item?.message}
                                                 data-message-id={item?.message?.id}
                                                 pasteFileIcon={pasteFileIcon}
                            />
                        )

                    ) : (
                        <Empty description="Еще нет сообщений"
                               image={Empty.PRESENTED_IMAGE_SIMPLE}
                               className={styles.antd_empty}
                        />
                    )
                    }
                    {isShowScrollButton && (
                        <FloatButton shape="circle"
                                     style={{insetInlineEnd: 20}}
                                     badge={{count: countOfUnreadMessages ?? null}}
                                     icon={<ArrowDownOutlined/>}
                                     onClick={() => {
                                         if (!messagesContainerRef.current) return;
                                         messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                                         setIsShowScrollButton(false);

                                         const unreadIds = messagesWithDividers
                                             .filter(item => item.type !== 'divider')
                                             .filter(item => item?.message?.fromId && currentUserId && +item?.message?.fromId !== +currentUserId)
                                             .filter(item => !item?.message?.status)
                                             .map(item => item?.message?.id);

                                         if (unreadIds.length > 0) {
                                             markMessagesAsRead(unreadIds);
                                         }
                                     }}
                        />
                    )}
                </div>
            </Content>
            <Footer className={styles['chat-input__footer']}>
                <ChatInput onSend={handleSend}/>
            </Footer>
        </Layout>
    );
}
