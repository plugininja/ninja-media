import { Folder } from "./media";

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

export type DownloadFolderResponse = {
    url: string;
};

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

export type TrashFileResponse = {
    trashed: (string | number)[];
} & Action;

export type RestoreFileResponse = {
    restored: (string | number)[];
} & Action;

export type DeleteFileResponse = {
    deleted: (string | number)[];
} & Action;

interface AttachmentJS {
    id: number;
    title: string;
    filename: string;
    url: string;
    link: string;
    alt: string;
    mime: string;
    type: string;
    subtype: string;
    sizes?: Record<
        string,
        { url: string; width: number; height: number; orientation: string }
    >;
    width?: number;
    height?: number;
    filesizeInBytes?: number;
    [key: string]: unknown;
}

export interface ReplaceMediaResponse {
    success: boolean;
    message: string;
    data: AttachmentJS;
}
