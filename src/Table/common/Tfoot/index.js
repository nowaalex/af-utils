import React, { memo } from "react";
import FooterCellsCached from "../FooterCellsCached";


const Tfoot = ({ className, trRef }) => (
    <tfoot className={className}>
        <tr ref={trRef}>
            {FooterCellsCached}
        </tr>
    </tfoot>
);

export default memo( Tfoot );