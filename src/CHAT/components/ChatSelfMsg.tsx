import styles from '../styles/chat_styles.module.css';
import dayjs from 'dayjs';
import { CheckOutlined } from "@ant-design/icons";
import {useChatSocket} from "../context/ChatSocketContext";
import type {Normalized} from "../types/types.ts";
import React from "react";

export default function ChatSelfMsg({ message, pasteFileIcon }: {
    message: Normalized,
    pasteFileIcon: (extension: string) => React.ReactNode
}) {
    const { text, files, timestamp, isSending, status } = message;

    const {
        HTTP_HOST
    } = useChatSocket();

    // Используем только существующие классы
    const messageClass = `message ${styles.message} ${styles.myMessage} ${
        isSending ? styles.localMessage : ''
    }`;

    const bubbleClass = `${styles.bubble} ${styles.myMessageBubble}`;

    return (
        <div className={messageClass} data-id={message.id} data-message-id={message.id}>
            <div className={bubbleClass}>
                <span>{text}</span>
                <div className={styles.files_container}>
                    {files && files.length > 0 && files.map((file, index) => (
                        <a href={`${HTTP_HOST}/${file.route}`} target={'_blank'} className={styles.file}  key={`file-${file.id}-${index}`}>
                            <div className={`${styles.file_circle} ${styles.self}`}>
                                {pasteFileIcon(file.extension)}
                            </div>
                            <p className={styles.href_label}>{file?.name}</p>
                        </a>
                    ))}
                </div>
                <div className={styles.time} style={{display: 'flex', justifyContent: 'flex-end', height: '18px'}}>
                    <div>{dayjs(+timestamp * 1000).format('HH:mm')}</div>
                    {!isSending &&
                        <span style={{width: '18px', height: '18px', position: 'relative'}}
                              title={status ? 'Прочитано' : 'Отправлено'}
                        >
							<CheckOutlined style={{color: status ? 'green' : ''}}/>
                            {status && <CheckOutlined
                                style={{position: 'absolute', top: '4px', left: '3px', color: status ? 'green' : ''}}/>}
						</span>
                    }
                </div>
                {isSending && <span className={styles.sending}> • отправляется...</span>}
            </div>
        </div>
    );
}
