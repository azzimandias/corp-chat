import {type RefObject, useEffect} from "react";
import type {messagesWithDividersInterface} from "../types/types.ts";

/**
 * Хук для притягивания скролла к низу контейнера, когда отправлено новое сообщение
 * или пришло новое сообщение, если скролл находится в офсете (близко к низу контейнера)
 *
 * @param {object} params - объект конфигурации
 * @param {Array} params.messagesWithDividers - сообщения, их количество изменится - сработает хук
 * @param {React.RefObject} params.containerRef - контейнер с сообщениями, за которым следим
 * @param {number} [params.offset=100] - офсет, расстояние до низа контейнера
 */

interface hookParams {
    messagesWithDividers: messagesWithDividersInterface[];
    containerRef: RefObject<HTMLDivElement | null>;
    offset: number;
}

export const useScrollDown = ({
                                  messagesWithDividers,
                                  containerRef,
                                  offset = 100,
                              }: hookParams) => {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const isNearBottom = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            return scrollHeight - scrollTop - clientHeight <= offset;
        };

        const scrollToBottom = () => {
            container.scrollTop = container.scrollHeight;
        };

        if (isNearBottom()) {
            setTimeout(scrollToBottom, 0);
        }
    }, [messagesWithDividers, containerRef, offset]);
};
