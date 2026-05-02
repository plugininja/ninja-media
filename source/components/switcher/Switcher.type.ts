import { FontSize } from "~/types/styles";

export interface SwitcherProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    checked?: boolean;
    title?: string;
    titleSize?: FontSize;
    tabIndex?: number;
    ariaLabel?: string;
    loading?: boolean;
    disabled?: boolean;
    onChange?: (checked: boolean) => void;
}
