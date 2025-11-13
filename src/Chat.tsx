import './Chat.css'
import ChatBtn from "./CHAT/ChatBtn";
import {ChatSocketProvider, useChatSocket} from './CHAT/context/ChatSocketContext';
import type {ChatParams} from "./CHAT/types/types.ts";
import {useEffect} from "react";

const ChatInner = ({userdata, httpParams, fetchParams, socketSubscribe, socketActions}: ChatParams) => {
    const {
        setUserData,

        SET_HTTP_HOST,
        SET_CSRF_TOKEN,
        SET_PRODMODE,
        SET_PROD_AXIOS_INSTANCE,

        setFetchChatsListPath,
        setFetchChatMessagesPath,
        setSendSmsPath,
        setMarkMessagesAsReadPath,

        setSubscribeToChat,
        setNewSms,
        setUpdateSms,
    } = useChatSocket();

    useEffect(() => {
        console.log('userdata', userdata);
        console.log('httpParams', httpParams);
        console.log('fetchParams', fetchParams);
        console.log('socketSubscribe', socketSubscribe);
        console.log('socketActions', socketActions);

        if (userdata) setUserData(userdata);

        if (httpParams && httpParams?.HTTP_HOST) SET_HTTP_HOST(httpParams?.HTTP_HOST);
        if (httpParams && httpParams?.CSRF_TOKEN) SET_CSRF_TOKEN(httpParams?.CSRF_TOKEN);
        if (httpParams && httpParams?.PRODMODE) SET_PRODMODE(httpParams?.PRODMODE);
        if (httpParams && httpParams?.PROD_AXIOS_INSTANCE) SET_PROD_AXIOS_INSTANCE(httpParams?.PROD_AXIOS_INSTANCE);

        if (fetchParams && fetchParams?.fetchChatsListPath) setFetchChatsListPath(fetchParams?.fetchChatsListPath);
        if (fetchParams && fetchParams?.fetchChatMessagesPath) setFetchChatMessagesPath(fetchParams?.fetchChatMessagesPath);
        if (fetchParams && fetchParams?.sendSmsPath) setSendSmsPath(fetchParams?.sendSmsPath);
        if (fetchParams && fetchParams?.markMessagesAsReadPath) setMarkMessagesAsReadPath(fetchParams?.markMessagesAsReadPath);

        if (socketSubscribe && socketSubscribe?.subscribeToChat) setSubscribeToChat(socketSubscribe?.subscribeToChat);
        if (socketActions && socketActions?.newSms) setNewSms(socketActions?.newSms);
        if (socketActions && socketActions?.updateSms) setUpdateSms(socketActions?.updateSms);
    }, [
        userdata,
        httpParams,
        fetchParams,
        socketSubscribe,
        socketActions,

        setUserData,

        SET_HTTP_HOST,
        SET_CSRF_TOKEN,
        SET_PRODMODE,
        SET_PROD_AXIOS_INSTANCE,

        setFetchChatsListPath,
        setFetchChatMessagesPath,
        setSendSmsPath,
        setMarkMessagesAsReadPath,

        setSubscribeToChat,
        setNewSms,
        setUpdateSms,
    ]);

    return <ChatBtn userdata={userdata}/>;
}

const Chat = (props: ChatParams) => {
    const { httpParams } = props;

    useEffect(() => {
        console.log('CORP-CHAT MOUNTED')
    }, []);

    useEffect(() => {
        console.log('CORP-CHAT PARAMS', props)
    }, [props]);

    return (
        <ChatSocketProvider url={!httpParams?.PRODMODE ? `http://localhost:${httpParams?.BFF_PORT}` : `${httpParams?.HTTP_HOST}:${httpParams?.BFF_PORT}`}>
            <ChatInner {...props} />
        </ChatSocketProvider>
    )
}

export default Chat;
