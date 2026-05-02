import { FOLDER_OPTIONS } from "~/media-library/components/topbar/Sorting";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { selectSettings } from "~/redux/features/settings";
import { useNavigate, useParams } from "react-router-dom";
import useFileActions from "~/hooks/useFileActions";
import InlineStack from "~/components/inlineStack";
import SelectBox from "~/components/selectBox";
import Checkbox from "~/components/checkbox";
import { useDeleteFile } from "./Delete";
import Button from "~/components/button";
import Text from "~/components/text";
import {
    selectFiles,
    setBulkSelect,
    setLoadingType,
    setQuery,
    setSelectedFiles,
    setView,
} from "~/redux/features/files";

const Header = () => {
    const { data } = useAppSelector(selectSettings);
    const { view, loadingType, files, selectedFiles, query, bulkSelect } =
        useAppSelector(selectFiles);

    const { menuKey, dynamicKey } = useParams();

    const { trashFile, restoreFile } = useFileActions();

    const { openDeleteFile } = useDeleteFile();

    const navigate = useNavigate();

    const dispatch = useAppDispatch();

    const isAllSelected = selectedFiles?.length === files?.length;

    const handleBulkSelect = () => {
        if (bulkSelect) {
            dispatch(setSelectedFiles([]));
        }
        dispatch(setBulkSelect(!bulkSelect));
    };

    const handleAllSelect = () => {
        if (selectedFiles?.length === files?.length) {
            dispatch(setSelectedFiles([]));
        } else {
            dispatch(setSelectedFiles(files));
        }
    };

    const handleReSelect = () => {
        navigate(`/files/dynamic`);
    };

    const handleView = () => {
        dispatch(setView(view === "grid" ? "list" : "grid"));
    };

    const handleLoadingType = () => {
        dispatch(
            setLoadingType(
                loadingType === "infinite" ? "pagination" : "infinite",
            ),
        );
        if (loadingType === "infinite") {
            dispatch(setQuery({ page: 1 }));
        }
    };

    const handleQuery = (q: Partial<typeof query>) => {
        dispatch(setQuery(q));
    };

    const handleTrash = () => {
        const ids = selectedFiles?.map((f) => f?.id) ?? [];

        trashFile(ids);
    };

    const handleRestore = () => {
        const ids = selectedFiles?.map((f) => f?.id) ?? [];

        restoreFile(ids);
    };

    const handleDelete = () => {
        const ids = selectedFiles?.map((f) => f?.id) ?? [];

        openDeleteFile(ids);
    };

    const enableTrash = data?.general?.files?.moveToTrash ?? false;

    const showTrash =
        selectedFiles?.length > 0 &&
        enableTrash &&
        menuKey !== "trash" &&
        (menuKey !== "dynamic" || dynamicKey);

    const showRestore = menuKey === "trash" && selectedFiles?.length > 0;

    const showDelete =
        selectedFiles?.length > 0 &&
        (menuKey === "trash" ? true : !enableTrash) &&
        (menuKey !== "dynamic" || dynamicKey);

    return (
        <InlineStack align="between" gap={10}>
            <InlineStack gap={10}>
                <SelectBox
                    prefix={<Text size="sm">Sort by:</Text>}
                    options={FOLDER_OPTIONS}
                    value={[query?.orderBy]}
                    onChange={(value) =>
                        handleQuery({
                            orderBy: value[0] as typeof query.orderBy,
                        })
                    }
                />

                <Button
                    variant="outlined"
                    startIcon={
                        query?.order === "ASC"
                            ? "arrow_upward"
                            : "arrow_downward"
                    }
                    onClick={() =>
                        handleQuery({
                            order: query?.order === "ASC" ? "DESC" : "ASC",
                        })
                    }
                >
                    {query?.order === "ASC" ? "Ascending" : "Descending"}
                </Button>

                <Button
                    variant="outlined"
                    startIcon={
                        loadingType === "infinite"
                            ? "page_control"
                            : "arrow_circle_down"
                    }
                    onClick={handleLoadingType}
                >
                    {loadingType === "infinite"
                        ? "Pagination"
                        : "Infinite Scroll"}
                </Button>

                {showTrash && (
                    <Button
                        variant="error"
                        startIcon="recycling"
                        onClick={handleTrash}
                    >
                        Trash
                    </Button>
                )}

                {showRestore && (
                    <Button
                        variant="primary"
                        startIcon="restore"
                        onClick={handleRestore}
                    >
                        Restore
                    </Button>
                )}

                {showDelete && (
                    <Button
                        variant="error"
                        startIcon="delete"
                        onClick={handleDelete}
                    >
                        Delete
                    </Button>
                )}

                {menuKey === "dynamic" && dynamicKey && (
                    <Button
                        variant="primary"
                        startIcon="left_click"
                        onClick={handleReSelect}
                    >
                        Re Select
                    </Button>
                )}
            </InlineStack>

            <InlineStack gap={10}>
                {bulkSelect && (
                    <Button variant="outlined" onClick={handleAllSelect}>
                        <Checkbox
                            size="small"
                            rounded="sm"
                            style={{
                                marginRight: 4,
                            }}
                            checked={isAllSelected}
                            onChange={handleAllSelect}
                        />

                        {isAllSelected ? "Deselect All" : "Select All"}
                    </Button>
                )}

                <Button variant="outlined" onClick={handleBulkSelect}>
                    <Checkbox
                        size="small"
                        rounded="sm"
                        style={{
                            marginRight: 4,
                        }}
                        checked={bulkSelect}
                        onChange={handleBulkSelect}
                    />

                    {bulkSelect
                        ? `Selected ${selectedFiles?.length}`
                        : "Bulk Select"}
                </Button>

                <Button
                    variant="outlined"
                    startIcon={view === "grid" ? "dehaze" : "grid_view"}
                    onClick={handleView}
                >
                    {view === "grid" ? "List view" : "Grid view"}
                </Button>
            </InlineStack>
        </InlineStack>
    );
};

export default Header;
