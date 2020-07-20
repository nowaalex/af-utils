import React from "react";
import List from "./index";
import r from "lodash/random";
import times from "lodash/times";

import { css } from "@emotion/core";

export default { title: "List" };

const DEFAULT_ROW_COUNT = 5000;

const dynamicListRowHeights = times( DEFAULT_ROW_COUNT, () => r( 50, 250 ) );

export const DynamicRowHeightList = () => (
    <List
        getRowData={
            i => (
                <div style={{
                    lineHeight: `${dynamicListRowHeights[i]}px`,
                    borderTop: "1px solid #666",
                    background: `hsl(${r(0,360)},${r(30,80)}%,${r(30,80)}%)`
                }}>
                    row {i}:&nbsp;{dynamicListRowHeights[i]}px
                </div>
            )
        }
        rows={dynamicListRowHeights}
    />
);