import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { selectFiles, setQuery } from "~/redux/features/files";
import useDebounce from "~/hooks/useDebounce";
import { useState } from "@wordpress/element";
import Input from "~/components/input";

const Search = () => {
    const { query } = useAppSelector(selectFiles);
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
            placeholder="Search media..."
            value={searchTerm}
            onChange={(value) => setSearchTerm(value as string)}
        />
    );
};

export default Search;
