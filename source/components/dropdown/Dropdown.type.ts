import {
    BorderColor,
    BorderRadius,
    BorderStyle,
    FontSize,
    TextColor,
} from "~/types/styles";

export type DropdownMenuContextType = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

export interface DropdownProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    outSideClick?: boolean;
}

export type DropdownRenderFn = (props: {
    open: boolean;
    setOpen: (open: boolean) => void;
}) => React.ReactNode;

export interface DropdownTriggerArrowProps {
    style?: React.CSSProperties;
    arrowColor?: TextColor;
    arrowSize?: FontSize;
}

export interface DropdownSubProps {
    style?: React.CSSProperties;
    className?: string;
    rounded?: BorderRadius;
    border?: boolean;
    borderColor?: BorderColor;
    borderStyle?: BorderStyle;
    shadow?: boolean;
    fullWidth?: boolean;
    tag?: keyof JSX.IntrinsicElements;
    position?: React.CSSProperties;
    children: React.ReactNode | DropdownRenderFn;
}

export interface DropdownTriggerProps {
    children: React.ReactNode | DropdownRenderFn;
    openStatus?: boolean;
    style?: React.CSSProperties;
    className?: string;
    disabled?: boolean;
}

export interface DropdownMenuItemProps {
    title?: string;
    children: React.ReactNode;
    onClick?: () => void;
    isActive?: boolean;
    activeIcon?: boolean;
    iconPosition?: "left" | "right";
    activeBg?: boolean;
    style?: React.CSSProperties;
    className?: string;
}

export interface DropdownComponent extends React.FC<DropdownProps> {
    Trigger: React.FC<DropdownTriggerProps>;
    TriggerArrow: React.FC<DropdownTriggerArrowProps>;
    Content: React.FC<DropdownSubProps>;
    MenuLabel: React.FC<DropdownSubProps>;
    MenuSeparator: React.FC;
    MenuItem: React.FC<DropdownMenuItemProps>;
}
