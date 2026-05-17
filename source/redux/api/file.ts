import { ServerResponse } from "~/types/response";
import { File } from "~/types/file";
import { baseApi } from "./base";

export type FileQueryParams = {
    type?: "all" | "uncategorized" | "dynamic" | "used" | "unused" | "favorites" | "trash";
    extension?: string;
    orderBy?: "name" | "size" | "createdAt" | "updatedAt";
    order?: "ASC" | "DESC";
    page?: number;
    perPage?: number;
    search?: string;
};

export const file = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getFiles: builder.query<
            ServerResponse<{
                allFiles: number;
                uncategorized: number;
                dynamicFolders: Record<string, number>;
                favorites: number;
                used: number;
                unused: number;
                trash: number;
                files: File[];
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

export const { useGetFilesQuery } = file;
