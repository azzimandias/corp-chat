import styles from '../styles/chat_styles.module.css';
import { useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatList from './ChatList';
import ChatFooter from './ChatFooter';
import { Layout } from 'antd';

const { Content } = Layout;

interface ChatSidebarParams {
    onSelectChat: (chatId: number | null) => void;
    selectedChatId: number | null;
}

export default function ChatSidebar({ onSelectChat, selectedChatId }: ChatSidebarParams) {
    const [draggable, setDraggable] = useState<boolean>(false);
    const [position, setPosition] = useState<'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null>('topLeft');
    const [search, setSearch] = useState<string>('');

    return (
        <Layout className={styles['sidebar-layout']}>
            <ChatHeader
                /*className={styles['sidebar-header']}*/
                onSearchChange={setSearch}
            />
            <Content className={styles['sidebar-content']}>
                <ChatList
                    search={search}
                    onSelectChat={onSelectChat}
                    selectedChatId={selectedChatId}
                />
            </Content>
            <ChatFooter
                /*className={styles['sidebar-footer']}*/
                draggable={draggable}
                setDraggable={setDraggable}
                position={position}
                setPosition={setPosition}
            />
        </Layout>
    );
}
