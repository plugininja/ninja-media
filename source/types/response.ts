export type ServerResponse<T> = {
    success: boolean;
    message: string;
    data?: T;
};
