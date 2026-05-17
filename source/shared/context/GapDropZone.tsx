const GapDropZone = ({
    isFolderDragging,
    draggedFolderId,
    onGapDrop,
}: {
    isFolderDragging: boolean;
    draggedFolderId: string | number | null;
    onGapDrop: (targetId: string | number) => void;
}) => {
    if (!isFolderDragging && !draggedFolderId)
        return (
            <div
                style={{
                    height: "5px",
                }}
            />
        );

    return (
        <div
            className="pnpnm-folder-tree__dropzone"
            onMouseUp={() => {
                if (!draggedFolderId) return;
                onGapDrop("root");
            }}
        />
    );
};

export default GapDropZone;
