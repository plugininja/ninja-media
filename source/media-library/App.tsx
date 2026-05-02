import { FolderDragProvider } from "./components/context/FolderDragContext";
import AttachmentTooltip from "./components/context/AttachmentTooltip";
import { useDuplicateFolder } from "./components/actions/Duplicate";
import { MenuProvider } from "~/components/contextMenu/ContextMenu";
import { DragProvider } from "./components/context/DragContext";
import FolderContext from "./components/context/FolderContext";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { useDeleteFolder } from "./components/actions/Delete";
import ReplaceMedia from "./components/context/ReplaceMedia";
import { DragAttachment } from "~/hooks/useDragAttachments";
import FileContext from "./components/context/FileContext";
import { selectSettings } from "~/redux/features/settings";
import FolderTree from "./components/folder/FolderTree";
import useMediaActions from "~/hooks/useMediaActions";
import Context from "./components/context/Context";
import Sidebar from "./components/sidebar/Sidebar";
import Topbar from "./components/topbar/Topbar";
import { useEffect } from "@wordpress/element";
import { Folder } from "~/types/media";
import { __ } from "@wordpress/i18n";
import {
    selectMedia,
    setActiveFolder,
    setBulkSelect,
    setCreateFolder,
    setCutFolders,
    setMoveFolder,
    setRenameFolder,
    setSelectedFolders,
} from "~/redux/features/media";

const App = () => {
    const { data } = useAppSelector(selectSettings);
    const { bulkSelect } = useAppSelector(selectMedia);
    const dispatch = useAppDispatch();

    const { openDuplicateFolder } = useDuplicateFolder();
    const { openDeleteFolder } = useDeleteFolder();

    const {
        moveFolder,
        downloadFolder,
        assignFile,
        trashFile,
        restoreFile,
        deleteFile,
    } = useMediaActions();

    const enableContextMenu =
        data?.advanced?.action?.contextMenu ??
        pnpnm?.settings?.advanced?.action?.contextMenu ??
        false;
    const enableDrag =
        data?.general?.files?.bulkSelection ??
        pnpnm?.settings?.general?.files?.bulkSelection ??
        false;
    const enableTooltip =
        data?.display?.settings?.detailsHover ??
        pnpnm?.settings?.display?.settings?.detailsHover ??
        false;
    const enableMediaReplace =
        data?.general?.files?.replaceMedia ??
        pnpnm?.settings?.general?.files?.replaceMedia ??
        false;

    useEffect(() => {
        if (!pnpnm?.settings?.display?.theme?.firstTime) return;

        const root = document?.documentElement;

        root?.style.setProperty("--pnpnm-primary", "#2271b1");
    }, []);

    const handleMenuClick = (
        key:
            | "new"
            | "color"
            | "rename"
            | "cut"
            | "paste"
            | "duplicate"
            | "download"
            | "delete",
        folder: Folder,
        folders: Folder[],
    ) => {
        switch (key) {
            case "new":
                dispatch(setActiveFolder(folder));
                dispatch(setCreateFolder({ create: true, folder }));
                break;
            case "rename":
                dispatch(setRenameFolder({ rename: true, folder }));
                break;
            case "cut":
                const cutFolders = folders?.length > 0 ? folders : [folder];
                dispatch(setCutFolders({ cut: true, folders: cutFolders }));
                if (bulkSelect) {
                    dispatch(setBulkSelect(false));
                    dispatch(setSelectedFolders([]));
                }
                break;
            case "paste":
                dispatch(setMoveFolder({ move: true, folderId: folder?.id }));
                moveFolder(folder?.id);
                break;
            case "duplicate":
                openDuplicateFolder(
                    String(folder?.parentId),
                    String(folder?.id),
                );
                break;
            case "download":
                const ids =
                    folders?.length > 0
                        ? folders?.map((f) => f?.id)
                        : [folder?.id];
                downloadFolder(ids);
                break;
            case "delete":
                openDeleteFolder(String(folder?.id));
                break;
            default:
                break;
        }
    };

    const handleFileMenuClick = (
        key: "trash" | "restore" | "delete",
        attachments: DragAttachment[],
    ) => {
        const ids = attachments?.map((att) => att?.id) ?? [];
        switch (key) {
            case "trash":
                trashFile(ids);
                break;
            case "restore":
                restoreFile(ids);
                break;
            case "delete":
                deleteFile(ids);
                break;
            default:
                break;
        }
    };

    const handleDrop = (
        folderId: string | number,
        attachments: DragAttachment[],
    ) => {
        const ids =
            attachments?.length > 0 ? attachments?.map((att) => att?.id) : [];
        if (folderId === "trash") {
            trashFile(ids);
            return;
        }
        assignFile(folderId, ids);
    };

    const handleFolderDrop = (
        targetId: string | number,
        draggedId: string | number,
    ) => {
        moveFolder(targetId, true, draggedId);
    };

    const handleGapDrop = (
        parentId: string | number,
        draggedId: string | number,
        folderId: string | number,
    ) => {
        moveFolder(parentId, true, draggedId, folderId);
    };

    return (
        <MenuProvider>
            <DragProvider onDrop={handleDrop}>
                <FolderDragProvider
                    onDrop={handleFolderDrop}
                    onGapDrop={handleGapDrop}
                >
                    <Sidebar>
                        <Topbar />

                        <FolderTree />
                    </Sidebar>

                    {(enableContextMenu || enableDrag) && <Context />}

                    {enableTooltip && <AttachmentTooltip />}

                    {enableMediaReplace && <ReplaceMedia />}

                    <FolderContext onMenuClick={handleMenuClick} />

                    <FileContext onMenuClick={handleFileMenuClick} />
                </FolderDragProvider>
            </DragProvider>
        </MenuProvider>
    );
};

export default App;
