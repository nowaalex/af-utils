import React, { useRef } from "react";
import List from "af-virtual-scroll/src/List";
import r from "lodash/random";
import times from "lodash/times";
import { css } from "@emotion/core";

const wrapperCss = css`
    display: flex;
    flex-flow: column nowrap;
`;

const rowCount = 100000;

const heights = times( rowCount, () => r( 50, 250 ) );

const getRowData = index => (
    <div style={{
        lineHeight: `${heights[index]}px`,
        borderTop: "1px solid #666",
        background: `hsl(${r(0,360)},${r(30,80)}%,${r(30,80)}%)`
    }}>
        row{index}:&nbsp;{heights[index]}px
    </div>
);

const ListWithScrollToRowButton = ({ className }) => {

    const dataRef = useRef();

    const submitHandler = e => {
        e.preventDefault();
        const v = e.currentTarget.elements.scrollRow.value;
        dataRef.current.scrollToRow( +v );
    };

    return (
        <div css={wrapperCss} className={className}>
            <form onSubmit={submitHandler}>
                <label>
                    Row:&nbsp;
                    <input
                        name="scrollRow"
                        type="number"
                        defaultValue="0"
                    />
                </label>
                <button type="submit">
                    Scroll
                </button>
            </form>
            <List
                dataRef={dataRef}
                getRowData={getRowData}
                rowCount={rowCount}
            />
        </div>
    );
};

export default ListWithScrollToRowButton;