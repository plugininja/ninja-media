import { ButtonStatusProps } from "~/components/button/Button.type";
import { useCustomAlert } from "~/components/alert/Alert";
import { useEffect, useState } from "@wordpress/element";
import InlineStack from "~/components/inlineStack";
import ButtonGroup from "~/components/buttonGroup";
import Description from "~/components/description";
import { Theme } from "~/types/settings/settings";
import IconButton from "~/components/iconButton";
import BlockStack from "~/components/blockStack";
import useSettings from "~/hooks/useSettings";
import Switcher from "~/components/switcher";
import Divider from "~/components/divider";
import { __ } from "@wordpress/i18n";
import Text from "~/components/text";

export const MoreSettings = ({ onClose }: { onClose: () => void }) => {
    const [triggerSave, setTriggerSave] = useState(false);
    const { data, setSettings, saveSettings } = useSettings();

    const { treeConnector } = data?.general?.folder || {};

    const { theme, settings } = data?.display || {};

    useEffect(() => {
        if (triggerSave) {
            saveSettings();
        }
        setTriggerSave(false);
    }, [theme, settings, treeConnector]);

    return (
        <div>
            <InlineStack align="between" gap={10} wrap={false}>
                <Text size="xl" weight="medium">
                    {__("Settings", "ninja-media")}
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

            <BlockStack marginTop={20} gap={10}>
                <Text color="secondaryblack" weight="medium">
                    {__("Theme", "ninja-media")}
                </Text>

                <ButtonGroup
                    background="extralight"
                    buttons={THEMES}
                    selectedKey={theme?.theme || "default"}
                    onChange={(value) => {
                    }}
                />

                <Description
                    text={__(
                        "Choose default view style for the file browser.",
                        "ninja-media",
                    )}
                />
            </BlockStack>

            <InlineStack marginTop={20} wrap={false}>
                <Switcher
                    title={__("Show breadcrumb", "ninja-media")}
                    checked={settings?.breadcrumbNavigation}
                    onChange={() => {
                        setSettings(
                            "display.settings.breadcrumbNavigation",
                            !settings?.breadcrumbNavigation,
                        );
                        setTriggerSave(true);
                    }}
                />

                <Divider variant="vertical" margin={"0 20px"} height="25px" />

                <Switcher
                    title={__("Tree Connector", "ninja-media")}
                    checked={treeConnector}
                    onChange={() => {
                        setSettings(
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

const THEMES: {
    key: Theme;
    title: string;
    startIcon: string;
    statusProps?: ButtonStatusProps;
}[] = [
    {
        key: "default",
        title: __("Default", "ninja-media"),
        startIcon: "grid_view",
    },
    {
        key: "bold",
        title: __("Bold", "ninja-media"),
        startIcon: "format_list_bulleted",
        statusProps: {
            default: true,
            isPro: true,
        },
    },
    {
        key: "plugininja",
        title: __("Plugininja", "ninja-media"),
        startIcon: "format_list_bulleted",
        statusProps: {
            default: true,
            isPro: true,
        },
    },
    {
        key: "awesome",
        title: __("Awesome", "ninja-media"),
        startIcon: "format_list_bulleted",
        statusProps: {
            default: true,
            isPro: true,
        },
    },
];
