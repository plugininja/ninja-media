import { FILE_CONTEXT_MENU_LISTS } from "~/media-library/context/FileContext";
import { Item, Menu, Separator } from "~/components/contextMenu/ContextMenu";
import { FileContextMenu } from "~/types/file/file";
import useSettings from "~/hooks/useSettings";
import { useParams } from "react-router-dom";
import Status from "~/components/status";
import useFile from "../hooks/useFile";
import Icon from "~/components/icon";
import { __ } from "@wordpress/i18n";
import Card from "~/components/card";
import Text from "~/components/text";
import { File } from "~/types/file";

const FileContext = ({
    onMenuClick,
}: {
    onMenuClick: ({
        key,
        files,
    }: {
        key: FileContextMenu;
        files: File[];
    }) => void;
}) => {
    const { data } = useSettings();
    const { bulkSelect } = useFile();
    const { menuKey } = useParams();

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
                            return menuKey === "trash" || bulkSelect
                                ? false
                                : true;
                        } else if (item?.key === "view") {
                            return bulkSelect ? false : true;
                        } else if (item?.key === "get") {
                            return bulkSelect ? false : true;
                        } else if (item?.key === "edit") {
                            if (menuKey === "trash" || bulkSelect) return false;
                            const ext = (props?.files?.[0]?.extension || "").toLowerCase();
                            return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
                        } else if (item?.key === "download") {
                            return bulkSelect ? false : true;
                        } else if (item?.key === "duplicate") {
                            return menuKey === "trash" || bulkSelect
                                ? false
                                : true;
                        } else if (item?.key === "replace") {
                            return menuKey === "trash" || bulkSelect
                                ? false
                                : true;
                        } else if (item?.key === "favorite") {
                            return menuKey === "trash" || bulkSelect
                                ? false
                                : props?.files[0]?.isFavorite
                                ? false
                                : true;
                        } else if (item?.key === "unfavorite") {
                            return menuKey === "trash" || bulkSelect
                                ? false
                                : props?.files[0]?.isFavorite
                                ? true
                                : false;
                        } else if (item?.key === "apply") {
                            return false;
                        } else if (item?.key === "remove") {
                            return false;
                        } else if (item?.key === "trash") {
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
                                                files: props?.files,
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
                                            menuKey === "trash"
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
                                                    files: props?.files,
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
