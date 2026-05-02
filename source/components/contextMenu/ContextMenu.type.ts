export type ContextMenuProps = {
    id: string;
    style?: React.CSSProperties;
    className?: string;
    children: (context: { props?: any }) => React.ReactNode;
};

export type ContextMenuItemProps = {
    style?: React.CSSProperties;
    className?: string;
    children: React.ReactNode;
    onClick?: (data: {
        event: React.MouseEvent<HTMLElement>;
        props?: any;
    }) => void;
    disabled?: boolean;
};

export type ContextMenuSeparatorProps = {
    style?: React.CSSProperties;
    className?: string;
};

export type ContextMenuSubmenuProps = {
    trigger?: "hover" | "click";
    label: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    children: React.ReactNode;
    disabled?: boolean;
};

export type ContextMenuContextType = {
    show: (
        id: string,
        event: React.MouseEvent<HTMLElement>,
        props?: any,
    ) => void;
    hide: () => void;
    activeMenu: {
        id: string;
        position: { x: number; y: number };
        props?: any;
        showCount: number;
    } | null;
};
