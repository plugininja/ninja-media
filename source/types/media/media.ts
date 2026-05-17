import { Theme } from "../settings/settings";

export type MediaMenu =
    | "all"
    | "uncategorized"
    | "dynamic"
    | "favorites"
    | "used"
    | "unused"
    | "folder"
    | "trash";

export type MediaContextMenu =
    | "open"
    | "view"
    | "get"
    | "edit"
    | "download"
    | "duplicate"
    | "replace"
    | "favorite"
    | "unfavorite"
    | "apply"
    | "remove"
    | "trash"
    | "restore"
    | "delete";

export type Attachment = { id: number; [key: string]: any };

export interface MenuItem {
    enabled?: boolean;
    menu: MediaMenu;
    theme?: Theme;
    showCount: boolean;
    count: number;
    onMenu: (menu: MediaMenu) => void;
}
