import { DividerProps } from "./Divider.type";
import clsx from "clsx";

const Divider = ({
    id,
    style,
    className,
    border,
    borderWidth = 1,
    borderStyle = "solid",
    color = "light",
    margin,
    marginTop,
    marginBottom,
    padding,
    paddingTop,
    paddingBottom,
    variant = "horizontal",
    height = "100%",
    width = "100%",
}: DividerProps) => {
    const borderSide =
        border ?? (variant === "horizontal" ? "bottom" : "right");

    const dividerStyle: React.CSSProperties = {
        ...(borderSide === "top" && {
            borderTopWidth: borderWidth,
            borderTopStyle: borderStyle,
        }),
        ...(borderSide === "right" && {
            borderRightWidth: borderWidth,
            borderRightStyle: borderStyle,
        }),
        ...(borderSide === "bottom" && {
            borderBottomWidth: borderWidth,
            borderBottomStyle: borderStyle,
        }),
        ...(borderSide === "left" && {
            borderLeftWidth: borderWidth,
            borderLeftStyle: borderStyle,
        }),

        ...(variant === "horizontal" ? { width } : { height }),

        margin,
        marginTop,
        marginBottom,
        padding,
        paddingTop,
        paddingBottom,
        ...style,
    };

    return (
        <div
            id={id}
            style={dividerStyle}
            className={clsx(`border-${color}`, className)}
        />
    );
};

export default Divider;
