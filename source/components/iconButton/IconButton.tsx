import { IconButtonProps } from "./IconButton.type";
import { TextColor } from "~/types/styles";
import Icon from "../icon/Icon";
import clsx from "clsx";

const IconButton = ({
    name,
    iconUrl,
    svgIcon: SvgIcon,
    id,
    style,
    className = "",
    iconStyle,
    iconClassName,
    variant = "default",
    title,
    color,
    size = "medium",
    fontSize = "xl",
    fontWeight = "medium",
    rounded = "sm",
    border = true,
    borderColor = "transparent",
    borderStyle = "solid",
    full = false,
    visible = true,
    disabled = false,
    loading = false,
    loadingIndicator,
    ariaLabel,
    role = "button",
    tabIndex,
    href,
    target,
    rel,
    preventDefault = false,
    stopPropagation = false,
    children,
    onClick,
    onBlur,
    onFocus,
    onMouseEnter,
    onMouseLeave,
    onDoubleClick,
}: IconButtonProps) => {
    const classes = clsx(
        "pn-icon-button",
        `pn-icon-button--${variant}`,
        `pn-icon-button--${size}`,
        `rounded-${rounded}`,
        border && `border border-${borderColor} border-${borderStyle}`,
        full && "w-full",
        disabled && "pn-icon-button--disabled",
        className,
    );

    const iconColor = color
        ? color
        : ["default", "secondary", "outlined", "link"].includes(variant)
        ? "black"
        : variant === "primary"
        ? "white"
        : variant === "warning"
        ? "warning"
        : variant === "white"
        ? "primary"
        : variant === "light"
        ? "black"
        : ("error" as TextColor);

    const content = loading
        ? loadingIndicator ?? (
              <Icon
                  name="progress_activity"
                  color={color ?? iconColor}
                  fontSize={fontSize}
                  fontWeight={fontWeight}
                  className="loading"
              />
          )
        : (name && (
              <Icon
                  name={name}
                  color={color ?? iconColor}
                  fontSize={fontSize}
                  fontWeight={fontWeight}
                  style={iconStyle}
                  className={iconClassName}
              />
          )) ??
          children ??
          (iconUrl && (
              <img
                  referrerPolicy="no-referrer"
                  src={iconUrl}
                  alt="icon"
                  style={{
                      padding: "3px",
                  }}
              />
          )) ??
          (SvgIcon && <SvgIcon />);

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

    if (!visible) return null;

    if (href) {
        return (
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
                {content}
            </a>
        );
    }

    return (
        <button
            type="button"
            {...commonProps}
            onClick={(e) => {
                if (disabled || loading) return;
                handleClick(e);
            }}
            disabled={disabled || loading}
        >
            {content}
        </button>
    );
};

export default IconButton;
