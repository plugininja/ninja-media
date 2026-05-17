import { useMoreSettings } from "~/shared/topbar/MoreSettings";
import { StatusProps } from "~/components/status/Status.type";
import { Settings } from "~/types/settings/settings";
import IconButton from "~/components/iconButton";
import useSettings from "~/hooks/useSettings";
import Dropdown from "~/components/dropdown";
import { Folder } from "~/types/folder";
import { __ } from "@wordpress/i18n";
import Card from "~/components/card";
import Icon from "~/components/icon";
import Text from "~/components/text";

const More = ({
    bulkSelect,
    expandAll,
    onSelectedFolders,
    onBulkSelect,
    onExpandAll,
    disabled = false,
}: {
    bulkSelect: boolean;
    expandAll: boolean;
    onSelectedFolders: (folder: Folder[]) => void;
    onBulkSelect: (value: boolean) => void;
    onExpandAll: (value: boolean) => void;
    disabled: boolean;
}) => {
    const { data, setSettings, saveSettings } = useSettings();
    const { openMoreSettings } = useMoreSettings();

    const showCount = data?.general?.folder?.showCount ?? false;

    const handleShowCount = () => {
        setSettings("general.folder.showCount", !showCount);

        const updatedData = {
            ...data,
            general: {
                ...data?.general,
                folder: {
                    ...data?.general?.folder,
                    showCount: !showCount,
                },
            },
        } as Settings;

        saveSettings(updatedData);
    };

    const handleAction = (type: "bulk" | "expand" | "id" | "count") => {
        switch (type) {
            case "id":
                return;
            case "count":
                handleShowCount();
                return;
            case "bulk":
                onBulkSelect(!bulkSelect);

                if (!bulkSelect) {
                    onSelectedFolders([]);
                }
                return;
            case "expand":
                onExpandAll(!expandAll);
                return;
            default:
                return;
        }
    };

    return (
        <Dropdown>
            <Dropdown.Trigger disabled={disabled}>
                <IconButton
                    variant="light"
                    size="extrasmall"
                    rounded="xs"
                    name="more_vert"
                    disabled={disabled}
                />
            </Dropdown.Trigger>

            <Dropdown.Content
                position={{
                    right: 0,
                    top: "115%",
                }}
                style={{
                    width: "180px",
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    userSelect: "none",
                }}
            >
                {[
                    {
                        key: "bulk",
                        title: __("Bulk Selection", "ninja-media"),
                        icon: "select_all",
                        value: bulkSelect,
                    },
                    {
                        key: "expand",
                        title: __("Expand All", "ninja-media"),
                        icon: "expand",
                        value: expandAll,
                    },
                    {
                        key: "id",
                        title: __("Show Folder ID", "ninja-media"),
                        icon: "tag",
                        statusProps: {
                            isPro: true,
                            size: "extrasmall",
                            placement: "right-center",
                            right: 2,
                        },
                    },
                    {
                        key: "count",
                        title: __("Show Count", "ninja-media"),
                        icon: "counter_0",
                        value: showCount,
                    },
                ]?.map(({ key, title, icon, value, statusProps }) => (
                    <Card
                        key={key}
                        statusProps={statusProps as StatusProps}
                        padding={10}
                        background={value ? "extralight" : "white"}
                        border={value ? "light" : "transparent"}
                        rounded="sm"
                        flex
                        direction="row"
                        blockAlign="center"
                        gap={9}
                        style={{
                            height: "30px",
                            cursor: "pointer",
                        }}
                        className="hover-extralight"
                        onClick={() =>
                            handleAction(
                                key as "bulk" | "expand" | "id" | "count",
                            )
                        }
                    >
                        <Icon
                            name={icon}
                            color={value ? "primary" : "secondaryblack"}
                        />

                        <Text
                            color={value ? "primary" : "secondaryblack"}
                            size="sm"
                            wrap={false}
                        >
                            {title}
                        </Text>
                    </Card>
                ))}

                <Card
                    padding={10}
                    background="white"
                    borderStyle="none"
                    rounded="sm"
                    flex
                    direction="row"
                    blockAlign="center"
                    gap={9}
                    style={{
                        height: "30px",
                        cursor: "pointer",
                    }}
                    className="hover-extralight"
                    onClick={openMoreSettings}
                >
                    <Icon name="settings" color="secondaryblack" />

                    <Text color="secondaryblack" size="sm" wrap={false}>
                        {__("More Settings", "ninja-media")}
                    </Text>
                </Card>
            </Dropdown.Content>
        </Dropdown>
    );
};

export default More;
