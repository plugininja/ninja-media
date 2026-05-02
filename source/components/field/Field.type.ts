import { StatusProps } from "../status/Status.type";

export interface FieldProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    gap?: number | string;
    title?: string;
    description?: string;
    docLink?: string;
    statusProps?: StatusProps;
    children: React.ReactNode;
}
