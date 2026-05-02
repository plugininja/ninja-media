import { ButtonStatusProps, ButtonVariant } from "../button/Button.type";
import {
    BackgroundColor,
    BorderColor,
    BorderRadius,
    BorderStyle,
    Size,
    TextTransform,
} from "../../types/styles";

interface ButtonProps {
    key: string;
    id?: string;
    title: string;
    style?: React.CSSProperties;
    buttonClassName?: string;
    variant?: ButtonVariant;
    activeVariant?: ButtonVariant;
    size?: Size;
    rounded?: BorderRadius;
    textTransform?: TextTransform;
    startIcon?: string;
    endIcon?: string;
    statusProps?: ButtonStatusProps;
}

interface SingleSelectProps {
    select?: "single";
    selectedKey: string;
    onChange: (value: string) => void;
}

interface MultipleSelectProps {
    select?: "multiple";
    selectedKey: string[];
    onChange: (value: string[]) => void;
}

export type ButtonGroupProps = {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    background?: BackgroundColor;
    border?: BorderColor;
    borderStyle?: BorderStyle;
    rounded?: BorderRadius;
    padding?: string | number;
    isFitContent?: boolean;
    buttons?: ButtonProps[];
    select?: "single" | "multiple";
    selectedKey?: string | string[];
    onChange?: (value: string | string[]) => void;
    children?: React.ReactNode;
} & (SingleSelectProps | MultipleSelectProps);
