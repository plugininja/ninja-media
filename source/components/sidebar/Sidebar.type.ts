export interface SidebarContextType {
    collapsed: boolean;
}

export interface SidebarProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    defaultCollapsed?: boolean;
    localStorageKey?: string;
    minWidth?: number;
    children: React.ReactNode;
}

export interface SidebarMenuProps {
    style?: React.CSSProperties;
    children: React.ReactNode;
}

export interface SidebarItemProps {
    key?: string;
    title: React.ReactNode;
    icon?: string;
    count?: number;
    active?: boolean;
    onClick?: () => void;
}

export interface SidebarDropdownItemProps {
    childrenItems?: SidebarItemProps[];
    activeKey?: string;
}

export interface SidebarBottomProps {
    children?: React.ReactNode;
    trash?: boolean;
    trashCount?: number;
    trashActive?: boolean;
    helpCenter?: boolean;
    trashClick?: () => void;
    disabledTrash?: boolean;
}

export interface StorageInfo {
    used: number;
    all: number;
}
