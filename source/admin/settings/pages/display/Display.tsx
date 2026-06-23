import { StatusProps } from "~/components/status/Status.type";
import { iconThemePlugininja, iconThemeAwesome, iconThemeDefault, iconThemeBold } from "~/utils/icons";
import SvgIcon from "~/components/svgIcon/SvgIcon";
import { useEffect, useState } from "@wordpress/element";
import SettingsField from "~/components/settingsField";
import PageContainer from "~/components/pageContainer";
import InlineStack from "~/components/inlineStack";
import ColorPicker from "~/components/colorPicker";
import Description from "~/components/description";
import BlockStack from "~/components/blockStack";
import useDebounce from "~/hooks/useDebounce";
import useSettings from "~/hooks/useSettings";
import Switcher from "~/components/switcher";
import Status from "~/components/status";
import Slider from "~/components/slider";
import Field from "~/components/field";
import { __ } from "@wordpress/i18n";
import Text from "~/components/text";
import Card from "~/components/card";
import DOCS from "~/constants/docs";
import clsx from "clsx";

const Display = () => {
    const { data, setSettings } = useSettings();

    const { theme: themeValue, settings } = data?.display || {};

    const { theme, color: colorValue, firstTime } = themeValue || {};

    const { perPage, detailsHover, breadcrumbNavigation, lightbox } =
        settings || {};

    const [color, setColor] = useState<string>(colorValue || "#4D49FC");

    useEffect(() => {
        if (colorValue) {
            setColor(colorValue);
        }
    }, [colorValue]);

    useDebounce(
        () => {
            setSettings("display.theme.color", color);

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
                title={__("Theme", "ninja-media")}
                description={__(
                    "Choose the visual style and accent color for the media library interface.",
                    "ninja-media",
                )}
                docLink={DOCS?.documentation?.main}
            >
                <SettingsField
                    background="extralight"
                    title={__("Select Theme", "ninja-media")}
                >
                    <Description
                        text={__(
                            "Choose a visual style for the folder sidebar and media browser.",
                            "ninja-media",
                        )}
                    />

                    <InlineStack gap={20}>
                        {THEMES?.map(
                            ({ key, title, icon, statusProps }, index) => (
                                <Card
                                    key={key ?? index}
                                    statusProps={{
                                        ...statusProps,
                                        ownUi: false,
                                        widthFull: false,
                                        size: "small",
                                    }}
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
                                    onClick={() => {
                                    }}
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
                                        blockAlign="end"
                                        gap={10}
                                        wrap={false}
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

                                        {statusProps?.isPro && <Status.Pro tooltipDisabled />}
                                    </InlineStack>
                                </Card>
                            ),
                        )}
                    </InlineStack>
                </SettingsField>

                <SettingsField
                    background="extralight"
                    title={__("Media Library Color", "ninja-media")}
                >
                    <Description
                        text={__(
                            "Set the primary accent color used throughout the media library interface.",
                            "ninja-media",
                        )}
                    />

                    <BlockStack gap={5}>
                        <ColorPicker
                            defaultColor={"#4D49FC"}
                            selectedColor={color}
                            onChange={(c) => {
                                setColor(c);

                                if (firstTime) {
                                    setSettings(
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
                                    setSettings(
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
                title={__("View Settings", "ninja-media")}
                description={__(
                    "Adjust how many items appear per page, thumbnail sizes, and hover preview behavior.",
                    "ninja-media",
                )}
                docLink={DOCS?.documentation?.main}
            >
                <SettingsField
                    background="extralight"
                    title={__("Items per page", "ninja-media")}
                >
                    <Slider
                        min={20}
                        max={500}
                        defaultValue={80}
                        reset
                        value={perPage || 80}
                        onChange={(value) =>
                            setSettings(
                                "display.settings.perPage",
                                Number(value),
                            )
                        }
                    />
                </SettingsField>

                <SettingsField
                    statusProps={{
                        isPro: true,
                        ownUi: false,
                    }}
                    background="extralight"
                    description="Show file name, type, and size as a tooltip when hovering over a media item."
                    action={
                        <Switcher
                            title={__(
                                "Show media details on hover",
                                "ninja-media",
                            )}
                            isPro={true}
                            checked={detailsHover}
                            onChange={() => {
                            }}
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description={__(
                        "Show a clickable folder trail above the media grid so you can navigate back up through nested folders.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__("Breadcrumb navigation", "ninja-media")}
                            checked={breadcrumbNavigation}
                            onChange={() =>
                                setSettings(
                                    "display.settings.breadcrumbNavigation",
                                    !breadcrumbNavigation,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description={__(
                        "Open images in a full-screen lightbox viewer with prev/next navigation and keyboard support.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__("Lightbox", "ninja-media")}
                            checked={lightbox ?? false}
                            onChange={() =>
                                setSettings(
                                    "display.settings.lightbox",
                                    !(lightbox ?? false),
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
    key: "default" | "bold" | "plugininja" | "awesome";
    title: string;
    icon: React.ReactNode;
    statusProps?: StatusProps;
}[] = [
    {
        key: "default",
        title: __("Default", "ninja-media"),
        icon: <SvgIcon src={iconThemeDefault} />,
    },
    {
        key: "bold",
        title: __("Bold", "ninja-media"),
        icon: <SvgIcon src={iconThemeBold} />,
        statusProps: {
            isPro: true,
        },
    },
    {
        key: "plugininja",
        title: __("Plugininja", "ninja-media"),
        icon: <SvgIcon src={iconThemePlugininja} />,
        statusProps: {
            isPro: true,
        },
    },
    {
        key: "awesome",
        title: __("Awesome", "ninja-media"),
        icon: <SvgIcon src={iconThemeAwesome} />,
        statusProps: {
            isPro: true,
        },
    },
];
