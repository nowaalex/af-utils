/*! For license information please see 26.a4be157c4c5bce9c0483.js.LICENSE.txt */
(window.Z=window.Z||[]).push([[26],{1275:function(t,e,o){"use strict";o.r(e);var r=o(0),n=o(3),a=o(4),s=(o(6),o(41)),l=o.n(s),i=["","-webkit-","-ms-"].map((function(t){return"position:"+t+"sticky"})).join(";"),c=l()((function(){var t=document.createElement("a").style;return t.cssText=i,t.position.includes("sticky")})),u=Object(r.createContext)(),d=function(t,e){var o=Object(r.useRef)(),n=o.current;return n&&n instanceof t||(n=o.current=new t),e&&(e.current=n),Object(r.useEffect)((function(){return function(){n.destructor()}}),[n]),n},f=o(13),h=(o(12),o(9),o(11)),m=o(14),w=o.n(m),b=o(39),g=o.n(b),p=o(40),C=o.n(p);var R=Uint32Array,v=Uint32Array,O=new Intl.Collator,j=function(t,e,o,r,n,a){var s=n(t);return s?a?a(s,e):s[o]:r},x=function(t,e,o,r,n,a){for(var s,l=n,i=0;i<t;i++)s=o(i),l=a(l,r?r(s,i):s[e]);return l},y=function(){this.count=0,this.sum=0,this.average=0},I=function(t,e){return function(t){Object(h.a)(n,t);o=n;var o,r=n.prototype;function n(){var o;return(o=t.call(this)||this).columns=[],o.totals={},o.headlessMode=!1,o.sortColumnIndex=-1,o.sortDirectionSign=1,o.scrollLeft=0,o.tbodyColumnWidths=null,o.orderedRows=new R(0),o.totalsCache=Object.create(null),o.refreshTotals=w()((function(){for(var t,e,r=0;r<o.columns.length;r++){var n=o.columns[r];t=n.dataKey,e=n.getCellData,o.refreshTotalsForColumnRaw(t,e)}return Object(f.a)(o)}),100),o.refreshSorting=w()((function(){if(o.sortColumnIndex>-1&&o.totalRows>0){var t=o.columns[o.sortColumnIndex],e=t.sort,r=t.dataKey,n=t.getCellData;if(e){var a=function(t,e,o,r,n){var a="locale"===o?O.compare:g.a,s="locale"===o?"":0;return function(o,l,i){var c=j(o,i,e,s,t,r),u=j(l,i,e,s,t,r);return a(c,u)*n}}(o.rowDataGetter,r,e,n,o.sortDirectionSign);o.orderedRows.sort(a),o.emit("#rowsOrder")}}}),500),o.on("#columns",o.resetColumnWidthsCache).on("#columns",o.refreshTotals).on("#columns",o.refreshSorting).on("#totalRows",o.refreshRowsOrder).on("#totalRows",o.refreshSorting).on("#totalRows",o.refreshTotals).on("sort-params-changed",o.refreshSorting).on("#rowDataGetter",o.refreshSorting).on("#rowDataGetter",o.refreshTotals).on("#rowsOrder",o.scrollToStart).on("#totals",o.refreshTotals).refreshRowsOrder(),e&&e(Object(f.a)(o)),o}return r.refreshTotalsForColumnRaw=function(t,e){var o=this.totals&&this.totals[t];if(o){var r=this.totalsCache[t];r||(r=this.totalsCache[t]=new y);for(var n,a,s,l,i=0;i<o.length;i++){switch(a=r[n=o[i]],n){case"count":s=this.totalRows;break;case"sum":case"average":void 0===l&&(l=x(this.totalRows,t,this.rowDataGetter,e,0,C.a)),s="sum"===n?l:l/this.totalRows;break;case"min":case"max":s=x(this.totalRows,t,this.rowDataGetter,e,"min"===n?Number.MAX_SAFE_INTEGER:Number.MIN_SAFE_INTEGER,Math[n]);break;default:0}a!==s&&(r[n]=s,this.emit("totals-calculated"))}}else 0;return this},r.refreshTotalsForColumn=function(t){var e=this.columns.find((function(e){return e.dataKey===t}));return e&&this.refreshTotalsForColumnRaw(t,e.getCellData),this},r.setSortParams=function(t,e){this.sortColumnIndex===t&&e===this.sortDirectionSign||(this.sortColumnIndex=t,this.sortDirectionSign=e,this.emit("sort-params-changed"))},r.refreshRowsOrder=function(){if(this.orderedRows.length!==this.totalRows)for(var t=this.orderedRows=new R(this.totalRows),e=1;e<t.length;e++)t[e]=e;return this},r.resetColumnWidthsCache=function(){this.tbodyColumnWidths=new v(this.columns.length)},r.destructor=function(){this.refreshSorting.cancel(),this.refreshTotals.cancel(),t.prototype.destructor.call(this)},n}(t)},E=o(37),T=o.n(E),S=o(38);var N=function(){throw new Error("getRowData must be provided")},H=function(t){Object(h.a)(r,t);e=r;var e,o=r.prototype;function r(){var e;return(e=t.call(this)||this).totalRows=0,e.startIndex=0,e.endIndex=0,e.virtualTopOffset=0,e.widgetScrollHeight=0,e.overscanRowsCount=0,e.estimatedRowHeight=16,e.scrollTop=0,e.widgetHeight=0,e.widgetWidth=0,e.rowKeyGetter=void 0,e.rowDataGetter=N,e.rowsContainerNode=null,e.scrollContainerNode=null,e.increaseEndIndexIfNeeded=w()((function(){var t=e.getDistanceBetweenIndexes(e.startIndex,e.endIndex);return e.widgetHeight>e.virtualTopOffset+t-e.scrollTop&&e.updateEndIndex(),Object(f.a)(e)}),400),e.on("#totalRows",e.updateWidgetScrollHeight).on("#totalRows",e.updateEndIndex).on("#widgetScrollHeight",e.increaseEndIndexIfNeeded).on("#endIndex",e.increaseEndIndexIfNeeded.cancel).on("#scrollTop",e.updateStartOffset).on("#overscanRowsCount",e.updateStartOffset).on("#widgetHeight",e.updateEndIndex).on("#startIndex",e.updateEndIndex),e}return o.set=function(t,e){return this[t]!==e&&(this[t]=e,this.emit("#"+t)),this},o.merge=function(t){for(var e in t)this.set(e,t[e]);return this},o.destructor=function(){this.increaseEndIndexIfNeeded.cancel(),this.removeAllListeners()},o.reportRowsRendered=function(){this.emit("rows-rendered")},o.updateStartOffset=function(){var t=this.scrollTop,e=this.overscanRowsCount,o=this.getVisibleRangeStart(t),r=o[0],n=o[1],a=Math.max(0,r-e),s=this.getDistanceBetweenIndexes(a,r);return this.set("virtualTopOffset",t-n-s).set("startIndex",a)},o.updateEndIndex=function(){var t=this.getVisibleRangeStart(this.scrollTop+this.widgetHeight)[0];return this.set("endIndex",Math.min(t+1+this.overscanRowsCount,this.totalRows))},o.scrollToRow=function(t){var e=this.scrollContainerNode;return e&&(t=T()(t,0,this.totalRows),e.scrollTop=this.getDistanceBetweenIndexes(0,t)),this},o.scrollToStart=function(){return this.scrollToRow(0)},r}(S.a);var P=I(function(t){Object(h.a)(r,t);e=r;var e,o=r.prototype;function r(){var e;return(e=t.call(this)||this).on("#estimatedRowHeight",e.updateWidgetScrollHeight).on("#widgetWidth",e.updateEstimatedRowHeight),e}return o.updateWidgetScrollHeight=function(){return this.set("widgetScrollHeight",this.estimatedRowHeight*this.totalRows)},o.updateEstimatedRowHeight=function(){var t=this.rowsContainerNode;t&&(t.firstElementChild&&this.set("estimatedRowHeight",t.firstElementChild.offsetHeight))},o.getVisibleRangeStart=function(t){var e=this.estimatedRowHeight;return[t/e|0,t%e]},o.getDistanceBetweenIndexes=function(t,e){return this.estimatedRowHeight*(e-t)},r}(H));var D=Uint32Array,W=I(function(t){Object(h.a)(r,t);e=r;var e,o=r.prototype;function r(){var e;return(e=t.call(this)||this).sTree=new D(2),e.N=1,e.shouldResetInvisibleRowHeights=!0,e.setVisibleRowsHeights=w()((function(){var t=e.rowsContainerNode;if(t){for(var o,r,n=Object(f.a)(e),a=n.sTree,s=n.N,l=-1,i=-1,c=0,u=0,d=t.firstElementChild;d;d=d.nextElementSibling,u++)r=parseInt(d.getAttribute("aria-rowindex"),10)-1,c+=o=d.offsetHeight,a[s+r]!==o&&(a[s+r]=o,-1===l&&(l=r),i=r);-1!==l&&(e.shouldResetInvisibleRowHeights?(e.set("estimatedRowHeight",Math.round(c/u)),e.shouldResetInvisibleRowHeights=!1):e.calculateParentsInRange(l,i).updateWidgetScrollHeight())}return Object(f.a)(e)}),50,{maxWait:150}),e.prependListener("#totalRows",e.resetCache).prependListener("#totalRows",e.reallocateCacheIfNeeded).on("#estimatedRowHeight",e.resetCache).on("#estimatedRowHeight",e.updateWidgetScrollHeight).on("rows-rendered",e.setVisibleRowsHeights).on("#widgetWidth",e.markResetInvisibleRowHeights).on("#widgetWidth",e.setVisibleRowsHeights),e}return o.markResetInvisibleRowHeights=function(){this.shouldResetInvisibleRowHeights=!0},o.updateWidgetScrollHeight=function(){return this.set("widgetScrollHeight",this.sTree[1])},o.calculateParentsInRange=function(t,e){var o=this.sTree,r=this.N;for(e+=r,t+=r;e>>=1;)for(var n=t>>=1;n<=e;n++)o[n]=o[n<<1]+o[n<<1|1];return this},o.getVisibleRangeStart=function(t){for(var e,o=this.sTree,r=this.N,n=1;n<r;)t>=(e=o[n<<=1])&&(t-=e,n|=1);return[n-r,t]},o.resetCache=function(){var t=this.sTree,e=this.estimatedRowHeight,o=this.N,r=this.totalRows;return t.fill(e,o,o+r),this.calculateParentsInRange(0,r)},o.reallocateCacheIfNeeded=function(){var t=this.totalRows?Math.pow(2,Math.ceil(Math.log2(this.totalRows+32))):1;return this.N!==t&&(this.N=t,this.sTree=new D(2*t)),this},o.destructor=function(){this.setVisibleRowsHeights.cancel(),t.prototype.destructor.call(this)},o.getDistanceBetweenIndexes=function(t,e){var o=this.sTree,r=this.N,n=0;for(t+=r,e+=r;t<e;t>>=1,e>>=1)1&t&&(n+=o[t++]),1&e&&(n+=o[--e]);return n},r}(H),(function(t){t.prependListener("#rowsOrder",t.resetCache)})),L=function(t){return function(e,o,r){var n,a=((n={})[t]=o+1,n);if(r){var s=r(e,o);s&&Object.assign(a,s)}return a}},k=L("aria-rowindex"),M=L("aria-colindex"),K=o(2),G=function(t){var e=t.columns,o=t.CellComponent,r=t.getRowData,n=t.getRowExtraProps,a=t.getCellExtraProps,s=t.rowDataIndex,l=t.rowIndex,i=r(s);return Object(K.c)("tr",k(i,s,n),e.map((function(t,e){if("hidden"===t.visibility)return null;var r=t.CellComponent||o;return Object(K.c)(r,{key:t.dataKey,rowData:i,rowIndex:l,column:t,columnIndex:e,getCellExtraProps:t.getCellExtraProps||a})})))};G.propTypes={};var A=G,V=function(t){var e=t.rowData,o=t.rowIndex,r=t.column,n=t.columnIndex,a=t.getCellExtraProps,s=r.render,l=r.getEmptyCellData,i=r.dataKey,c=r.format,u=r.getCellData,d=e&&(u?u(e,o):e[i]);return void 0===d||""===d?d=l?l(o,r):" ":(c&&(d=c(d,e)),s&&(d=s(d,e,r))),Object(K.c)("td",M(e,n,a),d)};V.propTypes={};var F=V,z=o(43),B=o.n(z),_=function(t){var e=t.cellTotals,o=t.totalsCache,r=t.formatTotal;if(!e||!o)return null;if(1===e.length){var n=e[0],a=o[n];return Object(K.c)("div",{title:n},r?r(a):a)}return e.map((function(t){var e=o[t];return void 0!==e?Object(K.c)("div",{key:t},B()(t),": ",r?r(e):e):null}))},U=function(t,e){return e?t+" "+e:t},Z=function(t){var e=t.className,o=Object(a.a)(t,["className"]);return Object(K.c)("div",Object(n.a)({className:U("afvscr-row-count-warning-container",e)},o))},X=function(t){return t+1},q=function(t){var e=Object(r.useContext)(u),o=Object(r.useReducer)(X,0)[1];return Object(r.useLayoutEffect)((function(){for(var r=0;r<t.length;r++)e.on(t[r],o);return function(){for(var r=0;r<t.length;r++)e.off(t[r],o)}}),t),e},J=o(42),Q=o.n(J),Y=["#columns"],$=Y.concat("tbody-column-widths-changed"),tt=Object(r.memo)((function(t){var e=t.useTbodyWidths,o=q(e?$:Y),r=o.columns,n=o.tbodyColumnWidths;return Object(K.c)("colgroup",null,r.map((function(t,o,r){var a=t.dataKey,s=t.background,l=t.visibility,i=t.border,c=t.width;return"hidden"!==l?Object(K.c)("col",{key:a,style:{width:e?n[o]:c,background:s,border:i}}):null})))})),et=["#columns","#scrollLeft","#widgetWidth","tbody-column-widths"],ot=function(t){var e=t.children,o=Object(a.a)(t,["children"]),r=q(et),s=r.scrollLeft,l=r.columns,i=r.tbodyColumnWidths,c={marginLeft:-s,width:Q()(i)};return Object(K.c)("table",Object(n.a)({},o,{style:c,"aria-colcount":l.length}),Object(K.c)(tt,{useTbodyWidths:!0}),e)},rt=["#columns","sort-params-changed"],nt={1:"ascending","-1":"descending"},at=Object(r.memo)((function(){var t=q(rt),e=t.columns,o=t.sortColumnIndex,r=t.sortDirectionSign;return e.map((function(t,e){var n=t.dataKey,a=t.title,s=t.sort,l=t.label;return"hidden"===t.visibility?null:Object(K.c)("th",{key:n,title:a,"data-sortable":s?"":void 0,"aria-colindex":e+1,"aria-sort":o!==e?"none":nt[r]},l)}))})),st=[],lt=Object(r.memo)((function(t){var e=t.trRef,o=(t.getCellStyle,Object(a.a)(t,["trRef","getCellStyle"])),s=q(st),l=Object(r.useCallback)((function(t){var e=parseInt(t.target.getAttribute("aria-colindex"),10)-1;if(s.columns[e].sort){var o="ascending"===t.target.getAttribute("aria-sort")?-1:1;s.setSortParams(e,o)}}),[]);return Object(K.c)("thead",Object(n.a)({},o,{onClick:l}),Object(K.c)("tr",{ref:e},Object(K.c)(at,null)))})),it=["#columns","#totals","totals-calculated"],ct=function(t){var e=t.TotalsCellComponent,o=q(it),r=o.columns,n=o.totals,a=o.totalsCache;return r.map((function(t,o){var r=t.dataKey,s=t.formatTotal;if("hidden"===t.visibility)return null;var l=n[r],i=a[r];return Object(K.c)("td",{key:r,"aria-colindex":o+1},Object(K.c)(e,{cellTotals:l,totalsCache:i,formatTotal:s}))}))};ct.propTypes={};var ut=Object(r.memo)(ct),dt=Object(r.memo)((function(t){var e=t.className,o=t.trRef,r=t.TotalsCellComponent;return Object(K.c)("tfoot",{className:e},Object(K.c)("tr",{ref:o},Object(K.c)(ut,{TotalsCellComponent:r})))})),ft=["#startIndex","#endIndex","#columns","#rowsOrder","#rowKeyGetter","#rowDataGetter"],ht=function(t){var e=t.getRowExtraProps,o=t.getCellExtraProps,n=t.RowComponent,a=t.CellComponent,s=q(ft);return Object(r.useEffect)((function(){s.reportRowsRendered()})),function(t,e,o,r,n,a,s,l,i,c){for(var u,d,f=[];e<o;e++)d=t[e],u=a?a(d):d,f.push(Object(K.c)(i,{getRowExtraProps:s,getCellExtraProps:l,rowIndex:e,rowDataIndex:d,key:u,columns:r,getRowData:n,CellComponent:c}));return f}(s.orderedRows,s.startIndex,s.endIndex,s.columns,s.rowDataGetter,s.rowKeyGetter,e,o,n,a)},mt=Object(r.memo)((function(t){var e=t.getRowExtraProps,o=t.getCellExtraProps,r=t.tbodyRef,n=t.RowComponent,a=t.CellComponent;return Object(K.c)("tbody",{ref:r},Object(K.c)(ht,{getRowExtraProps:e,getCellExtraProps:o,RowComponent:n,CellComponent:a}))})),wt=["#totalRows","#columns"],bt=function(t){var e=t.fixedLayout,o=Object(a.a)(t,["fixedLayout"]),r=q(wt),s={tableLayout:e?"fixed":"auto",minWidth:"100%"};return Object(K.c)("table",Object(n.a)({},o,{"aria-rowcount":r.totalRows,style:s,"aria-colcount":r.columns.length}))},gt=function(t){var e=Object(r.useRef)(),o=Object(r.useRef)(),n=e.current;return n||(n=e.current=new ResizeObserver((function(e){for(var o,r=0;r<e.length;r++){var n=e[r],a=n.target,s=n.contentRect;o=parseInt(a.getAttribute("aria-colindex")),t.tbodyColumnWidths[o-1]=Math.round(s.width)}t.emit("tbody-column-widths-changed")}))),Object(r.useEffect)((function(){if(o.current){for(var t=o.current.firstElementChild;t;t=t.nextElementSibling)n.observe(t);return function(){n.disconnect()}}}),[o.current]),o},pt=["#virtualTopOffset"],Ct=Object(r.memo)((function(t){var e=t.Component,o=q(pt).virtualTopOffset;return Object(K.c)(e,{className:"afvscr-scroller","aria-hidden":"true",style:{height:o}})})),Rt=function(){return Object(K.c)("tbody",{className:"afvscr-scroller","aria-hidden":"true"},Object(K.c)(Ct,{Component:"tr"}))},vt=["#widgetScrollHeight"],Ot=Object(K.c)("div",{"aria-hidden":"true",className:"afvscr-height-provider"}),jt=Object(r.memo)((function(){var t={style:{height:q(vt).widgetScrollHeight}};return Object(r.cloneElement)(Ot,t)})),xt=[],yt=Object(r.forwardRef)((function(t,e){var o=t.className,s=t.children,l=t.onScroll,i=t.reportScrollLeft,c=Object(a.a)(t,["className","children","onScroll","reportScrollLeft"]),u=q(xt),d=Object(r.useCallback)((function(t){var e=t.target,o=e.scrollTop,r=e.scrollLeft;u.set("scrollTop",o),i&&u.set("scrollLeft",r),l&&l(t)}),[l,i]);return Object(r.useEffect)((function(){var t=e.current,o=new ResizeObserver((function(t){if(1===t.length){var e=t[0].contentRect,o=e.width,r=e.height;u.set("widgetHeight",Math.round(r)).set("widgetWidth",Math.round(o))}}));return o.observe(t),function(){o.unobserve(t)}}),[]),Object(K.c)("div",Object(n.a)({tabIndex:"0",className:U("afvscr-scroll-container",o),ref:e,onScroll:d},c),Object(K.c)(jt,null),s)})),It=["#headlessMode","#totals"],Et=Object(r.memo)((function(t){var e=t.className,o=t.tbodyRef,s=t.scrollContainerRef,l=t.getRowExtraProps,i=t.getCellExtraProps,c=t.RowComponent,u=t.CellComponent,d=t.TotalsCellComponent,f=t.fixedLayout,h=t.onScroll,m=Object(a.a)(t,["className","tbodyRef","scrollContainerRef","getRowExtraProps","getCellExtraProps","RowComponent","CellComponent","TotalsCellComponent","fixedLayout","onScroll"]),w=q(It),b=w.headlessMode,g=w.totals,p=gt(w);return Object(K.c)("div",Object(n.a)({className:U("afvscr-nonst",e)},m),b?null:Object(K.c)(ot,{className:"afvscr-nonst-subtable"},Object(K.c)(lt,null)),Object(K.c)(yt,{ref:s,onScroll:h,reportScrollLeft:!0},Object(r.useMemo)((function(){return Object(K.c)(bt,{fixedLayout:f},Object(K.c)(tt,null),b?null:Object(K.c)(lt,{className:"afvscr-hdnwrp",trRef:p}),g&&Object(K.c)(dt,{TotalsCellComponent:d,className:"afvscr-hdnwrp",trRef:b?p:void 0}),Object(K.c)(Rt,null),Object(K.c)(mt,{tbodyRef:o,getRowExtraProps:l,getCellExtraProps:i,RowComponent:c,CellComponent:u}))}),[g,b,f,l,i,c,u,d])),g&&Object(K.c)(ot,{className:"afvscr-nonst-subtable"},Object(K.c)(dt,{TotalsCellComponent:d})))})),Tt=["#headlessMode","#totals"],St=Object(r.memo)((function(t){var e=t.tbodyRef,o=t.scrollContainerRef,s=t.getRowExtraProps,l=t.getCellExtraProps,i=t.RowComponent,c=t.CellComponent,u=t.TotalsCellComponent,d=t.fixedLayout,f=t.className,h=Object(a.a)(t,["tbodyRef","scrollContainerRef","getRowExtraProps","getCellExtraProps","RowComponent","CellComponent","TotalsCellComponent","fixedLayout","className"]),m=q(Tt),w=m.headlessMode,b=m.totals;return Object(K.c)(yt,Object(n.a)({ref:o,reportScrollLeft:!0,className:U("afvscr-st",f)},h),Object(r.useMemo)((function(){return Object(K.c)(bt,{fixedLayout:d},Object(K.c)(tt,null),w?null:Object(K.c)(lt,null),Object(K.c)(Rt,null),Object(K.c)(mt,{tbodyRef:e,getRowExtraProps:s,getCellExtraProps:l,RowComponent:i,CellComponent:c}),b&&Object(K.c)(dt,{TotalsCellComponent:u}))}),[w,d,b,s,l,i,c,u]))})),Nt={fixedSize:!1,rowCount:0,overscanRowsCount:4},Ht=function(t){var e=t.fixedSize,o=t.columns,s=t.totals,l=t.getRowData,i=t.getRowKey,f=t.getRowExtraProps,h=t.getCellExtraProps,m=t.rowCount,w=t.overscanRowsCount,b=t.rowCountWarningsTable,g=t.headless,p=t.RowCountWarningContainer,C=t.dataRef,R=t.useStickyIfPossible,v=t.className,O=Object(a.a)(t,["fixedSize","columns","totals","getRowData","getRowKey","getRowExtraProps","getCellExtraProps","rowCount","overscanRowsCount","rowCountWarningsTable","headless","RowCountWarningContainer","dataRef","useStickyIfPossible","className"]),j=Object(r.useRef)(),x=Object(r.useRef)(),y=d(e?P:W,C);Object(r.useEffect)((function(){y.merge({headlessMode:g,rowDataGetter:l,rowKeyGetter:i,overscanRowsCount:w,totals:s,columns:o,totalRows:Math.max(m,0),rowsContainerNode:x.current,scrollContainerNode:j.current})}));var I=g&&!s||R&&c()?St:Et;return Object(K.c)(u.Provider,{value:y},m>0?Object(K.c)(I,Object(n.a)({className:U("afvscr-table-wrapper",v),scrollContainerRef:j,getRowExtraProps:f,getCellExtraProps:h,tbodyRef:x},O)):b?Object(K.c)(p,null,b[m]):null)};Ht.propTypes={},Ht.defaultProps=Object.assign({},Nt,{fixedLayout:!1,headless:!1,RowComponent:Object(r.memo)(A),CellComponent:F,TotalsCellComponent:_,RowCountWarningContainer:Z});var Pt=Object(r.memo)(Ht),Dt=o(58),Wt=o.n(Dt),Lt=o(62),kt=o.n(Lt),Mt=o(92),Kt=o.n(Mt);var Gt={name:"1ara9wg-tableCss",styles:"th,tfoot td{background:#fff;};label:tableCss;"},At=[{dataKey:"rowIndex",label:"Row index",getCellData:function(t,e){return e}},{dataKey:"num",label:"Numeric",sort:"numeric"},{dataKey:"str",label:"String",sort:"locale"},{dataKey:"rect",label:"Rectangle",render:function(t){return Object(K.c)("div",{style:{lineHeight:t+"px",background:"hsl("+Wt()(0,360)+",50%,50%)"}},"height: ",t,"px")}}],Vt=kt()(1e5,(function(){return{num:Wt()(1,2e4),str:Kt.a.name.findName(),rect:Wt()(50,250)}})),Ft=function(t){return Vt[t]},zt={num:["sum","count"]};e.default=function(t){var e=t.className;return Object(K.c)(Pt,{css:Gt,className:e,useStickyIfPossible:!0,totals:zt,getRowData:Ft,rowCount:1e5,columns:At})}}}]);
//# sourceMappingURL=sm.26.5cbf55cff6091ee962ba5bc9e20dfb1b.map