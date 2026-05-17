import DefaultOpen from "~/assets/icons/folder/DefaultOpen";
import Default from "~/assets/icons/folder/NinjaDefault";
import InlineStack from "~/components/inlineStack";
import { Theme } from "~/types/settings/settings";
import BlockStack from "~/components/blockStack";
import { useMemo } from "@wordpress/element";
import Button from "~/components/button";
import Input from "~/components/input";
import { __ } from "@wordpress/i18n";
import clsx from "clsx";

const RenameFolder = ({
    theme = "default",
    active,
    open,
    color,
    inputRef,
    folderName = "New folder",
    setFolderName,
    onRename,
    onCancel,
}: {
    theme?: Theme;
    active?: boolean;
    open?: boolean;
    color?: string | null;
    inputRef?: React.RefObject<HTMLInputElement>;
    folderName?: string;
    setFolderName?: (name: string) => void;
    onRename?: () => void;
    onCancel?: () => void;
}) => {
    const iconElement = useMemo(() => {
        if (theme === "default")
            return open ? (
                <DefaultOpen color={color} active={active ?? false} />
            ) : (
                <Default color={color} active={active ?? false} />
            );

    }, [theme, open, color, active]);

    return (
        <BlockStack gap={5} className="pnpnm-folder-rename">
            <Input
                prefix={iconElement}
                size="extrasmall"
                placeholder={__("Folder Name", "ninja-media")}
                value={folderName}
                ref={inputRef}
                className={clsx(
                    theme === "default" && "pnpnm-folder-rename--default",
                )}
                onChange={(value) => setFolderName?.(String(value))}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        onRename?.();
                    }
                }}
            />

            <InlineStack gap={5} wrap={false}>
                <Button
                    variant="secondary"
                    size="supersmall"
                    rounded="xs"
                    onClick={onCancel}
                >
                    {__("Cancel", "ninja-media")}
                </Button>

                <Button
                    variant="primary"
                    size="supersmall"
                    rounded="xs"
                    startIcon="create_new_folder"
                    iconSize="sm"
                    onClick={onRename}
                >
                    {__("Rename", "ninja-media")}
                </Button>
            </InlineStack>
        </BlockStack>
    );
};

export default RenameFolder;
