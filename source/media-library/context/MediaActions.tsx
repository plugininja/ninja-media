import { ButtonStatusProps } from "~/components/button/Button.type";
import { CustomAlertProvider } from "~/components/alert/Alert";
import { createRoot } from "@wordpress/element";
import { useEffect } from "@wordpress/element";
import Button from "~/components/button";
import { Provider } from "react-redux";
import { store } from "~/redux/store";

const ActionButtons = ({ attachmentId }: { attachmentId: number }) => {

    const ACTIONS: {
        key: "replace" | "duplicate" | "apply" | "remove";
        title: string;
        actionTitle: string;
        icon: string;
        statusProps?: ButtonStatusProps;
        enabled?: boolean;
        loading?: boolean;
    }[] = [
        {
            key: "replace",
            title: "Replace media:",
            actionTitle: "Replace",
            icon: "update",
            statusProps: {
                default: true,
                isPro: true,
            },
            enabled: pnpnm?.settings?.general?.files?.replaceMedia ?? false,
            loading: replaceLoading,
        },
        {
            key: "duplicate",
            title: "Duplicate media:",
            actionTitle: "Duplicate",
            icon: "perm_media",
            statusProps: {
                default: true,
                isPro: true,
            },
            enabled: pnpnm?.settings?.general?.files?.duplicateMedia ?? false,
            loading: false,
        },
        {
            key: "apply",
            title: "Apply watermark:",
            actionTitle: "Apply",
            icon: "water",
            statusProps: {
                default: true,
                isPro: true,
            },
            enabled: pnpnm?.settings?.watermark?.enabled ?? false,
            loading: false,
        },
        {
            key: "remove",
            title: "Remove watermark:",
            actionTitle: "Remove",
            icon: "block",
            statusProps: {
                default: true,
                isPro: true,
            },
            enabled: pnpnm?.settings?.watermark?.enabled ?? false,
            loading: false,
        },
    ];

    return (
        <table
            style={{
                width: "100%",
                tableLayout: "fixed",
            }}
        >
            <tbody
                style={{
                    display: "table-row-group",
                    verticalAlign: "middle",
                }}
            >
                {ACTIONS?.map(
                    (
                        {
                            key,
                            title,
                            actionTitle,
                            icon,
                            statusProps,
                            enabled,
                            loading,
                        },
                        index,
                    ) => {
                        if (!enabled) return null;

                        return (
                            <tr
                                key={key ?? index}
                                style={{
                                    display: "block",
                                    verticalAlign: "middle",
                                }}
                            >
                                <th
                                    style={{
                                        minWidth: "30%",
                                        marginRight: "4%",
                                        float: "left",
                                        marginTop: "7px",
                                        textAlign: "right",
                                        display: "block",
                                        color: "#646970",
                                        fontSize: "12px",
                                        fontWeight: "400",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {title}
                                </th>

                                <td
                                    style={{
                                        float: "right",
                                        width: "65%",
                                    }}
                                >
                                    <Button
                                        variant="primary"
                                        size="extrasmall"
                                        startIcon={icon}
                                        statusProps={statusProps}
                                        loading={loading}
                                        onClick={() => {
                                        }}
                                    >
                                        {actionTitle}
                                    </Button>
                                </td>
                            </tr>
                        );
                    },
                )}
            </tbody>
        </table>
    );
};

const injectActionsButton = (details: Element) => {
    if (details.querySelector(".pnpnm-media-actions")) return;

    const attachmentId = window.location.search.match(/[?&]item=(\d+)/)?.[1];
    if (!attachmentId) return;

    const container = details.querySelector(".compat-item");
    if (!container) return;

    const wrapper = document.createElement("div");
    wrapper.className = "pnpnm-media-actions pnpnm-top-level-wrapper";
    container.appendChild(wrapper);

    createRoot(wrapper).render(
        <Provider store={store}>
            <CustomAlertProvider>
                <ActionButtons attachmentId={Number(attachmentId)} />
            </CustomAlertProvider>
        </Provider>,
    );
};

const MediaActions = () => {
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof Element)) continue;

                    if (node.classList.contains("attachment-details")) {
                        requestAnimationFrame(() => injectActionsButton(node));
                        continue;
                    }

                    const details = node.querySelector(".attachment-details");

                    if (details) {
                        requestAnimationFrame(() =>
                            injectActionsButton(details),
                        );
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, []);

    return null;
};

export default MediaActions;
