import { useEffect, useRef, useState } from "@wordpress/element";
import type { SliderProps } from "./Slider.type";
import { __ } from "@wordpress/i18n";
import SelectBox from "../selectBox";
import Button from "../button";
import Text from "../text";
import clsx from "clsx";

const Slider: React.FC<SliderProps> = ({
    id,
    style,
    className = "",
    size = "small",
    min = 0,
    max = 100,
    step = 1,
    value = 50,
    defaultValue = 50,
    reset = false,
    showMark = false,
    marks = [],
    unit = false,
    unitOptions = [],
    unitValue = [],
    defaultUnit = "",
    unitPlaceholder = "Unit",
    trackDisabled = false,
    disabled = false,
    onChange,
}) => {
    const [inputValue, setInputValue] = useState<string | number>(value);
    const [isDragging, setIsDragging] = useState(false);
    const [tooltipLeft, setTooltipLeft] = useState(0);
    const [error, setError] = useState("");

    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const percent = ((value - min) / (max - min)) * 100;

    const updateValueFromClientX = (clientX: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        let newPercent = ((clientX - rect.left) / rect.width) * 100;
        newPercent = Math.max(0, Math.min(100, newPercent));
        const newValue =
            Math.round((min + (newPercent / 100) * (max - min)) / step) * step;
        handleOnchange(newValue, unitValue[0]);
        setError("");
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (disabled || trackDisabled) return;
        setIsDragging(true);
        updateValueFromClientX(e.clientX);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || disabled || trackDisabled) return;
        updateValueFromClientX(e.clientX);
    };

    const handleMouseUp = () => {
        if (isDragging) setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    useEffect(() => {
        if (trackRef.current) {
            const trackWidth = trackRef.current.offsetWidth;
            const thumbWidth = 14;
            const left =
                (percent / 100) * (trackWidth - thumbWidth) + thumbWidth / 2;
            setTooltipLeft(left);
        }
    }, [value, percent]);

    const getMarkPosition = (markValue: number) => {
        if (!trackRef.current) return 0;
        const trackWidth = trackRef.current.offsetWidth;
        const thumbWidth = 14;
        const percent = (markValue - min) / (max - min);
        return percent * (trackWidth - thumbWidth) + thumbWidth / 2;
    };

    const handleOnchange = (newValue: number, newUnit?: string) => {
        if (disabled) return;

        setError("");

        const isNewUnit = newUnit && unitValue[0] !== newUnit;

        const defaultUnitValue = unitOptions.find(
            (option) => option.value === newUnit,
        )?.defaultValue;

        onChange(isNewUnit ? defaultUnitValue! : newValue, newUnit);
    };

    const handleReset = () => {
        if (disabled) return;
        handleOnchange(defaultValue, defaultUnit);
        setError("");
    };

    return (
        <div
            id={id}
            style={style}
            className={clsx(
                "pn-slider",
                size === "small" && "pn-slider--small",
                disabled && "pn-slider--disabled",
                className,
            )}
        >
            <div
                className={clsx(
                    "pn-slider__track-container",
                    trackDisabled && "pn-slider__track-container--disabled",
                )}
            >
                <div
                    ref={trackRef}
                    className="pn-slider__track-container-wrapper"
                    onMouseDown={handleMouseDown}
                >
                    <div className="pn-slider__track-container-wrapper-track">
                        <div
                            className="pn-slider__track-container-wrapper-track-fill"
                            style={{ width: `${percent}%` }}
                        />

                        <div
                            style={{ left: `${percent}%` }}
                            className={clsx(
                                "pn-slider__track-container-wrapper-thumb",
                                isDragging &&
                                    "pn-slider__track-container-wrapper-thumb--active",
                            )}
                        />
                    </div>

                    <div
                        className="pn-slider__track-container-wrapper-tooltip"
                        style={{ left: `${tooltipLeft}px` }}
                    >
                        {value}
                    </div>
                </div>

                {showMark && (
                    <div className="pn-slider-marks">
                        {marks.map(({ name, value: markValue }, index) => {
                            const markLeft = getMarkPosition(markValue);
                            const isActive = value === markValue;
                            const isPassed = value >= markValue;

                            return (
                                <div
                                    key={index}
                                    style={{
                                        position: "absolute",
                                        left: `${markLeft}px`,
                                        transform: "translateX(-50%)",
                                    }}
                                    className={clsx(
                                        "pn-slider-mark",
                                        isActive && "pn-slider-mark--active",
                                        isPassed && "pn-slider-mark--passed",
                                    )}
                                    onClick={() => {
                                        setError("");
                                        !disabled &&
                                            handleOnchange(
                                                markValue,
                                                unitValue[0],
                                            );
                                    }}
                                >
                                    {name}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div
                className={clsx(
                    "pn-slider-input-container",
                    unit ? "" : "pn-slider-input-container--no-unit",
                )}
            >
                <input
                    type="number"
                    value={inputValue}
                    step={step}
                    disabled={disabled}
                    className={clsx("pn-slider-input-box")}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setError("");
                        if (max < Number(e.target.value)) {
                            setError(
                                __(
                                    "Value exceeds maximum",
                                    "ninja-media",
                                ),
                            );
                            return;
                        }
                        if (min > Number(e.target.value)) {
                            setError(
                                __(
                                    "Value is below minimum",
                                    "ninja-media",
                                ),
                            );
                            return;
                        }
                        handleOnchange(Number(e.target.value), unitValue[0]);
                    }}
                />

                {unit && <div className="pn-slider-input-divider" />}

                {unit && (
                    <SelectBox
                        size={size === "small" ? "small" : "medium"}
                        borderStyle="none"
                        options={unitOptions}
                        value={unitValue}
                        placeholder={unitPlaceholder}
                        onChange={(unitValue) =>
                            handleOnchange(value, unitValue[0] as string)
                        }
                        disabled={disabled}
                    />
                )}
            </div>

            {reset && (
                <Button
                    variant="error"
                    size={size === "small" ? "small" : "medium"}
                    onClick={handleReset}
                    disabled={disabled}
                >
                    {__("Reset", "google-drive-integration")}
                </Button>
            )}

            {error && (
                <Text color="error" size="sm">
                    {error}
                </Text>
            )}
        </div>
    );
};

export default Slider;
