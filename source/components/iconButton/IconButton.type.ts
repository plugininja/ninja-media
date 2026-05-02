import {
    BorderColor,
    BorderRadius,
    BorderStyle,
    FontSize,
    FontWeight,
    Size,
    TextColor,
} from "~/types/styles";

export type ButtonVariant =
    | "default"
    | "primary"
    | "secondary"
    | "light"
    | "outlined"
    | "white"
    | "warning"
    | "error"
    | "link";

export interface IconButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    name?: string;
    iconUrl?: string;
    svgIcon?: React.FC<React.SVGProps<SVGSVGElement>>;
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    iconStyle?: React.CSSProperties;
    iconClassName?: string;
    variant?: ButtonVariant;
    title?: string;
    color?: TextColor;
    size?: "microsmall" | "supersmall" | Size;
    fontSize?: FontSize;
    fontWeight?: FontWeight;
    rounded?: BorderRadius;
    border?: boolean;
    borderColor?: BorderColor;
    borderStyle?: BorderStyle;
    full?: boolean;
    visible?: boolean;
    disabled?: boolean;
    loading?: boolean;
    loadingIndicator?: React.ReactNode;
    ariaLabel?: string;
    role?: "button" | "link";
    tabIndex?: number;
    href?: string;
    target?: "_blank" | "_self" | "_parent" | "_top";
    rel?: "noopener" | "noreferrer";
    preventDefault?: boolean;
    stopPropagation?: boolean;
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
