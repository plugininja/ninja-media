import { StatusProps } from "../status/Status.type";
import {
    BorderRadius,
    FontSize,
    Size,
    TextColor,
    TextTransform,
} from "~/types/styles";

export type ButtonVariant =
    | "default"
    | "primary"
    | "secondary"
    | "light"
    | "outlined"
    | "warning"
    | "error"
    | "link";

export type ButtonStatusProps = StatusProps & {
    default?: boolean;
};

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    iconUrl?: string;
    variant?: ButtonVariant;
    title?: string;
    color?: TextColor;
    size?: Size | "supersmall" | "microsmall";
    iconSize?: FontSize;
    rounded?: BorderRadius;
    textTransform?: TextTransform;
    wrap?: boolean;
    full?: boolean;
    visible?: boolean;
    disabled?: boolean;
    loading?: boolean;
    loadingIndicator?: React.ReactNode;
    startIcon?: string;
    startIconColor?: TextColor;
    startIconClassName?: string;
    endIcon?: string;
    endIconColor?: TextColor;
    endIconClassName?: string;
    ariaLabel?: string;
    role?: "button" | "link";
    tabIndex?: number;
    href?: string;
    target?: "_blank" | "_self" | "_parent" | "_top";
    rel?: "noopener" | "noreferrer";
    preventDefault?: boolean;
    stopPropagation?: boolean;
    statusProps?: ButtonStatusProps;
    children?: React.ReactNode;
    onClick?: (
        e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
    ) => void;
    onBlur?: (e: React.FocusEvent<HTMLElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
    onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void;
    onDoubleClick?: (e: React.MouseEvent<HTMLElement>) => void;
}
