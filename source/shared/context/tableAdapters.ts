export const HANDLE_CLASS = "pnpnm-drag-handle";

export type TableAdapter = {
    id: string;
    containerSelector: string;
    rowSelector: string;
    getPostId: (row: Element) => number | null;
    getSelectedPostIds: () => number[];
    injectHandle: (row: HTMLElement) => void;
    removeRow: (postId: number) => void;
};

export type SwapRegion = {
    selector: string;
    clearIfAbsent?: boolean;
    textOnly?: boolean;
    all?: boolean;
};

export type PageSwapAdapter = {
    id: string;
    bodySelector: string;
    regions: SwapRegion[];
};

const wpListTableAdapter: TableAdapter = {
    id: "wp-list-table",
    containerSelector: "#the-list",
    rowSelector: "#the-list tr",

    getPostId: (row) => {
        const id = Number(row.id?.replace("post-", ""));
        return id || null;
    },

    getSelectedPostIds: () => {
        return Array.from(
            document.querySelectorAll<HTMLInputElement>(
                "#the-list input[type='checkbox']:checked",
            ),
        ).reduce<number[]>((acc, el) => {
            const id = Number(el.closest("tr")?.id?.replace("post-", ""));
            if (id) acc.push(id);
            return acc;
        }, []);
    },

    injectHandle: (row) => {
        if (row.querySelector(`.${HANDLE_CLASS}`)) return;
        const th = row.querySelector<HTMLElement>("th.check-column");
        if (!th) return;
        th.classList.add("pnpnm-top-level-wrapper");
        const handle = document.createElement("span");
        handle.className = `${HANDLE_CLASS} pn-icon text-descgray text-lg`;
        handle.setAttribute("aria-hidden", "true");
        handle.textContent = "drag_click";
        th.appendChild(handle);
    },

    removeRow: (postId) => {
        document.getElementById(`post-${postId}`)?.remove();
    },
};

const tutorLmsAdapter: TableAdapter = {
    id: "tutor-lms",
    containerSelector: ".table-dashboard-course-list",
    rowSelector: ".table-dashboard-course-list tbody tr",

    getPostId: (row) => {
        const cb = row.querySelector<HTMLInputElement>(".tutor-bulk-checkbox");
        return cb?.value ? Number(cb.value) || null : null;
    },

    getSelectedPostIds: () => {
        return Array.from(
            document.querySelectorAll<HTMLInputElement>(
                ".tutor-bulk-checkbox:checked",
            ),
        ).reduce<number[]>((acc, el) => {
            const id = Number(el.value);
            if (id) acc.push(id);
            return acc;
        }, []);
    },

    injectHandle: (row) => {
        if (row.querySelector(`.${HANDLE_CLASS}`)) return;
        const td = row.querySelector<HTMLElement>("td.td-checkbox");
        if (!td) return;
        const handle = document.createElement("span");
        handle.className = `${HANDLE_CLASS} pn-icon text-descgray text-lg`;
        handle.setAttribute("aria-hidden", "true");
        handle.textContent = "drag_click";
        td.appendChild(handle);
    },

    removeRow: (postId) => {
        document
            .querySelector<HTMLInputElement>(
                `.tutor-bulk-checkbox[value="${postId}"]`,
            )
            ?.closest("tr")
            ?.remove();
    },
};

export const TABLE_ADAPTERS: TableAdapter[] = [
    wpListTableAdapter,
    tutorLmsAdapter,
];

export function getAdapterForRow(row: Element): TableAdapter | null {
    return (
        TABLE_ADAPTERS.find((a) => row.closest(a.containerSelector) !== null) ??
        null
    );
}

export const PAGE_SWAP_ADAPTERS: PageSwapAdapter[] = [
    {
        id: "wp-list-table",
        bodySelector: "tbody#the-list",
        regions: [
            { selector: ".tablenav-pages", all: true },
            { selector: ".displaying-num", all: true, textOnly: true },
        ],
    },
    {
        id: "tutor-lms",
        bodySelector: ".table-dashboard-course-list tbody",
        regions: [
            {
                selector: ".tutor-admin-page-pagination-wrapper",
                clearIfAbsent: true,
            },
        ],
    },
];
