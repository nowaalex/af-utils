/*! For license information please see 38c2d2937a34197abe4a.js.LICENSE.txt */
(self.webpackChunkaf_virtual_scroll=self.webpackChunkaf_virtual_scroll||[]).push([[796],{67175:(t,e,s)=>{"use strict";s.d(e,{Z:()=>i});const i=(0,s(67294).createContext)()},78611:(t,e,s)=>{"use strict";s.d(e,{Z:()=>g});var i=s(19756),r=s(85893),h=s(67294),o=s(32857),n=s(1531),a=s(26593);const c="a2uMg3Zj4kpPT6J8EoqLx";var l=s(92549);const u=[l.IC,l.Dj],d=()=>(0,a.Z)((t=>(0,r.jsx)("div",{className:c,style:{height:t.widgetScrollHeight+t.extraStickyHeight}})),u),f="_3Jl24WrVf4wfsfDMBe4LVm",g=t=>{let{className:e,children:s}=t,a=(0,i.Z)(t,["className","children"]);const c=(0,h.useRef)(),l=(0,n.Z)();return(0,h.useEffect)((()=>{const t=c.current;l.setScrollContainerNode(t);const e=new ResizeObserver((t=>{l.setWidgetHeight(Math.round(t[0].contentRect.height))}));return e.observe(t),()=>e.unobserve(t)}),[]),(0,r.jsxs)("div",Object.assign({},a,{tabIndex:"0",className:(0,o.Z)(f,e),ref:c,onScroll:t=>l.setScrollTop(t.target.scrollTop),children:[(0,r.jsx)(d,{}),s]}))}},92549:(t,e,s)=>{"use strict";s.d(e,{Vd:()=>i,wN:()=>r,XW:()=>h,IC:()=>o,Dj:()=>n,k_:()=>a});const i=0,r=1,h=2,o=3,n=4,a=5},1531:(t,e,s)=>{"use strict";s.d(e,{Z:()=>h});var i=s(67294),r=s(67175);const h=()=>(0,i.useContext)(r.Z)},55089:(t,e,s)=>{"use strict";s.d(e,{Z:()=>r});var i=s(67294);const r=(t,e,s,r,h,o)=>{const n=(0,i.useRef)();let a=n.current;return a instanceof t||(a=n.current=new t),e&&(e.current=a),a.startBatch().setViewParams(s,r,h,o),(0,i.useEffect)((()=>{a.endBatch()})),(0,i.useEffect)((()=>()=>a.destructor()),[a]),a}},26593:(t,e,s)=>{"use strict";s.d(e,{Z:()=>n});var i=s(67294);const r=t=>t+1,h=()=>(0,i.useReducer)(r,0)[1];var o=s(1531);const n=(t,e)=>{const s=(0,i.useRef)(null),r=(0,o.Z)(),n=h();return(0,i.useEffect)((()=>(r.on(n,...e),()=>r.off(n,...e))),e),r.inBatch?r.queue(n):s.current=t(r),s.current}},73462:(t,e,s)=>{"use strict";s.d(e,{Z:()=>o});var i=s(98867),r=s(92549);class h extends i.Z{setRowHeight(t){t!==this.rowHeight&&(this.rowHeight=t,this.remeasure())}constructor(){super(),this.rowHeight=0,this.on(this.measureRowsThrottled,r.XW)}getIndex(t){return this.rowHeight&&Math.trunc(t/this.rowHeight)}getOffset(t){return t*this.rowHeight}measureRows(){var t;this.rowsContainerNode&&this.rowsQuantity&&this.setRowHeight((null==(t=this.rowsContainerNode.firstElementChild)?void 0:t.offsetHeight)||0)}}const o=h},98867:(t,e,s)=>{"use strict";s.d(e,{Z:()=>o});var i=s(92549);const r=class{constructor(){this._E=Array.from({length:i.k_},(()=>[])),this._Q=new Set,this.inBatch=0}_on(t,e,s){const i=s?Array.prototype.unshift:Array.prototype.push;for(let s of e)i.call(this._E[s],t);return this}on(t,...e){return this._on(t,e,!1)}prependListener(t,...e){return this._on(t,e,!0)}destructor(){for(let t of this._E)t.splice(0);this._Q.clear()}off(t,...e){for(let s of e)this._E[s].splice(this._E[s].indexOf(t)>>>0,1);return this}queue(t){this._Q.add(t)}emit(t){if(this.inBatch)for(let e of this._E[t])this._Q.add(e);else for(let e of this._E[t])e.call(this);return this}startBatch(){return this.inBatch++,this}endBatch(){if(!--this.inBatch){for(let t of this._Q)t.call(this);this._Q.clear()}return this}},h=(t,e,s)=>{let i=0;const r=()=>{i=0,t.call(s)},h=()=>{0===i&&(i=setTimeout(r,e))};return h.cancel=()=>{clearTimeout(i),i=0},h};const o=class extends r{setScrollContainerNode(t){this.scrollContainerNode=t}setScrollTop(t){t!==this.scrollTop&&(this.scrollTop=t,this.updateVisibleRange())}setWidgetHeight(t){t!==this.widgetHeight&&(this.widgetHeight=t,this.updateEndIndex()),this.measureRowsThrottled()}updateExtraStickyHeight(t){t&&(this.extraStickyHeight+=t,this.emit(i.Dj))}updateEndIndex(){const t=Math.min(this.rowsQuantity,this.getIndex(this.scrollTop+this.widgetHeight)+this.overscanRowsCount);return t!==this.endIndex&&(this.endIndex=t,this.emit(i.wN)),this}updateVisibleRange(){const t=Math.max(0,Math.min(this.rowsQuantity,this.getIndex(this.scrollTop))-this.overscanRowsCount);return t!==this.startIndex&&(this.startIndex=t,this.virtualTopOffset=this.getOffset(t),this.emit(i.Vd)),this.updateEndIndex()}remeasure(){return this.updateWidgetScrollHeight().updateVisibleRange()}constructor(){super(),this.scrollTop=0,this.rowsQuantity=0,this.overscanRowsCount=2,this.widgetHeight=0,this.extraStickyHeight=0,this.estimatedRowHeight=0,this.rowsContainerNode=null,this.scrollContainerNode=null,this.measureRowsThrottled=h(this.measureRows,200,this),this.startIndex=0,this.endIndex=0,this.virtualTopOffset=0,this.widgetScrollHeight=0,this.on(this.updateWidgetScrollHeight,i.XW).on(this.updateEndIndex,i.XW)}destructor(){this.measureRowsThrottled.cancel(),super.destructor()}scrollToRow(t){this.scrollContainerNode&&(this.scrollContainerNode.scrollTop=this.getOffset(t))}updateWidgetScrollHeight(){const t=this.getOffset(this.rowsQuantity);return t!==this.widgetScrollHeight&&(this.widgetScrollHeight=t,this.emit(i.IC)),this}setViewParams(t,e,s,r){this.estimatedRowHeight=t,this.rowsContainerNode=r,this.startBatch(),e!==this.overscanRowsCount&&(this.overscanRowsCount=e,this.queue(this.updateVisibleRange)),s!==this.rowsQuantity&&(this.rowsQuantity=s,this.emit(i.XW)),this.endBatch()}}},16336:(t,e,s)=>{"use strict";s.d(e,{Z:()=>o});var i=s(98867),r=s(92549);class h extends i.Z{constructor(){super(),this.rowHeights=[],this.fTree=[],this.msb=0,this.prependListener(this.grow,r.XW).on(this.measureRowsThrottled,r.Vd,r.wN)}grow(){const{rowsQuantity:t}=this;if(t<0||t>2147483647)throw new Error("Wrong rowsQuantity: "+t+". Must be 0...2_147_483_647.");this.msb=t&&1<<31-Math.clz32(t);const e=this.rowHeights.length;if(t>e){const s=this.rowHeights;this.rowHeights=new Uint32Array(t),this.fTree=new Uint32Array(t+1),this.rowHeights.set(s),this.rowHeights.fill(this.estimatedRowHeight,e),this.fTree.set(this.rowHeights,1);for(let e,s=1;s<=t;s++)e=s+(s&-s),e<=t&&(this.fTree[e]+=this.fTree[s]);this.remeasure()}}getIndex(t){let e=0;for(let s,i=this.msb;0!==i;i>>=1)if(s=e+i,!(s>this.rowsQuantity)){if(t===this.fTree[s])return s;t>this.fTree[s]&&(t-=this.fTree[s],e=s)}return e}getOffset(t){let e=0;for(;t>0;t-=t&-t)e+=this.fTree[t];return e}updateRowHeight(t,e,s){for(;t<s;t+=t&-t)this.fTree[t]+=e}measureRows(){const t=this.rowsContainerNode;if(t){let e,s=this.startIndex,i=0;const r=Math.min(this.fTree.length,1<<32-Math.clz32(this.endIndex-1));for(let h of t.children)e=h.offsetHeight-this.rowHeights[s],e&&(this.rowHeights[s]+=e,i+=e,this.updateRowHeight(s+1,e,r)),s++;i&&(this.updateRowHeight(r,i,this.fTree.length),this.remeasure())}}}const o=h},32857:(t,e,s)=>{"use strict";s.d(e,{Z:()=>i});const i=(t,e)=>e?t+" "+e:t}}]);
//# sourceMappingURL=38c2d2937a34197abe4a.js.map