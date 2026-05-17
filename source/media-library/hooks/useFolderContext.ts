import { Folder, FolderContextMenu } from "~/types/folder";
import { useDeleteFolder } from "../actions/Delete";
import useMediaActions from "./useMediaActions";
import useMedia from "./useMedia";

type HandleFolderContextParams = {
    key: FolderContextMenu;
    folders: Folder[];
};

const useFolderContext = () => {
    const { setMedia, bulkSelect } = useMedia();

    const {
        moveFolder,
    } = useMediaActions();

    const { openDeleteFolder } = useDeleteFolder();

    const handleFolderContext = ({
        key,
        folders,
    }: HandleFolderContextParams) => {
        const folder = folders?.[0];

        switch (key) {
            case "new":
                setMedia("activeFolder", folder);
                setMedia("createFolder", { create: true, folder });
                return;
            case "color":
                return;
            case "rename":
                setMedia("renameFolder", { rename: true, folder });
                return;
            case "cut":
                setMedia("cutFolders", { cut: true, folders });

                if (bulkSelect) {
                    setMedia("bulkSelect", false);
                    setMedia("selectedFolders", []);
                }
                return;
            case "paste":
                setMedia("moveFolder", { move: true, id: folder?.id });
                moveFolder({
                    target: folder?.id,
                });
                return;
            case "duplicate":
                return;
            case "download":
                return;
            case "delete":
                openDeleteFolder(String(folder?.id));
                return;
            default: {
                const exhaustiveCheck: never = key;
                return exhaustiveCheck;
            }
        }
    };

    return handleFolderContext;
};

export default useFolderContext;
