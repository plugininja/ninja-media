import { Align, BlockAlign } from "~/types/styles";

export interface InlineStackProps {
    id?: string;
    title?: string;
    style?: React.CSSProperties;
    className?: string;
    margin?: string | number;
    marginTop?: string | number;
    padding?: string | number;
    paddingTop?: string | number;
    as?: "div" | "span" | "li" | "ol" | "ul" | "fieldset";
    align?: Align;
    blockAlign?: BlockAlign;
    direction?: "row" | "row-reverse";
    gap?: string | number;
    wrap?: boolean;
    children?: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    onDoubleClick?: (e: React.MouseEvent) => void;
}
