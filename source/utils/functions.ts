import { GenericObject, NestedKey, NestedValue } from "./types";

export function setNestedValue<
    Obj extends GenericObject,
    Path extends NestedKey<Obj>,
>(obj: Obj, path: Path, value: NestedValue<Obj, Path>) {
    if (!obj || typeof obj !== "object") return;

    const keys = path.split(".");

    let current: GenericObject = obj;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        if (i === keys.length - 1) {
            current[key] = value;
        } else {
            if (!current[key] || typeof current[key] !== "object") {
                current[key] = {};
            }

            current = current[key];
        }
    }
}

export function objectEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== typeof obj2) return false;

    if (obj1 == null || obj2 == null) return obj1 === obj2;

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) return false;

        const arr1 = [...obj1];
        const arr2 = [...obj2];

        return arr1.every((item1) => {
            const index = arr2.findIndex((item2) => objectEqual(item1, item2));
            if (index === -1) return false;
            arr2.splice(index, 1);
            return true;
        });
    }

    if (typeof obj1 === "object" && typeof obj2 === "object") {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) return false;

        return keys1.every(
            (key) => keys2.includes(key) && objectEqual(obj1[key], obj2[key]),
        );
    }

    return obj1 === obj2;
}

export const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;

    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
