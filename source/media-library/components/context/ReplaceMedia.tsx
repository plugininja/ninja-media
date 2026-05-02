import { CustomAlertProvider, useCustomAlert } from "~/components/alert/Alert";
import { useReplaceMediaMutation } from "~/redux/api/media";
import { useState, useEffect } from "@wordpress/element";
import InlineStack from "~/components/inlineStack";
import { createRoot } from "@wordpress/element";
import Button from "~/components/button";
import { Provider } from "react-redux";
import { store } from "~/redux/store";

const addCacheBuster = (url: string, timestamp: number): string => {
    try {
        const u = new URL(url);
        u.searchParams.set("_cb", String(timestamp));
        return u.toString();
    } catch {
        return url;
    }
};

const ReplaceButton = ({ attachmentId }: { attachmentId: number }) => {
    const [loading, setLoading] = useState(false);
    const [replaceMedia] = useReplaceMediaMutation();
    const { showAlert } = useCustomAlert();

    const handleClick = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.style.display = "none";
        input.accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx";
        document.body.appendChild(input);

        input.addEventListener("change", async () => {
            const file = input.files?.[0];
            input.remove();
            if (!file) return;

            setLoading(true);

            try {
                const formData = new FormData();
                formData.append("file", file);

                const result = await replaceMedia({
                    id: attachmentId,
                    formData,
                }).unwrap();

                refreshAttachmentPreview(attachmentId, result.data);

                showAlert({
                    toast: true,
                    type: "success",
                    text: result.message || "Media replaced successfully.",
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                });
            } catch (error: any) {
                showAlert({
                    toast: true,
                    type: "error",
                    text:
                        error?.data?.message ||
                        "Failed to replace media. Please try again.",
                    timer: 4000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                });
            } finally {
                setLoading(false);
            }
        });

        input.click();
    };

    return (
        <InlineStack gap={29} wrap={false}>
            <span
                style={{
                    color: "#646970",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                }}
            >
                Replace media:
            </span>

            <Button
                variant="primary"
                size="small"
                startIcon="update"
                loading={loading}
                onClick={handleClick}
            >
                Replace
            </Button>
        </InlineStack>
    );
};

function refreshAttachmentPreview(
    attachmentId: number,
    freshData: Record<string, unknown>,
): void {
    const wpMedia = (window as any).wp?.media;
    if (!wpMedia) return;

    const attachment = wpMedia.attachment(attachmentId);
    if (!attachment) return;

    const ts = Date.now();

    const patch: Record<string, unknown> = {};

    if (typeof freshData.url === "string") {
        patch.url = addCacheBuster(freshData.url, ts);
    }

    if (freshData.sizes && typeof freshData.sizes === "object") {
        const bustedSizes: Record<string, unknown> = {};
        for (const [key, sizeData] of Object.entries(
            freshData.sizes as Record<
                string,
                { url: string; [k: string]: unknown }
            >,
        )) {
            bustedSizes[key] = {
                ...sizeData,
                url:
                    typeof sizeData.url === "string"
                        ? addCacheBuster(sizeData.url, ts)
                        : sizeData.url,
            };
        }
        patch.sizes = bustedSizes;
    }

    if (Object.keys(patch).length > 0) {
        attachment.unset("url", { silent: true });
        attachment.unset("sizes", { silent: true });
        attachment.set(patch);
    }

    document
        .querySelectorAll<HTMLImageElement>(
            ".attachment-details img, .attachment-preview img",
        )
        .forEach((img) => {
            if (!img.src) return;
            const clean = img.src
                .replace(/([?&])_cb=[^&]*/g, "$1")
                .replace(/[?&]$/, "");
            img.src = addCacheBuster(clean, ts);
        });

    attachment.fetch();
}

const injectReplaceButton = (details: Element) => {
    if (details.querySelector(".pnpnm-replace-content")) return;

    const attachmentId = window.location.search.match(/[?&]item=(\d+)/)?.[1];
    if (!attachmentId) return;

    const settings = details.querySelector(".settings");
    if (!settings) return;

    settings.className += " pnpnm-replace-wrapper";

    const wrapper = document.createElement("div");
    wrapper.className = "pnpnm-replace-content pnpnm-top-level-wrapper";
    settings.appendChild(wrapper);

    createRoot(wrapper).render(
        <Provider store={store}>
            <CustomAlertProvider>
                <ReplaceButton attachmentId={Number(attachmentId)} />
            </CustomAlertProvider>
        </Provider>,
    );
};

const ReplaceMedia = () => {
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof Element)) continue;

                    if (node.classList.contains("attachment-details")) {
                        requestAnimationFrame(() => injectReplaceButton(node));
                        continue;
                    }

                    const details = node.querySelector(".attachment-details");

                    if (details)
                        requestAnimationFrame(() =>
                            injectReplaceButton(details),
                        );
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, []);

    return null;
};

export default ReplaceMedia;
