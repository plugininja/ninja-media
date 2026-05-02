import { ServerResponse } from "~/types/states";
import { Folder } from "~/types/media";
import { baseApi } from "./base";
import {
    AssignFileResponse,
    CreateFolderResponse,
    DeleteFileResponse,
    DownloadFolderResponse,
    GetBreadcrumbsResponse,
    GetFolderResponse,
    GetFoldersResponse,
    ReplaceMediaResponse,
    RestoreFileResponse,
    TrashFileResponse,
    UpdateFolderResponse,
} from "~/types/response";

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

        downloadFolder: builder.mutation<
            ServerResponse<DownloadFolderResponse>,
            { ids: (string | number)[] }
        >({
            query: ({ ids }) => {
                return {
                    url: `media-library/folder/download`,
                    method: "GET",
                    params: {
                        ids,
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

        deleteFolder: builder.mutation<
            ServerResponse<{ uncategorized: number }>,
            { ids: (string | number)[] }
        >({
            query: ({ ids }) => {
                return {
                    url: `media-library/folder`,
                    method: "DELETE",
                    body: {
                        ids,
                    },
                };
            },
        }),

        trashFile: builder.mutation<
            ServerResponse<TrashFileResponse>,
            { ids: (string | number)[] }
        >({
            query: ({ ids }) => {
                return {
                    url: `media-library/trash`,
                    method: "POST",
                    body: {
                        ids,
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
                    url: `media-library/trash`,
                    method: "DELETE",
                    body: {
                        ids,
                    },
                };
            },
        }),

        replaceMedia: builder.mutation<
            ReplaceMediaResponse,
            { id: number; formData: FormData }
        >({
            query: ({ id, formData }) => ({
                url: `replace-media/${id}`,
                method: "POST",
                body: formData,
                formData: true,
            }),
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
    useDownloadFolderMutation,
    useAssignFileMutation,
    useDeleteFolderMutation,
    useTrashFileMutation,
    useRestoreFileMutation,
    useDeleteFileMutation,
    useReplaceMediaMutation,
} = media;
