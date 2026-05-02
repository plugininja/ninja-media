import {
    BackgroundColor,
    BorderRadius,
    BorderStyle,
    FontSize,
    Size,
    TextColor,
} from "../../types/styles";

export type Option = {
    name?: string;
    value: string;
    icon?: string;
    warning?: boolean;
};

export interface SelectBoxProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    gap?: number | string;
    color?: TextColor;
    size?: Size;
    background?: BackgroundColor;
    borderStyle?: BorderStyle;
    rounded?: BorderRadius;
    multiple?: boolean;
    visible?: boolean;
    disabled?: boolean;
    optionIcon?: boolean;
    placement?: "top" | "bottom" | "auto";
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
    label?: string;
    labelFontSize?: FontSize;
    helperText?: string;
    error?: boolean;
    errorText?: string;
    searchable?: boolean;
    required?: boolean;
    readonly?: boolean;
    waiting?: boolean;
    loading?: boolean;
    placeholder?: string;
    options: Option[];
    value?: string[];
    defaultValue?: string[];
    requiredValue?: string[];
    skipValues?: string[];
    onClick?: () => void;
    onChange?: (value: string[]) => void;
    onSearch?: (searchText: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
}

export type SelectBoxTriggerProps = {
    color: TextColor;
    size: Size;
    background: BackgroundColor;
    borderStyle: BorderStyle;
    rounded: BorderRadius;
    disabled: boolean;
    waiting: boolean;
    isOpen: boolean;
    selectedValues: string[];
    options: Option[];
    placeholder: string;
    multiple: boolean;
    optionIcon: boolean;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
    error: boolean;
    children?: React.ReactNode;
    onToggle: () => void;
    onRemove: (val: string, e: React.MouseEvent) => void;
};

export type SelectBoxDropdownProps = {
    isOpen: boolean;
    position: "top" | "bottom";
    searchable: boolean;
    searchText: string;
    setSearchText: (v: string) => void;
    onSearch?: (v: string) => void;
    loading: boolean;
    options: Option[];
    selectedValues: string[];
    multiple: boolean;
    optionIcon: boolean;
    onSelect: (v: string) => void;
    onClearAll: (e: React.MouseEvent) => void;
};
