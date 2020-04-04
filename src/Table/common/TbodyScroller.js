import React from "react";
import Scroller from "../../common/Scroller";

/*
    According to specs, tr must always be inside tbody, thead or tfoot                
*/
const TbodyScroller = () => (
    <tbody className="afvscr-scroller" aria-hidden="true">
        <Scroller Component="tr" />
    </tbody>
);

export default TbodyScroller;