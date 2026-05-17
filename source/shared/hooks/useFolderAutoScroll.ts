import { useRef } from "@wordpress/element";

export const useFolderAutoScroll = () => {
    const scrollLock = useRef(false);

    const scrollToFolder = (folderId: string) => {
        if (scrollLock.current) return;

        const el = document.querySelector(
            `[data-folder-id="${folderId}"]`,
        ) as HTMLElement | null;

        const container = document.querySelector(
            ".pnpnm-folder-tree__list",
        ) as HTMLElement | null;

        if (!el || !container) return;

        scrollLock.current = true;

        requestAnimationFrame(() => {
            const containerRect = container.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();

            const target =
                container.scrollTop +
                (elRect.top - containerRect.top) -
                containerRect.height * 0.35;

            container.scrollTo({
                top: Math.max(0, target),
                behavior: "smooth",
            });

            setTimeout(() => {
                scrollLock.current = false;
            }, 500);
        });
    };

    return { scrollToFolder };
};
