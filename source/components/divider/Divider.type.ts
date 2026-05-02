import { BorderStyle, TextColor } from "~/types/styles";

export interface DividerProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    border?: "top" | "right" | "bottom" | "left";
    borderWidth?: number;
    borderStyle?: BorderStyle;
    color?: TextColor;
    margin?: string | number;
    marginTop?: string | number;
    marginBottom?: string | number;
    padding?: string | number;
    paddingTop?: string | number;
    paddingBottom?: string | number;
    variant?: "horizontal" | "vertical";
    height?: string;
    width?: string;
}
