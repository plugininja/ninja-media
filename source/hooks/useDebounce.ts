import { useEffect, useCallback } from "@wordpress/element";

type DebounceEffect = () => void;

type Dependencies = React.DependencyList;

export default function useDebounce(
    effect: DebounceEffect,
    dependencies: Dependencies,
    delay: number,
): void {
    const callback = useCallback(effect, dependencies);

    useEffect(() => {
        const timeout = setTimeout(callback, delay);
        return () => clearTimeout(timeout);
    }, [callback, delay]);
}
