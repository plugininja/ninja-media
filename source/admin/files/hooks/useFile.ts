import { selectFile, updateFileState } from "~/redux/features/file/file";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { NestedKey, NestedValue } from "~/utils/types";
import { useCallback } from "@wordpress/element";
import { FileState } from "~/types/file/states";

const useFile = () => {
    const file = useAppSelector(selectFile);

    const dispatch = useAppDispatch();

    const setFile = useCallback(
        <Path extends NestedKey<FileState>>(
            path: Path,
            value: NestedValue<FileState, Path>,
        ) => {
            dispatch(updateFileState({ path, value }));
        },
        [],
    );

    return { ...file, setFile };
};

export default useFile;
