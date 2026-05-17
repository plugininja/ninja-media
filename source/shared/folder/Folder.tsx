import type { ReactNode, CSSProperties, MouseEvent } from "react";
import InlineStack from "~/components/inlineStack";
import { Theme } from "~/types/settings/settings";
import BlockStack from "~/components/blockStack";
import Checkbox from "~/components/checkbox";
import * as React from "@wordpress/element";
import Card from "~/components/card";
import Text from "~/components/text";
import Icon from "~/components/icon";
import ThemeIcon from "./ThemeIcon";
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
    onMouseEnter,
}: {
    theme?: Theme;
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
    onMouseEnter?: () => void;
    loading?: boolean;
    disabled?: boolean;
}) => {
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
            onMouseEnter={onMouseEnter}
        >
            <InlineStack
                gap={9}
                wrap={false}
                style={{
                    marginLeft: "4px",
                    minWidth: 0,
                }}
            >

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
                        <ThemeIcon
                            theme={theme}
                            open={open}
                            color={color}
                            active={active}
                            drop={drop}
                        />
                    )}
                </BlockStack>

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
