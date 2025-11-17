import { useRef, useEffect, useState } from 'react';
import { Modal } from 'antd';
import Draggable, {type DraggableData, type DraggableEvent} from 'react-draggable';
import { CloseOutlined } from '@ant-design/icons';
import ChatLayout from './ChatLayout';
import styles from '../styles/chat_styles.module.css';

interface ChatModalParams {
    open: boolean;
    onOk: () => void;
    onCancel: () => void;
    positionCorner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null;
}

export const ChatModal = ({ open, onOk, onCancel, positionCorner }: ChatModalParams) => {
    const dragRef = useRef<HTMLDivElement | null>(null);
    const boundsRef = useRef<{top: number, right: number, bottom: number, left: number} | null>(null);
    const [dragging, setDragging] = useState<boolean>(false);
    const [position, setPosition] = useState<{x: number, y: number}>({ x: 0, y: 0 });
    // draggable выключать, если positionCorner задан
    const draggable = !positionCorner;

    const clamp = (value: number, min: number, max: number): number => {
        return Math.min(Math.max(value, min), max);
    };

    useEffect(() => {
        if (open) {
            setPosition({ x: 0, y: 0 });
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        if (positionCorner) {
            const margin = 10; // отступ от края окна
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const modalWidth = dragRef.current ? dragRef.current.offsetWidth : 500; // примерная ширина модалки
            const modalHeight = dragRef.current ? dragRef.current.offsetHeight : 400; // примерная высота модалки

            let x: number;
            let y: number;

            switch (positionCorner) {
                case 'topLeft':
                    x = margin;
                    y = margin;
                    break;
                case 'topRight':
                    x = windowWidth - modalWidth - margin;
                    y = margin;
                    break;
                case 'bottomLeft':
                    x = margin;
                    y = windowHeight - modalHeight - margin;
                    break;
                case 'bottomRight':
                    x = windowWidth - modalWidth - margin;
                    y = windowHeight - modalHeight - margin;
                    break;
                default:
                    x = 0;
                    y = 0;
            }
            setPosition({ x, y });
        }
    }, [positionCorner, open]);

    const onStart = () => {
        setDragging(true);

        if (dragRef.current) {
            const clientWidth = window.innerWidth;
            const clientHeight = window.innerHeight;
            const rect = dragRef.current.getBoundingClientRect();

            boundsRef.current = {
                left: -rect.left + 10,
                top: -rect.top + 10,
                right: clientWidth - rect.right - 10,
                bottom: clientHeight - rect.bottom - 10,
            };
        }
    };

    const onStop = (e: DraggableEvent, data: DraggableData) => {
        setDragging(false);
        console.log(e);

        if (boundsRef.current) {
            setPosition({
                x: clamp(data.x, boundsRef.current.left, boundsRef.current.right),
                y: clamp(data.y, boundsRef.current.top, boundsRef.current.bottom),
            });
        } else {
            setPosition({ x: data.x, y: data.y });
        }
    };

    return (
        <Modal
            title={
                <h3
                    className={`ant-modal-title ${styles['chat-modal__title']}`}
                    style={{ userSelect: dragging ? 'none' : 'auto' }}
                >
                    Чаты
                </h3>
            }
            open={open}
            onOk={onOk}
            onCancel={onCancel}
            footer={null}
            closeIcon={<CloseOutlined />}
            maskClosable={true}
            keyboard={true}
            mask={false}
            className={styles.chatModal}
            width={800}
            modalRender={(modal) =>
                draggable ? (
                    <Draggable
                        handle=".ant-modal-title"
                        bounds={boundsRef.current || undefined}
                        onStart={onStart}
                        onStop={onStop}
                        nodeRef={dragRef}
                        position={position}
                    >
                        <div ref={dragRef} className={styles.draggableWrapper}>
                            {modal}
                        </div>
                    </Draggable>
                ) : (
                    <div
                        ref={dragRef}
                        className={styles.draggableWrapper}
                        style={{
                            position: 'fixed',
                            left: position.x,
                            top: position.y,
                            margin: 0,
                        }}
                    >
                        {modal}
                    </div>
                )
            }
        >
            <ChatLayout />
        </Modal>
    );
};
