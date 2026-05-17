import { Order, OrderBy } from "../filter";
import { File } from "../file";

export type FileState = {
    view: "grid" | "list";
    loadingType: "pagination" | "infinite";
    count: {
        all: number;
        uncategorized: number;
        dynamic: number;
        favorites: number;
        used: number;
        unused: number;
        trash: number;
    };
    files: File[];
    selectedFiles: File[];
    hiddenFileIds: (string | number)[];
    detailsFile: File | null;
    query: {
        orderBy: OrderBy;
        order: Order;
        page: number;
        perPage: number;
        search: string;
    };
    dynamicFolders: Record<string, number>;
    totalPages: number;
    hasMore: boolean;
    bulkSelect: boolean;
    loading: boolean;
};
