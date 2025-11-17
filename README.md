# Chat based on React + TypeScript + Vite

## Install

```bash
npm install corp-chat-library-antd-react-socket
```
## Usage
```tsx
import Chat from "corp-chat-library-antd-react-socket";

export default () => (
    <Chat userdata={userdata}
          httpParams={httpParams}
          fetchParams={fetchParams}
          socketSubscribe={socketSubscribe}
          socketActions={socketActions}
    />
);
```
## Props types 
```ts
export interface ChatParams {
    userdata: UserData;
    httpParams: HttpParams;
    fetchParams: FetchParams;
    socketSubscribe: SocketSubscribe;
    socketActions: SocketActions;
}

export interface HttpParams {
    CSRF_TOKEN: string;
    PRODMODE: boolean;
    HTTP_HOST: string;
    BFF_PORT: number;
}

export interface FetchParams {
    fetchChatsListPath: string;
    fetchChatMessagesPath: string;
    sendSmsPath: string;
    markMessagesAsReadPath: string;
}

export interface SocketSubscribe {
    subscribeToChat: string;
}

export interface SocketActions {
    newSms: string;
    updateSms: string;
}

export interface UserData {
    acls: number[],
    companies: Company[],
    user: User,
    mode: number,
    duration: number,
    status: number,
}

export interface Company {
    id: number,
    name: string,
    description: string,
    is_active: number,
    template_prefix: string,
    folder: string,
    color: string,
    ext_address_offers: string,
    path_logo: string,
    places: Place[],
}

export interface Place {
    id: number,
    name: string,
    label: string,
    accessgroup: number,
    accessname: string,
    position: number,
    place: number,
}

export interface User {
    id: number,
    name: string,
    surname: string,
    secondname: string,
    occupy: string,
    passcard: string | null | undefined,
    id_role: number,
    email: string | null | undefined,
    sales_role: number,
    password2: string,
    active_company: number,
    id_departament: number,
    id_company: number,
    super?: number | null,
}
```

## HttpParams
CSRF_TOKEN - session token for backend;\
PRODMODE - use fetches and socked, or use mocks;\
HTTP_HOST - host;\
BFF_PORT - socket port (HTTP_HOST:BFF_PORT);

## Fetches
### "fetchChatsListPath"
payload:
```ts
const payload = {
    "data": {
        "search": "" // search string
    },
    "_token": "jklgjl4494033gfgf342sddgLFRE" 
}
```

expected response format:
```ts
export interface fetchChatsListPathResponse {
    content: {
        sms: ChatToList[],    // last message from all chats
        total_unread: number, // the number of all unread messages in all chats
    }
}
```
---

### "fetchChatMessagesPath"
When you scroll up the chat, a pack of older messages will be loaded.\
payload:
```ts
const payload = {
    "data": {
        "last_id": null // ID of the oldest message in the pack, null on first time
    },
    "_token": "006GmuwH1vmrE8OdOIax4ySEd3FDreDD1u78t5ll"
}
```

expected response format:
```ts
export interface fetchChatMessagesPathResponse {
    "content": {
        "messages": [
            {
                "id": 626,
                "from_id": 584,
                "answer": null,
                "text": "text",
                "files": [
                    {
                        "id": 23,
                        "route": "files/files_1_644_check_1.png",
                        "extension": "png",
                        "name": "files_1_644_check_1.png"
                    }
                ],
                "status": true,
                "created_at": 1762419672,
                "updated_at": 1762420765
            },
            /* ... */
        ],
        "who": "Name Surname",
        "total": 19
    },
    "message": "OK!"
}
```
---

### "sendSmsPath"
When you scroll up the chat, a pack of older messages will be loaded.\
formData payload:
```
------WebKitFormBoundary3wAFUZxrYC6BqiuX
Content-Disposition: form-data; name="_token"

006GmuwH1vmrE8OdOIax4ySEd3FDreDD1u78t5ll
------WebKitFormBoundary3wAFUZxrYC6BqiuX
Content-Disposition: form-data; name="data"

{
    "to":584,
    "text":"text",
    "answer":null,
    "timestamp":1763373631
}
------WebKitFormBoundary3wAFUZxrYC6BqiuX
Content-Disposition: form-data; name="file[]"; filename="211751_gear_icon.svg"
Content-Type: image/svg+xml


------WebKitFormBoundary3wAFUZxrYC6BqiuX--
```

expected response format:
```ts
export interface sendSmsPathResponse {
    "message": "OK!",
    "id": 645,
    "timestamp": 1763373631,
    "left": {
        "id": 645,
        "chat_id": 584,
        "from": {
            "surname": "Surname",
            "name": "Name",
            "id": 566
        },
        "to": {
            "surname": "Surname",
            "name": "Name",
            "id": 584
        },
        "text": "text",
        "status": false,
        "files": [],
        "created_at": 1763373631,
        "updated_at": 1763373631,
        "count_unread": 1,
        "total_unread": 1
    },
    "files": [
        {
            "id": 24,
            "route": "files/files_1_646_211751_gear_icon.svg",
            "extension": "svg",
            "name": "files_1_646_211751_gear_icon.svg"
        }
    ]
}
```
---

### "markMessagesAsReadPath"
payload:
```ts
const payload = {
    "_token": "kvZJHSrj3JPJjyIthLPaCmjiYkb7H1TvATqJlxgE"
}
```

expected response format:
```ts
export interface markMessagesAsReadPathResponse {
    "message": "OK!",
    "sms": {
        "id": 646,
        "from": 46,
        "to": 584,
        "answer_id": null,
        "text": "text",
        "status": true,
        "created_at": 1763374396,
        "updated_at": 1763374626,
        "count_unread": 0,
        "total_unread": 0
    }
}
```
---

## Socket
"subscribeToChat" expects the name of the event in which the user joins the room.\
Example: 
```js
socket.on('expamleSubscribeToChatName', (userId) => { 
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    console.log(`User ${socket.id} joined personal room ${userRoom}`);
    socket.join('CHAT');
})
```

---

New message received event: "newSms"

The socket must return in this format:
```ts
export interface NewSmsResponse {
    left: ChatToList,
    rigth: ChatMessage,
}
```

Message format for the message list: 
```ts
export interface ChatToList {
    id: number | undefined,
    chat_id: number | undefined,
    text: string,
    files: string[],
    status: boolean,
    created_at: number,
    updated_at: number,
    count_unread: number,
    from: From,
    to: To,
    to_id?: number,
    from_id?: number,
    last_message?: number,
}

export interface From {
    id: number | undefined,
    name: string,
    surname: string,
}

export interface To {
    id: number | undefined,
    name: string,
    surname: string,
}
```
Message format for the opened chat:
```ts
export interface ChatMessage {
    id: number,
    from_id: number,
    answer: number | null,
    text: string,
    files: File[],
    status: boolean,
    created_at: number,
    updated_at: number,
    from?: number,
    isLocal?: boolean,
    isSending?: boolean,
}

export interface File {
    id: number,
    route: string,
    extension: string,
    name: string,
}
```

---
Updated message received event: "updateSms"

The socket must return in this format:
```ts
export interface ChatMessage {
    id: number,
    from_id: number,
    answer: number | null,
    text: string,
    files: File[],
    status: boolean,
    created_at: number,
    updated_at: number,
    from?: number,
    isLocal?: boolean,
    isSending?: boolean,
}
```


---
## Generated md
This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
