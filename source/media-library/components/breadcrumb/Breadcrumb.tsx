import { useFolderAutoScroll } from "~/hooks/useFolderAutoScroll";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { useGetBreadcrumbsQuery } from "~/redux/api/media";
import { selectSettings } from "~/redux/features/settings";
import { useEffect, useRef } from "@wordpress/element";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import Dropdown from "~/components/dropdown";
import Button from "~/components/button";
import { Folder } from "~/types/media";
import Icon from "~/components/icon";
import Text from "~/components/text";
import Card from "~/components/card";
import {
    selectMedia,
    setActiveFolder,
    setExpandedFolderIds,
    setMenu,
} from "~/redux/features/media";

const MAX_VISIBLE = 4;

const Breadcrumb = () => {
    const locationId = window?.location?.search.split("folder=")?.[1];
    const { data: dashboardData } = useAppSelector(selectSettings);
    const { activeFolder, folders } = useAppSelector(selectMedia);
    const isInitialLoad = useRef(true);

    const folderId = locationId || activeFolder?.id || "root";

    const { data } = useGetBreadcrumbsQuery(
        { id: folderId },
        { skip: !folderId },
    );

    const dispatch = useAppDispatch();

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

        dispatch(setExpandedFolderIds(folderIds));
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

        dispatch(setActiveFolder(currentFolder ?? (folder as Folder) ?? null));

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
        dispatch(setActiveFolder(child as any));

        window.pnpnmMedia?.initFilter([child]);
        window.pnpnmMedia
            ?.getFrame()
            ?.find("#pnpnm-media-folder-filter")
            ?.val(String(child?.id))
            ?.trigger("change");

        dispatch(
            setExpandedFolderIds([
                ...breadcrumbs.map((b) => String(b.id)),
                String(child?.id),
            ]),
        );
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

    if (!showBreadcrumbs) return null;

    return (
        <BlockStack
            gap={10}
            margin="0 0 12px"
            padding={pnpnm?.pagenow === "upload.php" ? "0" : "0 16px"}
        >
            <InlineStack
                padding="0px 10px"
                gap={5}
                wrap={false}
                className="pnpnm-breadcrumb"
            >
                <Icon
                    name="home"
                    color="primary"
                    fontSize="lg"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                        handleUrlChange();
                        dispatch(setMenu("all"));
                        dispatch(setActiveFolder(null));
                        window.pnpnmMedia?.initFilter([]);
                        window.pnpnmMedia
                            ?.getFrame()
                            ?.find("#pnpnm-media-folder-filter")
                            ?.val("all")
                            ?.trigger("change");
                    }}
                />

                {visible?.map((crumb, index) =>
                    crumb === null ? (
                        <InlineStack key={index} gap={5}>
                            <Icon
                                name="keyboard_arrow_right"
                                color="secondaryblack"
                                fontSize="lg"
                            />

                            <Card
                                padding={5}
                                rounded="sm"
                                flex
                                align="center"
                                blockAlign="center"
                                style={{
                                    width: "30px",
                                    height: "28px",
                                    cursor: "default",
                                }}
                            >
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <Icon
                                            name="more_horiz"
                                            color="secondaryblack"
                                            fontSize="lg"
                                        />
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        {hidden?.map((h) => (
                                            <Dropdown.MenuItem
                                                key={h?.id}
                                                title={h?.id as string}
                                                isActive
                                                onClick={() =>
                                                    handleNavigate(h?.id)
                                                }
                                            >
                                                {h?.name}
                                            </Dropdown.MenuItem>
                                        ))}
                                    </Dropdown.Content>
                                </Dropdown>
                            </Card>
                        </InlineStack>
                    ) : (
                        <InlineStack
                            key={crumb?.id}
                            gap={5}
                            title={crumb?.id as string}
                        >
                            <Icon
                                name="keyboard_arrow_right"
                                color="secondaryblack"
                                fontSize="lg"
                            />

                            <Text
                                color="primary"
                                size="sm"
                                style={{
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                }}
                                onClick={() => handleNavigate(crumb?.id)}
                            >
                                {crumb?.name}
                            </Text>
                        </InlineStack>
                    ),
                )}
            </InlineStack>

            <InlineStack padding={5} gap={5} className="pnpnm-breadcrumb">
                {childrenToShow?.length > 0 &&
                    childrenToShow?.map((child) => (
                        <Button
                            key={child?.id}
                            title={child?.id as string}
                            variant="outlined"
                            size="supersmall"
                            rounded="xs"
                            onClick={() => handleChildClick(child)}
                        >
                            {child?.name}
                        </Button>
                    ))}

                {prevFolder && (
                    <Button
                        key={prevFolder?.id}
                        title={prevFolder?.id as string}
                        variant="outlined"
                        size="supersmall"
                        rounded="xs"
                        onClick={() => handleNavigate(prevFolder?.id)}
                    >
                        Back
                    </Button>
                )}
            </InlineStack>
        </BlockStack>
    );
};

export default Breadcrumb;
