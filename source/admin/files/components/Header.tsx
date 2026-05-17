import { useNavigate, useParams } from "react-router-dom";
import { FOLDER_OPTIONS } from "~/shared/topbar/Sorting";
import { setQuery } from "~/redux/features/file/file";
import useFileActions from "../hooks/useFileActions";
import InlineStack from "~/components/inlineStack";
import { useAppDispatch } from "~/redux/hooks";
import SelectBox from "~/components/selectBox";
import { __, sprintf } from "@wordpress/i18n";
import useSettings from "~/hooks/useSettings";
import Checkbox from "~/components/checkbox";
import { useDeleteFile } from "./Delete";
import Button from "~/components/button";
import useFile from "../hooks/useFile";
import Text from "~/components/text";

const Header = () => {
    const { data } = useSettings();
    const {
        setFile,
        view,
        loadingType,
        files,
        selectedFiles,
        query,
        bulkSelect,
    } = useFile();

    const { menuKey, dynamicKey } = useParams();

    const {
        restoreFile,
    } = useFileActions();

    const { openDeleteFile } = useDeleteFile();

    const navigate = useNavigate();

    const dispatch = useAppDispatch();

    const isAllSelected = selectedFiles?.length === files?.length;

    const handleBulkSelect = () => {
        if (bulkSelect) {
            setFile("selectedFiles", []);
        }
        setFile("bulkSelect", !bulkSelect);
    };

    const handleAllSelect = () => {
        if (selectedFiles?.length === files?.length) {
            setFile("selectedFiles", []);
        } else {
            setFile("selectedFiles", files);
        }
    };

    const handleReSelect = () => {
        navigate(`/files/dynamic`);
    };

    const handleView = () => {
        setFile("view", view === "grid" ? "list" : "grid");
    };

    const handleLoadingType = () => {
        setFile(
            "loadingType",
            loadingType === "infinite" ? "pagination" : "infinite",
        );

        if (loadingType === "infinite") {
            dispatch(setQuery({ page: 1 }));
        }
    };

    const handleQuery = (q: Partial<typeof query>) => {
        dispatch(setQuery(q));
    };

    const handleTrash = () => {
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
                    prefix={
                        <Text size="sm">{__("Sort by:", "ninja-media")}</Text>
                    }
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
                    {query?.order === "ASC"
                        ? __("Ascending", "ninja-media")
                        : __("Descending", "ninja-media")}
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
                        ? __("Pagination", "ninja-media")
                        : __("Infinite Scroll", "ninja-media")}
                </Button>

                {showTrash && (
                    <Button
                        variant="error"
                        startIcon="recycling"
                        onClick={handleTrash}
                    >
                        {__("Trash", "ninja-media")}
                    </Button>
                )}

                {showRestore && (
                    <Button
                        variant="primary"
                        startIcon="restore"
                        onClick={handleRestore}
                    >
                        {__("Restore", "ninja-media")}
                    </Button>
                )}

                {showDelete && (
                    <Button
                        variant="error"
                        startIcon="delete"
                        onClick={handleDelete}
                    >
                        {__("Delete", "ninja-media")}
                    </Button>
                )}

                {menuKey === "dynamic" && dynamicKey && (
                    <Button
                        variant="primary"
                        startIcon="left_click"
                        onClick={handleReSelect}
                    >
                        {__("Re Select", "ninja-media")}
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

                        {isAllSelected
                            ? __("Deselect All", "ninja-media")
                            : __("Select All", "ninja-media")}
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
                        ? sprintf(
                              __("Selected %d", "ninja-media"),
                              selectedFiles?.length,
                          )
                        : __("Bulk Select", "ninja-media")}
                </Button>

                <Button
                    variant="outlined"
                    startIcon={view === "grid" ? "dehaze" : "grid_view"}
                    onClick={handleView}
                >
                    {view === "grid"
                        ? __("List view", "ninja-media")
                        : __("Grid view", "ninja-media")}
                </Button>
            </InlineStack>
        </InlineStack>
    );
};

export default Header;
