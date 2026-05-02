import { selectSettings } from "~/redux/features/settings";
import { useCustomAlert } from "~/components/alert/Alert";
import { useEffect, useState } from "@wordpress/element";
import ButtonGroup from "~/components/buttonGroup";
import Description from "~/components/description";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import IconButton from "~/components/iconButton";
import { useAppSelector } from "~/redux/hooks";
import SelectBox from "~/components/selectBox";
import Switcher from "~/components/switcher";
import Divider from "~/components/divider";
import useSave from "~/hooks/useSave";
import Text from "~/components/text";

export const MoreSettings = ({ onClose }: { onClose: () => void }) => {
    const [triggerSave, setTriggerSave] = useState(false);
    const { data } = useAppSelector(selectSettings);

    const { saveSettings, saveSettingsData } = useSave();

    const { treeConnector } = data?.general?.folder || {};

    const { theme, settings } = data?.display || {};

    useEffect(() => {
        if (triggerSave) {
            saveSettingsData();
        }
        setTriggerSave(false);
    }, [theme, settings, treeConnector]);

    return (
        <div>
            <InlineStack align="between" gap={10} wrap={false}>
                <Text size="xl" weight="medium">
                    Settings
                </Text>

                <IconButton
                    variant="error"
                    size="supersmall"
                    name="close"
                    fontSize="md"
                    style={{
                        borderRadius: "6px",
                    }}
                    onClick={onClose}
                />
            </InlineStack>

            <InlineStack marginTop={20} gap={10}>
                <Text color="secondaryblack" weight="medium">
                    Thumbnail sizes
                </Text>

                <SelectBox
                    background="extralight"
                    className="flex-1"
                    options={THUMBNAIL_SIZES}
                    value={[settings?.thumbnailSize || "medium"]}
                    onChange={(value) => {
                        saveSettings(
                            "display.settings.thumbnailSize",
                            value[0] as "small" | "medium" | "large",
                        );
                        setTriggerSave(true);
                    }}
                />
            </InlineStack>

            <BlockStack marginTop={20} gap={10}>
                <Text color="secondaryblack" weight="medium">
                    Theme
                </Text>

                <ButtonGroup
                    background="extralight"
                    buttons={THEMES}
                    selectedKey={theme?.theme || "default"}
                    onChange={(value) => {
                        saveSettings(
                            "display.theme.theme",
                            value as
                                | "default"
                                | "windows"
                                | "google-drive"
                                | "dropbox",
                        );
                        setTriggerSave(true);
                    }}
                />

                <Description text="Choose default view style for the file browser." />
            </BlockStack>

            <InlineStack marginTop={20} wrap={false}>
                <Switcher
                    title="Show breadcrumb"
                    checked={settings?.breadcrumbNavigation}
                    onChange={() => {
                        saveSettings(
                            "display.settings.breadcrumbNavigation",
                            !settings?.breadcrumbNavigation,
                        );
                        setTriggerSave(true);
                    }}
                />

                <Divider variant="vertical" margin={"0 20px"} height="25px" />

                <Switcher
                    title="Tree Connector"
                    checked={treeConnector}
                    onChange={() => {
                        saveSettings(
                            "general.folder.treeConnector",
                            !treeConnector,
                        );
                        setTriggerSave(true);
                    }}
                />
            </InlineStack>
        </div>
    );
};

export const useMoreSettings = () => {
    const { showAlert, closeAlert } = useCustomAlert();

    const openMoreSettings = () => {
        showAlert({
            id: "more-settings-modal",
            type: "info",
            showIcon: false,
            showConfirmButton: false,
            allowEscapeKey: false,
            width: "fit-content",
            height: "fit-content",
            html: (
                <MoreSettings
                    onClose={() => closeAlert("more-settings-modal")}
                />
            ),
        });
    };

    return { openMoreSettings };
};

const THUMBNAIL_SIZES: {
    name: string;
    value: "small" | "medium" | "large";
}[] = [
    {
        name: "Small",
        value: "small",
    },
    {
        name: "Medium",
        value: "medium",
    },
    {
        name: "Large",
        value: "large",
    },
];

const THEMES: {
    key: "default" | "windows" | "google-drive" | "dropbox";
    title: string;
    startIcon: string;
}[] = [
    {
        key: "default",
        title: "Default",
        startIcon: "grid_view",
    },
    {
        key: "windows",
        title: "Windows",
        startIcon: "format_list_bulleted",
    },
    {
        key: "google-drive",
        title: "Google Drive",
        startIcon: "format_list_bulleted",
    },
    {
        key: "dropbox",
        title: "Dropbox",
        startIcon: "format_list_bulleted",
    },
];
