import { ColorBoxProps, ColorPickerComponent } from "./ColorPicker.type";
import { useEffect, useState } from "@wordpress/element";
import { StatusProps } from "../status/Status.type";
import { __ } from "@wordpress/i18n";
import Status from "../status";
import Button from "../button";
import Icon from "../icon";
import clsx from "clsx";

const formatColorInput = (value: string): string => {
    let color = value.trim().toLowerCase();

    if (!color.startsWith("#") && /^[0-9a-f]{3,8}$/i.test(color)) {
        color = `#${color}`;
    }

    return color;
};

const isValidCssColor = (color: string): boolean => {
    const { style } = new Option();

    style.color = color;

    return style.color !== "";
};

const toFullHexColor = (color: string): string | null => {
    const hexColor = document.createElement("canvas").getContext("2d");
    if (!hexColor) return null;

    hexColor.fillStyle = "#000";
    hexColor.fillStyle = color;
    const finalColor = hexColor.fillStyle;

    return /^#[0-9a-f]{6}$/i.test(finalColor) ? finalColor : null;
};

const ColorPicker: ColorPickerComponent = ({
    id,
    style,
    className = "",
    defaultColor = "#000000",
    selectedColor,
    statusProps,
    onChange,
}) => {
    const resolvedDefault =
        isValidCssColor(defaultColor) && toFullHexColor(defaultColor)
            ? toFullHexColor(defaultColor)!
            : "#000000";

    const resolvedSelected =
        selectedColor &&
        isValidCssColor(selectedColor) &&
        toFullHexColor(selectedColor)
            ? toFullHexColor(selectedColor)!
            : resolvedDefault;

    const [color, setColor] = useState(resolvedSelected);
    const [inputValue, setInputValue] = useState(resolvedSelected);

    useEffect(() => {
        const fullHex = toFullHexColor(selectedColor || "");

        if (selectedColor && fullHex && fullHex !== color) {
            setColor(fullHex);
            setInputValue(fullHex);
        }
    }, [selectedColor, color]);

    useEffect(() => {
        const formatted = formatColorInput(inputValue);

        if (isValidCssColor(formatted)) {
            const full = toFullHexColor(formatted);

            if (full) {
                setColor(full);
                onChange?.(full);
            }
        }
    }, [inputValue, onChange]);

    const isValid = isValidCssColor(formatColorInput(inputValue));

    const handleColorBoxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setColor(e.target.value);
        setInputValue(e.target.value);
        onChange?.(e.target.value);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleClear = () => {
        setColor(resolvedDefault);
        setInputValue(resolvedDefault);
        onChange?.(resolvedDefault);
    };

    const finalStatusProps = {
        ...statusProps,
        size: "extrasmall",
        placement: "right-center",
        right: 8,
    } as StatusProps;

    return (
        <div
            id={id}
            style={style}
            className={clsx("pn-color-picker", className)}
        >
            <div className="pn-color-picker__wrapper">
                <Status {...finalStatusProps}>
                    <input
                        type="color"
                        value={color}
                        onChange={handleColorBoxChange}
                        className="pn-color-picker__wrapper-picker-box"
                    />
                </Status>

                <Status {...finalStatusProps}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder="Type Color"
                        className={clsx(
                            "pn-color-picker__wrapper-picker-input",
                            !isValid && "error",
                        )}
                    />
                </Status>
            </div>

            <Button variant="outlined" size="small" onClick={handleClear}>
                {__("Clear", "ninja-media")}
            </Button>
        </div>
    );
};

const ColorBox: React.FC<ColorBoxProps> = ({
    size = "small",
    colors,
    selectedColor,
    onSelect,
}) => {
    return (
        <div
            className={clsx(
                "pn-color-box-wrapper",
                size === "large" && "pn-color-box-wrapper--large",
            )}
        >
            {colors?.map((color, index) => {
                const hex = toFullHexColor(color);
                if (!hex) return null;

                const isActive = toFullHexColor(selectedColor) === hex;

                return (
                    <div
                        key={index}
                        className={clsx(
                            "pn-color-box",
                            size === "large" && "pn-color-box--large",
                            isActive && "active",
                        )}
                        style={{
                            backgroundColor: hex,
                            color: isActive ? "#fff" : "#000",
                        }}
                        onClick={() => onSelect(hex)}
                    >
                        {isActive && (
                            <Icon name="check" color="pure" fontSize="lg" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

ColorPicker.ColorBox = ColorBox;

export default ColorPicker;
