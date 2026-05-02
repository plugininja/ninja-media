export type AlertType = "success" | "error" | "warning" | "info" | "question";

export type AlertPosition =
    | "center-center"
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";

export interface AlertProps {
    rootId?: string;
    id?: string;
    title?: string;
    text?: string;
    html?: React.ReactNode;
    type?: AlertType;
    width?: string;
    height?: string;
    style?: React.CSSProperties;
    icon?: React.ReactNode | AlertType;
    showConfirmButton?: boolean;
    showCancelButton?: boolean;
    confirmButtonText?: string;
    cancelButtonText?: string;
    showIcon?: boolean;
    timer?: number;
    timerProgressBar?: boolean;
    position?: AlertPosition;
    toast?: boolean;
    allowOutsideClick?: boolean;
    allowEscapeKey?: boolean;
    showCloseButton?: boolean;
    onConfirm?: (inputValue: string | number) => void | Promise<void>;
    onCancel?: () => void;
    onClose?: () => void;
    input?: "text" | "email" | "password" | "number" | "textarea" | "select";
    inputPlaceholder?: string;
    inputValue?: string | number;
    inputSuffix?: React.ReactNode;
    inputOptions?: { value: string; label: string }[];
    inputValidator?: (value: string | number) => string | null;
    pauseOnHover?: boolean;
    confirmOnEnter?: boolean;
}

export interface AlertState extends AlertProps {
    id: string;
    isOpen: boolean;
    inputValue?: string | number;
    isLoading?: boolean;
    pauseOnHover: boolean;
}

export interface AlertContextType {
    showAlert: (
        options: AlertProps,
    ) => Promise<{ isConfirmed: boolean; value?: string | number }>;
    closeAlert: (id: string) => void;
}
