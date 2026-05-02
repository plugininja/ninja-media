import { useEffect, useMemo, useRef, useState } from "@wordpress/element";
import { selectMedia, setCreateFolder } from "~/redux/features/media";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { useCreateFolderMutation } from "~/redux/api/media";
import { useCustomAlert } from "~/components/alert/Alert";
import Dropbox from "~/assets/icons/folder/Dropbox";
import Windows from "~/assets/icons/folder/Windows";
import Default from "~/assets/icons/folder/Default";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import Button from "~/components/button";
import { Folder } from "~/types/media";
import Input from "~/components/input";
import Icon from "~/components/icon";
import clsx from "clsx";

const CreateFolder = ({
    theme = "default",
    nested,
    setFolder,
}: {
    theme?: "default" | "windows" | "google-drive" | "dropbox";
    nested?: boolean;
    setFolder?: (folder: Folder) => void;
}) => {
    const [folderName, setFolderName] = useState<string>("New folder");
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [createFolder] = useCreateFolderMutation();

    const dispatch = useAppDispatch();

    const { showAlert } = useCustomAlert();

    const { activeFolder } = useAppSelector(selectMedia);

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
                name: folderName || "New folder",
                parentId: activeFolder?.id,
            }).unwrap();

            if (response?.data) {
                setFolder?.(response?.data ?? []);
            }

            setFolderName("New folder");

            showAlert({
                toast: true,
                type: "success",
                text: response?.message || "Folder created successfully",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        } catch (error: any) {
            showAlert({
                toast: true,
                type: "error",
                text: error?.data?.message || "Failed to create folder",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        } finally {
            setLoading(false);
            dispatch(setCreateFolder({ create: false }));
        }
    };

    const iconElement = useMemo(() => {
        if (theme === "default") return <Default active={false} />;

        return (
            <InlineStack gap={theme === "dropbox" ? 9 : 10} wrap={false}>
                <BlockStack
                    align="center"
                    inlineAlign="center"
                    className="pnpnm-folder__arrow"
                >
                    <Icon
                        name={
                            theme === "google-drive"
                                ? "arrow_drop_down"
                                : "keyboard_arrow_down"
                        }
                        fontSize={theme === "google-drive" ? "xl" : "lg"}
                    />
                </BlockStack>

                {theme === "windows" ? (
                    <Windows />
                ) : theme === "dropbox" ? (
                    <Dropbox />
                ) : (
                    <Default active={false} />
                )}
            </InlineStack>
        );
    }, [theme]);

    return (
        <BlockStack
            marginTop={nested ? 5 : 0}
            gap={5}
            style={{
                paddingLeft: nested ? 10 : 0,
            }}
            className="pnpnm-folder-create"
        >
            <Input
                prefix={iconElement}
                size="extrasmall"
                placeholder="Folder Name"
                value={folderName}
                ref={inputRef}
                className={clsx(
                    theme === "default" && "pnpnm-folder-create--default",
                    theme === "dropbox" && "pnpnm-folder-create--dropbox",
                )}
                onChange={(value) => setFolderName(String(value))}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleCreate();
                    }
                }}
            />

            <InlineStack gap={5} wrap={false}>
                <Button
                    variant="secondary"
                    size="supersmall"
                    rounded="xs"
                    onClick={() => dispatch(setCreateFolder({ create: false }))}
                >
                    Cancel
                </Button>

                <Button
                    variant="primary"
                    size="supersmall"
                    rounded="xs"
                    startIcon="create_new_folder"
                    iconSize="sm"
                    onClick={handleCreate}
                    loading={loading}
                >
                    Create
                </Button>
            </InlineStack>
        </BlockStack>
    );
};

export default CreateFolder;
