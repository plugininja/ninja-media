import { IconProps } from "./Icon.type";
import clsx from "clsx";

const Icon = ({
    id,
    name,
    title,
    style,
    className = "",
    color = "black",
    fontSize = "md",
    fontWeight = "medium",
    onClick,
}: IconProps) => {
    const classes = clsx(
        name,
        "pn-icon",
        `text-${color}`,
        `text-${fontSize}`,
        `font-${fontWeight}`,
        className,
    );

    return (
        <span
            id={id}
            title={title}
            style={style}
            className={classes}
            onClick={onClick}
        >
            {name}
        </span>
    );
};

export default Icon;
