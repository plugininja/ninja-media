import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { NestedKey, NestedValue } from "~/utils/types";
import { setNestedValue } from "~/utils/functions";
import { MediaState } from "~/types/media/states";
import { RootState } from "~/redux/store";
import { Folder } from "~/types/folder";

const initialState: MediaState = {
    menu: "all",
    allFiles: 0,
    uncategorized: 0,
    dynamicFolders: {},
    favorites: 0,
    used: 0,
    unused: 0,
    trash: 0,
    folders: {},
    activeFolder: null,
    selectedFolders: [],
    expandedFolderIds: [],
    hiddenFolderIds: [],
    createFolder: { create: false, folder: null },
    renameFolder: { rename: false, folder: null },
    cutFolders: { cut: false, folders: [] },
    moveFolder: { move: false, id: null },
    folderSorting: { orderBy: "name" },
    fileSorting: { orderBy: "name" },
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
        updateMedia: <Path extends NestedKey<MediaState>>(
            state: MediaState,
            action: PayloadAction<{
                path: Path;
                value: NestedValue<MediaState, Path>;
            }>,
        ) => {
            setNestedValue(state, action.payload.path, action.payload.value);
        },

        setFolders: (
            state,
            action: PayloadAction<{
                id: string | number;
                children: Folder[];
            }>,
        ) => {
            state.folders[action.payload.id] = action.payload.children;
        },

        updateFolder: (
            state,
            action: PayloadAction<{
                id: string | number;
                data: Partial<Folder>;
            }>,
        ) => {
            const { id, data } = action.payload;

            Object.keys(state.folders).forEach((parentId) => {
                const index = state.folders[parentId].findIndex(
                    (f) => String(f.id) === String(id),
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

export const { updateMedia, setFolders, updateFolder, removeFolder } =
    mediaSlice.actions;

export const selectMedia = (state: RootState) => state.media;

const mediaReducer = mediaSlice.reducer;

export default mediaReducer;
