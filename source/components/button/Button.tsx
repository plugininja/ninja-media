import { FontSize, FontWeight, TextColor } from "~/types/styles";
import { ButtonProps, ButtonStatusProps } from "./Button.type";
import Status from "../status";
import Icon from "../icon";
import clsx from "clsx";

const Button = ({
    id,
    style,
    className = "",
    variant = "default",
    iconUrl,
    title,
    color,
    size = "medium",
    iconSize: _iconSize,
    rounded = "sm",
    textTransform = "capitalize",
    wrap = false,
    full = false,
    visible = true,
    disabled = false,
    loading = false,
    loadingIndicator,
    startIcon,
    startIconColor,
    startIconClassName,
    endIcon,
    endIconColor,
    endIconClassName,
    ariaLabel,
    role = "button",
    tabIndex,
    href,
    target,
    rel,
    preventDefault = false,
    stopPropagation = false,
    statusProps,
    children,
    onClick,
    onBlur,
    onFocus,
    onMouseEnter,
    onMouseLeave,
    onDoubleClick,
}: ButtonProps) => {
    const classes = clsx(
        "pn-button",
        `pn-button--${variant}`,
        `pn-button--${size}`,
        `rounded-${rounded}`,
        color && `text-${color}`,
        wrap ? "text-wrap" : "text-nowrap",
        `text-${textTransform}`,
        full && "w-full",
        disabled && "pn-button--disabled",
        className,
    );

    const iconColor = ["default", "secondary", "outlined", "link"].includes(
        variant,
    )
        ? "black"
        : variant === "primary"
        ? "pure"
        : variant === "warning"
        ? "warning"
        : ("error" as TextColor);

    const iconSize = _iconSize
        ? _iconSize
        : ["large", "extralarge"].includes(size)
        ? "xl"
        : ["supersmall"].includes(size)
        ? "sm"
        : ("lg" as FontSize);

    const iconProps = {
        color: startIcon
            ? startIconColor || iconColor
            : endIconColor || iconColor,
        fontSize: iconSize,
        fontWeight: "medium" as FontWeight,
    };

    const content = () => {
        const renderIcon = (icon?: string) => {
            if (loading) {
                return loadingIndicator ? (
                    loadingIndicator
                ) : (
                    <Icon
                        name="progress_activity"
                        className="loading"
                        {...iconProps}
                    />
                );
            } else if (iconUrl) {
                return (
                    <img
                        referrerPolicy="no-referrer"
                        src={iconUrl}
                        alt="button-icon"
                    />
                );
            }
            return icon ? (
                <Icon
                    name={icon}
                    {...iconProps}
                    className={
                        startIcon ? startIconClassName : endIconClassName
                    }
                />
            ) : null;
        };

        const hasIcons = startIcon || endIcon;
        const showChildren = !(loading && !startIcon && !endIcon);

        if (!hasIcons && loading) {
            return renderIcon();
        }

        return (
            <>
                {startIcon && renderIcon(startIcon)}
                {showChildren && children}
                {endIcon && renderIcon(endIcon)}
            </>
        );
    };

    const commonProps = {
        id,
        style,
        className: classes,
        title,
        "aria-label": ariaLabel,
        role,
        tabIndex,
        onBlur,
        onFocus,
        onMouseEnter,
        onMouseLeave,
        onDoubleClick,
    };

    const handleClick = (
        e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
    ) => {
        if (preventDefault) e.preventDefault();
        if (stopPropagation) e.stopPropagation();
        if (onClick && !disabled && !loading) onClick(e);
    };

    const finalStatusProps: ButtonStatusProps = {
        ...statusProps,
        ...(statusProps?.default && {
            size: "extrasmall",
            placement: "right-center",
            right: size === "extrasmall" ? 4 : size === "small" ? 6 : 8,
        }),
    };

    if (!visible) return null;

    if (href) {
        return (
            <Status {...finalStatusProps}>
                <a
                    href={href}
                    target={target}
                    rel={rel}
                    {...commonProps}
                    onClick={(e) => {
                        if (disabled || loading) return;
                        handleClick(e);
                    }}
                >
                    {content()}
                </a>
            </Status>
        );
    }

    return (
        <Status widthFull={false} {...finalStatusProps}>
            <button
                type="button"
                {...commonProps}
                onClick={(e) => {
                    if (disabled || loading) return;
                    handleClick(e);
                }}
                disabled={disabled || loading}
            >
                {content()}
            </button>
        </Status>
    );
};

export default Button;
