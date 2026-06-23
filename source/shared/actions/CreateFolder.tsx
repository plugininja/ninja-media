import { iconFolderDefault, iconFolderBold, iconFolderAwesome } from "~/utils/icons";
import SvgIcon from "~/components/svgIcon/SvgIcon";
import InlineStack from "~/components/inlineStack";
import { Theme } from "~/types/settings/settings";
import BlockStack from "~/components/blockStack";
import { useMemo } from "@wordpress/element";
import Button from "~/components/button";
import Input from "~/components/input";
import { __ } from "@wordpress/i18n";
import clsx from "clsx";

const CreateFolder = ({
    theme = "default",
    nested,
    inputRef,
    folderName = "New folder",
    setFolderName,
    onCreate,
    onCancel,
    loading = false,
}: {
    theme?: Theme;
    nested?: boolean;
    inputRef?: React.RefObject<HTMLInputElement>;
    folderName?: string;
    setFolderName?: (name: string) => void;
    onCreate?: () => void;
    onCancel?: () => void;
    loading?: boolean;
}) => {
    const iconElement = useMemo(() => {
        if (theme === "default") return <SvgIcon src={iconFolderDefault} style={{ color: "#697C8B" }} />;

    }, [theme]);

    return (
        <BlockStack
            marginTop={5}
            gap={5}
            style={{
                paddingLeft: nested ? 10 : 0,
            }}
            className="pnpnm-folder-create"
        >
            <Input
                prefix={iconElement}
                size="extrasmall"
                placeholder={__("Folder Name", "ninja-media")}
                value={folderName}
                ref={inputRef}
                className={clsx(
                    theme === "default" && "pnpnm-folder-create--default",
                )}
                onChange={(value) => setFolderName?.(String(value))}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        onCreate?.();
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
                    onClick={onCreate}
                    loading={loading}
                >
                    {__("Create", "ninja-media")}
                </Button>
            </InlineStack>
        </BlockStack>
    );
};

export default CreateFolder;
