import { useEffect, useRef } from "@wordpress/element";

export const useInfiniteScroll = ({
    hasMore,
    isFetching,
    onLoadMore,
    enabled = true,
}: {
    hasMore: boolean;
    isFetching: boolean;
    onLoadMore: () => void;
    enabled?: boolean;
}) => {
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        if (!enabled) return;

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isFetching) {
                    onLoadMore();
                }
            },
            { threshold: 0.1 },
        );

        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current);
        }

        return () => observerRef.current?.disconnect();
    }, [hasMore, isFetching, enabled, onLoadMore]);

    return { sentinelRef };
};
