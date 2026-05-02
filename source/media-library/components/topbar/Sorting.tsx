import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import BlockStack from "~/components/blockStack";
import IconButton from "~/components/iconButton";
import SelectBox from "~/components/selectBox";
import useDisabled from "~/hooks/useDisabled";
import Dropdown from "~/components/dropdown";
import Text from "~/components/text";
import Card from "~/components/card";
import Icon from "~/components/icon";
import {
    selectMedia,
    setFileSorting,
    setFolderSorting,
    setOrder,
} from "~/redux/features/media";

const Sorting = () => {
    const { folderSorting, fileSorting, order } = useAppSelector(selectMedia);

    const dispatch = useAppDispatch();

    const { sortingDisabled } = useDisabled();

    return (
        <Dropdown>
            <Dropdown.Trigger disabled={sortingDisabled}>
                <IconButton
                    variant="light"
                    size="extrasmall"
                    rounded="xs"
                    name="sort_by_alpha"
                    disabled={sortingDisabled}
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
                <Text weight="medium">Sorting</Text>

                <BlockStack marginTop={15} gap={7}>
                    <Text color="secondaryblack" size="sm">
                        Sort Folder
                    </Text>

                    <SelectBox
                        size="extrasmall"
                        background="extralight"
                        options={FOLDER_OPTIONS}
                        value={[folderSorting?.orderBy]}
                        onChange={(value) =>
                            dispatch(
                                setFolderSorting({
                                    ...folderSorting,
                                    orderBy: value[0] as
                                        | "name"
                                        | "size"
                                        | "createdAt"
                                        | "updatedAt",
                                }),
                            )
                        }
                    />
                </BlockStack>

                <BlockStack marginTop={15} gap={7}>
                    <Text color="secondaryblack" size="sm">
                        Sort Files
                    </Text>

                    <SelectBox
                        size="extrasmall"
                        background="extralight"
                        options={FOLDER_OPTIONS}
                        value={[fileSorting?.orderBy]}
                        onChange={(value) =>
                            dispatch(
                                setFileSorting({
                                    ...fileSorting,
                                    orderBy: value[0] as
                                        | "name"
                                        | "size"
                                        | "createdAt"
                                        | "updatedAt",
                                }),
                            )
                        }
                    />
                </BlockStack>

                <BlockStack marginTop={15} gap={7}>
                    <Text color="secondaryblack" size="sm">
                        Order By
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
                                onClick={() => dispatch(setOrder(key))}
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
        name: "Name",
        value: "name",
    },
    {
        name: "Size",
        value: "size",
    },
    {
        name: "Created At",
        value: "createdAt",
    },
    {
        name: "Updated At",
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
