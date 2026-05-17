import { Theme } from "./settings/settings";

export type Folder = {
    id: string | number;
    name: string;
    icon: string | null;
    color: string | null;
    createdAt: string;
    updatedAt: string;
    sortOrder: string | number;
    parentId: string | number;
    userId: string | number;
    childFolders: string | number | null;
    attachmentCount: number;
};

export type FolderContextMenu =
    | "new"
    | "color"
    | "rename"
    | "cut"
    | "paste"
    | "duplicate"
    | "download"
    | "delete";

export type MoveFolderMeta = {
    folder: Folder;
    active: boolean;
    isExpanded: boolean;
    theme: Theme;
};
