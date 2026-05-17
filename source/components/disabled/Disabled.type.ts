export interface DisabledProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    depend?: boolean;
    dependOn?: string;
    dependOnExact?: boolean;
    gap?: number;
    children?: React.ReactNode;
}
