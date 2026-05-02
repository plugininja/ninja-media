export type Menu =
    | "all"
    | "uncategorized"
    | "dynamic"
    | "unused"
    | "folder"
    | "trash";

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
