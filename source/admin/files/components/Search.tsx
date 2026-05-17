import { setQuery } from "~/redux/features/file/file";
import { useAppDispatch } from "~/redux/hooks";
import useDebounce from "~/hooks/useDebounce";
import { useState } from "@wordpress/element";
import Input from "~/components/input";
import useFile from "../hooks/useFile";
import { __ } from "@wordpress/i18n";

const Search = () => {
    const { query } = useFile();
    const [searchTerm, setSearchTerm] = useState(query?.search || "");

    const dispatch = useAppDispatch();

    useDebounce(
        () => {
            if (
                !searchTerm ||
                searchTerm.trim() === "" ||
                searchTerm.length < 2
            ) {
                if (query?.search) dispatch(setQuery({ search: "" }));
                return;
            }
            dispatch(setQuery({ search: String(searchTerm) }));
        },
        [searchTerm],
        300,
    );

    return (
        <Input
            searchIcon
            placeholder={__("Search media...", "ninja-media")}
            value={searchTerm}
            onChange={(value) => setSearchTerm(value as string)}
        />
    );
};

export default Search;
