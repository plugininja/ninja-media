import type { GridAreaChildProps, GridStackProps } from "./GridStack.type";
import clsx from "clsx";
import {
    gapStyle,
    marginStyle,
    marginTopStyle,
    paddingStyle,
    paddingTopStyle,
} from "~/utils/styles";
import {
    Children,
    cloneElement,
    forwardRef,
    isValidElement,
} from "@wordpress/element";

const GridStack = forwardRef(
    (
        {
            id,
            style,
            className = "",
            margin,
            marginTop,
            padding,
            paddingTop,
            as,
            children,
            columns = 1,
            rows,
            min = "0",
            max = "1fr",
            gap = 16,
            rounded = "none",
            align,
            blockAlign,
            templateAreas,
        }: GridStackProps,
        ref: React.Ref<any>,
    ) => {
        let gridTemplateColumns = "";

        if (columns === "auto-fit" || columns === "auto-fill") {
            gridTemplateColumns = `repeat(${columns}, minmax(${min}, ${max}))`;
        } else if (typeof columns === "number") {
            gridTemplateColumns = `repeat(${columns}, minmax(${min}, ${max}))`;
        } else {
            gridTemplateColumns = columns;
        }

        const classes: string[] = ["grid"];

        if (align) classes.push(`justify-${align}`);
        if (blockAlign) classes.push(`items-${blockAlign}`);
        if (rounded) classes.push(`rounded-${rounded}`);
        if (className) classes.push(className);

        const computedStyle: React.CSSProperties = {
            gridTemplateColumns,
            ...(rows ? { gridTemplateRows: rows } : {}),
            ...(templateAreas && {
                gridTemplateAreas: templateAreas.map((r) => `"${r}"`).join(" "),
            }),
            ...style,
            ...gapStyle(gap),
            ...marginStyle(margin),
            ...marginTopStyle(marginTop),
            ...paddingStyle(padding),
            ...paddingTopStyle(paddingTop),
        };

        const enhancedChildren = Children.map(children, (child) => {
            if (!isValidElement(child)) return child;
            const el = child as React.ReactElement<GridAreaChildProps>;
            const area = el.props.gridArea;

            return cloneElement(el, {
                style: {
                    ...(el.props.style || {}),
                    ...(area ? { gridArea: area } : {}),
                },
            });
        });

        // const Tag = as || "div";
        const Tag = (as || "div") as React.ElementType;

        return (
            <Tag
                ref={ref}
                id={id}
                style={computedStyle}
                className={clsx(...classes)}
            >
                {enhancedChildren}
            </Tag>
        );
    },
);
export default GridStack;
