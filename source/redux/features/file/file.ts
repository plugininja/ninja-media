import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { NestedKey, NestedValue } from "~/utils/types";
import { setNestedValue } from "~/utils/functions";
import { FileState } from "~/types/file/states";
import { RootState } from "~/redux/store";
import { File } from "~/types/file";

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

const initialState: FileState = {
    view: persisted?.view ?? "grid",
    loadingType: persisted?.loadingType ?? "infinite",
    count: {
        all: 0,
        uncategorized: 0,
        dynamic: 0,
        favorites: 0,
        used: 0,
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
        perPage: persisted?.query?.perPage ?? 80,
        search: "",
    },
    dynamicFolders: {},
    totalPages: 1,
    hasMore: false,
    bulkSelect: false,
    loading: false,
};

export const fileSlice = createSlice({
    name: "file",
    initialState,
    reducers: {
        updateFileState: <Path extends NestedKey<FileState>>(
            state: FileState,
            action: PayloadAction<{
                path: Path;
                value: NestedValue<FileState, Path>;
            }>,
        ) => {
            setNestedValue(state, action.payload.path, action.payload.value);
        },

        appendFiles: (state, action: PayloadAction<FileState["files"]>) => {
            const existingIds = new Set(state.files.map((f) => String(f.id)));
            const newFiles = action.payload.filter(
                (f) => !existingIds.has(String(f.id)),
            );
            state.files = [...state.files, ...newFiles];
        },

        setQuery: (
            state,
            action: PayloadAction<Partial<FileState["query"]>>,
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
    updateFileState,
    appendFiles,
    setQuery,
    updateFile,
    deleteFile,
} = fileSlice.actions;

export const selectFile = (state: RootState) => state.file;

const fileReducer = fileSlice.reducer;

export default fileReducer;
