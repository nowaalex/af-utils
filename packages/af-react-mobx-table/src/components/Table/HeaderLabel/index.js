import { observer } from "mobx-react-lite";
import { useDrag } from "react-dnd";
import { HEADER_DND_TYPE } from "constants";
import { css, cx } from "@af/styled";

const wrapperClass = css(
    "cursor: pointer",
    "user-select: none"
);

const compactTogglerClass = cx( wrapperClass, css(
    "font-size: 1.2em",
    "font-weight: 100",
    "padding-right: 0.3em"
));

const HeaderLabel = ({ m, column, i }) => {

    const { label, key } = column;

    const [ , dragRef ] = useDrag(() => ({
        type: HEADER_DND_TYPE,
        item: {
            key
        }}
    ), [ key ]);

    return (
        <div
            ref={dragRef}
            className={wrapperClass}
            onClick={() => m.setSorting( key )}
        >
            {i === 0 ? (
                <span
                    onClick={() => m.toggleCompact()}
                    className={compactTogglerClass}
                >
                    {m.compact ? "\u2295" : "\u2296"}
                </span>
             ) : null}
            {label}
            &nbsp;
            {m.sortDataKey === key?(m.sortDirection===1?"\u2191":"\u2193"):""}
        </div>
    );
};

export default observer( HeaderLabel );