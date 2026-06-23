import type { StatusConfig, StatusProps } from "./Status.type";
import { toBoolean } from "~/utils/utils";
import InlineStack from "../inlineStack";
import { __ } from "@wordpress/i18n";
import Tooltip from "../tooltip";
import Card from "../card";
import Icon from "../icon";
import clsx from "clsx";

const Status = ({
    id,
    style,
    className = "",
    isPro = false,
    isComingSoon = false,
    isHot = false,
    isNew = false,
    isBeta = false,
    ownUi = true,
    placement = "default",
    top = 10,
    bottom,
    left,
    right = 10,
    tooltipPlacement = "left",
    tooltipDisabled = false,
    proTooltipDisabled = false,
    size = "medium",
    widthFull = true,
    ignore = false,
    children,
}: StatusProps) => {
    const allowFeature = isPro ? toBoolean(pnpnm?.isPro) : true;

    const statusConfig: StatusConfig[] = [
        {
            key: "pro",
            variant: "pro",
            title: __("Premium Only", "ninja-media"),
            icon: "crown",
            iconColor: "dark",
            condition: !allowFeature,
        },
        {
            key: "comingsoon",
            variant: "warning",
            title: __("Coming Soon", "ninja-media"),
            icon: "upcoming",
            iconColor: "pure",
            condition: isComingSoon,
        },
        {
            key: "hot",
            variant: "error",
            title: __("Most Used Feature", "ninja-media"),
            icon: "local_fire_department",
            iconColor: "pure",
            condition: isHot,
        },
        {
            key: "new",
            variant: "new",
            title: __("New Feature", "ninja-media"),
            icon: "campaign",
            iconColor: "primary",
            condition: isNew,
        },
        {
            key: "beta",
            variant: "light",
            title: __("Beta Feature", "ninja-media"),
            icon: "running_with_errors",
            iconColor: "primary",
            condition: isBeta,
        },
    ];

    const statusList = statusConfig?.filter((status) => status?.condition);

    if (ignore || (!isPro && !isComingSoon && !isNew && !isHot && !isBeta)) {
        return <>{children}</>;
    }

    const parsePosition = (value?: number | string) =>
        value === undefined
            ? undefined
            : typeof value === "number"
            ? `${value}px`
            : value;

    let positionStyles: React.CSSProperties = {};

    switch (placement) {
        case "center":
            positionStyles = {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
            };
            break;

        case "right-center":
            positionStyles = {
                top: "50%",
                right: parsePosition(right ?? 10),
                transform: "translateY(-50%)",
            };
            break;

        case "left-center":
            positionStyles = {
                top: "50%",
                left: parsePosition(left ?? 10),
                transform: "translateY(-50%)",
            };
            break;

        case "top-center":
            positionStyles = {
                top: parsePosition(top ?? 10),
                left: "50%",
                transform: "translateX(-50%)",
            };
            break;

        case "bottom-center":
            positionStyles = {
                bottom: parsePosition(bottom ?? 10),
                left: "50%",
                transform: "translateX(-50%)",
            };
            break;

        default:
            positionStyles = {
                top: parsePosition(top),
                right: parsePosition(right),
                bottom: parsePosition(bottom),
                left: parsePosition(left),
            };
    }

    const classes = clsx(
        "pn-status",
        widthFull && "w-full",
        !allowFeature && !proTooltipDisabled && "pn-status--locked",
        className,
    );

    const content = (
        <div
            id={id}
            style={{ ...style }}
            className={classes}
            onClick={(e) => {
                if (!allowFeature) {
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }

                if (isComingSoon) {
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }
            }}
        >
            {!allowFeature && !proTooltipDisabled && (
                <div className="pn-status__pro-tooltip">
                    {__(
                        "This feature is only available in the pro version",
                        "ninja-media",
                    )}
                </div>
            )}

            {ownUi && (
                <InlineStack
                    wrap={false}
                    gap={
                        size === "extrasmall"
                            ? 5
                            : size === "small"
                            ? 7
                            : size === "medium"
                            ? 9
                            : size === "large"
                            ? 11
                            : 13
                    }
                    style={positionStyles}
                    className="pn-status__items"
                >
                    {statusList.map(
                        ({ key, variant, title, icon, iconColor }) => (
                            <Tooltip
                                key={key}
                                title={title}
                                placement={tooltipPlacement}
                                arrow
                                wrap="no-wrap"
                                disabled={tooltipDisabled}
                            >
                                <Card
                                    padding={5}
                                    rounded="sm"
                                    borderStyle="none"
                                    background={variant}
                                    className={clsx(
                                        "pn-status__items-item",
                                        `pn-status__items-item--${size}`,
                                    )}
                                >
                                    <Icon name={icon} color={iconColor} />
                                </Card>
                            </Tooltip>
                        ),
                    )}
                </InlineStack>
            )}

            <div
                className={clsx(
                    "pn-status__content",
                    !allowFeature || isComingSoon
                        ? "pn-status__content--disabled"
                        : "",
                )}
                onClick={(e) => {
                    if (!allowFeature) {
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                    }

                    if (isComingSoon) {
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                    }
                }}
            >
                {children}
            </div>
        </div>
    );

    return content;
};

Status.Pro = ({
    title,
    tooltipDisabled = false,
}: {
    title?: string;
    tooltipDisabled?: boolean;
}) => {
    if (toBoolean(pnpnm?.isPro)) {
        return null;
    }

    return (
        <Tooltip
            title={
                title ||
                __(
                    "This feature is only available in the pro version",
                    "ninja-media",
                )
            }
            arrow
            wrap="no-wrap"
            disabled={tooltipDisabled}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Icon name="crown" color="primary" fontSize="xl" />
        </Tooltip>
    );
};

export default Status;
