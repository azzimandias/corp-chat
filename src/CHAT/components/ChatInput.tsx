import { useState, useCallback, type KeyboardEvent } from 'react';
import {Input, Button, Popover, Upload, type UploadFile, type UploadProps} from 'antd';
import {
    SendOutlined,
    SmileOutlined,
    UploadOutlined,
    PaperClipOutlined,
} from '@ant-design/icons';
import EmojiPicker, {type EmojiClickData} from 'emoji-picker-react';
import styles from '../styles/chat_styles.module.css';
import type {UploadChangeParam} from "antd/es/upload";

export function ChatInput({ onSend }: { onSend: (trimmed: string, fileList: UploadFile[]) => void }) {
    const [inputValue, setInputValue] = useState<string>('');
    const [showPicker, setShowPicker] = useState<boolean>(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const handleSend = useCallback(() => {
        const trimmed = inputValue.trim();
        if (!trimmed && fileList.length === 0) return;
        onSend(trimmed, fileList);
        setInputValue('');
        setFileList([]);
    }, [inputValue, fileList, onSend]);

    const onEmojiClick = useCallback((emojiData: EmojiClickData) => {
        setInputValue((prev) => prev + emojiData.emoji);
        setShowPicker(false);
    }, []);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                const target = e.currentTarget; // currentTarget всегда указывает на элемент, к которому прикреплен обработчик
                const { selectionStart, selectionEnd } = target;
                const newValue =
                    inputValue.substring(0, selectionStart) + '\n' + inputValue.substring(selectionEnd);
                setInputValue(newValue);

                setTimeout(() => {
                    target.selectionStart = target.selectionEnd = selectionStart + 1;
                }, 0);
            } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [inputValue, handleSend]
    );

    const handleFileChange: UploadProps['onChange'] = useCallback(({ fileList: newFileList }: UploadChangeParam) => {
        setFileList(newFileList);
    }, []);

    const onRemove: UploadProps['onRemove'] = (file) => {
        const index = fileList.indexOf(file);
        const newFileList = fileList.slice();
        newFileList.splice(index, 1);
        setFileList(newFileList);
    };

    const beforeUpload = useCallback(() => {
        return false;
    }, []);

    return (
        <div className={styles.chat_inputs}>
            <Popover
                content={
                    <div style={{ padding: '8px' }}>
                        <Upload
                            fileList={fileList}
                            onChange={handleFileChange}
                            beforeUpload={beforeUpload}
                            onRemove={onRemove}
                            multiple
                            showUploadList={true}
                        >
                            <Button icon={<UploadOutlined />}>Выбрать файлы</Button>
                        </Upload>
                    </div>
                }
                trigger="click"
                placement="topLeft"
            >
                <Button
                    icon={<PaperClipOutlined />}
                    variant={fileList.length > 0 ? 'solid' : 'filled'}
                    color={'primary'}
                    style={fileList.length > 0 ? { backgroundColor: '#1890ff', color: 'white' } : {}}
                />
            </Popover>

            <Input.TextArea
                className={styles.textArea}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите сообщение..."
                autoSize={{ minRows: 1, maxRows: 6 }}
                style={{ width: '100%' }}
                variant={'borderless'}
            />

            <Popover
                content={<EmojiPicker onEmojiClick={onEmojiClick} />}
                trigger="hover"
                open={showPicker}
                onOpenChange={setShowPicker}
                placement="topRight"
            >
                <Button icon={<SmileOutlined />} variant={'filled'} color={'primary'} />
            </Popover>

            <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                disabled={!inputValue.trim() && fileList.length === 0}
            />
        </div>
    );
}