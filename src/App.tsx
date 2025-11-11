import './App.css'
import ChatBtn from "./CHAT/ChatBtn.tsx";
import {ChatSocketProvider, useChatSocket} from './CHAT/context/ChatSocketContext.tsx';
import type {ChatParams} from "./CHAT/types/types.ts";
import {useEffect} from "react";

const App = ({userdata, CSRF_TOKEN, PRODMODE, PROD_AXIOS_INSTANCE, HTTP_HOST, BFF_PORT}: ChatParams) => {

    const {
        setUserData,
        SET_CSRF_TOKEN,
        SET_PRODMODE,
        SET_PROD_AXIOS_INSTANCE,
    } = useChatSocket();

    useEffect(() => {
        if (userdata) setUserData(userdata);
        if (CSRF_TOKEN) SET_CSRF_TOKEN(CSRF_TOKEN);
        if (PRODMODE) SET_PRODMODE(PRODMODE);
        if (PROD_AXIOS_INSTANCE) SET_PROD_AXIOS_INSTANCE(PROD_AXIOS_INSTANCE);
    }, [
        setUserData,
        SET_CSRF_TOKEN,
        SET_PRODMODE,
        SET_PROD_AXIOS_INSTANCE,
    ]);

  return (
      <ChatSocketProvider url={!PRODMODE ? `http://localhost:${BFF_PORT}` : `${HTTP_HOST}:${BFF_PORT}`}>
          <ChatBtn userdata={userdata}/>
      </ChatSocketProvider>
  )
}

export default App;
