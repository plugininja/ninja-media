import SkeletonLoader from "~/components/skeletonLoader";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import Dropdown from "~/components/dropdown";
import Button from "~/components/button";
import { Folder } from "~/types/folder";
import Card from "~/components/card";
import Icon from "~/components/icon";
import Text from "~/components/text";

const BreadcrumbUI = ({
    variant,
    visible,
    hidden,
    childrenToShow,
    prevFolder,
    onHomeClick,
    handleNavigate,
    handleChildClick,
    loading,
}: {
    variant?: "media" | "post";
    visible?: ({ id: string | number; name: string } | null)[] | null;
    hidden?: { id: string | number; name: string }[];
    childrenToShow: Folder[];
    prevFolder?: Folder | null;
    onHomeClick?: () => void;
    handleNavigate: (id: string | number) => void;
    handleChildClick: (child: {
        id: string | number;
        name: string;
        [key: string]: any;
    }) => void;
    loading?: boolean;
}) => {
    return (
        <BlockStack
            pnpnm-theme-status="light"
            gap={variant === "media" ? 10 : 7}
            margin={variant === "media" ? "0 0 12px" : "0 0 7px"}
            padding={
                pnpnm?.pagenow ===
                (variant === "media" ? "upload.php" : "edit.php")
                    ? "0"
                    : "0 16px"
            }
        >
            <InlineStack
                padding="0px 13px"
                gap={5}
                wrap={false}
                style={{
                    minHeight: "44px",
                }}
                className="pnpnm-breadcrumb"
            >
                {loading && <SkeletonLoader.SkeletonBreadcrumb />}

                {!loading && (
                    <Icon
                        name="home"
                        color="primary"
                        fontSize="xl"
                        style={{ cursor: "pointer" }}
                        onClick={onHomeClick}
                    />
                )}

                {!loading &&
                    visible?.map((crumb, index) =>
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

            <InlineStack
                padding={5}
                gap={5}
                style={{
                    minHeight: "44px",
                }}
                className="pnpnm-breadcrumb"
            >
                {loading ? (
                    <SkeletonLoader.SkeletonBreadcrumb folder />
                ) : (
                    <>
                        {childrenToShow?.length > 0 &&
                            childrenToShow?.map((child) => (
                                <Button
                                    key={child?.id}
                                    title={child?.id as string}
                                    variant="outlined"
                                    size="extrasmall"
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
                                size="extrasmall"
                                rounded="xs"
                                onClick={() => handleNavigate(prevFolder?.id)}
                            >
                                Back
                            </Button>
                        )}
                    </>
                )}

                {!loading && childrenToShow?.length === 0 && (
                    <Text
                        color="secondaryblack"
                        size="sm"
                        style={{
                            paddingLeft: "7px",
                        }}
                    >
                        No folders found.
                    </Text>
                )}
            </InlineStack>
        </BlockStack>
    );
};

export default BreadcrumbUI;
