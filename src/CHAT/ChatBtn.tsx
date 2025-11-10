import styles from './style/Chat.module.css';
import {useEffect, useMemo, useState} from 'react';
import {Button, Dropdown, Space} from 'antd';
import {MessageOutlined} from '@ant-design/icons';
import {ChatModal} from './ChatModal.jsx';
import {useChatSocket} from "./context/ChatSocketContext";
import type {ChatParams} from "./types/types.ts";

const ChatBtn = ({userdata, CSRF_TOKEN, PRODMODE, PROD_AXIOS_INSTANCE}: ChatParams) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const {
        connected,           // boolean - подключен ли WebSocket
        totalUnread,         // количество непрочитанных сообщений
        chatsList,           // [] - список чатов
        fetchChatsList,

        SET_CSRF_TOKEN,
        SET_PRODMODE,
        SET_PROD_AXIOS_INSTANCE,
        setUserData,
    } = useChatSocket();
    const [currentUserId, setCurrentUserId] = useState(0);

    useEffect(() => {
        if (userdata) setUserData(userdata);
        if (CSRF_TOKEN) SET_CSRF_TOKEN(CSRF_TOKEN);
        if (PRODMODE) SET_PRODMODE(PRODMODE);
        if (PROD_AXIOS_INSTANCE) SET_PROD_AXIOS_INSTANCE(PROD_AXIOS_INSTANCE);
    }, [
        setUserData,
        SET_CSRF_TOKEN,
        SET_PRODMODE,
        SET_PROD_AXIOS_INSTANCE
    ]);

    useEffect(() => {
        if (!connected) {
            console.log('disconnected');
        }
    }, [connected]);
    useEffect(() => {
        fetchChatsList();
    }, [fetchChatsList]);
    useEffect(() => {
        fetchChatsList();
    }, [fetchChatsList, totalUnread]);

    useEffect(() => {
        setCurrentUserId(userdata.user.id);
    }, [userdata]);

    // Используем кастомный хук для логики ролей
    /*const { getRole, getDisplayName } = useChatRole(currentUserId);*/

    // --- Формируем smsData (чаты, где участвует текущий пользователь) ---
    const smsData = useMemo(() => {
        console.log(chatsList);

        if (!Array.isArray(chatsList) || chatsList.length === 0) {
            return { hasSms: false, messages: [] };
        }

        const messages = chatsList
            .filter((chat) => {
                const fromId = chat.from?.id || chat.from_id;
                const toId = chat.to?.id || chat.to_id;
                return fromId === currentUserId || toId === currentUserId;
            })
            .filter((chat) => chat.count_unread > 0)
            .map((chat) => {
                /*const role = getRole(chat);
                const displayName = getDisplayName(chat, role, false);*/
                const role = '';
                const displayName = '';

                return {
                    id: chat.chat_id || chat.id,
                    name: displayName || 'Неизвестный',
                    surname: '', // Теперь фамилия включена в displayName
                    content: chat.text || chat.last_message || '(без текста)',
                    chatId: chat.chat_id,
                    role: role, // Добавляем роль для отладки
                    countUnread: chat.count_unread,
                    _fullChat: chat,
                };
            });

        return { hasSms: messages.length > 0, messages };
    }, [chatsList, currentUserId]); /* getRole, getDisplayName */
    // --- Меню для dropdown ---
    const menuItems = useMemo(() => {
        if (!smsData.hasSms) return [];
        const { messages } = smsData;
        return messages.map((message, idx) => {
            return {
                key: `message-${idx}-${message.id}`,
                label: (
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px'}}>
                        <div>{message.name}</div>
                        <div>{message.countUnread}</div>
                    </div>
                ),
            }
        });
    }, [smsData]);

    const showModal = () => setIsModalOpen(true);
    const handleOk = () => setIsModalOpen(false);
    const handleCancel = () => setIsModalOpen(false);

    const ButtonNode = (
        <Button style={{ background: 'transparent' }} type="primary" onClick={showModal}>
            <MessageOutlined />
            {totalUnread > 0 && (
                <span className={styles['notification-badge']}>{totalUnread}</span>
            )}
        </Button>
    );

    return (
        <Space style={{ padding: 0 }}>
            {menuItems.length > 0 ? (
                <Dropdown menu={{ items: menuItems }} trigger={['hover']}>
                    <div>{ButtonNode}</div>
                </Dropdown>
            ) : (
                <div>{ButtonNode}</div>
            )}

            <ChatModal open={isModalOpen}
                       onOk={handleOk}
                       onCancel={handleCancel}
                       smsData={smsData}
            />
        </Space>
    );
};
export default ChatBtn;
