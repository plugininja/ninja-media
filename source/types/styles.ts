type Color =
    | "primary"
    | "hover"
    | "secondary"
    | "light"
    | "extralight"
    | "white"
    | "pure"
    | "black"
    | "secondaryblack"
    | "dark"
    | "descgray"
    | "warning"
    | "warninglight"
    | "warningextralight"
    | "error"
    | "errorlight"
    | "errorextralight"
    | "pro"
    | "new"
    | "inherit"
    | "transparent";

export type TextColor = Color;

export type BackgroundColor = Color;

export type BorderColor = Color;

export type BorderRadius =
    | "none"
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "pill"
    | "full";

export type Size = "extrasmall" | "small" | "medium" | "large" | "extralarge";

export type FontSize =
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "inherit";

export type FontWeight =
    | "thin"
    | "extralight"
    | "light"
    | "normal"
    | "medium"
    | "semibold"
    | "bold"
    | "extrabold"
    | "black"
    | "inherit";

export type BorderStyle = "none" | "solid" | "dashed" | "dotted";

export type TextTransform =
    | "none"
    | "uppercase"
    | "capitalize"
    | "lowercase"
    | "transformnone";

export type TextAlign = "left" | "center" | "right" | "justify" | "alignnone";

export type Align =
    | "start"
    | "end"
    | "center"
    | "between"
    | "around"
    | "evenly";

export type InlineAlign = "start" | "end" | "center" | "baseline" | "stretch";

export type BlockAlign = InlineAlign;
