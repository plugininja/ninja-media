import { useDragAttachments } from "../hooks/useDragAttachments";
import { createContext, useContext } from "@wordpress/element";
import { Attachment } from "~/types/media/media";
import DragTooltip from "./DragTooltip";

type DragContextValue = {
    isDragging: boolean;
    hoveredFolderId: string | null;
    startPending: (attachments: Attachment[], x: number, y: number) => void;
};

const DragContext = createContext<DragContextValue | null>(null);

export const useDragContext = () => {
    const context = useContext(DragContext);

    if (!context)
        throw new Error("useDragContext must be used within DragProvider");
    return context;
};

type Props = {
    children: React.ReactNode;
    onDrop: ({
        id,
        attachments,
    }: {
        id: string | number;
        attachments: Attachment[];
    }) => void;
};

export const DragProvider = ({ children, onDrop }: Props) => {
    const { drag, startPending } = useDragAttachments(onDrop);

    return (
        <DragContext.Provider
            value={{
                isDragging: drag.isDragging,
                hoveredFolderId: drag.hoveredFolderId,
                startPending,
            }}
        >
            {children}

            {drag.isDragging && (
                <DragTooltip
                    x={drag.x}
                    y={drag.y}
                    count={drag.attachments.length}
                />
            )}
        </DragContext.Provider>
    );
};
