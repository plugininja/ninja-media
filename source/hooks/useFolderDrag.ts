import { useState, useEffect, useCallback, useRef } from "@wordpress/element";
import { Meta } from "~/media-library/components/context/FolderDragContext";

type DragState = {
    isDragging: boolean;
    folderId: string | number | null;
    x: number;
    y: number;
    hoveredFolderId: string | null;
    meta: Meta;
};

const DRAG_THRESHOLD = 6;

export const useFolderDrag = (
    onDrop: (targetId: string | number, draggedId: string | number) => void,
) => {
    const [drag, setDrag] = useState<DragState>({
        isDragging: false,
        folderId: null,
        x: 0,
        y: 0,
        hoveredFolderId: null,
        meta: {
            folder: {} as Meta["folder"],
            active: false,
            isExpanded: false,
            theme: "default",
        },
    });

    const dragRef = useRef(drag);
    dragRef.current = drag;

    const pendingRef = useRef<{
        folderId: string | number;
        startX: number;
        startY: number;
        meta: Meta;
    } | null>(null);

    const startPending = useCallback(
        (
            folderId: string | number,
            startX: number,
            startY: number,
            meta: Meta,
        ) => {
            pendingRef.current = { folderId, startX, startY, meta };
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
                        folderId: pendingRef.current.folderId,
                        x: e.clientX,
                        y: e.clientY,
                        hoveredFolderId: null,
                        meta: pendingRef.current.meta,
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
                hoveredFolderId:
                    hoveredFolderId === String(dragRef.current.folderId)
                        ? null
                        : hoveredFolderId,
            }));
        };

        const onMouseUp = (e: MouseEvent) => {
            pendingRef.current = null;

            if (!dragRef.current.isDragging) return;

            const targetId = getInnermostFolderId(e.clientX, e.clientY);
            const draggedId = dragRef.current.folderId;

            if (targetId && draggedId && targetId !== String(draggedId)) {
                onDrop(targetId, draggedId);
            }

            setDrag({
                isDragging: false,
                folderId: null,
                x: 0,
                y: 0,
                hoveredFolderId: null,
                meta: {
                    folder: {} as Meta["folder"],
                    active: false,
                    isExpanded: false,
                    theme: "default",
                },
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
