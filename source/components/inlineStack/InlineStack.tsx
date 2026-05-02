import { InlineStackProps } from "./InlineStack.type";
import { forwardRef } from "@wordpress/element";
import clsx from "clsx";
import {
    gapStyle,
    marginStyle,
    marginTopStyle,
    paddingStyle,
    paddingTopStyle,
} from "~/utils/styles";

const InlineStack = forwardRef(
    (
        {
            id,
            title,
            style,
            className = "",
            margin,
            marginTop,
            padding,
            paddingTop,
            as: Component = "div",
            align = "start",
            blockAlign = "center",
            direction = "row",
            gap,
            wrap = true,
            children,
            onClick,
            onContextMenu,
            onDoubleClick,
            ...rest
        }: InlineStackProps,
        ref: React.Ref<any>,
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
            "flex",
            `justify-${align}`,
            `items-${blockAlign}`,
            direction === "row" ? "flex-row" : "flex-row-reverse",
            wrap ? "flex-wrap" : "flex-nowrap",
            className,
        );

        return (
            <Component
                ref={ref as any}
                id={id}
                title={title}
                style={styles}
                className={classes}
                onClick={onClick}
                onContextMenu={onContextMenu}
                onDoubleClick={onDoubleClick}
                {...rest}
            >
                {children}
            </Component>
        );
    },
);

export default InlineStack;
