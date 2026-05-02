import type { ReactNode, CSSProperties, MouseEvent } from "react";
import WindowsOpen from "~/assets/icons/folder/WindowsOpen";
import DefaultOpen from "~/assets/icons/folder/DefaultOpen";
import Windows from "~/assets/icons/folder/Windows";
import Default from "~/assets/icons/folder/Default";
import Dropbox from "~/assets/icons/folder/Dropbox";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import { useMemo } from "@wordpress/element";
import Checkbox from "~/components/checkbox";
import * as React from "@wordpress/element";
import Card from "~/components/card";
import Text from "~/components/text";
import Icon from "~/components/icon";
import clsx from "clsx";

const Folder = ({
    theme = "default",
    id,
    name,
    color,
    count = 0,
    icon: PropsIcon,
    open,
    active,
    bulkSelect = false,
    selected = false,
    bgWhite = false,
    style,
    className,
    drop = false,
    onClick,
    onDoubleClick,
    onContextMenu,
    onMouseDown,
    loading = false,
    disabled = false,
}: {
    theme?: "default" | "windows" | "google-drive" | "dropbox";
    id?: string | number;
    name?: string;
    color?: string | null;
    count?: number;
    icon?: ReactNode;
    open?: boolean;
    active?: boolean;
    bulkSelect?: boolean;
    selected?: boolean;
    drop?: boolean;
    bgWhite?: boolean;
    style?: CSSProperties;
    className?: string;
    onClick?: () => void;
    onDoubleClick?: () => void;
    onContextMenu?: (e: MouseEvent<HTMLElement>) => void;
    onMouseDown?: (e: MouseEvent<HTMLElement>) => void;
    loading?: boolean;
    disabled?: boolean;
}) => {
    const iconElement = useMemo(() => {
        if (theme === "windows")
            return open ? (
                <WindowsOpen color={color} />
            ) : (
                <Windows color={color} />
            );
        if (theme === "dropbox") return <Dropbox color={color} />;
        if (theme === "google-drive")
            return <Default color={color} active={false} />;
        if (drop) return <DefaultOpen color={color} active={active ?? false} />;
        return open ? (
            <DefaultOpen color={color} active={active ?? false} />
        ) : (
            <Default color={color} active={active ?? false} />
        );
    }, [theme, open, color, active, drop]);

    return (
        <Card
            padding={3}
            background={
                bgWhite
                    ? "white"
                    : drop
                    ? "light"
                    : active
                    ? "extralight"
                    : "white"
            }
            rounded="sm"
            border={active ? "light" : "transparent"}
            flex
            direction="row"
            align="between"
            gap={10}
            wrap={false}
            style={{
                ...style,
                minWidth: 0,
                height: "30px",
                cursor: disabled ? "not-allowed" : "pointer",
                userSelect: "none",
                opacity: disabled ? 0.5 : 1,
                overflow: "hidden",
            }}
            className={clsx(
                "pnpnm-folder",
                drop && "pnpnm-folder--drop",
                className,
            )}
            onClick={disabled ? undefined : onClick}
            onDoubleClick={disabled ? undefined : onDoubleClick}
            onContextMenu={disabled ? undefined : onContextMenu}
            onMouseDown={disabled ? undefined : onMouseDown}
        >
            <InlineStack
                gap={9}
                wrap={false}
                style={{
                    marginLeft: "4px",
                    minWidth: 0,
                }}
            >
                {(theme === "windows" || theme === "google-drive") && (
                    <BlockStack
                        align="center"
                        inlineAlign="center"
                        className={clsx(
                            "pnpnm-folder__arrow",
                            open && "pnpnm-folder__arrow--open",
                            bulkSelect && "pnpnm-folder__arrow--bulk-select",
                        )}
                    >
                        {loading ? (
                            <Icon
                                name="progress_activity"
                                color={active ? "primary" : "black"}
                                className="loading"
                            />
                        ) : bulkSelect ? (
                            <Checkbox
                                size="small"
                                checked={selected}
                                onChange={disabled ? undefined : onClick}
                            />
                        ) : (
                            <Icon
                                name={
                                    theme === "windows"
                                        ? "keyboard_arrow_down"
                                        : "arrow_drop_down"
                                }
                                fontSize={theme === "windows" ? "lg" : "xl"}
                            />
                        )}
                    </BlockStack>
                )}

                {theme === "dropbox" && (
                    <Card
                        padding={3}
                        background="white"
                        border={active ? "light" : "transparent"}
                        rounded="sm"
                        flex
                        align="center"
                        blockAlign="center"
                        className={clsx(
                            !bulkSelect && "pnpnm-folder__arrow",
                            "pnpnm-folder__arrow--dropbox",
                            open && "pnpnm-folder__arrow--open",
                        )}
                    >
                        {loading ? (
                            <Icon
                                name="progress_activity"
                                color={active ? "primary" : "black"}
                                className="loading"
                            />
                        ) : bulkSelect ? (
                            <Checkbox
                                size="small"
                                checked={selected}
                                onChange={disabled ? undefined : onClick}
                            />
                        ) : (
                            <Icon name="keyboard_arrow_down" fontSize="lg" />
                        )}
                    </Card>
                )}

                <BlockStack
                    align="center"
                    inlineAlign="center"
                    className="pnpnm-folder__icon"
                >
                    {loading && theme === "default" ? (
                        <Icon
                            name="progress_activity"
                            color={active ? "primary" : "black"}
                            className="loading"
                        />
                    ) : bulkSelect && theme === "default" ? (
                        <Checkbox
                            size="small"
                            checked={selected}
                            onChange={disabled ? undefined : onClick}
                        />
                    ) : PropsIcon ? (
                        PropsIcon
                    ) : (
                        iconElement
                    )}
                </BlockStack>

                {id && (
                    <Text
                        color={active ? "primary" : "secondaryblack"}
                        size="sm"
                        wrap={false}
                    >
                        #{id}
                    </Text>
                )}

                <Text
                    color={active ? "primary" : "secondaryblack"}
                    size="sm"
                    wrap={false}
                    ellipsis
                    style={{
                        minWidth: 0,
                    }}
                >
                    {name}
                </Text>
            </InlineStack>

            {count > 0 && (
                <Card
                    padding={5}
                    background={active ? "white" : "extralight"}
                    rounded="xs"
                    flex
                    align="center"
                    blockAlign="center"
                    style={{
                        width: "fit-content",
                        minWidth: "22px",
                        height: "22px",
                    }}
                >
                    <Text
                        color={active ? "primary" : "secondaryblack"}
                        size="xs"
                    >
                        {count}
                    </Text>
                </Card>
            )}
        </Card>
    );
};

export default React.memo(Folder);
