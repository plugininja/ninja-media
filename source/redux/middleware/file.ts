import { Middleware } from "@reduxjs/toolkit";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const fileMiddleware: Middleware = (store) => (next) => (action) => {
    const result = next(action);

    const actionType = (action as any).type as string;
    if (!actionType?.startsWith("file/")) return result;

    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
        const state = store.getState().file;

        localStorage.setItem(
            "fileStates",
            JSON.stringify({
                view: state.view,
                loadingType: state.loadingType,
                query: {
                    orderBy: state.query.orderBy,
                    order: state.query.order,
                    page: state.query.page,
                    perPage: state.query.perPage,
                },
            }),
        );
    }, 300);

    return result;
};
