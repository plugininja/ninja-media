import { filesApi } from "../api/files";
import { store } from "../store";

const updateFilesCaches = (
    removedIds: (string | number)[],
    countUpdates: {
        allFiles?: number;
        uncategorized?: number;
        unused?: number;
        trash?: number;
        dynamicFolders?: Record<string, number>;
    },
) => {
    const state = store.getState();
    const queries = state[filesApi.reducerPath]?.queries ?? {};

    Object.entries(queries).forEach(([, queryEntry]: [string, any]) => {
        if (queryEntry?.status !== "fulfilled") return;

        const endpointName = queryEntry?.endpointName;
        if (endpointName !== "getFiles") return;

        const args = queryEntry?.originalArgs;
        if (!args) return;

        store.dispatch(
            filesApi.util.updateQueryData("getFiles", args, (draft) => {
                if (!draft?.data) return;

                const removedSet = new Set(removedIds.map(String));
                draft.data.files = draft.data.files.filter(
                    (f) => !removedSet.has(String(f.id)),
                );

                if (countUpdates.allFiles !== undefined) {
                    draft.data.allFiles = countUpdates.allFiles;
                }
                if (countUpdates.uncategorized !== undefined) {
                    draft.data.uncategorized = countUpdates.uncategorized;
                }
                if (countUpdates.unused !== undefined) {
                    draft.data.unused = countUpdates.unused;
                }
                if (countUpdates.trash !== undefined) {
                    draft.data.trash = countUpdates.trash;
                }
                if (countUpdates.dynamicFolders !== undefined) {
                    draft.data.dynamicFolders = countUpdates.dynamicFolders;
                }

                const perPage = args.perPage ?? 30;

                draft.data.total = Math.max(
                    0,
                    draft.data.total - removedIds.length,
                );

                draft.data.totalPages = Math.max(
                    1,
                    Math.ceil(draft.data.total / perPage),
                );
            }),
        );
    });
};

export default updateFilesCaches;
