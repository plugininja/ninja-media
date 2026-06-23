import { iconFolderDefault, iconFolderDefaultOpen, iconFolderBold, iconFolderBoldOpen, iconFolderAwesome } from "~/utils/icons";
import SvgIcon from "~/components/svgIcon/SvgIcon";
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
        const resolvedColor = color || (active ? "var(--pnpnm-primary)" : "#697C8B");
        if (theme === "default")
            return open ? (
                <SvgIcon src={iconFolderDefaultOpen} style={{ color: resolvedColor }} />
            ) : (
                <SvgIcon src={iconFolderDefault} style={{ color: resolvedColor }} />
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
