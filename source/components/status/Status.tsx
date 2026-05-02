import type { StatusConfig, StatusProps } from "./Status.type";
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
    isComingSoon = false,
    isHot = false,
    isNew = false,
    isBeta = false,
    placement = "default",
    top = 10,
    bottom,
    left,
    right = 10,
    tooltipPlacement = "left",
    size = "medium",
    widthFull = true,
    ignore = false,
    children,
}: StatusProps) => {
    const statusConfig: StatusConfig[] = [
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

    if (ignore || (!isComingSoon && !isNew && !isHot && !isBeta)) {
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

    const classes = clsx("pn-status", widthFull && "w-full", className);

    return (
        <div
            id={id}
            style={style}
            className={classes}
            onClick={(e) => {
                if (isComingSoon) {
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }
            }}
        >
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
                {statusList.map(({ key, variant, title, icon, iconColor }) => (
                    <Tooltip
                        key={key}
                        title={title}
                        placement={tooltipPlacement}
                        arrow
                        wrap="no-wrap"
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
                ))}
            </InlineStack>

            <div
                className={clsx(
                    "pn-status__content",
                    isComingSoon ? "pn-status__content--disabled" : "",
                )}
                onClick={(e) => {
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
};

export default Status;
