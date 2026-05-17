import { FolderDragProvider } from "~/shared/context/FolderDragContext";
import { MenuProvider } from "~/components/contextMenu/ContextMenu";
import { DragProvider } from "~/shared/context/DragContext";
import FolderContext from "~/shared/context/FolderContext";
import useFolderContext from "./hooks/useFolderContext";
import useFileContext from "./hooks/useFileContext";
import MediaActions from "./context/MediaActions";
import FileContext from "./context/FileContext";
import Context from "~/shared/context/Context";
import { useEffect } from "@wordpress/element";
import FolderTree from "./folder/FolderTree";
import Sidebar from "./sidebar/Sidebar";
import useMedia from "./hooks/useMedia";
import useDrop from "./hooks/useDrop";
import Topbar from "./topbar/Topbar";

const AppLayout = () => {
    const { setMedia, activeFolder, selectedFolders, cutFolders, bulkSelect } =
        useMedia();

    const handleFolderContext = useFolderContext();

    const handleFileContext = useFileContext();

    const { handleFolderDrop, handleFileDrop, handleRootDrop } = useDrop();

    const enableContextMenu =
        pnpnm?.settings?.advanced?.action?.contextMenu ?? false;

    const enableDrag = pnpnm?.settings?.general?.files?.bulkSelection ?? false;

    const enableReplaceMedia =
        pnpnm?.settings?.general?.files?.replaceMedia ?? false;

    const enableDuplicateMedia =
        pnpnm?.settings?.general?.files?.duplicateMedia ?? false;

    const enableWatermark = pnpnm?.settings?.watermark?.enabled ?? false;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.altKey && e.key === "n") {
                e.preventDefault();
                setMedia("createFolder", {
                    create: true,
                    folder: activeFolder ?? null,
                });
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [activeFolder]);

    return (
        <MenuProvider>
            <DragProvider onDrop={handleFileDrop}>
                <FolderDragProvider
                    onDrop={handleFolderDrop}
                    onRootDrop={handleRootDrop}
                >
                    <Sidebar>
                        <Topbar />

                        <FolderTree />
                    </Sidebar>

                    {(enableContextMenu || enableDrag) && <Context />}

                    {(enableReplaceMedia ||
                        enableDuplicateMedia ||
                        enableWatermark) && <MediaActions />}

                    <FolderContext
                        selectedFolders={selectedFolders}
                        cutFolders={cutFolders}
                        bulkSelect={bulkSelect}
                        onMenuClick={handleFolderContext}
                    />

                    <FileContext onMenuClick={handleFileContext} />
                </FolderDragProvider>
            </DragProvider>
        </MenuProvider>
    );
};

export default AppLayout;
