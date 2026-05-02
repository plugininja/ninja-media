import * as WPElement from "@wordpress/element";
import Main from "./Main.tsx";

function render() {
    const container = document.getElementById("pnpnm-admin");

    const color = pnpnm?.settings?.display?.theme?.color ?? "#4D49FC";

    const root = document?.documentElement;

    root?.style.setProperty("--pnpnm-primary", color);

    if (container !== null) {
        const component = <Main />;

        if (WPElement.createRoot) {
            WPElement.createRoot(container).render(component);
        } else {
            WPElement.render(component, container);
        }
    }

    if (import.meta.hot) {
        import.meta.hot.accept();
    }
}

function renderPostTypeLibrary() {
    const postTypeLibraryContainer = document.getElementById(
        "pnpnm-post-type-library",
    );

    if (postTypeLibraryContainer !== null) {
        const testComponent = "";
        if (WPElement.createRoot) {
            WPElement.createRoot(postTypeLibraryContainer).render(
                testComponent,
            );
        } else {
            WPElement.render(testComponent, postTypeLibraryContainer);
        }
    }
}

render();

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderPostTypeLibrary);
} else {
    renderPostTypeLibrary();
    setTimeout(renderPostTypeLibrary, 100);
}
