export const marginStyle = (margin?: string | number): React.CSSProperties =>
    margin === undefined
        ? {}
        : {
              margin: typeof margin === "number" ? `${margin}px` : margin,
          };

export const marginTopStyle = (
    marginTop?: string | number,
): React.CSSProperties =>
    marginTop === undefined
        ? {}
        : {
              marginTop:
                  typeof marginTop === "number" ? `${marginTop}px` : marginTop,
          };

export const paddingStyle = (padding?: string | number): React.CSSProperties =>
    padding === undefined
        ? {}
        : {
              padding: typeof padding === "number" ? `${padding}px` : padding,
          };

export const paddingTopStyle = (
    paddingTop?: string | number,
): React.CSSProperties =>
    paddingTop === undefined
        ? {}
        : {
              paddingTop:
                  typeof paddingTop === "number"
                      ? `${paddingTop}px`
                      : paddingTop,
          };

export const gapStyle = (gap?: string | number): React.CSSProperties =>
    gap === undefined
        ? {}
        : { gap: typeof gap === "number" ? `${gap}px` : gap };
