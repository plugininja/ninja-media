import useMedia from "./useMedia";

const useDisabled = () => {
    const { menu, selectedFolders, activeFolder } = useMedia();

    const trashActive = menu === "trash";

    const newFolderDisabled = trashActive;

    const renameFolderDisabled =
        selectedFolders?.length > 1 || !activeFolder || trashActive;

    const deleteFolderDisabled =
        (!activeFolder && selectedFolders?.length === 0) || trashActive;

    const sortingDisabled = trashActive;

    const moreOptionsDisabled = trashActive;

    return {
        newFolderDisabled,
        renameFolderDisabled,
        deleteFolderDisabled,
        sortingDisabled,
        moreOptionsDisabled,
    };
};

export default useDisabled;
