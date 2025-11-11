import './App.css'
import ChatBtn from "./CHAT/ChatBtn.tsx";
import {ChatSocketProvider, useChatSocket} from './CHAT/context/ChatSocketContext.tsx';
import type {ChatParams} from "./CHAT/types/types.ts";
import {useEffect} from "react";

const AppContent = ({userdata, HTTP_HOST, CSRF_TOKEN, PRODMODE, PROD_AXIOS_INSTANCE}: ChatParams) => {
    const {
        setUserData,
        SET_HTTP_HOST,
        SET_CSRF_TOKEN,
        SET_PRODMODE,
        SET_PROD_AXIOS_INSTANCE,
    } = useChatSocket();

    useEffect(() => {
        if (userdata) setUserData(userdata);
        if (HTTP_HOST) SET_HTTP_HOST(HTTP_HOST);
        if (CSRF_TOKEN) SET_CSRF_TOKEN(CSRF_TOKEN);
        if (PRODMODE) SET_PRODMODE(PRODMODE);
        if (PROD_AXIOS_INSTANCE) SET_PROD_AXIOS_INSTANCE(PROD_AXIOS_INSTANCE);
    }, [
        userdata,
        HTTP_HOST,
        CSRF_TOKEN,
        PRODMODE,
        PROD_AXIOS_INSTANCE,
        setUserData,
        SET_HTTP_HOST,
        SET_CSRF_TOKEN,
        SET_PRODMODE,
        SET_PROD_AXIOS_INSTANCE,
    ]);

    return <ChatBtn userdata={userdata}/>;
}

const App = (props: ChatParams) => {
    const { PRODMODE, HTTP_HOST, BFF_PORT } = props;

    return (
        <ChatSocketProvider url={!PRODMODE ? `http://localhost:${BFF_PORT}` : `${HTTP_HOST}:${BFF_PORT}`}>
            <AppContent {...props} />
        </ChatSocketProvider>
    )
}

export default App;
