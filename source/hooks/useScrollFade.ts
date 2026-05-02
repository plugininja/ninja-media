import { useState, useRef, useCallback } from "@wordpress/element";

const useScrollFade = () => {
    const [showFade, setShowFade] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    const checkFade = useCallback(() => {
        const el = ref.current;
        if (!el) return;

        const hasScroll = el.scrollHeight > el.clientHeight;

        const reachedBottom =
            el.scrollTop + el.clientHeight >= el.scrollHeight - 2;

        setShowFade(hasScroll && !reachedBottom);
    }, []);

    return { ref, showFade, checkFade };
};

export default useScrollFade;
