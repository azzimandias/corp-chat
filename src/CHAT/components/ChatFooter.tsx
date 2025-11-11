import styles from './style/Chat.module.css';
import { Button, Space, Popover } from 'antd';
import {
    DragOutlined,
    SettingOutlined,
    BellOutlined,
    DownloadOutlined,
    LockOutlined,
    EyeInvisibleOutlined,
} from '@ant-design/icons';

type Position = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

interface ChatFooterParams {
    draggable: boolean;
    setDraggable: (draggable: boolean) => void;
    position: Position | null;
    setPosition: (position: Position | null) => void;
}

export default function ChatFooter({ draggable, setDraggable, position, setPosition }: ChatFooterParams) {
    const cyclePosition = () => {
        if (!position) {
            setPosition('topRight');
            return;
        }

        const nextPosition: Record<Position, Position> = {
            topLeft: 'topRight',
            topRight: 'bottomRight',
            bottomRight: 'bottomLeft',
            bottomLeft: 'topLeft',
        };

        setPosition(nextPosition[position]);
    };

    const settingsContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button type="text" icon={<BellOutlined />}>
                Уведомления
            </Button>
            <Button type="text" icon={<DownloadOutlined />}>
                Автозагрузка файлов
            </Button>
            <Button type="text" icon={<LockOutlined />}>
                Приватность чата
            </Button>
            <Button type="text" icon={<EyeInvisibleOutlined />}>
                Скрыть из списка
            </Button>
        </div>
    );

    return (
        <div hidden>
            <button>Send</button>
            <footer hidden className={styles['chat-footer']}>
                <Space.Compact>
                    <Popover
                        content={draggable ? 'Отключить перетаскивание' : 'Включить перетаскивание'}
                        trigger="hover"
                    >
                        <Button
                            type="default"
                            onClick={() => {
                                setDraggable(!draggable);
                            }}
                        >
                            <DragOutlined />
                        </Button>
                    </Popover>

                    <Popover content="Переместить окно по углам экрана" trigger="hover">
                        <Button type="default" onClick={cyclePosition}>
                            <DragOutlined style={{ transform: 'rotate(45deg)' }} />
                        </Button>
                    </Popover>

                    <Popover content={settingsContent} trigger="hover" title="Настройки чата">
                        <Button type="default">
                            <SettingOutlined />
                        </Button>
                    </Popover>
                </Space.Compact>
            </footer>
        </div>
    );
}