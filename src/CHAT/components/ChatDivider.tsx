import { Divider } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';

export const ChatDivider = ({ children }: {children: string}) => {
    return (
        <Divider orientation="center" plain style={{ color: '#888' }}>
            <CalendarOutlined style={{ marginRight: 8 }} />
            {children}
        </Divider>
    );
};
