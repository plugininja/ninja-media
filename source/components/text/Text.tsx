import { TextProps } from "./Text.type";
import clsx from "clsx";

const Text = ({
    id,
    style,
    className = "",
    as: Component = "span",
    color = "black",
    size = "md",
    textTransform = "none",
    align = "left",
    weight = "normal",
    wrap = true,
    ellipsis = false,
    ellipsisLine,
    children,
    onClick,
}: TextProps) => {
    const renderContent = (content: React.ReactNode) => {
        if (typeof content === "string") {
            const parts = content.split(/(\{.*?\})/g);

            return parts.map((part, index) => {
                if (/^\{.*\}$/.test(part)) {
                    return (
                        <strong key={index}>{part.replace(/[{}]/g, "")}</strong>
                    );
                }

                return part;
            });
        }

        return content;
    };

    const isMultiLine = ellipsis && ellipsisLine && ellipsisLine > 1;

    const classes = clsx(
        `text-${color}`,
        `text-${size}`,
        `font-${weight}`,
        `text-${textTransform}`,
        `text-${align}`,
        wrap ? "text-wrap" : "text-nowrap",
        ellipsis && "text-ellipsis",
        ellipsis && (isMultiLine ? "multi" : "single"),
        className,
    );

    const ellipsisStyle = isMultiLine
        ? {
              WebkitLineClamp: ellipsisLine,
          }
        : {};

    return (
        <Component
            id={id}
            style={{ ...style, ...ellipsisStyle }}
            className={classes}
            onClick={onClick}
        >
            {renderContent(children)}
        </Component>
    );
};

export default Text;
