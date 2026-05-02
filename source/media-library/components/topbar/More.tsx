import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { selectSettings } from "~/redux/features/settings";
import { useMoreSettings } from "./MoreSettings";
import IconButton from "~/components/iconButton";
import useDisabled from "~/hooks/useDisabled";
import Dropdown from "~/components/dropdown";
import { Settings } from "~/types/settings";
import useSave from "~/hooks/useSave";
import Card from "~/components/card";
import Icon from "~/components/icon";
import Text from "~/components/text";
import {
    selectMedia,
    setBulkSelect,
    setExpandAll,
    setSelectedFolders,
} from "~/redux/features/media";

const More = () => {
    const { data } = useAppSelector(selectSettings);
    const { bulkSelect, expandAll } = useAppSelector(selectMedia);
    const { openMoreSettings } = useMoreSettings();

    const { saveSettings, saveSettingsData } = useSave();

    const dispatch = useAppDispatch();

    const { moreOptionsDisabled } = useDisabled();

    const handleBulkSelect = () => {
        dispatch(setBulkSelect(!bulkSelect));

        if (!bulkSelect) {
            dispatch(setSelectedFolders([]));
        }
    };

    const handleExpandAll = () => {
        dispatch(setExpandAll(!expandAll));
    };

    const showFolderId = data?.general?.folder?.showFolderId ?? false;

    const handleShowFolderId = () => {
        saveSettings("general.folder.showFolderId", !showFolderId);

        const updatedData = {
            ...data,
            general: {
                ...data?.general,
                folder: {
                    ...data?.general?.folder,
                    showFolderId: !showFolderId,
                },
            },
        } as Settings;

        saveSettingsData(updatedData);
    };

    return (
        <Dropdown>
            <Dropdown.Trigger disabled={moreOptionsDisabled}>
                <IconButton
                    variant="light"
                    size="extrasmall"
                    rounded="xs"
                    name="more_vert"
                    disabled={moreOptionsDisabled}
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
                <Card
                    padding={10}
                    background={bulkSelect ? "extralight" : "white"}
                    border={bulkSelect ? "light" : "transparent"}
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
                    onClick={handleBulkSelect}
                >
                    <Icon
                        name="select_all"
                        color={bulkSelect ? "primary" : "secondaryblack"}
                    />

                    <Text
                        color={bulkSelect ? "primary" : "secondaryblack"}
                        size="sm"
                        wrap={false}
                    >
                        Bulk Selection
                    </Text>
                </Card>

                <Card
                    padding={10}
                    background={expandAll ? "extralight" : "white"}
                    border={expandAll ? "light" : "transparent"}
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
                    onClick={handleExpandAll}
                >
                    <Icon
                        name="expand"
                        color={expandAll ? "primary" : "secondaryblack"}
                    />

                    <Text
                        color={expandAll ? "primary" : "secondaryblack"}
                        size="sm"
                        wrap={false}
                    >
                        Expand All
                    </Text>
                </Card>

                <Card
                    padding={10}
                    background={showFolderId ? "extralight" : "white"}
                    border={showFolderId ? "light" : "transparent"}
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
                    onClick={handleShowFolderId}
                >
                    <Icon
                        name="tag"
                        color={showFolderId ? "primary" : "secondaryblack"}
                    />

                    <Text
                        color={showFolderId ? "primary" : "secondaryblack"}
                        size="sm"
                        wrap={false}
                    >
                        Show Folder ID
                    </Text>
                </Card>

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
                        More Settings
                    </Text>
                </Card>
            </Dropdown.Content>
        </Dropdown>
    );
};

export default More;
