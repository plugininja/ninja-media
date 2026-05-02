import { BorderRadius, Size } from "../../types/styles";

export interface CheckboxProps {
    id?: string;
    name?: string;
    style?: React.CSSProperties;
    className?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    size?: Size;
    rounded?: BorderRadius;
    title?: string;
    tabIndex?: number;
    ariaLabel?: string;
    readonly?: boolean;
    visible?: boolean;
    disabled?: boolean;
    onChange?: (checked: boolean) => void;
}
