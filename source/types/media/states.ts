import { Order, OrderBy } from "../filter";
import { MediaMenu } from "./media";
import { Folder } from "../folder";

export type MediaState = {
    menu: MediaMenu;
    allFiles: number;
    uncategorized: number;
    dynamicFolders: Record<string, number>;
    favorites: number;
    used: number;
    unused: number;
    trash: number;
    folders: Record<string | number, Folder[]>;
    activeFolder: Folder | null;
    selectedFolders: Folder[];
    expandedFolderIds: string[];
    hiddenFolderIds: (string | number)[];
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
        id?: string | number | null;
    };
    folderSorting: {
        orderBy: OrderBy;
    };
    fileSorting: {
        orderBy: OrderBy;
    };
    order: Order;
    search: string;
    bulkSelect: boolean;
    expandAll: boolean;
    loading: boolean;
};
