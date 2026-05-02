export type General = {
    folder: {
        forceSorting: boolean;
        showFolders: boolean;
        showFolderId: boolean;
        treeConnector: boolean;
    };

    files: {
        bulkSelection: boolean;
        replaceMedia: boolean;
        moveToTrash: boolean;
        controlUploadSize: boolean;
        uploadSize: number;
    };

    svgSupport: {
        uploadSupport: boolean;
        sanitization: boolean;
    };
};

export type Display = {
    theme: {
        theme: "default" | "windows" | "google-drive" | "dropbox";
        color: string;
        firstTime: boolean;
    };

    settings: {
        perPage: number;
        thumbnailSize: "small" | "medium" | "large";
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
        groupUncategorized: boolean;
        unused: boolean;
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
