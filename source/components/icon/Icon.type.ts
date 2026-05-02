import { FontSize, FontWeight, TextColor } from "~/types/styles";

export interface IconProps {
    id?: string;
    name: string;
    title?: string;
    style?: React.CSSProperties;
    className?: string;
    color?: TextColor;
    fontSize?: FontSize;
    fontWeight?: FontWeight;
    onClick?: React.MouseEventHandler<HTMLSpanElement>;
}
