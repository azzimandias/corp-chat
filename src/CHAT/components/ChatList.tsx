import {useCallback, useEffect, useMemo} from 'react';
import styles from '../styles/chat_styles.module.css';
import {useChatSocket} from "../context/ChatSocketContext";
import {Badge} from "antd";
import type {ChatToList} from "../types/types.ts";

interface ChatListParams {
    search: string;
    onSelectChat: (chatId: number | null) => void;
    selectedChatId: number | null;
}

export default function ChatList({ search, onSelectChat, selectedChatId }: ChatListParams) {
    const {
        /* socket */
        userdata,
        /* info */
        chatsList,
        /* methods */
        fetchChatsList
    } = useChatSocket();
    const currentUserId = userdata?.user?.id;

    useEffect(() => {
        fetchChatsList(search);
    }, [search]);

    const getRole = useCallback((sms: ChatToList) => {
            if (!sms || !currentUserId) return null;

            // Для сохраненного чата всегда возвращаем 'self'
            if (sms.chat_id === currentUserId) {
                return 'self';
            }

            // Основная логика определения роли
            return sms.from?.id === currentUserId ? 'self' : 'companion';
        },
        [currentUserId]
    );

    // Функция получения отображаемого имени
    const getDisplayName = useCallback((sms: ChatToList, role: 'self' | 'companion' | null, isSaved = false) => {
        if (isSaved) return 'Сохранённое';

        const user = role === 'self' ? sms?.to : sms?.from;
        return `${user?.surname ?? ''} ${user?.name ?? ''}`.trim();
    }, []);

    const truncateToTwoLines = (text: string, maxLength: number = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const chats = useMemo(() => {
        const normalizedSearch = search.toLowerCase();

        const filtered: ChatToList[] = chatsList.filter((sms: ChatToList) => {
            // Сообщения себе всегда показываем
            if (sms?.to?.id === currentUserId && sms?.from?.id === currentUserId) {
                return true;
            }

            const role: 'self' | 'companion' | null = getRole(sms);
            const displayName = getDisplayName(sms, role, false);
            const messageText = sms?.text?.toLowerCase() || '';

            return sms && (displayName.toLowerCase().includes(normalizedSearch) ||
                messageText.includes(normalizedSearch));
        });

        //const result = Object.values(uniqueChatsMap).sort((a, b) => {
        const result = Object.values(filtered).sort((a, b) => {
            const timeA = a.updated_at || a.created_at;
            const timeB = b.updated_at || b.created_at;
            return timeB - timeA;
        });

        const myChatIdx = result.findIndex((chat: ChatToList) => currentUserId && chat.from.id && chat.to.id && (+chat.from.id === +currentUserId) && (+chat.to.id === +currentUserId));
        if (myChatIdx !== -1) {
            result.splice(myChatIdx, 1);
        }

        // Добавляем чат "Сохранённое"
        result.unshift({
            id: 0,
            chat_id: currentUserId,
            from: { id: currentUserId, name: 'Вы', surname: '' },
            to: { id: currentUserId, name: 'Вы', surname: '' },
            text: '📁',
            updated_at: Infinity,
            created_at: Infinity,
            count_unread: 0,
            status: true,
            files: [],
        });

        return result;
    }, [chatsList, search, currentUserId, getRole, getDisplayName]);

    return (
        <div className={styles['chat-list__container']}>
            <ul className={styles['chat-list']}>
                {chats.map((chat, idx) => {
                    const role = getRole(chat);
                    const displayName = getDisplayName(chat, role, chat.chat_id === currentUserId);
                    const isActive = chat.chat_id === selectedChatId;
                    const lastMessageText = chat.text;
                    return (
                        <div key={`chat-${chat.chat_id}-${idx}`}>
                            <li
                                className={`${styles.chatItem} ${isActive ? styles.activeChatItem : ''}`}
                                onClick={() => {
                                    onSelectChat(chat.chat_id ?? null);
                                }}
                            >
                                <div>
                                    <div className={styles['companionName']}>{displayName || 'Неизвестный'}</div>
                                    <div className={styles['last-message']}>{truncateToTwoLines(lastMessageText, 50)}</div>
                                </div>
                                <Badge count={chat.count_unread} />
                            </li>
                        </div>
                    );
                })}
            </ul>
        </div>
    );
}
