import { Fragment, useRef, useState } from "@wordpress/element";
import { StatusProps } from "~/components/status/Status.type";
import { Folder, FolderContextMenu } from "~/types/folder";
import ColorPicker from "~/components/colorPicker";
import InlineStack from "~/components/inlineStack";
import Status from "~/components/status";
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
    excludeKeys,
    selectedFolders,
    cutFolders,
    bulkSelect,
    onMenuClick,
}: {
    excludeKeys?: FolderContextMenu[];
    selectedFolders?: Folder[];
    cutFolders?: { cut: boolean; folders?: Folder[] | undefined };
    bulkSelect?: boolean;
    onMenuClick: ({
        key,
        folders,
    }: {
        key: FolderContextMenu;
        folders: Folder[];
    }) => void;
}) => {
    const [displayColor, setDisplayColor] = useState<string>("#697C8B");
    const lastFolderIdRef = useRef<string | number | null>(null);

    const bulkRemoveKeys = ["new", "color", "rename", "paste", "duplicate"];

    const REMOVE_EXCLUDE_KEYS_MENU = FOLDER_CONTEXT_MENU_LISTS?.filter(
        ({ key }) => !excludeKeys?.includes(key),
    );

    const FILTERED_CONTEXT_MENU_LISTS = REMOVE_EXCLUDE_KEYS_MENU?.filter(
        ({ key }) => {
            if (bulkSelect) {
                return !bulkRemoveKeys?.includes(key);
            } else {
                return true;
            }
        },
    );

    return (
        <Menu id="folder-menu">
            {({ props }) => {
                const folders = props?.folders as Folder[];
                const folder = folders?.[0];
                const colorRef = props?.colorRef as React.MutableRefObject<
                    string | null
                >;
                const setColor = props?.setColor as (color: string) => void;

                if (folder?.id !== lastFolderIdRef.current) {
                    lastFolderIdRef.current = folder?.id ?? null;
                    setDisplayColor(colorRef?.current || "#697C8B");
                }

                return FILTERED_CONTEXT_MENU_LISTS?.map(
                    ({ key, title, icon, separator, statusProps }, index) => {
                        const showSubmenu = key === "color";
                        const pasteDisabled =
                            key === "paste" && !cutFolders?.cut;
                        const bulkMenuDisabled =
                            bulkSelect && !selectedFolders?.length;

                        return (
                            <Fragment key={key ?? index}>
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
                                        <Status
                                            isPro={true}
                                            size="small"
                                            top={5}
                                            right={5}
                                        >
                                            <ColorPicker
                                                statusProps={{
                                                    isPro: true,
                                                    ownUi: false,
                                                }}
                                                defaultColor="#697C8B"
                                                selectedColor={displayColor}
                                                onChange={(c) => {
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
                                                }}
                                            />
                                        </Status>
                                    </Submenu>
                                ) : key === "new" || key === "delete" ? (
                                    <Card
                                        margin={
                                            key === "new"
                                                ? "5px 5px 8px 5px"
                                                : "5px"
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
                                            onMenuClick({
                                                key,
                                                folders,
                                            });
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
                                    <Status
                                        {...statusProps}
                                        size="extrasmall"
                                        placement="right-center"
                                        top={0}
                                        right={5}
                                    >
                                        <Item
                                            className={clsx(
                                                (pasteDisabled ||
                                                    bulkMenuDisabled) &&
                                                    "pnpnm-context-menu-item-disabled",
                                            )}
                                            onClick={() => {
                                                if (
                                                    pasteDisabled ||
                                                    bulkMenuDisabled
                                                ) {
                                                    return;
                                                }
                                                onMenuClick({
                                                    key,
                                                    folders,
                                                });
                                            }}
                                        >
                                            <Icon name={icon} />

                                            {title}
                                        </Item>
                                    </Status>
                                )}

                                {(separator ||
                                    (key === "duplicate" &&
                                        excludeKeys?.includes("download"))) && (
                                    <Separator />
                                )}
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
    key: FolderContextMenu;
    title: string;
    icon: string;
    separator?: boolean;
    statusProps?: StatusProps;
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
        statusProps: {
            isPro: true,
        },
    },
    {
        key: "download",
        title: __("Download", "ninja-media"),
        icon: "arrow_circle_down",
        separator: true,
        statusProps: {
            isPro: true,
        },
    },
    {
        key: "delete",
        title: __("Delete", "ninja-media"),
        icon: "delete",
    },
];
