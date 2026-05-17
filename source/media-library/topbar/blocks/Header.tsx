import useDisabled from "~/media-library/hooks/useDisabled";
import useMedia from "~/media-library/hooks/useMedia";
import InlineStack from "~/components/inlineStack";
import Tooltip from "~/components/tooltip";
import Button from "~/components/button";
import Logo from "~/components/logo";

const Header = () => {
    const { setMedia, createFolder, bulkSelect } = useMedia();

    const { newFolderDisabled } = useDisabled();

    return (
        <InlineStack align="between" gap={10} wrap={false}>
            <Logo />

            {bulkSelect || createFolder?.create ? (
                <Button
                    variant="secondary"
                    size="extrasmall"
                    rounded="xs"
                    startIcon="cancel"
                    onClick={() => {
                        if (bulkSelect) {
                            setMedia("bulkSelect", false);
                            setMedia("selectedFolders", []);
                        }
                        if (createFolder?.create) {
                            setMedia("createFolder", { create: false });
                        }
                    }}
                >
                    Cancel
                </Button>
            ) : (
                <Tooltip
                    title="Ctrl + Alt + N"
                    placement="bottom"
                    arrow
                    wrap="no-wrap"
                >
                    <Button
                        variant="primary"
                        size="extrasmall"
                        rounded="xs"
                        startIcon="create_new_folder"
                        onClick={() =>
                            setMedia("createFolder", {
                                create: !createFolder?.create,
                            })
                        }
                        disabled={newFolderDisabled}
                    >
                        New Folder
                    </Button>
                </Tooltip>
            )}
        </InlineStack>
    );
};

export default Header;
