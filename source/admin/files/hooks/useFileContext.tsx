import { useViewDetails } from "../components/FileDetails";
import { useDeleteFile } from "../components/Delete";
import { FileContextMenu } from "~/types/file/file";
import useFileActions from "./useFileActions";
import { File } from "~/types/file";
import useFile from "./useFile";

type HandleFileContextParams = {
    key: FileContextMenu;
    files: File[];
};

const useFileContext = () => {
    const { setFile } = useFile();

    const {
        getFileLink,
        restoreFile,
    } = useFileActions();

    const { openViewDetails } = useViewDetails();

    const { openDeleteFile } = useDeleteFile();

    const handleFileContext = ({ key, files }: HandleFileContextParams) => {
        const ids = files?.map((f) => f?.id) ?? [];

        switch (key) {
            case "open":
                window.open(
                    `${pnpnm?.siteUrl}/wp-admin/upload.php?item=${ids[0]}`,
                    "_blank",
                );
                return;
            case "view":
                setFile("detailsFile", files[0]);
                openViewDetails();
                return;
            case "get":
                getFileLink(files[0]);
                return;
            case "edit":
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
                openDeleteFile(ids);
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
