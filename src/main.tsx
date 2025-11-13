import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Chat from "./Chat.tsx";
import {
    FETCH_PARAMS,
    HTTP_PARAMS,
    MS_USER,
    SOCKET_ACTIONS,
    SOCKET_SUBSCRIBE
} from "./CHAT/mock/chatParams.ts";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Chat userdata={MS_USER}
          httpParams={HTTP_PARAMS}
          fetchParams={FETCH_PARAMS}
          socketSubscribe={SOCKET_SUBSCRIBE}
          socketActions={SOCKET_ACTIONS}
    />
  </StrictMode>,
)
