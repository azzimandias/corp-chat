import styles from '../styles/chat_styles.module.css';
import dayjs from 'dayjs';
import {useChatSocket} from "../context/ChatSocketContext";
import type {Normalized} from "../types/types.ts";
import React from "react";

export default function ChatIncomingMsg({ message, pasteFileIcon }: {
    message: Normalized | undefined,
    pasteFileIcon: (extension: string) => React.ReactNode
}) {

    if (!message) {
        return null;
    }

    const { text, files, timestamp, senderName } = message;

    const {
        HTTP_HOST
    } = useChatSocket();

    return (
        <div className={`message ${styles.message} ${styles.otherMessage}`} data-message-id={message.id} data-id={message.id}>
            <div className={`${styles.bubble} ${styles.otherMessageBubble}`}>
                <div className={styles.senderName}>{/*<span style={{color: 'red'}}>{fromId}</span>*/}{senderName}</div>
                <span>{text}</span>
                <div className={styles.files_container}>
                    {files && files.length > 0 && files.map((file, index) => (
                        <a href={`${HTTP_HOST}/${file.route}`} target={'_blank'} className={styles.file} key={`file-${file.id}-${index}`}>
                            <div className={`${styles.file_circle}`}>
                                {pasteFileIcon(file.extension)}
                            </div>
                            <p className={styles.href_label}>{file?.name}</p>
                        </a>
                    ))}
                </div>
                <div className={styles.time}>
                    {dayjs(+timestamp * 1000).format('HH:mm')}
                </div>
            </div>
        </div>
    );
}
