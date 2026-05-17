import { useCallback, useState } from "@wordpress/element";
import { useEventListener } from "./useEventListener";
import type { Dispatch, SetStateAction } from "react";

type UseLocalStorageOptions<T> = {
    serializer?: (value: T) => string;
    deserializer?: (value: string) => T;
    initializeWithValue?: boolean;
    onError?: (error: Error, key: string) => void;
};

export function useLocalStorage<T>(
    key: string,
    initialValue: T | (() => T) = undefined as T,
    options: UseLocalStorageOptions<T> = {},
): [T, Dispatch<SetStateAction<T>>, () => void] {
    const {
        initializeWithValue = true,
        serializer = JSON.stringify,
        deserializer = JSON.parse,
        onError = (error, key) =>
            console.warn(
                `Error with localStorage key "${key}": ${error.message}`,
            ),
    } = options;

    const isLocalStorageAvailable = useCallback((): boolean => {
        return typeof window !== "undefined" && !!window.localStorage;
    }, []);

    const getInitialValue = useCallback((): T => {
        if (typeof initialValue === "function") {
            return (initialValue as () => T)();
        }
        return initialValue;
    }, [initialValue]);

    const readValueFromStorage = useCallback((): T => {
        if (!isLocalStorageAvailable()) {
            return getInitialValue();
        }

        try {
            const storedItem = window.localStorage.getItem(key);

            if (storedItem === null) {
                return getInitialValue();
            }

            return deserializer(storedItem);
        } catch (error) {
            const errorObj =
                error instanceof Error ? error : new Error("Unknown error");
            onError(errorObj, key);
            return getInitialValue();
        }
    }, [key, deserializer, onError, isLocalStorageAvailable, getInitialValue]);

    const [storedValue, setStoredValue] = useState<T>(() => {
        if (initializeWithValue) {
            return readValueFromStorage();
        }
        return getInitialValue();
    });

    const setValue: Dispatch<SetStateAction<T>> = useCallback(
        (value) => {
            if (!isLocalStorageAvailable()) {
                onError(new Error("localStorage not available"), key);
                return;
            }

            try {
                const newValue =
                    typeof value === "function"
                        ? (value as (prev: T) => T)(storedValue)
                        : value;

                window.localStorage.setItem(key, serializer(newValue));
                setStoredValue(newValue);
            } catch (error) {
                const errorObj =
                    error instanceof Error ? error : new Error("Unknown error");
                onError(errorObj, key);
            }
        },
        [key, storedValue, serializer, onError, isLocalStorageAvailable],
    );

    const removeValue = useCallback(() => {
        if (isLocalStorageAvailable()) {
            window.localStorage.removeItem(key);
        }

        setStoredValue(getInitialValue());
    }, [key, isLocalStorageAvailable, getInitialValue]);

    const handleStorageChange = useCallback(
        (event: StorageEvent) => {
            if (event.key === key) {
                setStoredValue(readValueFromStorage());
            }
        },
        [key, readValueFromStorage],
    );

    useEventListener(
        "storage",
        handleStorageChange,
        typeof window !== "undefined" ? window : null,
    );

    return [storedValue, setValue, removeValue];
}
