import { useEffect, useRef, useState } from "@wordpress/element";
import { useUpdateFolderMutation } from "~/redux/api/media";
import { useCustomAlert } from "~/components/alert/Alert";
import RenameFolder from "~/shared/actions/RenameFolder";
import { Theme } from "~/types/settings/settings";
import useMedia from "../hooks/useMedia";
import { Folder } from "~/types/folder";
import { __ } from "@wordpress/i18n";

const Rename = ({
    theme = "default",
    active,
    open,
    color,
    setCurrentFolder,
    setFolderLoading,
}: {
    theme?: Theme;
    active?: boolean;
    open?: boolean;
    color?: string | null;
    setCurrentFolder?: (folder: Folder) => void;
    setFolderLoading: (loading: boolean) => void;
}) => {
    const { setMedia, renameFolder } = useMedia();
    const [folderName, setFolderName] = useState<string>(
        renameFolder?.folder?.name || __("New folder", "ninja-media"),
    );
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [updateFolder] = useUpdateFolderMutation();

    const { showAlert } = useCustomAlert();

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const handleRename = async () => {
        if (!renameFolder?.folder || !folderName) return;

        setFolderLoading(true);

        setMedia("renameFolder", {
            rename: false,
            folder: null,
        });

        try {
            const response = await updateFolder({
                id: renameFolder?.folder?.id || "",
                name: folderName || __("New folder", "ninja-media"),
            }).unwrap();

            setCurrentFolder?.(response?.data as Folder);

            showAlert({
                toast: true,
                type: "success",
                text:
                    response?.message ||
                    __("Folder renamed successfully", "ninja-media"),
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        } catch (error: any) {
            showAlert({
                toast: true,
                type: "error",
                text:
                    error?.data?.message ||
                    __("Failed to rename folder", "ninja-media"),
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        } finally {
            setFolderLoading(false);

            setMedia("renameFolder", {
                rename: false,
                folder: null,
            });
        }
    };

    return (
        <RenameFolder
            theme={theme}
            active={active}
            open={open}
            color={color}
            inputRef={inputRef}
            folderName={folderName}
            setFolderName={setFolderName}
            onRename={handleRename}
            onCancel={() =>
                setMedia("renameFolder", { rename: false, folder: null })
            }
        />
    );
};

export default Rename;
