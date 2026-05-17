import { Item, Menu, Separator } from "~/components/contextMenu/ContextMenu";
import { Attachment, MediaContextMenu } from "~/types/media/media";
import { StatusProps } from "~/components/status/Status.type";
import useSettings from "~/hooks/useSettings";
import Status from "~/components/status";
import useMedia from "../hooks/useMedia";
import Icon from "~/components/icon";
import { __ } from "@wordpress/i18n";
import Card from "~/components/card";
import Text from "~/components/text";

const FileContext = ({
    onMenuClick,
}: {
    onMenuClick: ({
        key,
        attachments,
    }: {
        key: MediaContextMenu;
        attachments: Attachment[];
    }) => void;
}) => {
    const { data } = useSettings();
    const { menu } = useMedia();

    const enableTrash = data?.general?.files?.moveToTrash ?? false;

    return (
        <Menu
            id="file-menu"
            style={{
                width: "220px",
            }}
        >
            {({ props }) => {
                const FILTERED_MENUS = FILE_CONTEXT_MENU_LISTS?.filter(
                    (item) => {
                        if (item?.key === "open") {
                            return false;
                        } else if (item?.key === "view") {
                            return false;
                        } else if (item?.key === "get") {
                            return true;
                        } else if (item?.key === "edit") {
                            return pnpnm?.pagenow === "upload.php"
                                ? true
                                : false;
                        } else if (item?.key === "download") {
                            return true;
                        } else if (item?.key === "duplicate") {
                            return menu === "trash" ? false : true;
                        } else if (item?.key === "replace") {
                            return menu === "trash" ? false : true;
                        } else if (item?.key === "favorite") {
                            if (menu === "trash") return false;
                            if (props?.attachments?.length === 1) {
                                return !props.attachments[0]?.isFavorite;
                            }
                            return true;
                        } else if (item?.key === "unfavorite") {
                            if (menu === "trash") return false;
                            if (props?.attachments?.length === 1) {
                                return !!props.attachments[0]?.isFavorite;
                            }
                            return false;
                        } else if (item?.key === "apply") {
                            return false;
                        } else if (item?.key === "remove") {
                            return false;
                        } else if (item.key === "trash") {
                            return menu === "trash"
                                ? false
                                : enableTrash
                                ? true
                                : false;
                        } else if (item.key === "restore") {
                            return menu === "trash" ? true : false;
                        } else if (item.key === "delete") {
                            return !enableTrash
                                ? true
                                : menu === "trash"
                                ? true
                                : false;
                        }
                    },
                );

                return FILTERED_MENUS?.map(
                    ({ key, title, icon, className, statusProps }, index) => {
                        return (
                            <div key={key ?? index}>
                                {["trash", "delete"].includes(key) && (
                                    <Separator />
                                )}

                                {["trash", "delete"].includes(key) ? (
                                    <Card
                                        statusProps={{
                                            isPro: key === "trash",
                                            size: "extrasmall",
                                            top: 7.5,
                                            right: 7,
                                            style: {
                                                height: "fit-content",
                                            },
                                        }}
                                        margin={
                                            key === "trash"
                                                ? "5px 5px 5px 5px"
                                                : "8px 5px 5px 5px"
                                        }
                                        padding={5}
                                        background="errorextralight"
                                        border="errorextralight"
                                        rounded="sm"
                                        flex
                                        direction="row"
                                        blockAlign="center"
                                        gap={7}
                                        style={{
                                            cursor: "pointer",
                                            width: "calc(100% - 10px)",
                                        }}
                                        className="hover-errorlight"
                                        onClick={() =>
                                            onMenuClick({
                                                key,
                                                attachments: props?.attachments,
                                            })
                                        }
                                    >
                                        <Icon
                                            name={icon}
                                            fontSize="lg"
                                            color="error"
                                        />

                                        <Text color="error" size="sm">
                                            {key === "delete" &&
                                            menu === "trash"
                                                ? __(
                                                      "Delete Permanently",
                                                      "ninja-media",
                                                  )
                                                : title}
                                        </Text>
                                    </Card>
                                ) : (
                                    <Status
                                        {...statusProps}
                                        size="extrasmall"
                                        placement="right-center"
                                        right={5}
                                    >
                                        <Item
                                            className={className}
                                            onClick={() =>
                                                onMenuClick({
                                                    key,
                                                    attachments:
                                                        props?.attachments,
                                                })
                                            }
                                        >
                                            <Icon name={icon} />

                                            {title}
                                        </Item>
                                    </Status>
                                )}
                            </div>
                        );
                    },
                );
            }}
        </Menu>
    );
};

export default FileContext;

export const FILE_CONTEXT_MENU_LISTS: {
    key: MediaContextMenu;
    title: string;
    icon: string;
    className?: string;
    statusProps?: StatusProps;
}[] = [
    {
        key: "open",
        title: __("Open in Media Library", "ninja-media"),
        icon: "photo_library",
    },
    {
        key: "edit",
        title: __("Edit", "ninja-media"),
        icon: "edit_document",
    },
    {
        key: "get",
        title: __("Get link", "ninja-media"),
        icon: "link",
    },
    {
        key: "view",
        title: __("View details", "ninja-media"),
        icon: "art_track",
    },
    {
        key: "download",
        title: __("Download", "ninja-media"),
        icon: "download",
        statusProps: {
            isPro: true,
        },
    },
    {
        key: "duplicate",
        title: __("Duplicate", "ninja-media"),
        icon: "file_copy",
        statusProps: {
            isPro: true,
        },
    },
    {
        key: "replace",
        title: __("Replace", "ninja-media"),
        icon: "replace_image",
        statusProps: {
            isPro: true,
        },
    },
    {
        key: "favorite",
        title: __("Add to favorites", "ninja-media"),
        icon: "favorite",
        statusProps: {
            isPro: true,
        },
    },
    {
        key: "unfavorite",
        title: __("Remove from favorites", "ninja-media"),
        icon: "heart_broken",
        statusProps: {
            isPro: true,
        },
    },
    {
        key: "apply",
        title: __("Apply watermark", "ninja-media"),
        icon: "water",
        statusProps: {
            isPro: true,
        },
    },
    {
        key: "remove",
        title: __("Remove watermark", "ninja-media"),
        icon: "block",
        statusProps: {
            isPro: true,
        },
    },
    {
        key: "trash",
        title: __("Trash", "ninja-media"),
        icon: "recycling",
        className: "destructive",
        statusProps: {
            isPro: true,
        },
    },
    {
        key: "restore",
        title: __("Restore", "ninja-media"),
        icon: "restore",
    },
    {
        key: "delete",
        title: __("Delete", "ninja-media"),
        icon: "delete",
        className: "destructive",
    },
];
