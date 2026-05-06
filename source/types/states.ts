import { Folder, Menu } from "./media";
import { Settings } from "./settings";
import { File } from "./files";

export type SettingsState = {
    data: Settings | null;
    defaultData: Settings | null;
    draft: Settings | null;
};

export type MediaState = {
    menu: Menu;
    allFiles: number;
    uncategorized: number;
    dynamicFolders: Record<string, number>;
    unused: number;
    trash: number;
    folders: Record<string | number, Folder[]>;
    expandedFolderIds: string[];
    selectedFolders: Folder[];
    hiddenFolderIds: (string | number)[];
    activeFolder: Folder | null;
    createFolder: {
        create: boolean;
        folder?: Folder | null;
    };
    renameFolder: {
        rename: boolean;
        folder?: Folder | null;
    };
    cutFolders: {
        cut: boolean;
        folders?: Folder[];
    };
    moveFolder: {
        move: boolean;
        folderId?: string | number | null;
    };
    folderSorting: {
        orderBy: "name" | "size" | "createdAt" | "updatedAt";
    };
    fileSorting: {
        orderBy: "name" | "size" | "createdAt" | "updatedAt";
    };
    order: "ASC" | "DESC";
    search: string;
    bulkSelect: boolean;
    expandAll: boolean;
    loading: boolean;
};

export type FilesState = {
    view: "grid" | "list";
    loadingType: "pagination" | "infinite";
    count: {
        all: number;
        uncategorized: number;
        dynamic: number;
        unused: number;
        trash: number;
    };
    files: File[];
    selectedFiles: File[];
    hiddenFileIds: (string | number)[];
    detailsFile: File | null;
    query: {
        orderBy: "name" | "size" | "createdAt" | "updatedAt";
        order: "ASC" | "DESC";
        page: number;
        perPage: number;
        search: string;
    };
    dynamicFolders: Record<string, number>;
    totalPages: number;
    hasMore: boolean;
    bulkSelect: boolean;
};

export type ServerResponse<T> = {
    success: boolean;
    message: string;
    data?: T;
};
