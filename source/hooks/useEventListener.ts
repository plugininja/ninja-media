import { useCallback, useEffect, useRef } from "@wordpress/element";

type ElementType = Window | Document | HTMLElement | SVGElement;

type EventNameType<T extends ElementType> = T extends Window
    ? keyof WindowEventMap | string
    : T extends HTMLElement
    ? keyof HTMLElementEventMap | string
    : T extends SVGElement
    ? keyof SVGElementEventMap | string
    : keyof DocumentEventMap | string;

type EventTypeFromMap<EventMap, K extends string> = K extends keyof EventMap
    ? EventMap[K]
    : Event;

type EventType<T extends ElementType, K extends string> = T extends Window
    ? EventTypeFromMap<WindowEventMap, K>
    : T extends HTMLElement
    ? EventTypeFromMap<HTMLElementEventMap, K>
    : T extends SVGElement
    ? EventTypeFromMap<SVGElementEventMap, K>
    : EventTypeFromMap<DocumentEventMap, K>;

type UseEventListenerOptions = AddEventListenerOptions & {
    selector?: string;
};

export const useEventListener = <
    T extends ElementType,
    K extends EventNameType<T>,
>(
    eventName: K,
    handler: (
        event: EventType<T, K & string>,
        delegateTarget?: Element,
    ) => void,
    element?: T | null,
    options?: UseEventListenerOptions | boolean,
) => {
    const savedHandler = useRef<typeof handler>(handler);

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    const eventListener = useCallback(
        (event: Event) => {
            if (typeof options !== "object" || !options.selector) {
                savedHandler.current(event as EventType<T, K & string>);
                return;
            }

            const target = event.target as Element;
            if (target && target.closest) {
                const delegateTarget = target.closest(options.selector);
                if (delegateTarget) {
                    savedHandler.current(
                        event as EventType<T, K & string>,
                        delegateTarget,
                    );
                }
            }
        },
        [options],
    );

    useEffect(() => {
        const targetElement = element ?? window;
        if (!targetElement || !("addEventListener" in targetElement)) {
            console.warn(
                `Cannot attach ${eventName} listener: Invalid target element`,
            );
            return;
        }

        let eventOptions = options;

        if (typeof options === "object") {
            const { selector, ...standardOptions } = options;
            eventOptions = standardOptions;
        }

        targetElement.addEventListener(eventName, eventListener, eventOptions);

        return () => {
            targetElement.removeEventListener(
                eventName,
                eventListener,
                eventOptions,
            );
        };
    }, [eventName, element, eventListener, options]);
};
