import { useEffect, useState, useRef, useCallback } from "@wordpress/element";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import { useDragContext } from "./DragContext";
import Card from "~/components/card";
import Icon from "~/components/icon";
import Text from "~/components/text";

type WpAttachment = {
    id: number;
    url: string;
    filename: string;
    filesizeInBytes: number;
    width?: number;
    height?: number;
    mime: string;
    date: string;
    [key: string]: any;
};

type TooltipState = {
    attachment: WpAttachment | null;
    x: number;
    y: number;
};

const AttachmentTooltip = () => {
    const [tooltip, setTooltip] = useState<TooltipState>({
        attachment: null,
        x: 0,
        y: 0,
    });
    const [position, setPosition] = useState<{
        top: number;
        left: number;
    } | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const $ = (window as any).jQuery as any;

    const { isDragging } = useDragContext();

    const calculatePosition = useCallback((x: number, y: number) => {
        const el = tooltipRef.current;
        if (!el) return null;

        const { width, height } = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const left = x + 16 + width > vw ? x - width - 8 : x + 16;
        const top = y + 16 + height > vh ? y - height - 16 : y + 16;

        return { top, left };
    }, []);

    useEffect(() => {
        const handleMouseEnter = (e: MouseEvent) => {
            const target = e.currentTarget as HTMLElement;
            const idAttr = target.getAttribute("data-id");

            if (!idAttr || !window.wp?.media) return;

            timerRef.current = setTimeout(() => {
                const att = window.wp.media
                    .attachment(Number(idAttr))
                    .toJSON() as WpAttachment;

                setTooltip({
                    attachment: att,
                    x: lastMousePos.current.x,
                    y: lastMousePos.current.y,
                });
            }, 600);
        };

        const handleMouseMove = (e: MouseEvent) => {
            lastMousePos.current = { x: e.clientX, y: e.clientY };

            setTooltip((prev) => {
                if (!prev.attachment) return prev;
                return { ...prev, x: e.clientX, y: e.clientY };
            });
        };

        const handleMouseLeave = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setTooltip({ attachment: null, x: 0, y: 0 });
        };

        $(document).on(
            "mouseenter",
            ".attachments-wrapper .attachment",
            handleMouseEnter,
        );
        $(document).on(
            "mousemove",
            ".attachments-wrapper .attachment",
            handleMouseMove,
        );
        $(document).on(
            "mouseleave",
            ".attachments-wrapper .attachment",
            handleMouseLeave,
        );

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            $(document).off(
                "mouseenter",
                ".attachments-wrapper .attachment",
                handleMouseEnter,
            );
            $(document).off(
                "mousemove",
                ".attachments-wrapper .attachment",
                handleMouseMove,
            );
            $(document).off(
                "mouseleave",
                ".attachments-wrapper .attachment",
                handleMouseLeave,
            );
        };
    }, []);

    useEffect(() => {
        if (!tooltip.attachment) {
            setPosition(null);
            return;
        }

        requestAnimationFrame(() => {
            const pos = calculatePosition(tooltip.x, tooltip.y);
            if (pos) setPosition(pos);
        });
    }, [tooltip.attachment]);

    useEffect(() => {
        if (!tooltip.attachment) return;

        const pos = calculatePosition(tooltip.x, tooltip.y);

        if (pos) setPosition(pos);
    }, [tooltip.x, tooltip.y]);

    if (!tooltip.attachment || isDragging) return null;

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const { attachment } = tooltip;

    const { filesizeInBytes, width, height, date, subtype } =
        attachment as WpAttachment;

    const INFO_FIELDS = [
        { title: "Type:", icon: "description", value: subtype },
        {
            title: "Size:",
            icon: "database",
            value: formatSize(filesizeInBytes),
        },
        {
            title: "Location:",
            icon: "folder_eye",
            value: "Folder",
        },
        {
            title: "Dimensions:",
            icon: "aspect_ratio",
            value: width && height ? `${width}×${height}` : "—",
        },
        {
            title: "Uploaded:",
            icon: "schedule",
            value: new Date(date).toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            }),
        },
    ];

    return (
        <div
            ref={tooltipRef}
            style={{
                position: "fixed",
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                zIndex: 99999,
                padding: "15px",
                pointerEvents: "none",
                visibility: position ? "visible" : "hidden",
            }}
            className="pnpnm-attachment-tooltip"
        >
            <BlockStack gap={10}>
                {INFO_FIELDS?.map(({ title, icon, value }, index) => (
                    <InlineStack key={index} gap={10} wrap={false}>
                        <InlineStack
                            gap={7}
                            wrap={false}
                            style={{
                                width: "105px",
                            }}
                        >
                            <Card
                                padding={3}
                                background="extralight"
                                rounded="sm"
                                flex
                                align="center"
                                blockAlign="center"
                                style={{
                                    width: "25px",
                                    height: "25px",
                                }}
                            >
                                <Icon name={icon} />
                            </Card>

                            <Text size="xs">{title}</Text>
                        </InlineStack>

                        <Text
                            size="xs"
                            className="pnpnm-attachment-tooltip__value"
                        >
                            {value}
                        </Text>
                    </InlineStack>
                ))}
            </BlockStack>
        </div>
    );
};

export default AttachmentTooltip;
