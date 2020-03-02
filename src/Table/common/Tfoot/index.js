import React, { memo } from "react";
import FooterCellsCached from "../FooterCellsCached";


const Tfoot = ({ className }) => (
    <tfoot className={className}>
        <tr>
            {FooterCellsCached}
        </tr>
    </tfoot>
);

export default memo( Tfoot );