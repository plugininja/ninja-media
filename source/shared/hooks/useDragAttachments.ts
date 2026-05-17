import { useState, useEffect, useCallback, useRef } from "@wordpress/element";
import { Attachment } from "~/types/media/media";

type DragState = {
    isDragging: boolean;
    attachments: Attachment[];
    x: number;
    y: number;
    hoveredFolderId: string | null;
};

const DRAG_THRESHOLD = 6;

export const useDragAttachments = (
    onDrop: ({
        id,
        attachments,
    }: {
        id: string | number;
        attachments: Attachment[];
    }) => void,
) => {
    const [drag, setDrag] = useState<DragState>({
        isDragging: false,
        attachments: [],
        x: 0,
        y: 0,
        hoveredFolderId: null,
    });

    const dragRef = useRef(drag);
    dragRef.current = drag;

    const pendingRef = useRef<{
        attachments: Attachment[];
        startX: number;
        startY: number;
    } | null>(null);

    const startPending = useCallback(
        (attachments: Attachment[], startX: number, startY: number) => {
            pendingRef.current = { attachments, startX, startY };
        },
        [],
    );

    useEffect(() => {
        const getInnermostFolderId = (x: number, y: number): string | null => {
            const el = document.elementFromPoint(x, y);
            const folderEl = el?.closest(
                "[data-folder-id]",
            ) as HTMLElement | null;
            return folderEl?.dataset?.folderId ?? null;
        };

        const onMouseMove = (e: MouseEvent) => {
            if (pendingRef.current && !dragRef.current.isDragging) {
                const dx = Math.abs(e.clientX - pendingRef.current.startX);
                const dy = Math.abs(e.clientY - pendingRef.current.startY);

                if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
                    setDrag({
                        isDragging: true,
                        attachments: pendingRef.current.attachments,
                        x: e.clientX,
                        y: e.clientY,
                        hoveredFolderId: null,
                    });
                }
                return;
            }

            if (!dragRef.current.isDragging) return;

            const hoveredFolderId = getInnermostFolderId(e.clientX, e.clientY);

            setDrag((prev) => ({
                ...prev,
                x: e.clientX,
                y: e.clientY,
                hoveredFolderId,
            }));
        };

        const onMouseUp = (e: MouseEvent) => {
            pendingRef.current = null;

            if (!dragRef.current.isDragging) return;

            const folderId = getInnermostFolderId(e.clientX, e.clientY);

            if (folderId) {
                onDrop({
                    id: folderId,
                    attachments: dragRef.current.attachments,
                });
            }

            setDrag({
                isDragging: false,
                attachments: [],
                x: 0,
                y: 0,
                hoveredFolderId: null,
            });
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [onDrop]);

    return { drag, startPending };
};
