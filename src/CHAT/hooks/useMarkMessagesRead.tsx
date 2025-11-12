import {type RefObject, useEffect, useRef} from 'react';
import type {messagesWithDividersInterface} from "../types/types.ts";

/**
 * Хук, который вызывает колбэк метод когда во вьюпорт попадает конкретный объект
 * (например в чате со скроллом появляется непрочитанное сообщение)
 *
 * @param {object} params - объект конфигурации
 * @param {Array} params.messagesWithDividers - сообщения, их количество изменится - сработает хук
 * @param {number} params.currentUserId - id пользователя
 * @param {number} [params.chatId] - id чата
 * @param {React.RefObject} params.containerRef - контейнер с сообщениями, за которым следим
 * @param {function} [params.markMessagesAsRead] - функция срабатываемая при попадании сообщения в observer
 */

interface hookParams {
    messagesWithDividers: messagesWithDividersInterface[];
    currentUserId: number | null;
    chatId: number;
    containerRef: RefObject<HTMLDivElement | null>;
    markMessagesAsRead: (messageIds: (number | undefined)[]) => void;
}

export const useMarkMessagesRead = ({
                                        messagesWithDividers,
                                        currentUserId,
                                        chatId,
                                        containerRef,
                                        markMessagesAsRead
                                    }: hookParams) => {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const processedMessagesRef = useRef(new Set());

    useEffect(() => {
        if (!messagesWithDividers.length || !markMessagesAsRead || !containerRef?.current) return;

        const timeout = setTimeout(() => {
            const unreadMessages = messagesWithDividers
                .filter(item => item.type !== 'divider' && item.message)
                .filter(item => {
                    const fromId = item.message?.fromId;
                    return fromId !== undefined && +fromId === +chatId;
                })
                .filter(item => !item.message?.status)
                .map(item => {
                    const messageId = item.message?.id;
                    if (!messageId) return null;

                    const element = document.querySelector<HTMLDivElement>(`[data-message-id="${messageId}"]`);
                    return element ? { id: messageId, element } : null;
                })
                .filter((item): item is { id: number; element: HTMLDivElement } =>
                    item !== null
                );

            console.log(unreadMessages);
            if (unreadMessages.length === 0) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    const newlyVisible: (number | undefined)[] = [];

                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const target = entry.target as HTMLElement;
                            const messageId = Number(target.dataset.messageId);
                            if (!processedMessagesRef.current.has(messageId)) {
                                newlyVisible.push(messageId);
                                processedMessagesRef.current.add(messageId);
                            }
                        }
                    });

                    if (newlyVisible.length > 0) {
                        markMessagesAsRead(newlyVisible);
                    }
                },
                {
                    root: containerRef.current,
                    threshold: 0.3,
                    rootMargin: '0px 0px 100px 0px'
                }
            );

            observerRef.current = observer;

            unreadMessages.forEach(({ element }) => observer.observe(element));

        }, 0);

        return () => clearTimeout(timeout);
    }, [messagesWithDividers, currentUserId, chatId, containerRef?.current, markMessagesAsRead]);


    // Очищаем processedMessages при смене чата
    useEffect(() => {
        processedMessagesRef.current.clear();
    }, [chatId]);
};