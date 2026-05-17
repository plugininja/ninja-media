import { DisabledProps } from "./Disabled.type";
import BlockStack from "../blockStack";
import clsx from "clsx";

const Disabled = ({
    id,
    style,
    className = "",
    depend = false,
    dependOn = "",
    dependOnExact = false,
    gap = 20,
    children,
}: DisabledProps) => {
    const classes = clsx(depend && "pn-disabled", className);

    const handleClick = (e: React.MouseEvent) => {
        const dependent = document.getElementById(dependOn);

        if (dependent && depend) {
            e.stopPropagation();

            const label = dependOnExact
                ? dependent
                : (dependent.parentElement as HTMLElement);

            if (!label) return;

            label.classList.add("pn-blink");

            setTimeout(() => {
                label.classList.remove("pn-blink");
            }, 500);
        }
    };

    return (
        <BlockStack
            id={id}
            style={style}
            gap={gap}
            className={classes}
            onClick={handleClick}
        >
            {children}
        </BlockStack>
    );
};

export default Disabled;
