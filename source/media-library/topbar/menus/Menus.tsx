import useMedia from "~/media-library/hooks/useMedia";
import BlockStack from "~/components/blockStack";
import { MediaMenu } from "~/types/media/media";
import DynamicFolders from "./DynamicFolders";
import useSettings from "~/hooks/useSettings";
import Uncategorized from "./Uncategorized";
import Favorites from "./Favorites";
import Unused from "./Unused";
import Used from "./Used";
import All from "./All";

const Menus = () => {
    const { data } = useSettings();
    const {
        setMedia,
        menu,
        allFiles,
        uncategorized,
        dynamicFolders,
        favorites,
        used,
        unused,
    } = useMedia();

    const theme = data?.display?.theme?.theme ?? "default";

    const showCount = pnpnm?.settings?.general?.folder?.showCount ?? false;

    const isUncategorized =
        pnpnm?.settings?.advanced?.organization?.uncategorized ?? false;

    const isDynamicFolders =
        pnpnm?.settings?.advanced?.organization?.dynamicFolders ?? false;

    const isFavorites =
        pnpnm?.settings?.advanced?.organization?.favorites ?? false;

    const isUnused = pnpnm?.settings?.advanced?.organization?.unused ?? false;

    const handleMenu = (menu: MediaMenu) => {
        setMedia("menu", menu);
        setMedia("activeFolder", null);
        setMedia("selectedFolders", []);

        const keyMap: Record<string, string> = {
            all: "all",
            uncategorized: "uncategorized",
            dynamic: "dynamic",
            favorites: "favorites",
            used: "used",
            unused: "unused",
            trash: "trash",
        };

        window.pnpnmMedia?.initFilter([]);
        window.pnpnmMedia
            ?.getFrame()
            ?.find("#pnpnm-media-folder-filter")
            ?.val(keyMap[menu] ?? "all")
            ?.trigger("change");
    };

    return (
        <BlockStack gap={5} style={{ margin: "10px 0px" }}>
            <All
                menu={menu}
                showCount={showCount}
                count={allFiles}
                onMenu={handleMenu}
            />

            <Uncategorized
                enabled={isUncategorized}
                menu={menu}
                showCount={showCount}
                count={uncategorized}
                onMenu={handleMenu}
            />

            <DynamicFolders
                enabled={isDynamicFolders}
                menu={menu}
                theme={theme}
                onMenu={handleMenu}
                folders={dynamicFolders}
                showCount={showCount}
            />

            <Favorites
                enabled={isFavorites}
                menu={menu}
                theme={theme}
                showCount={showCount}
                count={favorites}
                onMenu={handleMenu}
            />

            <Used
                enabled={true}
                menu={menu}
                theme={theme}
                showCount={showCount}
                count={used}
                onMenu={handleMenu}
            />

            <Unused
                enabled={isUnused}
                menu={menu}
                theme={theme}
                showCount={showCount}
                count={unused}
                onMenu={handleMenu}
            />
        </BlockStack>
    );
};

export default Menus;
