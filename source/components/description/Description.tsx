import { DescriptionProps } from "./Description.type";
import clsx from "clsx";

const Description = ({
    id,
    style,
    className = "",
    as: Component = "span",
    limit,
    text,
    color = "descgray",
    size = "xs",
    weight = "normal",
    textTransform = "none",
    align = "left",
}: DescriptionProps) => {
    const classes = clsx(
        `text-${color}`,
        `text-${size}`,
        `font-${weight}`,
        `text-${textTransform}`,
        `text-${align}`,
        className,
    );

    const truncatedText =
        limit && typeof text === "string"
            ? text.slice(0, limit) + (text.length > limit ? "..." : "")
            : text;

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

    return (
        <Component id={id} style={style} className={classes}>
            {renderContent(truncatedText)}
        </Component>
    );
};

export default Description;
