import { useFolderAutoScroll } from "~/shared/hooks/useFolderAutoScroll";
import BreadcrumbUI from "~/shared/breadcrumb/BreadcrumbUI";
import { useGetBreadcrumbsQuery } from "~/redux/api/media";
import { useEffect, useRef } from "@wordpress/element";
import useSettings from "~/hooks/useSettings";
import useMedia from "../hooks/useMedia";
import { Folder } from "~/types/folder";

const MAX_VISIBLE = 4;

const Breadcrumb = () => {
    const locationId = new URLSearchParams( window?.location?.search ?? "" ).get( "folder" );
    const { data: dashboardData } = useSettings();
    const {
        setMedia,
        activeFolder,
        folders,
        loading: foldersLoading,
    } = useMedia();

    const isInitialLoad = useRef(true);

    const folderId = locationId || activeFolder?.id || "root";

    const { data, isLoading, isFetching } = useGetBreadcrumbsQuery(
        { id: folderId },
        { skip: !folderId },
    );

    const { scrollToFolder } = useFolderAutoScroll();

    const breadcrumbs = data?.data?.breadcrumbs ?? [];

    const childrenToShow = activeFolder?.id
        ? folders[activeFolder.id] ?? []
        : folders["root"] ?? [];

    useEffect(() => {
        if (!locationId || !breadcrumbs?.length) return;

        if (!isInitialLoad.current) return;

        isInitialLoad.current = false;

        const folderIds = breadcrumbs?.map((b) => String(b?.id)) ?? [];

        setMedia("expandedFolderIds", folderIds);
    }, [data, locationId]);

    useEffect(() => {
        const wpFilter = document.querySelector(".wp-filter") as HTMLElement;

        if (wpFilter) {
            wpFilter.style.margin = "12px 0 7px";
        }
    }, []);

    const handleUrlChange = () => {
        try {
            const url = new URL(window.location.href);

            if (url.searchParams.has("folder")) {
                url.searchParams.delete("folder");
                window.history.replaceState(null, "", url.toString());
            }
        } catch (e) {}
    };

    const handleNavigate = (id: string | number) => {
        const folder = breadcrumbs?.find((b) => String(b?.id) === String(id));

        if (!folder) return;

        handleUrlChange();

        const currentFolder = Object.values(folders)
            .flat()
            .find((f) => String(f?.id) === String(folder?.id));

        setMedia("activeFolder", currentFolder ?? (folder as Folder) ?? null);

        window.pnpnmMedia?.initFilter([
            currentFolder ?? (folder as Folder) ?? null,
        ]);
        window.pnpnmMedia
            ?.getFrame()
            ?.find("#pnpnm-media-folder-filter")
            ?.val(String(folder?.id))
            ?.trigger("change");

        scrollToFolder(String(folder?.id));
    };

    const handleChildClick = async (child: {
        id: string | number;
        name: string;
        [key: string]: any;
    }) => {
        handleUrlChange();
        setMedia("menu", "folder");
        setMedia("activeFolder", child as any);

        window.pnpnmMedia?.initFilter([child]);
        window.pnpnmMedia
            ?.getFrame()
            ?.find("#pnpnm-media-folder-filter")
            ?.val(String(child?.id))
            ?.trigger("change");

        setMedia("expandedFolderIds", [
            ...breadcrumbs.map((b) => String(b.id)),
            String(child?.id),
        ]);
    };

    const handleHomeClick = () => {
        handleUrlChange();

        setMedia("menu", "all");
        setMedia("activeFolder", null);

        window.pnpnmMedia?.initFilter([]);
        window.pnpnmMedia
            ?.getFrame()
            ?.find("#pnpnm-media-folder-filter")
            ?.val("all")
            ?.trigger("change");
    };

    const showBreadcrumbs =
        dashboardData?.display?.settings?.breadcrumbNavigation ??
        pnpnm?.settings?.display?.settings?.breadcrumbNavigation ??
        false;
    const showEllipsis = breadcrumbs?.length > MAX_VISIBLE + 1;
    const visible = showEllipsis
        ? [breadcrumbs[0], null, ...breadcrumbs?.slice(-MAX_VISIBLE)]
        : breadcrumbs;
    const hidden = showEllipsis ? breadcrumbs?.slice(1, -MAX_VISIBLE) : [];
    const prev = breadcrumbs?.[breadcrumbs?.length - 2]?.id ?? null;
    const prevFolder = Object.values(folders)
        .flat()
        .find((f) => String(f.id) === String(prev));
    const loading = foldersLoading || isLoading || isFetching;

    if (!showBreadcrumbs) return null;

    return (
        <BreadcrumbUI
            variant="media"
            visible={visible}
            hidden={hidden}
            childrenToShow={childrenToShow}
            prevFolder={prevFolder}
            onHomeClick={handleHomeClick}
            handleNavigate={handleNavigate}
            handleChildClick={handleChildClick}
            loading={loading}
        />
    );
};

export default Breadcrumb;
