import { Attachment } from "~/types/media/media";
import useMediaActions from "./useMediaActions";

type FolderDropParams = {
    targetId: string | number;
    draggedId: string | number;
};

type FileDropParams = {
    id: string | number;
    attachments: Attachment[];
};

type RootDropParams = {
    targetId: string | number;
    draggedId: string | number;
    folderId: string | number;
};

const useDrop = () => {
    const {
        moveFolder,
        assignFile,
    } = useMediaActions();

    const handleFolderDrop = ({ targetId, draggedId }: FolderDropParams) => {
        moveFolder({
            target: targetId,
            drop: true,
            dragged: draggedId,
        });
    };

    const handleFileDrop = ({ id, attachments }: FileDropParams) => {
        const ids = attachments?.map((attachment) => attachment?.id) ?? [];

        if (id === "trash") {
            return;
        }

        assignFile(id, ids);
    };

    const handleRootDrop = ({
        targetId,
        draggedId,
        folderId,
    }: RootDropParams) => {
        moveFolder({
            target: targetId,
            drop: true,
            dragged: draggedId,
            folderId: folderId,
        });
    };

    return { handleFolderDrop, handleFileDrop, handleRootDrop };
};

export default useDrop;
