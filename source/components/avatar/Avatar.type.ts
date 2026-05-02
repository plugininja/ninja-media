import { BorderRadius } from "../../types/styles";

export interface AvatarProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    src: string;
    alt?: string;
    width?: number | string;
    height?: number | string;
    rounded?: BorderRadius;
    objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
    referrerPolicy?: "no-referrer" | "origin" | "unsafe-url";
    fallback?: string | React.ReactNode;
    fallBackLimit?: number;
    showSpinner?: boolean;
}
