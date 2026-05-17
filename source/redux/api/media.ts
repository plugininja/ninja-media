import { ServerResponse } from "~/types/response";
import { Folder } from "~/types/folder";
import { baseApi } from "./base";
import {
    AssignFileResponse,
    CreateFolderResponse,
    DeleteFileResponse,
    GetBreadcrumbsResponse,
    GetFolderResponse,
    GetFoldersResponse,
    RestoreFileResponse,
    UpdateFolderResponse,
} from "~/types/media/response";

export const media = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getFolders: builder.query<
            ServerResponse<GetFoldersResponse>,
            {
                orderBy?: "name" | "size" | "createdAt" | "updatedAt";
                order?: "ASC" | "DESC";
                search?: string;
            }
        >({
            query: ({ orderBy, order, search }) => {
                const params: Record<string, string> = {};

                if (orderBy) {
                    params.orderBy = orderBy;
                }
                if (order) {
                    params.order = order;
                }
                if (search) {
                    params.search = search;
                }

                return {
                    url: `media-library`,
                    method: "GET",
                    params,
                };
            },

            providesTags: ["Folders"],
        }),

        getFolder: builder.query<
            ServerResponse<GetFolderResponse>,
            { id: string | number }
        >({
            query: ({ id }) => {
                return {
                    url: `media-library/${id}`,
                    method: "GET",
                };
            },
        }),

        getBreadcrumbs: builder.query<
            ServerResponse<GetBreadcrumbsResponse>,
            { id: string | number }
        >({
            query: ({ id }) => {
                return {
                    url: `media-library/breadcrumbs`,
                    method: "GET",
                    params: {
                        id,
                    },
                };
            },
        }),

        createFolder: builder.mutation<
            ServerResponse<CreateFolderResponse>,
            { name: string; parentId?: string | number | null }
        >({
            query: ({ name, parentId }) => {
                return {
                    url: `media-library/folder`,
                    method: "POST",
                    body: {
                        name,
                        parentId,
                    },
                };
            },

            async onQueryStarted(
                { parentId },
                { dispatch, queryFulfilled, getState },
            ) {
                if (parentId) return;

                try {
                    await queryFulfilled;

                    const state = getState() as any;
                    const { folderSorting, order } = state.media;
                    const isForceSorting =
                        state.settings?.data?.general?.folder?.forceSorting ??
                        false;

                    if (!isForceSorting) return;

                    dispatch(media.util.invalidateTags(["Folders"]));

                    dispatch(
                        media.endpoints.getFolders.initiate(
                            {
                                orderBy: folderSorting?.orderBy,
                                order: order,
                            },
                            { forceRefetch: true },
                        ),
                    );
                } catch {}
            },
        }),

        updateFolder: builder.mutation<
            ServerResponse<UpdateFolderResponse>,
            {
                id: string | number;
                name?: string;
                color?: string | null;
            }
        >({
            query: ({ id, name, color }) => {
                return {
                    url: `media-library/folder`,
                    method: "PUT",
                    body: {
                        id,
                        name,
                        color,
                    },
                };
            },
        }),

        copyFolder: builder.mutation<
            ServerResponse<{ folders: Folder[] }>,
            { parentId: string | number; id: string | number }
        >({
            query: ({ parentId, id }) => {
                return {
                    url: `media-library/folder/copy`,
                    method: "POST",
                    body: {
                        parentId,
                        ids: [id],
                    },
                };
            },
        }),

        moveFolder: builder.mutation<
            ServerResponse<null>,
            { id: string | number; ids: (string | number)[] }
        >({
            query: ({ id, ids }) => {
                return {
                    url: `media-library/folder/move`,
                    method: "POST",
                    body: {
                        parentId: id,
                        ids,
                    },
                };
            },
        }),

        deleteFolder: builder.mutation<
            ServerResponse<{ allFiles: number; uncategorized: number }>,
            { ids: (string | number)[]; isMediaDelete?: boolean }
        >({
            query: ({ ids, isMediaDelete }) => {
                return {
                    url: `media-library/folder`,
                    method: "DELETE",
                    body: {
                        ids,
                        isMediaDelete,
                    },
                };
            },
        }),

        assignFile: builder.mutation<
            ServerResponse<AssignFileResponse>,
            { id: string | number; attachments: (string | number)[] }
        >({
            query: ({ id, attachments }) => {
                return {
                    url: `media-library/folder/${id}/assign`,
                    method: "POST",
                    body: {
                        attachments,
                    },
                };
            },
        }),

        restoreFile: builder.mutation<
            ServerResponse<RestoreFileResponse>,
            { ids: (string | number)[] }
        >({
            query: ({ ids }) => {
                return {
                    url: `media-library/restore`,
                    method: "POST",
                    body: {
                        ids,
                    },
                };
            },
        }),

        deleteFile: builder.mutation<
            ServerResponse<DeleteFileResponse>,
            { ids: (string | number)[] }
        >({
            query: ({ ids }) => {
                return {
                    url: `media-library/delete`,
                    method: "DELETE",
                    body: {
                        ids,
                    },
                };
            },
        }),

    }),
});

export const {
    useGetFoldersQuery,
    useLazyGetFolderQuery,
    useGetBreadcrumbsQuery,
    useCreateFolderMutation,
    useUpdateFolderMutation,
    useCopyFolderMutation,
    useMoveFolderMutation,
    useAssignFileMutation,
    useDeleteFolderMutation,
    useRestoreFileMutation,
    useDeleteFileMutation,
} = media;
