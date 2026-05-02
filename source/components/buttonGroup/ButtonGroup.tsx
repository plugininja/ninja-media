import { ButtonVariant } from "../button/Button.type";
import { ButtonGroupProps } from "./ButtonGroup.type";
import Button from "../button/Button";
import Card from "../card";

const ButtonGroup = (props: ButtonGroupProps) => {
    const {
        id,
        style,
        className = "",
        background = "white",
        border = "secondary",
        borderStyle = "dashed",
        rounded = "md",
        padding = 10,
        isFitContent = true,
        children,
        buttons = [],
    } = props;

    const isSelectable = buttons.length > 0;
    const single = props.select !== "multiple";

    const styles: React.CSSProperties = {
        ...style,
        width: isFitContent ? "fit-content" : "100%",
    };

    const getVariant = (
        key: string,
        variant: ButtonVariant,
        activeVariant: ButtonVariant,
    ) => {
        if (!isSelectable) return variant;

        if (single) {
            return props.selectedKey === key ? activeVariant : variant;
        }

        return (props.selectedKey as string[]).includes(key)
            ? activeVariant
            : variant;
    };

    const handleClick = (key: string) => {
        if (!isSelectable) return;

        if (single) {
            props.onChange?.(key);
        } else {
            const keys = props.selectedKey as string[];
            props.onChange?.(
                keys.includes(key)
                    ? keys.filter((k) => k !== key)
                    : [...keys, key],
            );
        }
    };

    return (
        <Card
            id={id}
            flex
            gap={8}
            padding={padding}
            background={background}
            border={border}
            borderStyle={borderStyle}
            rounded={rounded}
            style={styles}
            className={className}
        >
            {isSelectable
                ? buttons.map(
                      ({
                          key,
                          id,
                          title,
                          style,
                          buttonClassName,
                          variant = "outlined",
                          activeVariant = "primary",
                          size = "small",
                          rounded,
                          textTransform,
                          startIcon,
                          endIcon,
                          statusProps,
                      }) => (
                          <Button
                              key={key}
                              id={id}
                              style={style}
                              className={buttonClassName}
                              variant={getVariant(key, variant, activeVariant)}
                              size={size}
                              rounded={rounded}
                              textTransform={textTransform}
                              startIcon={startIcon}
                              endIcon={endIcon}
                              statusProps={statusProps}
                              onClick={() => handleClick(key)}
                          >
                              {title}
                          </Button>
                      ),
                  )
                : children}
        </Card>
    );
};

export default ButtonGroup;
