import { useState, useEffect } from 'react';
import Input from 'antd/es/input/Input';
import styles from '../styles/chat_styles.module.css';
import { SearchOutlined } from '@ant-design/icons';

interface ChatHeaderParams {
    onSearchChange: (searchSrt: string) => void;
}

export default function ChatHeader({ onSearchChange }: ChatHeaderParams) {
    const [inputValue, setInputValue] = useState<string>('');

    useEffect(() => {
        const timeout = setTimeout(() => {
            onSearchChange(inputValue.trim());
        }, 300);

        return () => clearTimeout(timeout);
    }, [inputValue, onSearchChange]);

    return (
        <header className={styles['chat-header']}>
            <Input
                placeholder="Поиск"
                prefix={<SearchOutlined />}
                className={styles['chat-header__input']}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
            />
        </header>
    );
}
