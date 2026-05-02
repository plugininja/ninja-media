import { BlockStackProps } from "./BlockStack.type";
import { forwardRef } from "@wordpress/element";
import clsx from "clsx";
import {
    gapStyle,
    marginStyle,
    marginTopStyle,
    paddingStyle,
    paddingTopStyle,
} from "~/utils/styles";

export const BlockStack = forwardRef(
    (
        {
            id,
            style,
            className = "",
            margin,
            marginTop,
            padding,
            paddingTop,
            as: Component = "div",
            align = "start",
            inlineAlign,
            gap,
            reverseOrder = false,
            children,
            onClick,
            onContextMenu,
            onDoubleClick,
            ...rest
        }: BlockStackProps,
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
            "flex-col",
            `justify-${align}`,
            inlineAlign && `items-${inlineAlign}`,
            reverseOrder && "flex-col-reverse",
            className,
        );

        return (
            <Component
                ref={ref as any}
                id={id}
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

export default BlockStack;
