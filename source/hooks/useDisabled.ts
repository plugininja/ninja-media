import { selectMedia } from "~/redux/features/media";
import { useAppSelector } from "~/redux/hooks";

const useDisabled = () => {
    const { menu, selectedFolders, activeFolder } = useAppSelector(selectMedia);

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
