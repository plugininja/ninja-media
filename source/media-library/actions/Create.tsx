import { useEffect, useRef, useState } from "@wordpress/element";
import { useCreateFolderMutation } from "~/redux/api/media";
import { useCustomAlert } from "~/components/alert/Alert";
import CreateFolder from "~/shared/actions/CreateFolder";
import { Theme } from "~/types/settings/settings";
import useMedia from "../hooks/useMedia";
import { Folder } from "~/types/folder";
import { __ } from "@wordpress/i18n";

const Create = ({
    theme = "default",
    nested,
    setFolder,
}: {
    theme?: Theme;
    nested?: boolean;
    setFolder?: (folder: Folder) => void;
}) => {
    const [folderName, setFolderName] = useState<string>(
        __("New folder", "ninja-media"),
    );
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [createFolder] = useCreateFolderMutation();

    const { showAlert } = useCustomAlert();

    const { setMedia, activeFolder } = useMedia();

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const handleCreate = async () => {
        try {
            setLoading(true);

            const response = await createFolder({
                name: folderName || __("New folder", "ninja-media"),
                parentId: activeFolder?.id,
            }).unwrap();

            if (response?.data) {
                setFolder?.(response?.data ?? []);
            }

            setFolderName(__("New folder", "ninja-media"));

            showAlert({
                toast: true,
                type: "success",
                text:
                    response?.message ||
                    __("Folder created successfully", "ninja-media"),
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
                    __("Failed to create folder", "ninja-media"),
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        } finally {
            setLoading(false);
            setMedia("createFolder", { create: false, folder: null });
        }
    };

    return (
        <CreateFolder
            theme={theme}
            nested={nested}
            inputRef={inputRef}
            folderName={folderName}
            setFolderName={setFolderName}
            onCreate={handleCreate}
            onCancel={() =>
                setMedia("createFolder", { create: false, folder: null })
            }
            loading={loading}
        />
    );
};

export default Create;
