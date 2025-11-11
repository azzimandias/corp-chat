import type {AxiosInstance} from "axios";

export interface ChatParams {
    userdata: UserData,
    CSRF_TOKEN: string,
    PRODMODE: boolean,
    PROD_AXIOS_INSTANCE: AxiosInstance | null,
    HTTP_HOST: string
    BFF_PORT: number
}

export interface UserData {
    acls: number[],
    companies: Company[],
    user: User,
    mode: number,
    duration: number,
    status: number[],
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
    created_at: number,
    updated_at: number,
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
    passcard: string,
    id_role: number,
    email: string,
    sales_role: number,
    password2: string,
    active_company: number,
    id_departament: number,
    id_company: number,
    super: number | null,
}

export interface AlertInfo {
    message: string,
    description: string,
    type: "success" | "info" | "warning" | "error"
}

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

export interface Chat {
    chat_id: number,
    who: string,
    messages: ChatMessage[],
    total: number,
}

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

export interface Normalized {
    fromId: number,
    id: number,
    text: string,
    files: File[],
    timestamp: number,
    isSelf: boolean,
    senderName: string,
    isLocal: boolean,
    isSending: boolean,
    status: boolean,
    _raw: ChatMessage,
}

export interface messagesWithDividersInterface {
    type: string;
    id: string;
    timestamp?: number;
    message?: Normalized;
}