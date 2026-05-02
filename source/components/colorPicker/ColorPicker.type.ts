import { StatusProps } from "../status/Status.type";

export interface ColorPickerProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    defaultColor?: string;
    selectedColor?: string;
    statusProps?: StatusProps;
    onChange?: (color: string) => void;
}

export interface ColorBoxProps {
    size?: "small" | "large";
    colors: string[];
    selectedColor: string;
    onSelect: (color: string) => void;
}

export type ColorPickerComponent = React.FC<ColorPickerProps> & {
    ColorBox: React.FC<ColorBoxProps>;
};
