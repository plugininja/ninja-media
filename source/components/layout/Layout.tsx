import { forwardRef } from "@wordpress/element";
import { LayoutProps } from "./Layout.type";
import clsx from "clsx";

const Layout = ({ style, className, children }: LayoutProps) => {
    return (
        <div style={style} className={clsx("pnpnm", className)}>
            {children}
        </div>
    );
};

Layout.Wrapper = ({ style, className, children }: LayoutProps) => {
    return (
        <div
            style={style}
            className={clsx("pnpnm-content-wrapper", className)}
        >
            {children}
        </div>
    );
};

Layout.Content = forwardRef<HTMLElement, LayoutProps>(
    ({ style, className, children }, ref) => {
        const classNames = clsx("pnpnm-content", className);

        return (
            <div
                style={style}
                className={classNames}
                ref={ref as React.RefObject<HTMLDivElement>}
            >
                {children}
            </div>
        );
    },
);

export default Layout;
