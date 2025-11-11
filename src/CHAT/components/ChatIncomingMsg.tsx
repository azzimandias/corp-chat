import styles from './style/Chat.module.css';
import dayjs from 'dayjs';
import {
    FileExcelFilled,
    FileFilled,
    FileImageFilled,
    FileMarkdownFilled,
    FilePdfFilled,
    FilePptFilled,
    FileTextFilled,
    FileWordFilled,
    FileZipFilled,
} from "@ant-design/icons";
import {useChatSocket} from "../context/ChatSocketContext.tsx";
import type {Normalized} from "../types/types.ts";

export default function ChatIncomingMsg({ message }: { message: Normalized }) {
    const { text, files, timestamp, senderName } = message;

    const {
        HTTP_HOST
    } = useChatSocket();

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
