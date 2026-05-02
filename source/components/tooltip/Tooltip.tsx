import { useState, useRef, useEffect } from "@wordpress/element";
import type { TooltipProps } from "./Tooltip.type";
import clsx from "clsx";

const Tooltip: React.FC<TooltipProps> = ({
    title = "Tooltip",
    component,
    style,
    className,
    placement = "top",
    arrow = false,
    arrowSize = 5,
    openStyle = "fade",
    trigger = "hover",
    width = "auto",
    wrap = "wrap",
    background = "secondaryblack",
    color = "white",
    border,
    shadow = false,
    visible = true,
    disabled = false,
    children,
}) => {
    const [actualPlacement, setActualPlacement] = useState(placement);
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                trigger === "click" &&
                tooltipRef.current &&
                !tooltipRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                setIsVisible(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [trigger]);

    useEffect(() => {
        if (
            placement !== "auto" ||
            !isVisible ||
            !tooltipRef.current ||
            !triggerRef.current
        )
            return;
        const triggerBox = triggerRef.current.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const spaces = {
            top: triggerBox.top,
            bottom: windowHeight - triggerBox.bottom,
            left: triggerBox.left,
            right: windowWidth - triggerBox.right,
        };
        const bestSide = Object.entries(spaces).sort(
            (a, b) => b[1] - a[1],
        )[0][0];
        setActualPlacement(bestSide as "top" | "bottom" | "left" | "right");
    }, [isVisible, placement]);

    const wrapperClasses = clsx(
        "pn-tooltip",
        isVisible && "pn-tooltip--show",
        placement === "auto"
            ? `pn-tooltip--${actualPlacement}`
            : `pn-tooltip--${placement}`,
    );

    const textClasses = clsx(
        "pn-tooltip__text",
        arrow && "pn-tooltip__text--has-arrow",
        `pn-tooltip__text--open-${openStyle}`,
        `pn-tooltip__text--wrap-${wrap}`,
        `text-${color}`,
        `bg-${background}`,
        border && `border border-solid border-${border}`,
        shadow && "pn-tooltip__text--shadow",
    );

    if (disabled) return <>{children}</>;

    return (
        <div
            ref={triggerRef}
            style={style}
            className={clsx(wrapperClasses, className)}
            onMouseEnter={
                trigger === "hover"
                    ? () => setIsVisible(visible ? true : false)
                    : undefined
            }
            onMouseLeave={
                trigger === "hover" ? () => setIsVisible(false) : undefined
            }
            onClick={
                trigger === "click"
                    ? () => setIsVisible((prev) => (visible ? !prev : false))
                    : undefined
            }
        >
            <div
                ref={tooltipRef}
                className={textClasses}
                style={
                    {
                        "--pn-tooltip-width": width,
                        "--pn-tooltip-arrow-size": `${arrowSize}px`,
                        "--pn-tooltip-arrow-color": `var(--pnpnm-${background})`,
                    } as React.CSSProperties
                }
            >
                {component ? component : title}
            </div>

            {children}
        </div>
    );
};

export default Tooltip;
