import InlineStack from "~/components/inlineStack";
import IconButton from "~/components/iconButton";
import Dropdown from "~/components/dropdown";
import Button from "~/components/button";
import Icon from "~/components/icon";
import Card from "~/components/card";
import { __ } from "@wordpress/i18n";
import { FC } from "react";

type PaginationProps = {
    variant?: "small" | "large";
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
};

const MAX_VISIBLE = 4;

const Pagination: FC<PaginationProps> = ({
    variant = "large",
    currentPage,
    totalPages,
    onPageChange,
    className = "",
}) => {
    if (totalPages <= 1) return null;

    const DOTS = "...";

    const getPaginationRange = (
        current: number,
        total: number,
    ): (number | string)[] => {
        if (total <= MAX_VISIBLE) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        let start = current - 1;
        let end = current + 2;

        if (start < 1) {
            start = 1;
            end = MAX_VISIBLE;
        }

        if (end > total) {
            end = total;
            start = total - MAX_VISIBLE + 1;
        }

        const pages = Array.from(
            { length: end - start + 1 },
            (_, i) => start + i,
        );

        const result: (number | string)[] = [];

        if (pages[0] > 1) {
            result.push(DOTS);
        }

        result.push(...pages);

        if (pages[pages.length - 1] < total) {
            result.push(DOTS);
        }

        return result;
    };

    const range = getPaginationRange(currentPage, totalPages);

    const visibleNumbers = range.filter((r) => r !== DOTS) as number[];

    const hiddenPages = Array.from(
        { length: totalPages },
        (_, i) => i + 1,
    ).filter((p) => !visibleNumbers.includes(p));

    const firstVisible = visibleNumbers[0];
    const leftHidden = hiddenPages.filter((p) => p < firstVisible);

    const lastVisible = visibleNumbers[visibleNumbers.length - 1];
    const rightHidden = hiddenPages.filter((p) => p > lastVisible);

    return (
        <InlineStack
            gap={5}
            align="center"
            blockAlign="center"
            className={className}
        >
            {variant === "large" ? (
                <Button
                    variant="outlined"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    {__("Prev", "ninja-media")}
                </Button>
            ) : (
                <IconButton
                    variant="outlined"
                    size="small"
                    name="chevron_backward"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                />
            )}

            {range.map((page, index) =>
                page === DOTS ? (
                    <Dropdown key={`dots-${index}`}>
                        <Dropdown.Trigger>
                            <Icon
                                name="more_horiz"
                                fontSize="xl"
                                fontWeight="semibold"
                                style={{
                                    cursor: "pointer",
                                    userSelect: "none",
                                }}
                            />
                        </Dropdown.Trigger>

                        <Dropdown.Content
                            position={{
                                top: "170%",
                                left: 0,
                            }}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                maxHeight: "300px",
                                overflowY: "auto",
                                scrollbarWidth: "none",
                            }}
                        >
                            {(index === 0 ? leftHidden : rightHidden).map(
                                (p) => (
                                    <Card
                                        key={p}
                                        padding={5}
                                        rounded="sm"
                                        flex
                                        align="center"
                                        blockAlign="center"
                                        background={
                                            p === currentPage
                                                ? "primary"
                                                : "extralight"
                                        }
                                        style={{
                                            cursor: "pointer",
                                            minWidth: "32px",
                                            height: "32px",
                                        }}
                                        className={
                                            p === currentPage
                                                ? "text-white"
                                                : "text-black"
                                        }
                                        onClick={() => onPageChange(p)}
                                    >
                                        {p}
                                    </Card>
                                ),
                            )}
                        </Dropdown.Content>
                    </Dropdown>
                ) : (
                    <Button
                        key={page}
                        variant={page === currentPage ? "primary" : "outlined"}
                        size={variant === "small" ? "small" : "medium"}
                        onClick={() => onPageChange(Number(page))}
                    >
                        {page}
                    </Button>
                ),
            )}

            {variant === "large" ? (
                <Button
                    variant="outlined"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    {__("Next", "ninja-media")}
                </Button>
            ) : (
                <IconButton
                    variant="outlined"
                    size="small"
                    name="chevron_forward"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                />
            )}
        </InlineStack>
    );
};

export default Pagination;
