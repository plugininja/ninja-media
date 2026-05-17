
export type Theme = "default" | "bold" | "plugininja" | "awesome";

export type General = {
    folder: {
        forceSorting: boolean;
        showFolders: boolean;
        showFolderId: boolean;
        showCount: boolean;
        treeConnector: boolean;
        postTypeFolders: string[];
    };

    files: {
        bulkSelection: boolean;
        replaceMedia: boolean;
        duplicateMedia: boolean;
        moveToTrash: boolean;
        controlUploadSize: boolean;
        uploadSize: number;
        controlBigImageSize: boolean;
        bigImageSize: number;
    };

    svgSupport: {
        uploadSupport: boolean;
        sanitization: boolean;
    };
};

export type Display = {
    theme: {
        theme: Theme;
        color: string;
        firstTime: boolean;
    };

    settings: {
        perPage: number;
        detailsHover: boolean;
        breadcrumbNavigation: boolean;
    };
};

export type Advanced = {
    action: {
        contextMenu: boolean;
        undoActions: boolean;
    };

    organization: {
        dynamicFolders: boolean;
        uncategorized: boolean;
        favorites: boolean;
        used: boolean;
        unused: boolean;
    };

    imageProcessing: {
        convertWebp: boolean;
        thumbnailGenerator: boolean;
    };
};

export type Tools = {
    deleteOnUninstall: boolean;
    autoSave: boolean;
};

export type Settings = {
    general: General;
    display: Display;
    advanced: Advanced;
    tools: Tools;
};
