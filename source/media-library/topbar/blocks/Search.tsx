import useMedia from "~/media-library/hooks/useMedia";
import { useState } from "@wordpress/element";
import useDebounce from "~/hooks/useDebounce";
import Input from "~/components/input";
import { __ } from "@wordpress/i18n";

const Search = () => {
    const { setMedia, search } = useMedia();
    const [searchTerm, setSearchTerm] = useState(search || "");

    useDebounce(
        () => {
            if (
                !searchTerm ||
                searchTerm.trim() === "" ||
                searchTerm.length < 2
            ) {
                if (search) setMedia("search", "");
                return;
            }

            setMedia("search", searchTerm);
        },
        [searchTerm],
        300,
    );

    return (
        <Input
            type="search"
            size="extrasmall"
            searchIcon
            placeholder={__("Search for Folders...", "ninja-media")}
            className="pnpnm-topbar__input"
            value={searchTerm}
            onChange={(value) => setSearchTerm(String(value))}
        />
    );
};

export default Search;
