import Input from "../input";
import clsx from "clsx";
import {
    createContext,
    createPortal,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
} from "@wordpress/element";
import {
    AlertContextType,
    AlertProps,
    AlertState,
    AlertType,
} from "./Alert.type";

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function CustomAlertProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [alerts, setAlerts] = useState<AlertState[]>([]);

    const closeAlert = useCallback((id: string) => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, []);

    const showAlert = useCallback(
        (
            options: AlertProps,
        ): Promise<{ isConfirmed: boolean; value?: string | number }> => {
            return new Promise((resolve) => {
                const id = options.id || `alert-${Date.now()}-${Math.random()}`;

                const handleConfirm = async (inputValue: string | number) => {
                    const alert = alerts.find((a) => a.id === id);

                    if (options.input && options.inputValidator) {
                        const error = options.inputValidator(inputValue);

                        if (error) {
                            return;
                        }
                    }

                    if (options.onConfirm) {
                        setAlerts((prev) =>
                            prev.map((a) =>
                                a.id === id ? { ...a, isLoading: true } : a,
                            ),
                        );

                        await options.onConfirm(inputValue);
                    }

                    closeAlert(id);

                    resolve({ isConfirmed: true, value: alert?.inputValue });
                };

                const handleCancel = () => {
                    if (options.onCancel) {
                        options.onCancel();
                    }

                    closeAlert(id);

                    resolve({ isConfirmed: false });
                };

                const handleClose = () => {
                    if (options.onClose) {
                        options.onClose();
                    }

                    closeAlert(id);

                    resolve({ isConfirmed: false });
                };

                const newAlert: AlertState = {
                    ...options,
                    id,
                    isOpen: true,
                    onConfirm: handleConfirm,
                    onCancel: handleCancel,
                    onClose: handleClose,
                    inputValue: options.inputValue || "",
                    pauseOnHover: options.pauseOnHover ?? true,
                };

                setAlerts((prev) => [...prev, newAlert]);
            });
        },
        [alerts, closeAlert],
    );

    return (
        <AlertContext.Provider value={{ showAlert, closeAlert }}>
            {children}

            <AlertContainer alerts={alerts} />
        </AlertContext.Provider>
    );
}

export function useCustomAlert() {
    const context = useContext(AlertContext);

    if (!context) {
        throw new Error(
            "useCustomAlert must be used within CustomAlertProvider",
        );
    }

    return context;
}

function AlertContainer({ alerts }: { alerts: AlertState[] }) {
    if (typeof window === "undefined") return null;

    return (
        <>
            {alerts.map((alert) => {
                const root = alert.rootId
                    ? document.getElementById(alert.rootId)
                    : document.body;

                if (!root) return null;

                return createPortal(
                    <AlertComponent key={alert.id} {...alert} />,
                    root,
                );
            })}
        </>
    );
}

function AlertComponent(props: AlertState) {
    const {
        title,
        text,
        html,
        type = "info",
        width,
        height,
        style,
        icon,
        showConfirmButton = true,
        showCancelButton = false,
        confirmButtonText = "OK",
        cancelButtonText = "Cancel",
        showIcon = true,
        timer,
        timerProgressBar = false,
        position = "center-center",
        toast = false,
        allowOutsideClick = true,
        allowEscapeKey = true,
        showCloseButton = false,
        onConfirm,
        onCancel,
        onClose,
        input,
        inputPlaceholder = "",
        inputValue: initialInputValue = "",
        inputSuffix,
        inputOptions = [],
        isLoading = false,
        pauseOnHover = true,
        id,
        confirmOnEnter = true,
        rootId,
    } = props;

    const [inputValue, setInputValue] = useState(initialInputValue);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isDark, setIsDark] = useState(false);
    const [closing, setClosing] = useState(false);

    const [remainingTime, setRemainingTime] = useState(timer || 0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const pausedElapsedRef = useRef<number>(0);
    const inputRef = useRef<HTMLElement | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    const isToastWithTimer = toast && !!timer && timer > 0;
    const shouldPauseOnHover = isToastWithTimer && pauseOnHover;

    useEffect(() => {
        if (!isToastWithTimer) return;

        if (startTimeRef.current === 0) {
            startTimeRef.current = Date.now();
        }

        if (!isPaused) {
            timerRef.current = setInterval(() => {
                const now = Date.now();
                const totalElapsed =
                    now - startTimeRef.current + pausedElapsedRef.current;
                const newRemaining = Math.max(0, timer - totalElapsed);

                setRemainingTime(newRemaining);

                if (newRemaining <= 0) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    if (onClose) onClose();
                }
            }, 16);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPaused, isToastWithTimer, timer, onClose]);

    const handleMouseEnter = () => {
        if (!shouldPauseOnHover) return;

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        const now = Date.now();
        pausedElapsedRef.current += now - startTimeRef.current;
        startTimeRef.current = 0;

        setIsPaused(true);
    };

    const handleMouseLeave = () => {
        if (!shouldPauseOnHover) return;

        startTimeRef.current = Date.now();
        setIsPaused(false);
    };

    useEffect(() => {
        const theme_mode =
            localStorage.getItem("pnpnm-theme-status") || "light";
        setIsDark(theme_mode === "dark");
    }, []);

    useEffect(() => {
        if (input && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
    }, [input]);

    useEffect(() => {
        if (!allowEscapeKey) return;

        const handleEscape = (e: KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === "Escape" && onClose) {
                handleCloseWithAnimation();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [allowEscapeKey, onClose]);

    const handleCloseWithAnimation = () => {
        if (onClose) onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (allowOutsideClick && e.target === e.currentTarget) {
            handleCloseWithAnimation();
        }
    };

    const handleConfirmClick = async () => {
        if (props.inputValidator && inputValue) {
            const error = props.inputValidator(inputValue);
            if (error) {
                setErrorMessage(error);
                return;
            }
        }

        if (onConfirm) {
            await onConfirm(inputValue);
        }
    };
    useEffect(() => {
        if (!confirmOnEnter) return;

        const handleEnter = (e: KeyboardEvent) => {
            if (e.key === "Enter" && showConfirmButton && !isLoading) {
                e.stopPropagation();
                handleConfirmClick();
            }
        };

        document.addEventListener("keydown", handleEnter);

        return () => {
            document.removeEventListener("keydown", handleEnter);
        };
    }, [confirmOnEnter, inputValue]);

    const getPositionClass = () => {
        const positionMap = {
            "center-center": "center-center",
            "top-left": "top-left",
            "top-center": "top-center",
            "top-right": "top-right",
            "bottom-left": "bottom-left",
            "bottom-center": "bottom-center",
            "bottom-right": "bottom-right",
        };

        return positionMap[position] || "center-center";
    };

    const overlayClasses = [
        "pn-alert-overlay",
        isDark && "dark",
        toast && "pn-toast",
        getPositionClass(),
    ]
        .filter(Boolean)
        .join(" ");

    const containerClasses = [
        "pnpnm-top-level-wrapper",
        "pn-alert-container",
        isDark && "dark",
        toast && "pn-toast",
        closing && (toast ? "toast-closing" : "closing"),
        id,
    ]
        .filter(Boolean)
        .join(" ");

    const iconClasses = [
        "pn-alert-icon-container",
        `pn-${type}`,
        type === "question" || type === "info"
            ? "bg-extralight"
            : `bg-${type}extralight`,
        toast && "pn-toast",
    ]
        .filter(Boolean)
        .join(" ");

    const contentClasses = ["pn-alert-content", toast && "pn-toast"]
        .filter(Boolean)
        .join(" ");

    const titleClasses = ["pn-alert-title", toast && "pn-toast"]
        .filter(Boolean)
        .join(" ");

    const messageClasses = ["pn-alert-message", toast && "pn-toast"]
        .filter(Boolean)
        .join(" ");

    const inputClasses = [
        "pn-alert-input",
        isDark && "dark",
        errorMessage && "error",
    ]
        .filter(Boolean)
        .join(" ");

    const buttonsClasses = ["pn-alert-buttons", toast && "pn-toast"]
        .filter(Boolean)
        .join(" ");

    const confirmButtonClasses = [
        "pn-alert-button",
        "pn-alert-confirm-button",
        type,
        toast && "pn-toast",
    ]
        .filter(Boolean)
        .join(" ");

    const cancelButtonClasses = [
        "pn-alert-button",
        "pn-alert-cancel-button",
        isDark && "dark",
        toast && "pn-toast",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div
            className={overlayClasses}
            onClick={handleBackdropClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                style={{
                    ...style,
                    maxWidth: width ? width : "",
                    height: height ? height : "",
                }}
                className={containerClasses}
            >
                {timerProgressBar && isToastWithTimer && (
                    <div
                        style={{
                            transform: `scaleX(${remainingTime / timer})`,
                            transformOrigin: "left",
                            transition: isPaused
                                ? "none"
                                : "transform 0.05s linear",
                            borderRadius:
                                "0 0 var(--alert-border-radius) var(--alert-border-radius)",
                        }}
                        className={clsx(
                            "pn-alert-timer-progress",
                            `pn-progress-${type}`,
                        )}
                    />
                )}

                {showCloseButton && (
                    <button
                        aria-label="Close"
                        className={clsx(
                            "pn-alert-close-button",
                            isDark && "dark",
                        )}
                        onClick={handleCloseWithAnimation}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                d="M18 6L6 18M6 6l12 12"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                )}

                {toast ? (
                    <div className="pn-alert-toast-content">
                        {showIcon && (
                            <div className={iconClasses}>
                                {getIcon({ icon, type, toast })}
                            </div>
                        )}

                        <div className="pn-alert-toast-text">
                            {title && <h3 className={titleClasses}>{title}</h3>}

                            {text && <p className={messageClasses}>{text}</p>}

                            {html && (
                                <div className="pn-alert-html-content">
                                    {html}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {showIcon && (
                            <div className={iconClasses}>
                                {getIcon({ icon, type, toast })}
                            </div>
                        )}

                        <div className={contentClasses}>
                            {title && <h2 className={titleClasses}>{title}</h2>}

                            {text && <p className={messageClasses}>{text}</p>}

                            {html && (
                                <div className="pn-alert-html-content">
                                    {html}
                                </div>
                            )}

                            {input && (
                                <div className="pn-alert-input-container">
                                    {input === "textarea" ? (
                                        <textarea
                                            ref={
                                                inputRef as React.RefObject<HTMLTextAreaElement>
                                            }
                                            className={clsx(
                                                inputClasses,
                                                "pn-alert-textarea",
                                            )}
                                            placeholder={inputPlaceholder}
                                            value={inputValue}
                                            onChange={(e) => {
                                                setInputValue(e.target.value);
                                                setErrorMessage(null);
                                            }}
                                        />
                                    ) : input === "select" ? (
                                        <select
                                            ref={
                                                inputRef as React.RefObject<HTMLSelectElement>
                                            }
                                            className={inputClasses}
                                            value={inputValue}
                                            onChange={(e) => {
                                                setInputValue(e.target.value);
                                                setErrorMessage(null);
                                            }}
                                        >
                                            <option value="">
                                                {inputPlaceholder ||
                                                    "Select an option"}
                                            </option>

                                            {inputOptions.map((opt) => (
                                                <option
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <Input
                                            ref={
                                                inputRef as React.RefObject<HTMLInputElement>
                                            }
                                            type={input}
                                            placeholder={inputPlaceholder}
                                            value={inputValue}
                                            suffix={inputSuffix && inputSuffix}
                                            onChange={(value) => {
                                                const convertedValue =
                                                    input === "number"
                                                        ? Number(value)
                                                        : String(value);

                                                setInputValue(convertedValue);
                                                setErrorMessage(null);
                                            }}
                                        />
                                    )}

                                    {errorMessage && (
                                        <div className="pn-alert-error-text">
                                            {errorMessage}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {(showConfirmButton || showCancelButton) && (
                    <div className={buttonsClasses}>
                        {showCancelButton && (
                            <button
                                className={cancelButtonClasses}
                                onClick={onCancel}
                                disabled={isLoading}
                            >
                                {cancelButtonText}
                            </button>
                        )}

                        {showConfirmButton && (
                            <button
                                className={confirmButtonClasses}
                                onClick={handleConfirmClick}
                                disabled={isLoading}
                            >
                                {isLoading && (
                                    <span className="pn-alert-spinner" />
                                )}
                                {confirmButtonText}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const getIcon = ({
    icon,
    type,
    toast,
}: {
    icon?: React.ReactNode | AlertType;
    type?: string;
    toast?: boolean;
}) => {
    if (typeof icon !== "string" && icon) return icon;

    const iconSize = toast ? "24" : "40";

    const iconType = icon || type;

    switch (iconType) {
        case "success":
            return (
                <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <path
                        d="M8 12.5l2.5 2.5L16 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );

        case "error":
            return (
                <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <path
                        d="M15 9l-6 6M9 9l6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            );

        case "warning":
            return (
                <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <path
                        d="M12 2L2 20h20L12 2z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M12 9v4M12 17h.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            );

        case "info":
            return (
                <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <path
                        d="M12 16v-4M12 8h.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            );

        case "question":
            return (
                <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <path
                        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            );
    }
};
