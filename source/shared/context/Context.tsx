import { useContextMenu } from "~/components/contextMenu/ContextMenu";
import { useDragContext } from "~/shared/context/DragContext";
import { useEffect } from "@wordpress/element";
import useSettings from "~/hooks/useSettings";
import {
    TABLE_ADAPTERS,
    HANDLE_CLASS,
    getAdapterForRow,
} from "./tableAdapters";

type WpAttachment = { id: number; [key: string]: any };

const getAttachments = (target: HTMLElement): WpAttachment[] => {
    if (!window.wp?.media) return [];

    const selectedEls = Array.from(
        document.querySelectorAll(
            ".attachments-wrapper .attachment[aria-checked='true']",
        ),
    ) as HTMLElement[];

    if (selectedEls.length > 0) {
        return selectedEls
            .map((el) => {
                const idAttr = el.getAttribute("data-id");
                if (!idAttr) return null;

                return window.wp.media
                    .attachment(Number(idAttr))
                    .toJSON() as WpAttachment;
            })
            .filter(Boolean) as WpAttachment[];
    }

    const idAttr = target.getAttribute("data-id");
    if (!idAttr) return [];

    return [
        window.wp.media.attachment(Number(idAttr)).toJSON() as WpAttachment,
    ];
};

type WpPost = { id: number; [key: string]: any };

const getPostsForRow = (row: HTMLElement): WpPost[] => {
    const adapter = getAdapterForRow(row);
    if (!adapter) return [];

    const selectedIds = adapter.getSelectedPostIds();
    if (selectedIds.length > 0) {
        return selectedIds.map((id) => ({ id }));
    }

    const id = adapter.getPostId(row);
    return id ? [{ id }] : [];
};

const getType = (el: HTMLElement) => {
    if (el.closest(".attachments-wrapper")) return "attachment";

    if (TABLE_ADAPTERS.some((a) => el.closest(a.containerSelector)))
        return "post";

    return null;
};

const injectAllDragHandles = () => {
    TABLE_ADAPTERS.forEach((adapter) => {
        document
            .querySelectorAll<HTMLElement>(adapter.rowSelector)
            .forEach((row) => {
                adapter.injectHandle(row);

                row.addEventListener("mouseenter", () => {
                    row.style.cursor = "grab";
                });

                row.addEventListener("mouseleave", () => {
                    row.style.cursor = "";
                });
            });
    });
};

const Context = () => {
    const { data } = useSettings();
    const { startPending } = useDragContext();
    const { show } = useContextMenu();
    const $ = (window as any).jQuery as any;

    useEffect(() => {
        const enableDrag = data?.general?.files?.bulkSelection;
        const observers: MutationObserver[] = [];

        if (enableDrag) {
            injectAllDragHandles();

            TABLE_ADAPTERS.forEach((adapter) => {
                const container = document.querySelector<HTMLElement>(
                    adapter.containerSelector,
                );
                if (!container) return;

                const observer = new MutationObserver(injectAllDragHandles);
                observer.observe(container, { childList: true, subtree: true });
                observers.push(observer);
            });
        }

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button !== 0 || !enableDrag) return;

            const target = e.currentTarget as HTMLElement | null;
            if (!target) return;

            const type = getType(target);

            if (type === "attachment") {
                const attachments = getAttachments(target);
                if (attachments.length === 0) return;

                startPending(attachments, e.clientX, e.clientY);
            }

            if (type === "post") {
                const posts = getPostsForRow(target);
                if (posts.length === 0) return;

                const isHandle = (e.target as HTMLElement).classList.contains(
                    HANDLE_CLASS,
                );

                if (isHandle) {
                    e.preventDefault();

                    const adapter = getAdapterForRow(target);
                    const container = adapter
                        ? document.querySelector<HTMLElement>(
                              adapter.containerSelector,
                          )
                        : null;
                    if (container) container.style.userSelect = "none";

                    const onMouseUp = () => {
                        if (container) container.style.userSelect = "";
                        window.removeEventListener("mouseup", onMouseUp);
                    };
                    window.addEventListener("mouseup", onMouseUp);
                }

                startPending(posts, e.clientX, e.clientY);
            }
        };

        const handleContextMenu = (e: Event) => {
            const target = e.currentTarget as HTMLElement | null;
            if (!target || !data?.advanced?.action?.contextMenu) return;

            e.preventDefault();

            const type = getType(target);

            if (type === "attachment") {
                const attachments = getAttachments(target);
                if (attachments.length === 0) return;

                show(
                    "file-menu",
                    {
                        clientX: (e as MouseEvent).clientX,
                        clientY: (e as MouseEvent).clientY,
                        preventDefault: () => {},
                    } as any,
                    { attachments },
                );
            }
        };

        $(document).on(
            "mousedown",
            ".attachments-wrapper .attachment",
            handleMouseDown,
        );
        $(document).on(
            "contextmenu",
            ".attachments-wrapper .attachment",
            handleContextMenu,
        );

        TABLE_ADAPTERS.forEach((adapter) => {
            $(document).on("mousedown", adapter.rowSelector, handleMouseDown);
        });

        return () => {
            observers.forEach((o) => o.disconnect());

            document
                .querySelectorAll(`.${HANDLE_CLASS}`)
                .forEach((el) => el.remove());

            $(document).off(
                "mousedown",
                ".attachments-wrapper .attachment",
                handleMouseDown,
            );
            $(document).off(
                "contextmenu",
                ".attachments-wrapper .attachment",
                handleContextMenu,
            );

            TABLE_ADAPTERS.forEach((adapter) => {
                $(document).off(
                    "mousedown",
                    adapter.rowSelector,
                    handleMouseDown,
                );
            });
        };
    }, [startPending, show]);

    return null;
};

export default Context;
