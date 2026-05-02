import { StatusProps } from "~/components/status/Status.type";
import GoogleDrive from "~/assets/icons/themes/GoogleDrive";
import { selectSettings } from "~/redux/features/settings";
import { useEffect, useState } from "@wordpress/element";
import SettingsField from "~/components/settingsField";
import PageContainer from "~/components/pageContainer";
import Default from "~/assets/icons/themes/Default";
import Windows from "~/assets/icons/themes/Windows";
import Dropbox from "~/assets/icons/themes/Dropbox";
import InlineStack from "~/components/inlineStack";
import ColorPicker from "~/components/colorPicker";
import Description from "~/components/description";
import BlockStack from "~/components/blockStack";
import SelectBox from "~/components/selectBox";
import { useAppSelector } from "~/redux/hooks";
import useDebounce from "~/hooks/useDebounce";
import Switcher from "~/components/switcher";
import Slider from "~/components/slider";
import Field from "~/components/field";
import useSave from "~/hooks/useSave";
import Text from "~/components/text";
import Card from "~/components/card";
import clsx from "clsx";

const Display = () => {
    const { data } = useAppSelector(selectSettings);

    const { saveSettings } = useSave();

    const { theme: themeValue, settings } = data?.display || {};

    const { theme, color: colorValue, firstTime } = themeValue || {};

    const { perPage, thumbnailSize, detailsHover, breadcrumbNavigation } =
        settings || {};

    const [color, setColor] = useState<string>(colorValue || "#4D49FC");

    useEffect(() => {
        if (colorValue) {
            setColor(colorValue);
        }
    }, [colorValue]);

    useDebounce(
        () => {
            saveSettings("display.theme.color", color);

            const root = document.documentElement;

            if (root && colorValue) {
                root.style.setProperty("--pnpnm-primary", color);
            }
        },
        [color],
        800,
    );

    return (
        <PageContainer>
            <Field
                title="Theme"
                description="Choose the visual style and accent color for the media library interface."
                docLink="https://plugininja.com"
            >
                <SettingsField background="extralight" title="Select Theme">
                    <Description text="Choose a theme that matches your preferred file manager style." />

                    <InlineStack gap={20}>
                        {THEMES?.map(
                            ({ key, title, icon, statusProps }, index) => (
                                <Card
                                    key={key ?? index}
                                    // statusProps={{
                                    //     ...statusProps,
                                    //     widthFull: false,
                                    // }}
                                    padding={5}
                                    background="white"
                                    rounded="md"
                                    style={{
                                        position: "relative",
                                        width: "235px",
                                        height: "200px",
                                        cursor: "pointer",
                                    }}
                                    className={clsx(
                                        "pnpnm-theme-preview",
                                        theme === key &&
                                            "pnpnm-theme-preview--active",
                                    )}
                                    onClick={() =>
                                        saveSettings("display.theme.theme", key)
                                    }
                                >
                                    <Card
                                        padding={0}
                                        background="white"
                                        rounded="sm"
                                        style={{
                                            width: "220px",
                                            height: "160px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                        className="pnpnm-theme-preview__icon"
                                    >
                                        {icon}
                                    </Card>

                                    <InlineStack
                                        align="center"
                                        blockAlign="center"
                                        style={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            padding: 8,
                                        }}
                                    >
                                        <Text
                                            color={
                                                theme === key
                                                    ? "primary"
                                                    : "descgray"
                                            }
                                            size="sm"
                                        >
                                            {title}
                                        </Text>
                                    </InlineStack>
                                </Card>
                            ),
                        )}
                    </InlineStack>
                </SettingsField>

                <SettingsField
                    background="extralight"
                    title="Media Library Color"
                >
                    <Description text="Set a custom accent color for the media library. Applies to active states, buttons, and highlights." />

                    <BlockStack gap={5}>
                        <ColorPicker
                            defaultColor={"#4D49FC"}
                            selectedColor={color}
                            onChange={(c) => {
                                setColor(c);

                                if (firstTime) {
                                    saveSettings(
                                        "display.theme.firstTime",
                                        false,
                                    );
                                }
                            }}
                        />

                        <ColorPicker.ColorBox
                            colors={[
                                "#4d49fc",
                                "#2271B1",
                                "#00ac47",
                                "#dd115c",
                                "#0048BC",
                                "#001941",
                                "#000E25",
                                "#0072A8",
                                "#007AFF",
                                "#22BC00",
                                "#6800C8",
                            ]}
                            selectedColor={color}
                            onSelect={(c) => {
                                setColor(c);

                                if (firstTime) {
                                    saveSettings(
                                        "display.theme.firstTime",
                                        false,
                                    );
                                }
                            }}
                        />
                    </BlockStack>
                </SettingsField>
            </Field>

            <Field
                title="View Settings"
                description="Adjust how files and folders are displayed in the media library."
                docLink="https://plugininja.com"
            >
                <SettingsField background="extralight" title="Items per page">
                    <Slider
                        min={20}
                        max={500}
                        defaultValue={80}
                        reset
                        value={perPage || 80}
                        onChange={(value) =>
                            saveSettings(
                                "display.settings.perPage",
                                Number(value),
                            )
                        }
                    />
                </SettingsField>

                <SettingsField
                    background="extralight"
                    title="Thumbnail sizes"
                    description="Choose the thumbnail size used when displaying media files in the library grid."
                    secondaryAction={
                        <SelectBox
                            size="small"
                            style={{
                                width: "150px",
                            }}
                            options={THUMBNAIL_SIZES}
                            value={[thumbnailSize || "medium"]}
                            onChange={(value) =>
                                saveSettings(
                                    "display.settings.thumbnailSize",
                                    value[0] as "small" | "medium" | "large",
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description="Show a quick preview panel with file details when you hover over a media item."
                    action={
                        <Switcher
                            title="Show media details on hover"
                            checked={detailsHover}
                            onChange={() =>
                                saveSettings(
                                    "display.settings.detailsHover",
                                    !detailsHover,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description="Display a breadcrumb trail at the top of the media library to show your current folder path."
                    action={
                        <Switcher
                            title="Breadcrumb navigation"
                            checked={breadcrumbNavigation}
                            onChange={() =>
                                saveSettings(
                                    "display.settings.breadcrumbNavigation",
                                    !breadcrumbNavigation,
                                )
                            }
                        />
                    }
                />
            </Field>
        </PageContainer>
    );
};

export default Display;

const THEMES: {
    key: "default" | "windows" | "google-drive" | "dropbox";
    title: string;
    icon: React.ReactNode;
    statusProps?: StatusProps;
}[] = [
    {
        key: "default",
        title: "Default",
        icon: <Default />,
    },
    {
        key: "windows",
        title: "Windows",
        icon: <Windows />,
        statusProps: {},
    },
    {
        key: "google-drive",
        title: "Google Drive",
        icon: <GoogleDrive />,
        statusProps: {},
    },
    {
        key: "dropbox",
        title: "Dropbox",
        icon: <Dropbox />,
        statusProps: {},
    },
];

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
