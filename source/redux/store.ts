import { combineReducers, configureStore } from "@reduxjs/toolkit";
import settingsReducer from "./features/settings/settings";
import { fileMiddleware } from "./middleware/file";
import mediaReducer from "./features/media/media";
import fileReducer from "./features/file/file";
import { baseApi } from "./api/base";

const rootReducer = combineReducers({
    [baseApi.reducerPath]: baseApi.reducer,
    settings: settingsReducer,
    media: mediaReducer,
    file: fileReducer,
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(fileMiddleware)
            .concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
