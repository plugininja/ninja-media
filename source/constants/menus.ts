export const SETTINGS_MENUS: {
    key: "general" | "display" | "advanced" | "tools";
    title: string;
    icon: string;
}[] = [
    {
        key: "general",
        title: "General",
        icon: "settings",
    },
    {
        key: "display",
        title: "Display",
        icon: "auto_awesome_mosaic",
    },
    {
        key: "advanced",
        title: "Advanced",
        icon: "instant_mix",
    },
    {
        key: "tools",
        title: "Tools",
        icon: "build",
    },
];

export const FILES_MENUS: {
    key: "all" | "uncategorized" | "dynamic" | "unused";
    title: string;
    icon: string;
}[] = [
    {
        key: "all",
        title: "All Files",
        icon: "collections",
    },
    {
        key: "uncategorized",
        title: "Uncategorized",
        icon: "image",
    },
    {
        key: "dynamic",
        title: "Dynamic Folders",
        icon: "dynamic_feed",
    },
    {
        key: "unused",
        title: "Unused",
        icon: "dangerous",
    },
];
