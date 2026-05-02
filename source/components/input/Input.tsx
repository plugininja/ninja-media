import { forwardRef, useEffect, useState } from "@wordpress/element";
import { InputProps } from "./Input.type";
import { __ } from "@wordpress/i18n";
import Icon from "../icon";
import clsx from "clsx";

const sizeClasses = {
    extrasmall: "pn-input__group--xs",
    small: "pn-input__group--sm",
    medium: "pn-input__group--md",
    large: "pn-input__group--lg",
    extralarge: "pn-input__group--xl",
};

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
    const {
        id,
        name,
        style,
        inputStyle,
        className = "",
        gap = 10,
        inputClassName = "",
        type = "text",
        title,
        placeholder = __("Type...", "ninja-media"),
        value: controlledValue = "",
        visible = true,
        disabled = false,
        readOnly = false,
        required = false,
        spellCheck = false,
        color = "light",
        size = "medium",
        borderStyle = "solid",
        rounded = "sm",
        fullWidth = true,
        customWidth,
        label,
        labelFontSize = "md",
        labelFontWeight = "medium",
        helperText,
        error = false,
        errorText,
        prefix,
        suffix,
        searchIcon = false,
        ariaLabel,
        tabIndex,
        preventDefault = false,
        stopPropagation = false,
        onClick,
        onChange,
        onBlur,
        onKeyDown,
        ...rest
    } = props;

    const [internalValue, setInternalValue] = useState(controlledValue);

    useEffect(() => {
        setInternalValue(controlledValue);
    }, [controlledValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInternalValue(newValue);
        onChange?.(type === "number" ? Number(newValue) || 0 : newValue);
    };

    const handleBlur = () => {
        onBlur?.(
            type === "number" ? Number(internalValue) || 0 : internalValue,
        );
    };

    if (!visible) return null;

    const wrapperStyle: React.CSSProperties = {
        ...style,
        ...(gap && { gap }),
        width: fullWidth ? "100%" : customWidth,
    };

    const wrapperClass = clsx(
        "pn-input",
        disabled && "pn-input--disabled",
        className,
    );

    const inputGroupClass = clsx(
        "pn-input__group",
        sizeClasses[size],
        `rounded-${rounded}`,
        "border",
        error ? "border-error" : `border-${color}`,
        `border-${borderStyle}`,
        searchIcon && "pn-input__group--search-icon",
        prefix && "pn-input__group--prefix",
        suffix && "pn-input__group--suffix",
    );

    return (
        <div style={wrapperStyle} className={wrapperClass}>
            {label && (
                <label
                    htmlFor={id}
                    className={clsx(
                        `text-${labelFontSize}`,
                        `font-${labelFontWeight}`,
                        "text-black",
                    )}
                >
                    {label}
                    {required && <span className="pn-input__required">*</span>}
                </label>
            )}

            <div className={inputGroupClass}>
                {(prefix || searchIcon) && (
                    <span className="pn-input__group-prefix-icon">
                        {searchIcon ? (
                            <Icon name="search" fontSize="lg" />
                        ) : (
                            prefix
                        )}
                    </span>
                )}

                <input
                    id={id}
                    name={name}
                    ref={ref}
                    type={type}
                    placeholder={placeholder}
                    title={title}
                    value={internalValue}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={required}
                    spellCheck={spellCheck}
                    aria-label={ariaLabel}
                    aria-invalid={error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    tabIndex={tabIndex}
                    style={inputStyle}
                    className={inputClassName}
                    onClick={(e) => {
                        if (preventDefault) e.preventDefault();
                        if (stopPropagation) e.stopPropagation();
                        onClick?.(e);
                    }}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={onKeyDown}
                    {...rest}
                />

                {suffix && (
                    <span className="pn-input__group-suffix-icon">
                        {suffix}
                    </span>
                )}
            </div>

            {(helperText || (error && errorText)) && (
                <span
                    id={error ? `${id}-error` : undefined}
                    className={clsx(
                        "pn-input__helper-text",
                        error && "pn-input-error",
                    )}
                >
                    {error && errorText ? errorText : helperText}
                </span>
            )}
        </div>
    );
});

export default Input;
