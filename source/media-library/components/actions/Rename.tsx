import { useEffect, useMemo, useRef, useState } from "@wordpress/element";
import { selectMedia, setRenameFolder } from "~/redux/features/media";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import WindowsOpen from "~/assets/icons/folder/WindowsOpen";
import { useUpdateFolderMutation } from "~/redux/api/media";
import DefaultOpen from "~/assets/icons/folder/DefaultOpen";
import { useCustomAlert } from "~/components/alert/Alert";
import Windows from "~/assets/icons/folder/Windows";
import Dropbox from "~/assets/icons/folder/Dropbox";
import Default from "~/assets/icons/folder/Default";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import Button from "~/components/button";
import { Folder } from "~/types/media";
import Input from "~/components/input";
import Card from "~/components/card";
import Icon from "~/components/icon";
import clsx from "clsx";

const RenameFolder = ({
    theme = "default",
    active,
    open,
    color,
    setCurrentFolder,
    setFolderLoading,
}: {
    theme?: "default" | "windows" | "google-drive" | "dropbox";
    active?: boolean;
    open?: boolean;
    color?: string | null;
    setCurrentFolder?: (folder: Folder) => void;
    setFolderLoading: (loading: boolean) => void;
}) => {
    const { renameFolder } = useAppSelector(selectMedia);
    const [folderName, setFolderName] = useState<string>(
        renameFolder?.folder?.name || "New folder",
    );
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [updateFolder] = useUpdateFolderMutation();

    const dispatch = useAppDispatch();

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

        dispatch(setRenameFolder({ rename: false }));

        try {
            const response = await updateFolder({
                id: renameFolder?.folder?.id || "",
                name: folderName || "New folder",
            }).unwrap();

            setCurrentFolder?.(response?.data as Folder);

            showAlert({
                toast: true,
                type: "success",
                text: response?.message || "Folder renamed successfully",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        } catch (error: any) {
            showAlert({
                toast: true,
                type: "error",
                text: error?.data?.message || "Failed to rename folder",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        } finally {
            setFolderLoading(false);

            dispatch(setRenameFolder({ rename: false }));
        }
    };

    const iconElement = useMemo(() => {
        if (theme === "default")
            return open ? (
                <DefaultOpen color={color} active={active ?? false} />
            ) : (
                <Default color={color} active={active ?? false} />
            );

        return (
            <InlineStack gap={10} wrap={false}>
                {theme === "dropbox" ? (
                    <Card
                        padding={3}
                        background="white"
                        border={active ? "light" : "transparent"}
                        rounded="sm"
                        flex
                        align="center"
                        blockAlign="center"
                        style={{
                            cursor: "default",
                        }}
                        className={clsx(
                            "pnpnm-folder__arrow",
                            "pnpnm-folder__arrow--dropbox",
                            open && "pnpnm-folder__arrow--open",
                        )}
                    >
                        <Icon name="keyboard_arrow_down" fontSize="lg" />
                    </Card>
                ) : (
                    <BlockStack
                        align="center"
                        inlineAlign="center"
                        className={clsx(
                            "pnpnm-folder__arrow",
                            open && "pnpnm-folder__arrow--open",
                        )}
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
                )}

                {theme === "windows" ? (
                    open ? (
                        <WindowsOpen color={color} />
                    ) : (
                        <Windows color={color} />
                    )
                ) : theme === "dropbox" ? (
                    <Dropbox color={color} />
                ) : (
                    <Default color={color} active={false} />
                )}
            </InlineStack>
        );
    }, [theme, open, color, active]);

    return (
        <BlockStack gap={5} className="pnpnm-folder-rename">
            <Input
                prefix={iconElement}
                size="extrasmall"
                placeholder="Folder Name"
                value={folderName}
                ref={inputRef}
                className={clsx(
                    theme === "default" && "pnpnm-folder-rename--default",
                )}
                onChange={(value) => setFolderName(String(value))}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleRename();
                    }
                }}
            />

            <InlineStack gap={5} wrap={false}>
                <Button
                    variant="secondary"
                    size="supersmall"
                    rounded="xs"
                    onClick={() => dispatch(setRenameFolder({ rename: false }))}
                >
                    Cancel
                </Button>

                <Button
                    variant="primary"
                    size="supersmall"
                    rounded="xs"
                    startIcon="create_new_folder"
                    iconSize="sm"
                    onClick={handleRename}
                >
                    Rename
                </Button>
            </InlineStack>
        </BlockStack>
    );
};

export default RenameFolder;
