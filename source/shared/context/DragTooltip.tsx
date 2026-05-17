type Props = { x: number; y: number; count: number };

const DragTooltip = ({ x, y, count }: Props) => {
    return (
        <div
            style={{
                position: "fixed",
                top: y + 14,
                left: x + 14,
                zIndex: 99999,
            }}
            className="pnpnm-file-drag-tooltip"
        >
            {count === 1 ? "Move 1 Item" : `Move ${count} Items`}
        </div>
    );
};

export default DragTooltip;
