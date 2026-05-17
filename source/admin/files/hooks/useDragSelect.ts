import { useState, useRef, useEffect } from "@wordpress/element";
import { File } from "~/types/file";

interface DragSelectOptions {
    containerRef: React.RefObject<HTMLDivElement>;
    files: File[];
    onSelect: (selectedFiles: File[]) => void;
    isEnabled: boolean;
}

interface DragBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const useDragSelect = ({
    containerRef,
    files,
    onSelect,
    isEnabled,
}: DragSelectOptions) => {
    const [dragBox, setDragBox] = useState<DragBox | null>(null);
    const startPoint = useRef<{ x: number; y: number } | null>(null);
    const dragBoxRef = useRef<DragBox | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isEnabled || !containerRef.current) return;

        const target = e.target as HTMLElement;
        if (target.closest("button, input, a, label")) return;
        if (e.button !== 0) return;

        e.preventDefault();

        const rect = containerRef.current.getBoundingClientRect();
        startPoint.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };

        const box = {
            x: startPoint.current.x,
            y: startPoint.current.y,
            width: 0,
            height: 0,
        };

        dragBoxRef.current = box;
        setDragBox(box);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!startPoint.current || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const currentX = Math.min(
            Math.max(e.clientX - rect.left, 0),
            rect.width,
        );
        const currentY = Math.min(
            Math.max(e.clientY - rect.top, 0),
            rect.height,
        );

        const box = {
            x: Math.min(startPoint.current.x, currentX),
            y: Math.min(startPoint.current.y, currentY),
            width: Math.abs(currentX - startPoint.current.x),
            height: Math.abs(currentY - startPoint.current.y),
        };

        dragBoxRef.current = box;
        setDragBox(box);
    };

    const handleMouseUp = (e: MouseEvent) => {
        if (!startPoint.current || !containerRef.current) {
            setDragBox(null);
            dragBoxRef.current = null;
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const currentX = Math.min(
            Math.max(e.clientX - rect.left, 0),
            rect.width,
        );
        const currentY = Math.min(
            Math.max(e.clientY - rect.top, 0),
            rect.height,
        );

        const dragDistance = Math.sqrt(
            (currentX - startPoint.current.x) ** 2 +
                (currentY - startPoint.current.y) ** 2,
        );

        if (dragDistance < 5) {
            setDragBox(null);
            dragBoxRef.current = null;
            startPoint.current = null;
            return;
        }

        const currentDragBox = dragBoxRef.current;
        const selected: File[] = [];

        files.forEach((file) => {
            const el = document.querySelector<HTMLElement>(
                `[data-file-id="${file.id}"]`,
            );
            if (!el || !currentDragBox) return;

            const elRect = el.getBoundingClientRect();

            const overlap =
                currentDragBox.x + rect.left < elRect.right &&
                currentDragBox.x + currentDragBox.width + rect.left >
                    elRect.left &&
                currentDragBox.y + rect.top < elRect.bottom &&
                currentDragBox.y + currentDragBox.height + rect.top >
                    elRect.top;

            if (overlap) selected.push(file);
        });

        onSelect(selected);

        startPoint.current = null;
        dragBoxRef.current = null;
        setDragBox(null);
    };

    useEffect(() => {
        if (!isEnabled) {
            setDragBox(null);
            dragBoxRef.current = null;
            startPoint.current = null;
            return;
        }

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isEnabled, files, onSelect]);

    return { dragBox, handleMouseDown };
};
