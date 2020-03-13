import React, { memo } from "react";
import FooterCells from "../FooterCells";

const Tfoot = ({ className, trRef, TotalsCellComponent }) => (
    <tfoot className={className}>
        <tr ref={trRef}>
            <FooterCells TotalsCellComponent={TotalsCellComponent} />
        </tr>
    </tfoot>
);

export default memo( Tfoot );