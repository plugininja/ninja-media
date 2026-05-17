import { selectMedia, updateMedia } from "~/redux/features/media/media";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { NestedKey, NestedValue } from "~/utils/types";
import { MediaState } from "~/types/media/states";
import { useCallback } from "@wordpress/element";

const useMedia = () => {
    const media = useAppSelector(selectMedia);

    const dispatch = useAppDispatch();

    const setMedia = useCallback(
        <Path extends NestedKey<MediaState>>(
            path: Path,
            value: NestedValue<MediaState, Path>,
        ) => {
            dispatch(updateMedia({ path, value }));
        },
        [],
    );

    return { ...media, setMedia };
};

export default useMedia;
