import { FileQueryParams, useGetFilesQuery } from "~/redux/api/file";
import { useCallback, useEffect, useRef } from "@wordpress/element";
import { MenuProvider } from "~/components/contextMenu/ContextMenu";
import { appendFiles, setQuery } from "~/redux/features/file/file";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import SkeletonLoader from "~/components/skeletonLoader";
import { useDragSelect } from "../hooks/useDragSelect";
import useFileContext from "../hooks/useFileContext";
import InlineStack from "~/components/inlineStack";
import { PAGE_OPTIONS } from "~/constants/files";
import BlockStack from "~/components/blockStack";
import { File as FileType } from "~/types/file";
import { useAppDispatch } from "~/redux/hooks";
import NotFound from "~/assets/icons/NotFound";
import SelectBox from "~/components/selectBox";
import GridStack from "~/components/gridStack";
import { useParams } from "react-router-dom";
import FileContext from "./FileContext";
import useFile from "../hooks/useFile";
import Pagination from "./Pagination";
import Text from "~/components/text";
import FileLists from "./FileLists";
import File from "./File";

const FilesContainer = () => {
    const {
        setFile,
        view,
        loadingType,
        files,
        selectedFiles,
        query,
        hasMore,
        bulkSelect,
    } = useFile();

    const { menuKey, dynamicKey } = useParams();
    const isFirstLoad = useRef(true);

    const dispatch = useAppDispatch();

    const finalQuery = {
        ...query,
        type: menuKey,
        extension: dynamicKey,
    };

    useEffect(() => {
        if (isFirstLoad.current && loadingType === "pagination") {
            isFirstLoad.current = false;
            return;
        }

        dispatch(
            setQuery({
                page: 1,
                search: "",
            }),
        );
        setFile("selectedFiles", []);
    }, [menuKey, dynamicKey, loadingType]);

    const {
        data: fetchedFiles,
        isLoading,
        isFetching,
    } = useGetFilesQuery(finalQuery as FileQueryParams, {
        skip: !["all", "uncategorized"].includes(menuKey!) && !pnpnm?.isPro,
    });

    const handleFileContext = useFileContext();

    const containerRef = useRef<HTMLDivElement>(null);

    const {
        allFiles,
        uncategorized,
        dynamicFolders,
        favorites,
        used,
        unused,
        trash,
        files: responseFiles,
        page: currentPage,
        totalPages,
    } = fetchedFiles?.data || {};

    const isFirstPage = query.page === 1;
    const isInfinite = loadingType === "infinite";
    const isPagination = loadingType === "pagination";

    useEffect(() => {
        if (!responseFiles) return;

        if (isFirstPage || isPagination) {
            setFile("files", responseFiles);
        } else {
            dispatch(appendFiles(responseFiles));
        }

        const dynamicCount =
            dynamicKey && dynamicFolders
                ? dynamicFolders[dynamicKey] ?? 0
                : Object.keys(dynamicFolders ?? {}).length;

        setFile("count", {
            all: allFiles ?? 0,
            uncategorized: uncategorized ?? 0,
            dynamic: dynamicCount,
            favorites: favorites ?? 0,
            used: used ?? 0,
            unused: unused ?? 0,
            trash: trash ?? 0,
        });

        setFile("dynamicFolders", dynamicFolders ?? {});
        setFile("totalPages", totalPages ?? 1);
        setFile("hasMore", query?.page < (totalPages ?? 1));
    }, [fetchedFiles]);

    useEffect(() => {
        if (!isFetching) {
            setFile("loading", false);
        }
    }, [isFetching]);

    const handleLoadMore = useCallback(() => {
        dispatch(setQuery({ page: query.page + 1 }));
    }, [query.page]);

    const { sentinelRef } = useInfiniteScroll({
        hasMore,
        isFetching,
        onLoadMore: handleLoadMore,
        enabled: isInfinite,
    });

    const handleDragSelect = useCallback(
        (draggedFiles: FileType[]) => {
            const existingIds = new Set(selectedFiles.map((f) => String(f.id)));
            const merged = [
                ...selectedFiles,
                ...draggedFiles.filter((f) => !existingIds.has(String(f.id))),
            ];
            setFile("selectedFiles", merged);
        },
        [selectedFiles],
    );

    const { dragBox, handleMouseDown } = useDragSelect({
        containerRef,
        files,
        onSelect: handleDragSelect,
        isEnabled: bulkSelect,
    });

    const showInitialLoading =
        (isLoading || isFetching) && (isFirstPage || isPagination);
    const showLoadMoreSkeleton = isFetching && !isFirstPage && !isPagination;

    return (
        <MenuProvider>
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    marginTop: 20,
                    userSelect: "none",
                }}
                onMouseDown={handleMouseDown}
            >
                {view === "grid" ? (
                    <GridStack
                        gap={15}
                        columns="auto-fill"
                        min="180px"
                        className="flex-1"
                    >
                        {showInitialLoading ? (
                            <SkeletonLoader.SkeletonFile
                                length={query?.perPage}
                            />
                        ) : (
                            files?.map((file) => (
                                <File key={file?.id} file={file} />
                            ))
                        )}

                        {showLoadMoreSkeleton && (
                            <SkeletonLoader.SkeletonFile
                                length={query?.perPage}
                            />
                        )}
                    </GridStack>
                ) : (
                    <FileLists
                        loading={showInitialLoading}
                        loadMore={showLoadMoreSkeleton}
                    />
                )}

                {!isLoading && !isFetching && files.length === 0 && (
                    <BlockStack
                        align="center"
                        inlineAlign="center"
                        gap={10}
                        style={{
                            marginTop: "50px",
                        }}
                    >
                        <NotFound />

                        <Text size="xl" weight="semibold" align="center">
                            No media found
                        </Text>

                        <Text size="sm" align="center">
                            Try adjusting your search or filter or refreshing to
                            find what you're looking for.
                        </Text>
                    </BlockStack>
                )}

                {isInfinite && hasMore && (
                    <div
                        ref={sentinelRef}
                        style={{ height: "20px", marginTop: "-20px" }}
                    />
                )}

                <FileContext onMenuClick={handleFileContext} />

                {dragBox && (
                    <div
                        style={{
                            left: dragBox.x,
                            top: dragBox.y,
                            width: dragBox.width,
                            height: dragBox.height,
                        }}
                        className="pnpnm-drag-box"
                    />
                )}
            </div>

            {isPagination && !isLoading && files.length > 0 && (
                <BlockStack marginTop={20}>
                    <InlineStack gap={5} align="center">
                        <Pagination
                            currentPage={currentPage || 1}
                            totalPages={totalPages || 1}
                            onPageChange={(p) =>
                                dispatch(setQuery({ page: p }))
                            }
                        />

                        <SelectBox
                            placement="top"
                            options={PAGE_OPTIONS}
                            value={[query?.perPage?.toString() || "80"]}
                            onChange={(value) =>
                                dispatch(
                                    setQuery({ perPage: Number(value[0]) }),
                                )
                            }
                        />
                    </InlineStack>
                </BlockStack>
            )}
        </MenuProvider>
    );
};

export default FilesContainer;
