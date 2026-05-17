import { Folder } from "../folder";

type Action = {
    allFiles: number;
    uncategorized: number;
    dynamicFolders: Record<string, number>;
    unused: number;
    trash: number;
    folders: {
        id: string | number;
        remaining: number | string | null;
    }[];
};

export type GetFoldersResponse = {
    allFiles: number;
    totalFolders: number;
    uncategorized: number;
    dynamicFolders: Record<string, number>;
    favorites: number;
    used: number;
    unused: number;
    trashed: number;
    folders: Folder[];
};

export type GetFolderResponse = {
    currentFolder: Folder;
    folders: Folder[];
};

export type GetBreadcrumbsResponse = {
    breadcrumbs: {
        id: string | number;
        name: string;
    }[];
};

export type CreateFolderResponse = Folder;

export type UpdateFolderResponse = Folder;

export type AssignFileResponse = {
    assigned: (string | number)[];
    total: number | string | null;
    count: number | string | null;
    previousFolder: {
        id: string | number;
        remaining: number | string | null;
    };
    uncategorizedCount: number;
};

export type RestoreFileResponse = {
    restored: (string | number)[];
} & Action;

export type DeleteFileResponse = {
    deleted: (string | number)[];
} & Action;

