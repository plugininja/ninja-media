import {
    FontSize,
    FontWeight,
    TextAlign,
    TextColor,
    TextTransform,
} from "~/types/styles";

export interface DescriptionProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    as?: keyof JSX.IntrinsicElements;
    limit?: number;
    text?: string;
    color?: TextColor;
    size?: FontSize;
    weight?: FontWeight;
    textTransform?: TextTransform;
    align?: TextAlign;
}
