import { CheckboxProps } from "./Checkbox.type";
import clsx from "clsx";

const Checkbox = ({
    id,
    name,
    style,
    className = "",
    checked,
    defaultChecked = false,
    size = "medium",
    rounded = "xs",
    title,
    tabIndex,
    ariaLabel,
    readonly,
    visible = true,
    disabled = false,
    onChange,
}: CheckboxProps) => {
    const classes = clsx(
        "pn-checkbox",
        `pn-checkbox--${size}`,
        `rounded-${rounded}`,
        disabled && "pn-checkbox--disabled",
        className,
    );

    const handleCheck = (checked: boolean) => {
        if (readonly) return;
        onChange && onChange(checked);
    };

    if (!visible) return null;

    return (
        <label
            title={title}
            style={style}
            className={classes}
            onClick={(e) => e.stopPropagation()}
        >
            <input
                id={id}
                type="checkbox"
                name={name}
                checked={checked}
                defaultChecked={defaultChecked}
                className="pn-checkbox__input"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onChange && handleCheck(e.target.checked)}
                tabIndex={tabIndex}
                aria-label={ariaLabel}
                aria-readonly={readonly || undefined}
                readOnly={readonly}
                disabled={disabled}
            />
            <span className="pn-checkbox__box" />
        </label>
    );
};

export default Checkbox;
