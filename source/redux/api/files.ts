import { ServerResponse } from "~/types/states";
import { File } from "~/types/files";
import { baseApi } from "./base";

export type FileQueryParams = {
    type?: "all" | "uncategorized" | "dynamic" | "unused" | "trash";
    extension?: string;
    orderBy?: "name" | "size" | "createdAt" | "updatedAt";
    order?: "ASC" | "DESC";
    page?: number;
    perPage?: number;
    search?: string;
};

export const filesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getFiles: builder.query<
            ServerResponse<{
                allFiles: number;
                uncategorized: number;
                unused: number;
                trash: number;
                files: File[];
                dynamicFolders: Record<string, number>;
                total: number;
                totalPages: number;
                page: number;
            }>,
            FileQueryParams
        >({
            query: ({
                type,
                extension,
                orderBy,
                order,
                page,
                perPage,
                search,
            }) => {
                const params: Record<string, string | number> = {
                    ...(type && { type }),
                    ...(type === "dynamic" && extension && { extension }),
                    ...(orderBy && { orderBy }),
                    ...(order && { order }),
                    ...(page !== undefined && { page }),
                    ...(perPage !== undefined && {
                        perPage,
                    }),
                    ...(search && { search }),
                };

                return {
                    url: `media-library/files`,
                    method: "GET",
                    params,
                };
            },

            providesTags: ["Files"],
        }),
    }),
});

export const { useGetFilesQuery } = filesApi;
