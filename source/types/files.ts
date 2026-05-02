export type File = {
    id: string | number;
    name: string;
    url: string;
    extension: string;
    size: number;
    createdAt: string;
    updatedAt: string;
    isWatermarked: boolean;
    location: {
        name: string;
        url: string;
    }[];
};
