import './Chat.css'
import ChatBtn from "./CHAT/ChatBtn";
import {ChatSocketProvider, useChatSocket} from './CHAT/context/ChatSocketContext';
import type {ChatParams} from "./CHAT/types/types.ts";
import {useEffect} from "react";

const ChatInner = ({
                       userdata,
                       httpParams,
                       fetchParams,
                       socketSubscribe,
                       socketActions
}: ChatParams) => {
    const {
        setUserData,

        SET_HTTP_HOST,
        SET_CSRF_TOKEN,
        SET_PRODMODE,
        SET_BFF_PORT,

        setFetchChatsListPath,
        setFetchChatMessagesPath,
        setSendSmsPath,
        setMarkMessagesAsReadPath,

        setSubscribeToChat,
        setNewSms,
        setUpdateSms,

        setInit,
    } = useChatSocket();

    useEffect(() => {
        console.log('CORP-CHAT userdata', userdata);
        console.log('CORP-CHAT httpParams', httpParams);
        console.log('CORP-CHAT fetchParams', fetchParams);
        console.log('CORP-CHAT socketSubscribe', socketSubscribe);
        console.log('CORP-CHAT socketActions', socketActions);

        let userdataFlag = false;
        let httpParamsFlag = false;
        let fetchParamsFlag = false;
        let socketSubscribeFlag = false;
        let socketActionsFlag = false;

        if (userdata) setUserData(userdata);
        if (userdata) userdataFlag = true;

        if (httpParams && httpParams?.HTTP_HOST) SET_HTTP_HOST(httpParams?.HTTP_HOST);
        if (httpParams && httpParams?.CSRF_TOKEN) SET_CSRF_TOKEN(httpParams?.CSRF_TOKEN);
        if (httpParams && httpParams?.PRODMODE) SET_PRODMODE(httpParams?.PRODMODE);
        if (httpParams && httpParams?.BFF_PORT) SET_BFF_PORT(httpParams?.BFF_PORT);
        if (httpParams && httpParams?.HTTP_HOST && httpParams?.CSRF_TOKEN && httpParams?.PRODMODE && httpParams?.BFF_PORT)
            httpParamsFlag = true;

        if (fetchParams && fetchParams?.fetchChatsListPath) setFetchChatsListPath(fetchParams?.fetchChatsListPath);
        if (fetchParams && fetchParams?.fetchChatMessagesPath) setFetchChatMessagesPath(fetchParams?.fetchChatMessagesPath);
        if (fetchParams && fetchParams?.sendSmsPath) setSendSmsPath(fetchParams?.sendSmsPath);
        if (fetchParams && fetchParams?.markMessagesAsReadPath) setMarkMessagesAsReadPath(fetchParams?.markMessagesAsReadPath);
        if (fetchParams && fetchParams?.fetchChatsListPath && fetchParams?.fetchChatMessagesPath && fetchParams?.sendSmsPath && fetchParams?.markMessagesAsReadPath)
            fetchParamsFlag = true;

        if (socketSubscribe && socketSubscribe?.subscribeToChat) setSubscribeToChat(socketSubscribe?.subscribeToChat);
        if (socketSubscribe && socketSubscribe?.subscribeToChat) socketSubscribeFlag = true;

        if (socketActions && socketActions?.newSms) setNewSms(socketActions?.newSms);
        if (socketActions && socketActions?.updateSms) setUpdateSms(socketActions?.updateSms);
        if (socketActions && socketActions?.newSms && socketActions?.updateSms) socketActionsFlag = true;

        if (userdataFlag && httpParamsFlag && fetchParamsFlag && socketSubscribeFlag && socketActionsFlag)
            setInit(true);
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
        SET_BFF_PORT,

        setFetchChatsListPath,
        setFetchChatMessagesPath,
        setSendSmsPath,
        setMarkMessagesAsReadPath,

        setSubscribeToChat,
        setNewSms,
        setUpdateSms,

        setInit,
    ]);

    return <ChatBtn userdata={userdata}/>;
}

const Chat = (props: ChatParams) => {
    const {
        userdata,
        httpParams,
        fetchParams,
        socketSubscribe,
        socketActions
    } = props;

    useEffect(() => {
        console.log('CORP-CHAT MOUNTED')
    }, []);

    useEffect(() => {
        console.log('CORP-CHAT PARAMS', props)
    }, [props]);


    return (
        <div>
            {userdata && httpParams && fetchParams && socketSubscribe && socketActions ? (
                <ChatSocketProvider>
                    <ChatInner {...props} />
                </ChatSocketProvider>
            ) : (
                <div>AAAAdd userdata, httpParams, fetchParams, socketSubscribe, socketActions</div>
            )}
        </div>
    );
}

export default Chat;
