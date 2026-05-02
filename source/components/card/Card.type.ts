import { StatusProps } from "../status/Status.type";
import {
    BackgroundColor,
    BorderColor,
    BorderRadius,
    BorderStyle,
} from "~/types/styles";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    margin?: string | number;
    marginTop?: string | number;
    padding?: string | number;
    paddingTop?: string | number;
    background?: BackgroundColor;
    border?: BorderColor;
    borderStyle?: BorderStyle;
    rounded?: BorderRadius;
    widthFull?: boolean;
    heightFull?: boolean;
    disabled?: boolean;
    flex?: boolean;
    align?: "start" | "center" | "end" | "around" | "between" | "evenly";
    blockAlign?: "start" | "center" | "end" | "baseline" | "stretch";
    direction?: "row" | "row-reverse" | "col" | "col-reverse";
    gap?: string | number;
    wrap?: boolean;
    statusProps?: StatusProps;
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}
