export type ExtraContents = Array<
    | JSX.Element
    | React.ReactElement
    | Iterable<React.ReactNode>
    | number
    | boolean
    | null
    | undefined
>;

export interface TopbarProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    padding?: string | number;
    leftContents?: ExtraContents;
    rightContents?: ExtraContents;
}
