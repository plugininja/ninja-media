import { SwitcherProps } from "./Switcher.type";
import Text from "../text";
import clsx from "clsx";

const Switcher: React.FC<SwitcherProps> = ({
    id = "",
    style,
    className = "",
    checked,
    title,
    titleSize = "md",
    tabIndex,
    ariaLabel,
    loading = false,
    disabled,
    onChange,
}) => {
    const handleChange = (isChecked: boolean) => {
        if (disabled || loading) return;

        if (onChange) onChange(isChecked);
    };

    const classes = clsx(
        "pn-switcher",
        disabled && "pn-switcher--disabled",
        className,
    );

    return (
        <div
            id={id}
            style={{
                ...style,
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                userSelect: "none",
            }}
            tabIndex={tabIndex}
            aria-label={ariaLabel}
            className={classes}
        >
            <div
                className={clsx(
                    "pn-switcher__toggle",
                    checked && "pn-switcher__toggle--active",
                    loading && "pn-switcher__toggle--loading",
                )}
                onClick={() => handleChange(!checked)}
            >
                <div className="pn-switcher__toggle-thumb" />
            </div>

            {title && (
                <Text
                    size={titleSize}
                    weight="medium"
                    className="cursor-pointer"
                    onClick={() => handleChange(!checked)}
                >
                    {title}
                </Text>
            )}
        </div>
    );
};

export default Switcher;
