import { useEffect, useState } from "@wordpress/element";

const cache = new Map<string, string>();

const SvgIcon = ({
    src,
    style,
    className,
}: {
    src: string;
    style?: React.CSSProperties;
    className?: string;
}) => {
    const [svg, setSvg] = useState<string>(cache.get(src) ?? "");

    useEffect(() => {
        if (cache.has(src)) {
            setSvg(cache.get(src)!);
            return;
        }

        fetch(src)
            .then((r) => r.text())
            .then((content) => {
                cache.set(src, content);
                setSvg(content);
            });
    }, [src]);

    return (
        <span
            className={className}
            style={{ display: "inline-flex", ...style }}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

export default SvgIcon;
