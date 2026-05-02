import { Item, Menu, Separator } from "~/components/contextMenu/ContextMenu";
import { DragAttachment } from "~/hooks/useDragAttachments";
import { selectSettings } from "~/redux/features/settings";
import { selectMedia } from "~/redux/features/media";
import { useAppSelector } from "~/redux/hooks";
import Icon from "~/components/icon";
import { __ } from "@wordpress/i18n";
import Card from "~/components/card";
import Text from "~/components/text";

const FileContext = ({
    onMenuClick,
}: {
    onMenuClick: (
        key: "trash" | "restore" | "delete",
        attachments: DragAttachment[],
    ) => void;
}) => {
    const { data } = useAppSelector(selectSettings);
    const { menu } = useAppSelector(selectMedia);

    const enableTrash = data?.general?.files?.moveToTrash ?? false;

    return (
        <Menu id="file-menu">
            {({ props }) => {
                const FILTERED_MENUS = FILE_CONTEXT_MENU_LISTS?.filter(
                    (item) => {
                        if (item.key === "trash") {
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
                        return false;
                    },
                );

                return FILTERED_MENUS?.map(
                    ({ key, title, icon, className }, index) => {
                        return (
                            <div key={key ?? index}>
                                {["trash", "delete"].includes(key) ? (
                                    <Card
                                        margin={5}
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
                                            onMenuClick(key, props?.attachments)
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
                                    <Item
                                        className={className}
                                        onClick={() =>
                                            onMenuClick(key, props?.attachments)
                                        }
                                    >
                                        <Icon name={icon} />

                                        {title}
                                    </Item>
                                )}

                                {key === "restore" && (
                                    <Separator
                                        style={{
                                            marginBottom:
                                                key === "restore" ? 8 : 0,
                                        }}
                                    />
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
    key: "trash" | "restore" | "delete";
    title: string;
    icon: string;
    className?: string;
}[] = [
    {
        key: "trash",
        title: __("Trash", "ninja-media"),
        icon: "recycling",
        className: "destructive",
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
