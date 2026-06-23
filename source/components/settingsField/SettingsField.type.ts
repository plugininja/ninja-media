import { StatusProps } from "../status/Status.type";
import {
    BackgroundColor,
    BorderColor,
    BorderRadius,
    BorderStyle,
    FontSize,
} from "../../types/styles";

interface SettingsField {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    title?: React.ReactNode;
    titleSize?: FontSize;
    description?: React.ReactNode;
    docLink?: string;
    background?: BackgroundColor;
    border?: BorderColor;
    borderStyle?: BorderStyle;
    rounded?: BorderRadius;
    padding?: string | number;
    contentPadding?: string | number;
    fullWidth?: boolean;
    gap?: string | number;
    children?: React.ReactNode;
    isIgnoreChildren?: boolean;
    action?: React.ReactNode;
    secondaryAction?: React.ReactNode;
    statusProps?: StatusProps;
}

export interface SettingsFieldProps extends React.FC<SettingsField> {
    SubField: React.FC<SettingsSubFieldProps>;
}

export interface SettingsSubFieldProps extends SettingsField {
    depend?: boolean;
    dependOn?: string;
    dependOnExact?: boolean;
}
