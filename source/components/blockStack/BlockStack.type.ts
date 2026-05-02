import { Align, InlineAlign } from "~/types/styles";

type ElementType = keyof JSX.IntrinsicElements;

export interface BlockStackProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    margin?: string | number;
    marginTop?: string | number;
    padding?: string | number;
    paddingTop?: string | number;
    as?: "div" | "span" | "ul" | "ol" | "li" | "fieldset";
    align?: Align;
    inlineAlign?: InlineAlign;
    gap?: string | number;
    reverseOrder?: boolean;
    children?: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    onDoubleClick?: (e: React.MouseEvent) => void;
}
