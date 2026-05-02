import { Fragment, useRef, useState } from "@wordpress/element";
import { selectMedia } from "~/redux/features/media";
import ColorPicker from "~/components/colorPicker";
import InlineStack from "~/components/inlineStack";
import { useAppSelector } from "~/redux/hooks";
import Status from "~/components/status";
import { Folder } from "~/types/media";
import Icon from "~/components/icon";
import Card from "~/components/card";
import Text from "~/components/text";
import { __ } from "@wordpress/i18n";
import clsx from "clsx";
import {
    Item,
    Menu,
    Separator,
    Submenu,
} from "~/components/contextMenu/ContextMenu";

const FolderContext = ({
    onMenuClick,
}: {
    onMenuClick: (
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
    ) => void;
}) => {
    const [displayColor, setDisplayColor] = useState<string>("#697C8B");
    const lastFolderIdRef = useRef<string | number | null>(null);

    const { selectedFolders, cutFolders, bulkSelect } =
        useAppSelector(selectMedia);

    const bulkRemoveKeys = ["new", "color", "rename", "paste", "duplicate"];

    const FILTERED_CONTEXT_MENU_LISTS = FOLDER_CONTEXT_MENU_LISTS?.filter(
        ({ key }) => {
            if (bulkSelect) {
                return !bulkRemoveKeys?.includes(key);
            }

            return true;
        },
    );

    return (
        <Menu id="folder-menu">
            {({ props }) => {
                const folders = props?.folders as Folder[];
                const folder = props?.folder as Folder;
                const colorRef = props?.colorRef as React.MutableRefObject<
                    string | null
                >;
                const setColor = props?.setColor as (color: string) => void;

                if (folder?.id !== lastFolderIdRef.current) {
                    lastFolderIdRef.current = folder?.id ?? null;
                    setDisplayColor(colorRef?.current || "#697C8B");
                }

                return FILTERED_CONTEXT_MENU_LISTS?.map(
                    ({ key, title, icon, separator }, index) => {
                        const showSubmenu = key === "color";
                        const pasteDisabled =
                            key === "paste" && !cutFolders?.cut;
                        const bulkMenuDisabled =
                            bulkSelect && !selectedFolders?.length;

                        return (
                            <Fragment key={key ?? index}>
                                <Status
                                    size="extrasmall"
                                    placement="right-center"
                                    top={0}
                                    right={5}
                                >
                                    {showSubmenu ? (
                                        <Submenu
                                            trigger="click"
                                            label={
                                                <InlineStack gap={8}>
                                                    <Icon name={icon} />

                                                    {title}
                                                </InlineStack>
                                            }
                                        >
                                            <ColorPicker
                                                defaultColor="#697C8B"
                                                selectedColor={displayColor}
                                                onChange={(c) => {
                                                    setDisplayColor(c);
                                                    setColor(c);
                                                }}
                                            />

                                            <ColorPicker.ColorBox
                                                size="large"
                                                colors={[
                                                    "#697C8B",
                                                    "#2271B1",
                                                    "#0048BC",
                                                    "#002D77",
                                                    "#001941",
                                                    "#000E25",
                                                    "#007AFF",
                                                    "#22BC00",
                                                    "#BC0300",
                                                    "#8400FF",
                                                    "#00B8BC",
                                                    "#FF9E00",
                                                    "#FF5100",
                                                    "#FFD288",
                                                    "#FF0094",
                                                    "#FFCC00",
                                                    "#dd115c",
                                                    "#812fce",
                                                ]}
                                                selectedColor={displayColor}
                                                onSelect={(c) => {
                                                    setDisplayColor(c);
                                                    setColor(c);
                                                }}
                                            />
                                        </Submenu>
                                    ) : key === "new" || key === "delete" ? (
                                        <Card
                                            margin={
                                                key === "new"
                                                    ? "5px 5px 8px 5px"
                                                    : 5
                                            }
                                            padding={5}
                                            background={
                                                key === "delete"
                                                    ? "errorextralight"
                                                    : "extralight"
                                            }
                                            border={
                                                key === "delete"
                                                    ? "errorextralight"
                                                    : "light"
                                            }
                                            rounded="sm"
                                            flex
                                            direction="row"
                                            blockAlign="center"
                                            gap={7}
                                            style={{
                                                cursor: "pointer",
                                                width: "calc(100% - 10px)",
                                            }}
                                            className={clsx(
                                                key === "delete"
                                                    ? "hover-errorlight"
                                                    : "hover-light",
                                                bulkMenuDisabled &&
                                                    "pnpnm-context-menu-item-disabled",
                                            )}
                                            onClick={() => {
                                                if (bulkMenuDisabled) return;
                                                onMenuClick(
                                                    key,
                                                    folder,
                                                    folders,
                                                );
                                            }}
                                        >
                                            <Icon
                                                name={icon}
                                                color={
                                                    key === "delete"
                                                        ? "error"
                                                        : "primary"
                                                }
                                            />

                                            <Text
                                                color={
                                                    key === "delete"
                                                        ? "error"
                                                        : "primary"
                                                }
                                                size="sm"
                                            >
                                                {title}
                                            </Text>
                                        </Card>
                                    ) : (
                                        <Item
                                            onClick={() => {
                                                if (
                                                    pasteDisabled ||
                                                    bulkMenuDisabled
                                                ) {
                                                    return;
                                                }
                                                onMenuClick(
                                                    key,
                                                    folder,
                                                    folders,
                                                );
                                            }}
                                            className={clsx(
                                                (pasteDisabled ||
                                                    bulkMenuDisabled) &&
                                                    "pnpnm-context-menu-item-disabled",
                                            )}
                                        >
                                            <Icon name={icon} />

                                            {title}
                                        </Item>
                                    )}

                                    {separator && <Separator />}
                                </Status>
                            </Fragment>
                        );
                    },
                );
            }}
        </Menu>
    );
};

export default FolderContext;

const FOLDER_CONTEXT_MENU_LISTS: {
    key:
        | "new"
        | "color"
        | "rename"
        | "cut"
        | "paste"
        | "duplicate"
        | "download"
        | "delete";
    title: string;
    icon: string;
    separator?: boolean;
}[] = [
    {
        key: "new",
        title: __("New Folder", "ninja-media"),
        icon: "create_new_folder",
        separator: true,
    },
    {
        key: "color",
        title: __("Change Color", "ninja-media"),
        icon: "palette",
    },
    {
        key: "rename",
        title: __("Rename", "ninja-media"),
        icon: "bookmark_manager",
    },
    {
        key: "cut",
        title: __("Cut", "ninja-media"),
        icon: "content_cut",
    },
    {
        key: "paste",
        title: __("Paste", "ninja-media"),
        icon: "content_paste",
    },
    {
        key: "duplicate",
        title: __("Duplicate", "ninja-media"),
        icon: "folder_copy",
    },
    {
        key: "download",
        title: __("Download", "ninja-media"),
        icon: "arrow_circle_down",
        separator: true,
    },
    {
        key: "delete",
        title: __("Delete", "ninja-media"),
        icon: "delete",
    },
];
