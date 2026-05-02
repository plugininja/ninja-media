import {
    FontSize,
    FontWeight,
    TextAlign,
    TextColor,
    TextTransform,
} from "~/types/styles";

export interface TextProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    as?: keyof JSX.IntrinsicElements;
    color?: TextColor;
    size?: FontSize;
    weight?: FontWeight;
    textTransform?: TextTransform;
    align?: TextAlign;
    wrap?: boolean;
    ellipsis?: boolean;
    ellipsisLine?: number;
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
}
