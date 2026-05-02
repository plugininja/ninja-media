export interface SliderProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    size?: "small" | "large";
    min?: number;
    max?: number;
    step?: number;
    value: number;
    defaultValue?: number;
    reset?: boolean;
    showMark?: boolean;
    marks?: { name: string; value: number }[];
    unit?: boolean;
    unitOptions?: {
        name: string;
        value: string;
        defaultValue: number;
    }[];
    unitValue?: string[];
    defaultUnit?: string;
    unitPlaceholder?: string;
    trackDisabled?: boolean;
    disabled?: boolean;
    onChange: (value: number, unit?: string) => void;
}
