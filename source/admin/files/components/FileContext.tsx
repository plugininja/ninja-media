import { FILE_CONTEXT_MENU_LISTS } from "~/media-library/components/context/FileContext";
import { Item, Menu, Separator } from "~/components/contextMenu/ContextMenu";
import { selectSettings } from "~/redux/features/settings";
import { selectFiles } from "~/redux/features/files";
import { useAppSelector } from "~/redux/hooks";
import { useParams } from "react-router-dom";
import Icon from "~/components/icon";
import { __ } from "@wordpress/i18n";
import Card from "~/components/card";
import Text from "~/components/text";
import { File } from "~/types/files";

const FileContext = ({
    onMenuClick,
}: {
    onMenuClick: (key: string, files: File[]) => void;
}) => {
    const { data } = useAppSelector(selectSettings);
    const { view, bulkSelect } = useAppSelector(selectFiles);
    const { menuKey } = useParams();

    const enableTrash = data?.general?.files?.moveToTrash ?? false;

    return (
        <Menu id="file-menu">
            {({ props }) => {
                const FILTERED_MENUS = [
                    ...FILE_EXTRA_MENU_LISTS,
                    ...FILE_CONTEXT_MENU_LISTS,
                ]?.filter((item) => {
                    if (item?.key === "trash") {
                        return menuKey === "trash"
                            ? false
                            : enableTrash
                            ? true
                            : false;
                    } else if (item?.key === "restore") {
                        return menuKey === "trash" ? true : false;
                    } else if (item?.key === "delete") {
                        return !enableTrash
                            ? true
                            : menuKey === "trash"
                            ? true
                            : false;
                    } else if (item?.key === "open") {
                        return menuKey === "trash" || bulkSelect ? false : true;
                    } else if (item?.key === "view") {
                        return bulkSelect || view === "list" ? false : true;
                    }
                });

                return FILTERED_MENUS?.map(
                    ({ key, title, icon, className }, index) => {
                        return (
                            <div key={key ?? index}>
                                {["trash", "delete"].includes(key) ? (
                                    <Card
                                        margin={
                                            key === "trash"
                                                ? "10px 5px 5px 5px"
                                                : 5
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
                                            onMenuClick(key, props?.files)
                                        }
                                    >
                                        <Icon
                                            name={icon}
                                            fontSize="lg"
                                            color="error"
                                        />

                                        <Text color="error" size="sm">
                                            {key === "delete" &&
                                            menuKey === "trash"
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
                                            onMenuClick(key, props?.files)
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

const FILE_EXTRA_MENU_LISTS: {
    key: "view" | "open";
    title: string;
    icon: string;
    className?: string;
}[] = [
    {
        key: "view",
        title: __("View details", "ninja-media"),
        icon: "art_track",
    },
    {
        key: "open",
        title: __("Open in Media Library", "ninja-media"),
        icon: "photo_library",
    },
];
