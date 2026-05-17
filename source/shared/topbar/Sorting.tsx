import BlockStack from "~/components/blockStack";
import IconButton from "~/components/iconButton";
import { Order, OrderBy } from "~/types/filter";
import SelectBox from "~/components/selectBox";
import Dropdown from "~/components/dropdown";
import { __ } from "@wordpress/i18n";
import Text from "~/components/text";
import Card from "~/components/card";
import Icon from "~/components/icon";

const Sorting = ({
    variant = "media",
    folderSorting,
    fileSorting,
    order,
    onFolderSorting,
    onFileSorting,
    onOrder,
    disabled,
}: {
    variant?: "media" | "post";
    folderSorting: {
        orderBy: OrderBy;
    };
    fileSorting: {
        orderBy: OrderBy;
    };
    order: Order;
    onFolderSorting: (sorting: { orderBy: OrderBy }) => void;
    onFileSorting: (sorting: { orderBy: OrderBy }) => void;
    onOrder: (order: Order) => void;
    disabled?: boolean;
}) => {
    return (
        <Dropdown>
            <Dropdown.Trigger disabled={disabled}>
                <IconButton
                    variant="light"
                    size="extrasmall"
                    rounded="xs"
                    name="sort_by_alpha"
                    disabled={disabled}
                />
            </Dropdown.Trigger>

            <Dropdown.Content
                position={{
                    right: 0,
                    top: "115%",
                }}
                style={{
                    width: "180px",
                    padding: "10px",
                }}
            >
                <Text weight="medium">{__("Sorting", "ninja-media")}</Text>

                <BlockStack marginTop={15} gap={7}>
                    <Text color="secondaryblack" size="sm">
                        {__("Sort Folder", "ninja-media")}
                    </Text>

                    <SelectBox
                        size="extrasmall"
                        background="extralight"
                        options={FOLDER_OPTIONS}
                        value={[folderSorting?.orderBy]}
                        onChange={(value) =>
                            onFolderSorting({
                                ...folderSorting,
                                orderBy: value[0] as OrderBy,
                            })
                        }
                    />
                </BlockStack>

                <BlockStack marginTop={15} gap={7}>
                    <Text color="secondaryblack" size="sm">
                        {variant === "media" ? __("Sort Files", "ninja-media") : __("Sort Posts", "ninja-media")}
                    </Text>

                    <SelectBox
                        size="extrasmall"
                        background="extralight"
                        options={FOLDER_OPTIONS}
                        value={[fileSorting?.orderBy]}
                        onChange={(value) =>
                            onFileSorting({
                                ...fileSorting,
                                orderBy: value[0] as OrderBy,
                            })
                        }
                    />
                </BlockStack>

                <BlockStack marginTop={15} gap={7}>
                    <Text color="secondaryblack" size="sm">
                        {__("Order By", "ninja-media")}
                    </Text>

                    <Card
                        padding={5}
                        rounded="sm"
                        flex
                        direction="row"
                        gap={5}
                        wrap={false}
                    >
                        {ORDER_OPTIONS?.map(({ key, icon }, index) => (
                            <Card
                                key={key ?? index}
                                padding={5}
                                background={order === key ? "primary" : "white"}
                                rounded="xs"
                                flex
                                align="center"
                                blockAlign="center"
                                style={{
                                    cursor: "pointer",
                                }}
                                onClick={() => onOrder(key)}
                            >
                                <Icon
                                    name={icon}
                                    color={order === key ? "white" : "black"}
                                />
                            </Card>
                        ))}
                    </Card>
                </BlockStack>
            </Dropdown.Content>
        </Dropdown>
    );
};

export default Sorting;

export const FOLDER_OPTIONS: {
    name: string;
    value: "name" | "size" | "createdAt" | "updatedAt";
}[] = [
    {
        name: __("Name", "ninja-media"),
        value: "name",
    },
    {
        name: __("Size", "ninja-media"),
        value: "size",
    },
    {
        name: __("Created At", "ninja-media"),
        value: "createdAt",
    },
    {
        name: __("Updated At", "ninja-media"),
        value: "updatedAt",
    },
];

const ORDER_OPTIONS: {
    key: "ASC" | "DESC";
    icon: string;
}[] = [
    {
        key: "ASC",
        icon: "arrow_warm_up",
    },
    {
        key: "DESC",
        icon: "arrow_cool_down",
    },
];
