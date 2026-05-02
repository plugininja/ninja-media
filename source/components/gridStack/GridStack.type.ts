import { Align, BlockAlign, BorderRadius } from "../../types/styles";
import { LooseLiteral } from "~/utils/types";

type GridColumns = LooseLiteral<number | "auto-fit" | "auto-fill">;

export interface GridAreaChildProps {
    style?: React.CSSProperties;
    gridArea?: string;
}

export interface GridStackProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    margin?: number | string;
    marginTop?: number | string;
    padding?: number | string;
    paddingTop?: number | string;
    as?: keyof JSX.IntrinsicElements;
    children: React.ReactNode;
    columns?: GridColumns;
    rows?: string;
    min?: string;
    max?: string;
    gap?: number | string;
    rounded?: BorderRadius;
    align?: Align;
    blockAlign?: BlockAlign;
    templateAreas?: string[];
}
