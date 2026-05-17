import { __ } from "@wordpress/i18n";

export const SETTINGS_MENUS: {
    key: "general" | "display" | "advanced" | "tools";
    title: string;
    icon: string;
}[] = [
    {
        key: "general",
        title: __("General", "ninja-media"),
        icon: "settings",
    },
    {
        key: "display",
        title: __("Display", "ninja-media"),
        icon: "auto_awesome_mosaic",
    },
    {
        key: "advanced",
        title: __("Advanced", "ninja-media"),
        icon: "instant_mix",
    },
    {
        key: "tools",
        title: __("Tools", "ninja-media"),
        icon: "build",
    },
];

export const FILES_MENUS: {
    key: "all" | "uncategorized" | "dynamic" | "favorites" | "used" | "unused";
    title: string;
    icon: string;
}[] = [
    {
        key: "all",
        title: __("All Files", "ninja-media"),
        icon: "collections",
    },
    {
        key: "uncategorized",
        title: __("Uncategorized", "ninja-media"),
        icon: "image",
    },

    {
        key: "dynamic",
        title: __("Dynamic Folders", "ninja-media"),
        icon: "dynamic_feed",
    },
    {
        key: "favorites",
        title: __("Favorites", "ninja-media"),
        icon: "favorite",
    },
    {
        key: "used",
        title: __("Used Files", "ninja-media"),
        icon: "gallery_thumbnail",
    },
    {
        key: "unused",
        title: __("Unused Files", "ninja-media"),
        icon: "dangerous",
    },
];

export const WATERMARK_MENUS: {
    key: "text" | "image";
    title: string;
    icon: string;
}[] = [
    {
        key: "text",
        title: __("Text", "ninja-media"),
        icon: "art_track",
    },
    {
        key: "image",
        title: __("Image", "ninja-media"),
        icon: "gallery_thumbnail",
    },
];
