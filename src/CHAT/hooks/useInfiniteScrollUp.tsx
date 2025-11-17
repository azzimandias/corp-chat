import {type RefObject, useEffect, useRef} from 'react';

/**
 * Хук для подгрузки сообщений при скролле вверх.
 * Работает даже если DOM-элементы пересоздаются при обновлении.
 *
 * @param {object} params - объект конфигурации
 * @param {React.RefObject} params.containerRef - контейнер с сообщениями, за которым следим
 * @param {function} params.fetchMoreMessages - метод выполняемый в точке офсета
 * @param {boolean} params.hasMore - флаг надо ли еще реагировать на офсет
 * @param {number} [params.offset=100] - офсет, расстояние до топа контейнера, в котором срабатывает метод
 */

interface hookParams {
    containerRef: RefObject<HTMLDivElement | null>,
    fetchMoreMessages: () => void;
    hasMore: boolean;
    offset: number;
}

export const useInfiniteScrollUp = ({
                                        containerRef,
                                        fetchMoreMessages,
                                        hasMore,
                                        offset = 100,
                                    }: hookParams) => {
    const isFetchingRef = useRef(false);
    const topVisibleIdRef = useRef<string | undefined>(null);
    const topVisibleOffsetTopRef = useRef(0);
    const prevScrollTopRef = useRef(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !fetchMoreMessages) return;

        // Сохраняем верхнее видимое сообщение (id и offsetTop)
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                if (visible.length > 0) {
                    const topEl = visible[0].target as HTMLDivElement;
                    topVisibleIdRef.current = getMessageId(topEl);
                    // offsetTop даёт позицию внутри контента (от начала scrollable)
                    topVisibleOffsetTopRef.current = topEl.offsetTop;
                    prevScrollTopRef.current = container.scrollTop;
                }
            },
            { root: container, threshold: 0 }
        );

        const getMessageId = (el: HTMLDivElement) => el.dataset.id;

        const observeMessages = () => {
            const messages = container.querySelectorAll('.message');
            messages.forEach((m) => observer.observe(m));
        };

        observeMessages();

        const waitImagesLoaded = (root: HTMLElement, timeout: number = 2000) => {
            const imgs = Array.from(root.querySelectorAll('img'));
            if (imgs.length === 0) return Promise.resolve();

            const pending = imgs
                .filter((img) => !img.complete)
                .map((img) =>
                    new Promise<void>((resolve) => {
                        const onDone = () => {
                            img.removeEventListener('load', onDone);
                            img.removeEventListener('error', onDone);
                            resolve();
                        };
                        img.addEventListener('load', onDone);
                        img.addEventListener('error', onDone);
                    })
                );

            if (pending.length === 0) return Promise.resolve();

            // ограничиваем ожидание таймаутом
            return Promise.race([
                Promise.all(pending),
                new Promise<void>((resolve) => setTimeout(resolve, timeout)),
            ]);
        };

        const handleScroll = async () => {
            if (isFetchingRef.current || !hasMore) return;
            if (container.scrollTop > offset) return;

            isFetchingRef.current = true;

            // Сохраняем id и позицию (offsetTop) до подгрузки
            const savedId = topVisibleIdRef.current;
            const savedOffsetTop = topVisibleOffsetTopRef.current;
            const savedScrollTop = prevScrollTopRef.current ?? container.scrollTop;
            const prevScrollHeight = container.scrollHeight;

            // Выполняем подгрузку
            fetchMoreMessages();
            // Ждём, пока картинки загрузятся и DOM стабилизируется
            await waitImagesLoaded(container, 200);

            // Двойной rAF — помогает дождаться реального layout
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (savedId != null) {
                        const newScrollHeight = container.scrollHeight;
                        const selector = `.message[data-id="${savedId}"]`;
                        const sameMessage = container.querySelector(selector) as HTMLDivElement;

                        if (sameMessage) {
                            const newOffsetTop = sameMessage.offsetTop;
                            const delta = newOffsetTop - (savedOffsetTop || 0);

                            // Если newOffsetTop не изменился — компенсируем разницу по scrollHeight
                            const scrollHeightDiff = newScrollHeight - prevScrollHeight;

                            container.scrollTop = (savedScrollTop || 0) + (delta || scrollHeightDiff);
                        }
                    }

                    // Обновляем наблюдаемую коллекцию сообщений
                    observer.disconnect();
                    observeMessages();

                    isFetchingRef.current = false;
                });
            });
        };

        container.addEventListener('scroll', handleScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, [
        containerRef,
        fetchMoreMessages,
        hasMore,
        offset,
    ]);
};