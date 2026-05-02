import { selectFiles, setDetailsFile } from "~/redux/features/files";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { formatFileSize } from "~/utils/functions";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import IconButton from "~/components/iconButton";
import Avatar from "~/components/avatar";
import Card from "~/components/card";
import Text from "~/components/text";
import Icon from "~/components/icon";

const FileDetails = () => {
    const { detailsFile } = useAppSelector(selectFiles);
    const dispatch = useAppDispatch();

    const { id, name, url, extension, size, location, createdAt } =
        detailsFile || {};

    return (
        <Card
            padding={15}
            background="white"
            rounded="md"
            style={{
                position: "sticky",
                top: 0,
                flex: "0 0 300px",
                maxWidth: "300px",
                flexShrink: 0,
            }}
        >
            <InlineStack align="between" gap={10}>
                <Text size="sm">Media Details {id}</Text>

                <IconButton
                    variant="error"
                    size="microsmall"
                    name="close"
                    style={{
                        borderRadius: "5px",
                    }}
                    onClick={() => dispatch(setDetailsFile(null))}
                />
            </InlineStack>

            <Card
                marginTop={10}
                padding={0}
                background="extralight"
                rounded="md"
                style={{
                    height: "180px",
                }}
            >
                <Avatar
                    src={url as string}
                    alt={name}
                    width="100%"
                    height="100%"
                    rounded="md"
                    showSpinner
                />
            </Card>

            <InlineStack gap={20} wrap={false}>
                <BlockStack marginTop={10} gap={5}>
                    <Text size="sm">Name:</Text>

                    <Text size="sm">Type:</Text>

                    <Text size="sm">Size:</Text>

                    <Text size="sm">Date:</Text>
                </BlockStack>

                <BlockStack
                    marginTop={10}
                    gap={5}
                    style={{
                        minWidth: 0,
                    }}
                >
                    <Text
                        color="descgray"
                        size="sm"
                        wrap={false}
                        ellipsis
                        style={{
                            minWidth: 0,
                        }}
                    >
                        {name}
                    </Text>

                    <Text color="descgray" size="sm">
                        {extension}
                    </Text>

                    <Text color="descgray" size="sm">
                        {formatFileSize(size ?? 0)}
                    </Text>

                    <Text color="descgray" size="sm">
                        {createdAt}
                    </Text>
                </BlockStack>
            </InlineStack>

            <BlockStack marginTop={20} gap={location?.length === 0 ? 0 : 10}>
                <Text size="sm">
                    Location {location?.length === 0 ? "not Found" : ":"}
                </Text>

                <BlockStack
                    gap={5}
                    style={{
                        marginLeft: 10,
                    }}
                >
                    {location?.map(({ name, url }, index) => (
                        <InlineStack key={index} gap={10} wrap={false}>
                            <Text color="descgray" size="sm" wrap={false}>
                                {index + 1}.
                            </Text>

                            <Text color="descgray" size="sm" wrap={false}>
                                {name}
                            </Text>

                            <Icon
                                name="open_in_new"
                                color="primary"
                                style={{
                                    cursor: "pointer",
                                }}
                                onClick={() => window.open(url, "_blank")}
                            />
                        </InlineStack>
                    ))}
                </BlockStack>
            </BlockStack>
        </Card>
    );
};

export default FileDetails;
