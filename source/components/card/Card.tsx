import { forwardRef } from "@wordpress/element";
import type { CardProps } from "./Card.type";
import Status from "../status";
import clsx from "clsx";
import {
    gapStyle,
    marginStyle,
    marginTopStyle,
    paddingStyle,
    paddingTopStyle,
} from "~/utils/styles";

const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            id,
            style,
            className = "",
            margin,
            marginTop,
            padding = 20,
            paddingTop,
            background = "light",
            border = "secondary",
            borderStyle = "solid",
            rounded = "lg",
            widthFull = true,
            heightFull = false,
            disabled,
            flex = false,
            align,
            blockAlign,
            direction,
            gap,
            wrap,
            statusProps,
            children,
            onClick,
            onContextMenu,
            onMouseEnter,
            onMouseLeave,
            ...rest
        },
        ref,
    ) => {
        const styles: React.CSSProperties = {
            ...style,
            ...marginStyle(margin),
            ...marginTopStyle(marginTop),
            ...paddingStyle(padding),
            ...paddingTopStyle(paddingTop),
            ...gapStyle(gap),
        };

        const classes = clsx(
            `bg-${background}`,
            "border",
            `border-${border}`,
            `border-${borderStyle}`,
            `rounded-${rounded}`,
            "bg-transition",
            widthFull && "w-full",
            heightFull && "h-full",
            disabled && "disabled",
            flex && "flex",
            flex && align && `justify-${align}`,
            flex && blockAlign && `items-${blockAlign}`,
            flex &&
                (direction === "row"
                    ? "flex-row"
                    : direction === "row-reverse"
                    ? "flex-row-reverse"
                    : direction === "col"
                    ? "flex-col"
                    : direction === "col-reverse"
                    ? "flex-col-reverse"
                    : "flex-row"),
            flex && (wrap ? "flex-wrap" : "flex-nowrap"),
            className,
        );

        return (
            <Status {...statusProps}>
                <div
                    ref={ref}
                    id={id}
                    style={styles}
                    className={classes}
                    onClick={(e) => onClick && !disabled && onClick(e)}
                    onContextMenu={(e) =>
                        onContextMenu && !disabled && onContextMenu(e)
                    }
                    onMouseEnter={(e) => onMouseEnter?.(e)}
                    onMouseLeave={(e) => onMouseLeave?.(e)}
                    {...rest}
                >
                    {children}
                </div>
            </Status>
        );
    },
);

export default Card;
