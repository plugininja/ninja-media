import { useContextMenu } from "~/components/contextMenu/ContextMenu";
import { selectSettings } from "~/redux/features/settings";
import { useEffect } from "@wordpress/element";
import { useDragContext } from "./DragContext";
import { useAppSelector } from "~/redux/hooks";

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

const Context = () => {
    const { data } = useAppSelector(selectSettings);
    const { startPending } = useDragContext();
    const { show } = useContextMenu();
    const $ = (window as any).jQuery as any;

    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (e.button !== 0 || !data?.general?.files?.bulkSelection) return;

            const target = e.currentTarget as HTMLElement | null;
            if (!target) return;

            const attachments = getAttachments(target);
            if (attachments.length === 0) return;

            startPending(attachments, e.clientX, e.clientY);
        };

        const handleContextMenu = (e: Event) => {
            const target = e.currentTarget as HTMLElement | null;
            if (!target || !data?.advanced?.action?.contextMenu) return;

            e.preventDefault();

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

        return () => {
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
        };
    }, [startPending, show]);

    return null;
};

export default Context;
