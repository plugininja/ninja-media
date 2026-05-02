import { BackgroundColor, BorderColor, TextColor } from "~/types/styles";

export interface TooltipProps {
    title?: string;
    component?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    placement?: "top" | "bottom" | "left" | "right" | "auto";
    arrow?: boolean;
    arrowSize?: number;
    openStyle?: "fade" | "zoom" | "slide-down";
    trigger?: "hover" | "click";
    width?: string;
    wrap?: "wrap" | "no-wrap";
    color?: TextColor;
    background?: BackgroundColor;
    border?: BorderColor;
    shadow?: boolean;
    visible?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
}
