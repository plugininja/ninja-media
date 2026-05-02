import { createContext, useContext } from "@wordpress/element";
import { useFolderDrag } from "~/hooks/useFolderDrag";
import { Folder as FolderType } from "~/types/media";
import Folder from "../folder/Folder";

export type Meta = {
    folder: FolderType;
    active: boolean;
    isExpanded: boolean;
    theme: "default" | "windows" | "google-drive" | "dropbox";
};

type FolderDragContextValue = {
    isFolderDragging: boolean;
    hoveredFolderId: string | null;
    draggedFolderId: string | number | null;
    startFolderDrag: (
        folderId: string | number,
        x: number,
        y: number,
        meta: Meta,
    ) => void;
    onGapDrop: (
        parentId: string | number,
        draggedId: string | number,
        folderId: string | number,
    ) => void;
};

const FolderDragContext = createContext<FolderDragContextValue | null>(null);

export const useFolderDragContext = () => {
    const context = useContext(FolderDragContext);
    if (!context)
        throw new Error(
            "useFolderDragContext must be used within FolderDragProvider",
        );
    return context;
};

type Props = {
    children: React.ReactNode;
    onDrop: (targetId: string | number, draggedId: string | number) => void;
    onGapDrop: (
        parentId: string | number,
        draggedId: string | number,
        folderId: string | number,
    ) => void;
};

export const FolderDragProvider = ({ children, onDrop, onGapDrop }: Props) => {
    const { drag, startPending } = useFolderDrag(onDrop);

    const { folder, active, isExpanded, theme } = drag?.meta ?? {};

    const { id, name, color, attachmentCount } = folder || {};

    return (
        <FolderDragContext.Provider
            value={{
                isFolderDragging: drag.isDragging,
                hoveredFolderId: drag.hoveredFolderId,
                draggedFolderId: drag.folderId,
                startFolderDrag: startPending,
                onGapDrop: onGapDrop,
            }}
        >
            {children}

            {drag.isDragging && (
                <Folder
                    theme={theme}
                    id={id}
                    name={name}
                    color={color}
                    count={attachmentCount}
                    active={active}
                    open={isExpanded}
                    bgWhite
                    style={{
                        position: "fixed",
                        top: drag.y + 14,
                        left: drag.x + 14,
                        zIndex: 99999,
                        transition: "none",
                        width: "270px",
                    }}
                    className="pnpnm-folder-drag-tooltip"
                />
            )}
        </FolderDragContext.Provider>
    );
};
