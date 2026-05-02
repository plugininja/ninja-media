import Uncategorized from "~/assets/icons/folder/Uncategorized";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { selectSettings } from "~/redux/features/settings";
import { useDeleteFolder } from "../actions/Delete";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import Home from "~/assets/icons/folder/Home";
import { useState } from "@wordpress/element";
import DynamicFolders from "./DynamicFolders";
import useDebounce from "~/hooks/useDebounce";
import useDisabled from "~/hooks/useDisabled";
import Divider from "~/components/divider";
import Button from "~/components/button";
import Input from "~/components/input";
import Folder from "../folder/Folder";
import Card from "~/components/card";
import { Menu } from "~/types/media";
import Logo from "~/components/logo";
import Sorting from "./Sorting";
import More from "./More";
import {
    selectMedia,
    setActiveFolder,
    setCreateFolder,
    setMenu,
    setRenameFolder,
    setSearch,
} from "~/redux/features/media";

const Topbar = () => {
    const { data } = useAppSelector(selectSettings);
    const {
        menu,
        allFiles,
        uncategorized,
        dynamicFolders,
        activeFolder,
        createFolder,
        renameFolder,
        search,
    } = useAppSelector(selectMedia);
    const [searchTerm, setSearchTerm] = useState(search || "");

    const { openDeleteFolder } = useDeleteFolder();

    const { newFolderDisabled, renameFolderDisabled, deleteFolderDisabled } =
        useDisabled();

    const dispatch = useAppDispatch();

    useDebounce(
        () => {
            if (
                !searchTerm ||
                searchTerm.trim() === "" ||
                searchTerm.length < 2
            ) {
                if (search) dispatch(setSearch(""));
                return;
            }
            dispatch(setSearch(String(searchTerm)));
        },
        [searchTerm],
        300,
    );

    const handleCreate = () => {
        dispatch(
            setCreateFolder({
                create: !createFolder?.create,
            }),
        );
    };

    const handleRename = () => {
        dispatch(
            setRenameFolder({
                rename: !renameFolder?.rename,
                folder: activeFolder,
            }),
        );
    };

    const handleMenu = (menu: Menu) => {
        dispatch(setMenu(menu));
        dispatch(setActiveFolder(null));

        const keyMap: Record<string, string> = {
            all: "all",
            uncategorized: "uncategorized",
            dynamic: "dynamic",
            trash: "trash",
        };

        window.pnpnmMedia?.initFilter([]);
        window.pnpnmMedia
            ?.getFrame()
            ?.find("#pnpnm-media-folder-filter")
            ?.val(keyMap[menu] ?? "all")
            ?.trigger("change");
    };

    const isUncategorized =
        data?.advanced?.organization?.groupUncategorized ??
        pnpnm?.settings?.advanced?.organization?.groupUncategorized ??
        false;

    const isDynamicFolders =
        data?.advanced?.organization?.dynamicFolders ??
        pnpnm?.settings?.advanced?.organization?.dynamicFolders ??
        false;

    const isUnused =
        data?.advanced?.organization?.unused ??
        pnpnm?.settings?.advanced?.organization?.unused ??
        false;

    return (
        <div className="pnpnm-topbar">
            <InlineStack align="between" gap={10} wrap={false}>
                <Logo />

                <Button
                    variant="primary"
                    size="extrasmall"
                    rounded="xs"
                    startIcon="create_new_folder"
                    onClick={handleCreate}
                    disabled={newFolderDisabled}
                >
                    New Folder
                </Button>
            </InlineStack>

            <Card
                marginTop={20}
                padding={5}
                background="white"
                rounded="sm"
                border="light"
                flex
                direction="row"
                align="between"
                gap={5}
                wrap={false}
            >
                <InlineStack gap={5} wrap={false}>
                    <Button
                        variant="primary"
                        size="extrasmall"
                        rounded="xs"
                        startIcon="edit_document"
                        onClick={handleRename}
                        disabled={renameFolderDisabled}
                    >
                        Rename
                    </Button>

                    <Button
                        variant="error"
                        size="extrasmall"
                        rounded="xs"
                        startIcon="delete"
                        onClick={() =>
                            openDeleteFolder(String(activeFolder?.id))
                        }
                        disabled={deleteFolderDisabled}
                    >
                        Delete
                    </Button>
                </InlineStack>

                <InlineStack gap={5} wrap={false}>
                    <Sorting />

                    <More />
                </InlineStack>
            </Card>

            <BlockStack gap={10} style={{ margin: "10px 0px" }}>
                <Folder
                    name="All Files"
                    count={allFiles}
                    icon={<Home active={menu === "all"} />}
                    active={menu === "all"}
                    onClick={() => handleMenu("all")}
                />

                {isUncategorized && (
                    <Folder
                        name="Uncategorized"
                        count={uncategorized}
                        icon={
                            <Uncategorized active={menu === "uncategorized"} />
                        }
                        active={menu === "uncategorized"}
                        onClick={() => handleMenu("uncategorized")}
                    />
                )}

                {isDynamicFolders && (
                    <DynamicFolders
                        menu={menu}
                        setMenu={handleMenu}
                        folders={dynamicFolders}
                    />
                )}

                {isUnused && (
                    <Folder
                        name="Unused"
                        count={30}
                        active={menu === "unused"}
                        open={menu === "unused"}
                        onClick={() => handleMenu("unused")}
                    />
                )}
            </BlockStack>

            <Divider marginTop={10} marginBottom={10} />

            <Input
                type="search"
                size="extrasmall"
                searchIcon
                placeholder="All Files"
                className="pnpnm-topbar__input"
                value={search}
                onChange={(value) => setSearchTerm(String(value))}
            />

            <Divider marginTop={10} />
        </div>
    );
};

export default Topbar;
