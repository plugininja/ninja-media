import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FilesState } from "~/types/states";
import { RootState } from "../store";
import { File } from "~/types/files";

const getPersistedFileState = () => {
    if (typeof window === "undefined") return undefined;

    try {
        const raw = localStorage.getItem("fileStates");
        if (!raw) return undefined;

        const parsed = JSON.parse(raw);

        if (typeof parsed !== "object") return undefined;

        return parsed;
    } catch {
        return undefined;
    }
};

const persisted = getPersistedFileState();

const initialState: FilesState = {
    view: persisted?.view ?? "grid",
    loadingType: persisted?.loadingType ?? "infinite",
    count: {
        all: 0,
        uncategorized: 0,
        dynamic: 0,
        unused: 0,
        trash: 0,
    },
    files: [],
    selectedFiles: [],
    hiddenFileIds: [],
    detailsFile: null,
    query: {
        orderBy: persisted?.query?.orderBy ?? "createdAt",
        order: persisted?.query?.order ?? "DESC",
        page: persisted?.query?.page ?? 1,
        perPage: persisted?.query?.perPage ?? 30,
        search: "",
    },
    dynamicFolders: {},
    totalPages: 1,
    hasMore: false,
    bulkSelect: false,
};

export const filesSlice = createSlice({
    name: "files",
    initialState,
    reducers: {
        setView: (state, action: PayloadAction<FilesState["view"]>) => {
            state.view = action.payload;
        },

        setLoadingType: (
            state,
            action: PayloadAction<FilesState["loadingType"]>,
        ) => {
            state.loadingType = action.payload;
        },

        setCount: (state, action: PayloadAction<FilesState["count"]>) => {
            state.count = action.payload;
        },

        setFiles: (state, action: PayloadAction<File[]>) => {
            state.files = action.payload;
        },

        appendFiles: (state, action: PayloadAction<File[]>) => {
            const existingIds = new Set(state.files.map((f) => String(f.id)));
            const newFiles = action.payload.filter(
                (f) => !existingIds.has(String(f.id)),
            );
            state.files = [...state.files, ...newFiles];
        },

        setSelectedFiles: (state, action: PayloadAction<File[]>) => {
            state.selectedFiles = action.payload;
        },

        setHiddenFileIds: (
            state,
            action: PayloadAction<(string | number)[]>,
        ) => {
            state.hiddenFileIds = action.payload;
        },

        setDetailsFile: (state, action: PayloadAction<File | null>) => {
            state.detailsFile = action.payload;
        },

        setQuery: (
            state,
            action: PayloadAction<Partial<FilesState["query"]>>,
        ) => {
            const resettingKeys = ["orderBy", "order", "search"];

            const isResetting = resettingKeys.some(
                (key) => key in action.payload,
            );

            state.query = {
                ...state.query,
                ...action.payload,
                ...(isResetting && !("page" in action.payload) && { page: 1 }),
            };

            if (isResetting) {
                state.hasMore = false;
            }
        },

        setDynamicFolders: (
            state,
            action: PayloadAction<Record<string, number>>,
        ) => {
            state.dynamicFolders = action.payload;
        },

        setTotalPages: (
            state,
            action: PayloadAction<FilesState["totalPages"]>,
        ) => {
            state.totalPages = action.payload;
        },

        setHasMore: (state, action: PayloadAction<FilesState["hasMore"]>) => {
            state.hasMore = action.payload;
        },

        setBulkSelect: (
            state,
            action: PayloadAction<FilesState["bulkSelect"]>,
        ) => {
            state.bulkSelect = action.payload;
        },

        updateFile: (
            state,
            action: PayloadAction<{ id: string | number; data: Partial<File> }>,
        ) => {
            const { id, data } = action.payload;

            const index = state.files.findIndex(
                (f) => String(f?.id) === String(id),
            );
            if (index !== -1) {
                state.files[index] = {
                    ...state.files[index],
                    ...data,
                };
            }
        },

        deleteFile: (state, action: PayloadAction<(string | number)[]>) => {
            const ids = new Set(action.payload);

            state.files = state.files.filter((f) => !ids.has(f?.id));
            state.selectedFiles = state.selectedFiles.filter(
                (f) => !ids.has(f?.id),
            );
        },
    },
});

export const {
    setView,
    setLoadingType,
    setCount,
    setFiles,
    appendFiles,
    setSelectedFiles,
    setHiddenFileIds,
    setDetailsFile,
    setQuery,
    setDynamicFolders,
    setTotalPages,
    setHasMore,
    setBulkSelect,
    updateFile,
    deleteFile,
} = filesSlice.actions;

export const selectFiles = (state: RootState) => state.files;

const filesReducer = filesSlice.reducer;

export default filesReducer;
