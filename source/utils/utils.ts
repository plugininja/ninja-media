export const toBoolean = (value: boolean | string) =>
    value === "true" || value === true || value === "1";

export function isValidArray<T = unknown>(
    value: T[] | undefined | null,
): value is Array<T> {
    return Array.isArray(value) && value.length > 0;
}
