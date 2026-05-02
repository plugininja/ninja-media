import { Size, TextColor } from "~/types/styles";

export interface StatusProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    isComingSoon?: boolean;
    isHot?: boolean;
    isNew?: boolean;
    isBeta?: boolean;
    placement?:
        | "center"
        | "right-center"
        | "left-center"
        | "top-center"
        | "bottom-center"
        | "default";
    top?: number | string;
    bottom?: number | string;
    left?: number | string;
    right?: number | string;
    tooltipPlacement?: "top" | "bottom" | "left" | "right" | "auto";
    size?: Size;
    widthFull?: boolean;
    ignore?: boolean;
    children?: React.ReactNode;
}

export type StatusConfig = {
    key: "comingsoon" | "hot" | "new" | "beta";
    variant: "warning" | "error" | "new" | "light";
    title: string;
    icon: string;
    iconColor: TextColor;
    condition: boolean;
};
