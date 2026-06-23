import { CustomAlertProvider } from "~/components/alert/Alert.tsx";
import Breadcrumb from "./breadcrumb/Breadcrumb.tsx";
import { createRoot } from "@wordpress/element";
import MainRoute from "~/routes/MainRoute.tsx";
import { store } from "~/redux/store.ts";
import { Provider } from "react-redux";
import App from "./App.tsx";

class PNPNMMedia {
    constructor() {
        this.$ = jQuery;
        this._pausedFilter = null;
        this._activeFolderId = null;
        this._roots = new Map();
    }

    ready() {
        this.initModule();
    }

    initModule() {
        if (
            pnpnm.pagenow === "upload.php" ||
            pnpnm.pagenow === "post.php" ||
            pnpnm.pagenow === "admin.php"
        ) {
            if (
                this.$('#posts-filter input[name="mode"][value="list"]')
                    .length &&
                this.$("#posts-filter .media").length
            ) {
                this.pageType = "upload-list";
            } else if (this.$("#wp-media-grid").length) {
                this.pageType = "upload-grid";
            }
        }

        if (
            this.$('.upload-php #posts-filter input[name="mode"][value="list"]')
                .length
        ) {
        } else {
            if (this.pageType !== "upload-list") {
                this.initFilter();
            }

            if (
                typeof wp !== "undefined" &&
                wp.media?.view?.AttachmentsBrowser
            ) {
                const $this = this;

                wp.media.view.AttachmentsBrowser.prototype.on(
                    "ready",
                    function () {
                        const frameState = this.controller?._state;
                        if (
                            frameState === "image-details" ||
                            frameState === "edit-image"
                        ) {
                            return;
                        }

                        $this.initTree();

                        if ($this.pageType !== "upload-list") {
                            $this.addAttachmentClass();
                        }

                        $this.initLoadMore(this.collection, this.$el);
                    },
                );
            }
        }

        let featuredImageController = wp?.media?.controller?.FeaturedImage;

        if (featuredImageController) {
            const $this = this;

            wp.media.controller.FeaturedImage = featuredImageController.extend({
                updateSelection: function () {
                    featuredImageController.prototype.updateSelection.apply(
                        this,
                        arguments,
                    );

                    $this.initTree();
                },
            });
        }

        let uploaderInlineView = wp?.media?.view?.UploaderInline;

        if (uploaderInlineView) {
            const $this = this;

            wp.media.view.UploaderInline = uploaderInlineView.extend({
                ready: function () {
                    uploaderInlineView.prototype.ready.apply(this, arguments);

                    $this.initTree();
                },
            });
        }

        if (this.pageType !== "upload-list") {
            this.onModalOpen();
            this.handleUploader();
            this.handleUploadStatus();
        }

        if (pnpnm?.isElementor || typeof window.elementor !== "undefined") {
            this.initElementorSupport();
        }
    }

    initElementorSupport() {
        const $this = this;

        const attachHooks = () => {
            if (wp?.media?.view?.AttachmentsBrowser) {
                wp.media.view.AttachmentsBrowser.prototype.on(
                    "ready",
                    function () {
                        $this.initTree();
                    },
                );
            }

            if (
                wp?.media?.view?.AttachmentFilters &&
                !wp.media.view.AttachmentFilters.pnpnm_media
            ) {
                $this.initFilter();
            }
        };

        if (typeof window.elementor !== "undefined" && window.elementor.on) {
            window.elementor.on("document:loaded", attachHooks);
        }

        attachHooks();
    }

    getFrame() {
        if (this.pageType === "upload-list") {
            return this.$(".upload-php #posts-filter");
        }

        const visibleModal = this.$(".media-modal:visible");

        return visibleModal.length
            ? visibleModal.find(".media-frame")
            : this.$(".upload-php .media-frame").first();
    }

    setFolderFilter(folderId) {
        this._activeFolderId = folderId || null;

        const applyFilter = (library) => {
            if (!library?.props) return false;
            try {
                // Non-silent set: this triggers the natural change → _requery chain,
                // which properly mirrors a new Query and resets the grid.
                if (folderId && folderId !== "all") {
                    library.props.set({ folderId: String(folderId), paged: 1 });
                } else {
                    library.props.unset("folderId");
                    library.props.set({ paged: 1 });
                }
                return true;
            } catch (e) {}
            return false;
        };

        // Primary: wp.media.frame.state().get('library') — same path WordPress uses internally
        try {
            const library = wp?.media?.frame?.state()?.get("library");
            if (applyFilter(library)) return;
        } catch (e) {}

        // Fallback 1: attachmentsBrowser.collection
        try {
            if (applyFilter(this.attachmentsBrowser?.collection)) return;
        } catch (e) {}

        // Fallback 2: .attachments-browser DOM element backboneView
        try {
            const $browser = this.getFrame()?.find(".attachments-browser");
            const view = $browser?.length ? $browser.data("backboneView") : null;
            if (applyFilter(view?.collection)) return;
        } catch (e) {}

        // Fallback 3: wp.media.frame content view collection
        try {
            const content = wp?.media?.frame?.content?.get();
            applyFilter(content?.collection);
        } catch (e) {}
    }

    filterByFolder(itemIds) {
        const frame = wp?.media?.frame;

        if (!frame) return;

        try {
            const content = frame.content.get();

            if (!content?.collection) return;

            if (itemIds === null) {
                content.collection.props.unset("post__in");
            } else {
                content.collection.props.set({
                    post__in: itemIds.length ? itemIds : [-1],
                });
            }
        } catch (e) {
            console.warn("pnpnm filterByFolder:", e);
        }
    }

    initTree(frame = this.getFrame()) {
        const $frame = this.$(frame);

        const isModalVisible = this.$(".media-modal:visible").length > 0;

        const isUploadView =
            this.pageType === "upload-list" || this.pageType === "upload-grid";

        const windowWidth = this.$(window).width();

        if (windowWidth <= 900) return;

        if (isUploadView && !isModalVisible) {
            if ($frame.hasClass("hide-menu") && windowWidth > 768) {
                $frame.addClass("pnpnm-tree-view").removeClass("hide-menu");
            }
        }

        if (!isUploadView || isModalVisible) {
            if ($frame.hasClass("hide-menu")) {
                const placeholderText = $frame
                    .find(".media-search-input-label")
                    .text();

                $frame
                    .find("#media-search-input")
                    .attr("placeholder", placeholderText);

                if (windowWidth > 768) {
                    $frame.addClass("pnpnm-tree-view").removeClass("hide-menu");
                }
            }
        }

        const treeExists =
            $frame.find(".media-frame-menu .pnpnm-media-tree-wrap").length > 0;

        if (treeExists) {
            if (
                !isUploadView &&
                wp.media.frame &&
                wp.media.frame._state === "gallery-edit"
            ) {
                const treeElement = this.getTreeElement(frame);
                if (treeElement.length) {
                    const domNode = treeElement[0];

                    if (this._roots.has(domNode)) {
                        this._roots.get(domNode).unmount();
                        this._roots.delete(domNode);
                    }
                    treeElement.remove();
                }
            } else {
                this.getTreeElement(frame).show();

                if (this._activeFolderId) {
                    this.setFolderFilter(this._activeFolderId);
                }
            }
            return;
        }

        if (isModalVisible || !isUploadView) {
            let menuContainer = $frame.find(".media-frame-menu .media-menu");

            if (!menuContainer.length) {
                menuContainer = $frame.find(".media-frame-menu");
                $frame.find(".media-frame-menu-heading").hide();
            }

            if (!menuContainer.find(".pnpnm-media-tree-wrap").length) {
                this.$(
                    '<div id="pnpnm-media-library-sidebar-wrapper" class="pnpnm-media-tree-wrap pnpnm-top-level-wrapper"></div>',
                ).appendTo(menuContainer);
            }
        } else {
            const insertBeforeElement =
                windowWidth < 600
                    ? this.$("ul.attachments")
                    : this.$("#wpbody-content");

            if (!this.$(".upload-php .pnpnm-media-tree-wrap").length) {
                this.$(
                    '<div id="pnpnm-media-library-sidebar-wrapper" class="pnpnm-media-tree-wrap pnpnm-top-level-wrapper"></div>',
                ).insertBefore(insertBeforeElement);
            }
        }

        const treeElement = this.getTreeElement(frame);

        if (treeElement.length) {
            const domNode = treeElement[0];

            if (this._roots.has(domNode)) {
                return;
            }

            const root = createRoot(domNode);

            this._roots.set(domNode, root);

            root.render(
                <Provider store={store}>
                    <CustomAlertProvider>
                        <MainRoute>
                            <App />
                        </MainRoute>
                    </CustomAlertProvider>
                </Provider>,
            );
        }

        this.$(
            '<div id="pnpnm-breadcrumb" class="pnpnm-top-level-wrapper"></div>',
        ).insertBefore(this.$("ul.attachments"));

        const $pnpnmBreadcrumb = this.$("#pnpnm-breadcrumb");

        if (treeElement.length) {
            const root = createRoot($pnpnmBreadcrumb[0]);

            root.render(
                <Provider store={store}>
                    <CustomAlertProvider>
                        <MainRoute>
                            <Breadcrumb />
                        </MainRoute>
                    </CustomAlertProvider>
                </Provider>,
            );
        }

        if (!$frame.find(".pnpnm-media-toggle-actions").length) {
            this.initActionsToggle($frame);
        }
    }

    getTreeElement(frame = this.getFrame()) {
        const isModalVisible = this.$(".media-modal:visible").length > 0;

        const isUploadView =
            this.pageType === "upload-grid" || this.pageType === "upload-list";

        if (isModalVisible || !isUploadView) {
            return frame.find(".pnpnm-media-tree-wrap").first();
        } else {
            return this.$(".upload-php .pnpnm-media-tree-wrap");
        }
    }

    initActionsToggle(frame = this.getFrame()) {
        const menuHeading = frame?.find(".media-frame-menu-heading");

        menuHeading?.append(
            '<i class="pnpnm-media-toggle-actions dashicons dashicons-arrow-down"></i>',
        );

        menuHeading?.on("click", () => {
            frame.find(".media-menu").toggleClass("show-actions");
        });
    }

    initFilter(folders = [], isRefresh = false) {
        if (wp?.media?.view?.AttachmentFilters) {
            wp.media.view.AttachmentFilters.pnpnm_media =
                wp.media.view.AttachmentFilters.extend({
                    className: "pnpnm-media-folder-filter",
                    id: "pnpnm-media-folder-filter",

                    createFilters() {
                        const defaultFilters = [
                            "uncategorized",
                            "dynamic",
                            "favorites",
                            "used",
                            "unused",
                            "trash",
                        ];

                        const filtersMap = {};
                        const perPage = pnpnm.perPage || 60;

                        filtersMap.all = {
                            text: wp.i18n.__("Media Library"),

                            props: {
                                folderId: null,
                                posts_per_page: perPage,
                                isRefresh: null,
                                timeStamp: null,
                            },
                        };

                        defaultFilters.forEach((key) => {
                            filtersMap[key] = {
                                text: wp.i18n.__(
                                    key
                                        .replace(/_/g, " ")
                                        .replace(/\b\w/g, (c) =>
                                            c.toUpperCase(),
                                        ),
                                ),

                                props: {
                                    folderId: key,
                                    posts_per_page: perPage,
                                },
                            };
                        });

                        folders.forEach((folder) => {
                            if (!folder?.id) return;

                            const key =
                                folder.type === "dynamic"
                                    ? `dynamic_${folder.id}`
                                    : String(folder.id);

                            const v = {
                                folderId: key,
                                posts_per_page: perPage,
                            };

                            if (isRefresh) {
                                v.isRefresh = true;
                                v.timeStamp = Date.now();
                            }

                            filtersMap[key] = {
                                text: folder.name,
                                props: v,
                            };
                        });

                        this.filters = filtersMap;
                    },
                });
        }

        const AttachmentsBrowser = wp?.media?.view?.AttachmentsBrowser;

        if (typeof AttachmentsBrowser !== "undefined") {
            const $this = this;

            wp.media.view.AttachmentsBrowser =
                wp.media.view.AttachmentsBrowser.extend({
                    createToolbar() {
                        this.$el.data("backboneView", this);

                        if (this.collection?.props) {
                            const propsToSet = { paged: 1 };
                            if (pnpnm.perPage) {
                                propsToSet.posts_per_page = pnpnm.perPage;
                            }
                            this.collection.props.set(propsToSet, { silent: true });
                        }

                        AttachmentsBrowser.prototype.createToolbar.apply(
                            this,
                            arguments,
                        );

                        $this.attachmentsBrowser = this;

                        this.toolbar.set(
                            "pnpnm-media-folder-filter",
                            new wp.media.view.AttachmentFilters.pnpnm_media({
                                controller: this.controller,
                                model: this.collection.props,
                                priority: -75,
                            }).render(),
                        );
                    },
                });

            if (this.attachmentsBrowser) {
                this.attachmentsBrowser.toolbar.set(
                    "pnpnm-media-folder-filter",
                    new wp.media.view.AttachmentFilters.pnpnm_media({
                        controller: this.attachmentsBrowser.controller,
                        model: this.attachmentsBrowser.collection.props,
                        priority: -75,
                    }).render(),
                );
            }
        }
    }

    addAttachmentClass() {}

    initLoadMore(collection, $container) {
        if (!collection || collection._pnpnmLoadMoreInit) return;
        collection._pnpnmLoadMoreInit = true;

        const $wrap = this.$(
            '<div class="pnpnm-load-more-wrap">' +
                '<button class="pnpnm-load-more-btn button">' +
                    wp.i18n.__("Load More", "ninja-media") +
                "</button>" +
                '<span class="pnpnm-load-more-spinner spinner"></span>' +
            "</div>",
        );

        $container.append($wrap);

        const $btn = $wrap.find(".pnpnm-load-more-btn");
        const $spinner = $wrap.find(".pnpnm-load-more-spinner");

        const setLoading = (loading) => {
            $btn.prop("disabled", loading);
            $spinner.toggleClass("is-active", loading);
        };

        const updateVisibility = () => {
            $container.toggleClass("pnpnm-has-more", !!collection.hasMore());
        };

        $btn.on("click", () => {
            setLoading(true);
            const promise = collection.more();
            if (promise && typeof promise.always === "function") {
                promise.always(() => {
                    setLoading(false);
                    updateVisibility();
                });
            } else {
                setLoading(false);
                updateVisibility();
            }
        });

        collection.on("reset", () => {
            setTimeout(updateVisibility, 0);
        });
        collection.on("add", updateVisibility);

        setTimeout(updateVisibility, 0);
    }

    onModalOpen() {
        const OriginalModal = wp?.media?.view?.Modal;

        if (typeof OriginalModal !== "undefined") {
            const $this = this;

            wp.media.view.Modal = OriginalModal.extend({
                open: function () {
                    OriginalModal.prototype.open.apply(this, arguments);

                    const frameState = this.controller?._state;
                    if (
                        frameState === "image-details" ||
                        frameState === "edit-image"
                    ) {
                        return;
                    }

                    setTimeout(() => $this.initTree(), 0);

                    const attachmentDetails = $this.$(".attachment-details");

                    const inputName = attachmentDetails
                        .find('input[name^="attachments["]')
                        .attr("name");

                    const attachmentIdMatch = inputName
                        ? inputName.match(/attachments\[(\d+)\]\[menu_order\]/)
                        : null;

                    const attachmentId = attachmentIdMatch
                        ? attachmentIdMatch[1]
                        : null;

                    if (
                        attachmentId &&
                        wp.media
                            .attachment(attachmentId)
                            .get("pnpnm_media_replace_id")
                    ) {
                        const thumbnail = attachmentDetails.find(".thumbnail");

                        thumbnail.addClass("pnpnm-media-replaced");

                        if (
                            thumbnail.find(".pnpnm-media-replaced-label")
                                .length === 0
                        ) {
                            const replacedLabel = `<span class="pnpnm-media-replaced-label dashicons dashicons-update-alt" title="${wp.i18n.__(
                                "Replaced with Dropbox",
                                "integrate-dropbox",
                            )}"></span>`;
                            thumbnail.append(replacedLabel);
                        }
                    }
                },
            });
        }
    }

    handleUploader() {
        if (typeof wp === "undefined" || !wp.Uploader) return;
        const $this = this;

        const origAdded = wp.Uploader.prototype.added;

        wp.Uploader.prototype.added = function (files) {
            if (typeof origAdded === "function")
                origAdded.apply(this, arguments);
            try {
                const content = wp.media?.frame?.content?.get();

                if (content?.collection?.props?.get("post__in")) {
                    $this._pausedFilter =
                        content.collection.props.get("post__in");
                    content.collection.props.unset("post__in");
                }
            } catch (e) {}
        };

        const origSuccess = wp.Uploader.prototype.success;

        wp.Uploader.prototype.success = function (attachment) {
            if (typeof origSuccess === "function")
                origSuccess.apply(this, arguments);

            const id = attachment?.get
                ? attachment.get("id")
                : attachment?.id ?? null;

            if (id) {
                document.dispatchEvent(
                    new CustomEvent("pnpnm:file-uploaded", {
                        detail: { id: Number(id) },
                    }),
                );
            }
        };
    }

    handleUploadStatus() {
        if (typeof wp === "undefined" || !wp.media?.view?.UploaderInline)
            return;
        const $this = this;

        const OrigInline = wp.media.view.UploaderInline;

        wp.media.view.UploaderInline = OrigInline.extend({
            ready() {
                OrigInline.prototype.ready.apply(this, arguments);
                $this.initTree();
            },

            success() {
                if (typeof OrigInline.prototype.success === "function")
                    OrigInline.prototype.success.apply(this, arguments);

                if ($this._pausedFilter) {
                    try {
                        const content = wp.media?.frame?.content?.get();

                        if (content?.collection) {
                            content.collection.props.set({
                                post__in: $this._pausedFilter,
                            });
                        }
                    } catch (e) {}
                    $this._pausedFilter = null;
                }
            },
        });
    }
}

const mediaModule = new PNPNMMedia();

window.pnpnmMedia = mediaModule;

mediaModule.ready();
