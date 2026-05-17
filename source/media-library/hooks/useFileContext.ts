import { Attachment, MediaContextMenu } from "~/types/media/media";
import useMediaActions from "./useMediaActions";

type HandleFileContextParams = {
    key: MediaContextMenu;
    attachments: Attachment[];
};

const useFileContext = () => {
    const {
        getFileLink,
        openMediaEdit,
        restoreFile,
        deleteFile,
    } = useMediaActions();

    const handleFileContext = ({
        key,
        attachments,
    }: HandleFileContextParams) => {
        const ids = attachments?.map((attachment) => attachment?.id) ?? [];

        switch (key) {
            case "open":
                return;
            case "view":
                return;
            case "get":
                getFileLink(attachments[0]);
                return;
            case "edit":
                openMediaEdit(ids?.[0]);
                return;
            case "download":
                return;
            case "duplicate":
                return;
            case "replace":
                return;
            case "favorite":
                return;
            case "unfavorite":
                return;
            case "apply":
                return;
            case "remove":
                return;
            case "trash":
                return;
            case "restore":
                restoreFile(ids);
                return;
            case "delete":
                deleteFile(ids);
                return;
            default: {
                const exhaustiveCheck: never = key;
                return exhaustiveCheck;
            }
        }
    };

    return handleFileContext;
};

export default useFileContext;
