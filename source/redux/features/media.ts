import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MediaState } from "~/types/states";
import { Folder } from "~/types/media";
import { RootState } from "../store";

const initialState: MediaState = {
    menu: "all",
    allFiles: 0,
    uncategorized: 0,
    dynamicFolders: {},
    trash: 0,
    folders: {},
    expandedFolderIds: [],
    selectedFolders: [],
    hiddenFolderIds: [],
    activeFolder: null,
    createFolder: {
        create: false,
        folder: null,
    },
    renameFolder: {
        rename: false,
        folder: null,
    },
    cutFolders: {
        cut: false,
        folders: [],
    },
    moveFolder: {
        move: false,
        folderId: null,
    },
    folderSorting: {
        orderBy: "name",
    },
    fileSorting: {
        orderBy: "name",
    },
    order: "ASC",
    search: "",
    bulkSelect: false,
    expandAll: false,
    loading: false,
};

export const mediaSlice = createSlice({
    name: "media",
    initialState,
    reducers: {
        setMenu: (state, action: PayloadAction<MediaState["menu"]>) => {
            state.menu = action.payload;
        },

        setAllFiles: (state, action: PayloadAction<MediaState["allFiles"]>) => {
            state.allFiles = action.payload;
        },

        setUncategorized: (
            state,
            action: PayloadAction<MediaState["uncategorized"]>,
        ) => {
            state.uncategorized = action.payload;
        },

        setDynamicFolders: (
            state,
            action: PayloadAction<MediaState["dynamicFolders"]>,
        ) => {
            state.dynamicFolders = action.payload;
        },

        setTrash: (state, action: PayloadAction<MediaState["trash"]>) => {
            state.trash = action.payload;
        },

        setFolders: (
            state,
            action: PayloadAction<{
                parentId: string | number;
                children: Folder[];
            }>,
        ) => {
            state.folders[action.payload.parentId] = action.payload.children;
        },

        setExpandedFolderIds: (
            state,
            action: PayloadAction<MediaState["expandedFolderIds"]>,
        ) => {
            state.expandedFolderIds = action.payload;
        },

        setSelectedFolders: (
            state,
            action: PayloadAction<MediaState["selectedFolders"]>,
        ) => {
            state.selectedFolders = action.payload;
        },

        setHiddenFolderIds: (
            state,
            action: PayloadAction<MediaState["hiddenFolderIds"]>,
        ) => {
            state.hiddenFolderIds = action.payload;
        },

        setActiveFolder: (
            state,
            action: PayloadAction<MediaState["activeFolder"]>,
        ) => {
            state.activeFolder = action.payload;
        },

        setCreateFolder: (
            state,
            action: PayloadAction<MediaState["createFolder"]>,
        ) => {
            state.createFolder = action.payload;
        },

        setRenameFolder: (
            state,
            action: PayloadAction<MediaState["renameFolder"]>,
        ) => {
            state.renameFolder = action.payload;
        },

        setCutFolders: (
            state,
            action: PayloadAction<MediaState["cutFolders"]>,
        ) => {
            state.cutFolders = action.payload;
        },

        setMoveFolder: (
            state,
            action: PayloadAction<MediaState["moveFolder"]>,
        ) => {
            state.moveFolder = action.payload;
        },

        setFolderSorting: (
            state,
            action: PayloadAction<MediaState["folderSorting"]>,
        ) => {
            state.folderSorting = action.payload;
        },

        setFileSorting: (
            state,
            action: PayloadAction<MediaState["fileSorting"]>,
        ) => {
            state.fileSorting = action.payload;
        },

        setOrder: (state, action: PayloadAction<"ASC" | "DESC">) => {
            state.order = action.payload;
        },

        setSearch: (state, action: PayloadAction<MediaState["search"]>) => {
            state.search = action.payload;
        },

        setBulkSelect: (
            state,
            action: PayloadAction<MediaState["bulkSelect"]>,
        ) => {
            state.bulkSelect = action.payload;
        },

        setExpandAll: (
            state,
            action: PayloadAction<MediaState["expandAll"]>,
        ) => {
            state.expandAll = action.payload;
        },

        setLoading: (state, action: PayloadAction<MediaState["loading"]>) => {
            state.loading = action.payload;
        },

        updateFolder: (
            state,
            action: PayloadAction<{
                folderId: string | number;
                data: Partial<Folder>;
            }>,
        ) => {
            const { folderId, data } = action.payload;

            Object.keys(state.folders).forEach((parentId) => {
                // state.folders[parentId] = state.folders[parentId].map((f) =>
                //     String(f.id) === String(folderId) ? { ...f, ...data } : f,
                // );
                const index = state.folders[parentId].findIndex(
                    (f) => String(f.id) === String(folderId),
                );
                if (index !== -1) {
                    state.folders[parentId][index] = {
                        ...state.folders[parentId][index],
                        ...data,
                    };
                }
            });
        },

        removeFolder: (state, action: PayloadAction<(string | number)[]>) => {
            const deletedIds = new Set(action.payload.map(String));

            Object.keys(state.folders).forEach((parentId) => {
                state.folders[parentId] = state.folders[parentId].filter(
                    (f) => !deletedIds.has(String(f.id)),
                );
            });
        },
    },
});

export const {
    setMenu,
    setAllFiles,
    setUncategorized,
    setDynamicFolders,
    setTrash,
    setFolders,
    setExpandedFolderIds,
    setSelectedFolders,
    setHiddenFolderIds,
    setActiveFolder,
    setCreateFolder,
    setRenameFolder,
    setCutFolders,
    setMoveFolder,
    setFolderSorting,
    setFileSorting,
    setOrder,
    setSearch,
    setBulkSelect,
    setExpandAll,
    setLoading,
    updateFolder,
    removeFolder,
} = mediaSlice.actions;

export const selectMedia = (state: RootState) => state.media;

const mediaReducer = mediaSlice.reducer;

export default mediaReducer;
