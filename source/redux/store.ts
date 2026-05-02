import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { filesMiddleware } from "./middleware/files";
import settingsReducer from "./features/settings";
import filesReducer from "./features/files";
import mediaReducer from "./features/media";
import { baseApi } from "./api/base";

const rootReducer = combineReducers({
    [baseApi.reducerPath]: baseApi.reducer,
    settings: settingsReducer,
    media: mediaReducer,
    files: filesReducer,
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(filesMiddleware)
            .concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
