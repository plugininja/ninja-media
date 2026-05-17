export type File = {
    id: string | number;
    name: string;
    url: string;
    thumbnailUrl?: string;
    extension: string;
    size: number;
    createdAt: string;
    updatedAt: string;
    isFavorite: boolean;
    isWatermarked: boolean;
    location: {
        name: string;
        url: string;
    }[];
};
