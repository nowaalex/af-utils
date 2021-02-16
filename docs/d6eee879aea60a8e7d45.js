/*! For license information please see d6eee879aea60a8e7d45.js.LICENSE.txt */
(self.webpackChunkaf_virtual_scroll=self.webpackChunkaf_virtual_scroll||[]).push([[747],{89104:(e,t,r)=>{"use strict";r.d(t,{Z:()=>R});var n=r(19756),s=r(67294),a=(r(45697),r(67175)),o=r(55089),d=r(16336),i=r(73462),l=r(78611),c=r(84625),u=r(92549),f=r(26593),h=r(85893);const x=[u.Vd,u.wN],w=({dataRef:e,renderRow:t})=>(0,f.Z)((r=>{const{startIndex:n,endIndex:s,virtualTopOffset:a}=r,o=[];for(let e=n;e<s;e++)o.push(t(e));return(0,h.jsx)("div",{ref:e,style:{transform:`translateY(${a}px)`},children:o})}),x),m=(0,s.memo)(w),v=e=>{let{fixed:t,children:r,estimatedRowHeight:c,rowsQuantity:u,overscanRowsCount:f,dataRef:x,onRangeEndMove:w}=e,v=(0,n.Z)(e,["fixed","children","estimatedRowHeight","rowsQuantity","overscanRowsCount","dataRef","onRangeEndMove"]);const[R,Z]=(0,s.useState)(),p=(0,o.Z)(t?i.Z:d.Z,x,c,f,u,R,w);return(0,h.jsx)(a.Z.Provider,{value:p,children:(0,h.jsx)(l.Z,Object.assign({},v,{children:(0,h.jsx)(m,{dataRef:Z,renderRow:r})}))})};v.defaultProps=c.Z;const R=(0,s.memo)(v)},94031:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>x});var n=r(67294),s=r(89104),a=r(29163),o=r(98913),d=r.n(o),i=r(83608),l=r.n(i),c=r(85893);const u=(0,a.ZP)(s.Z)`
    flex: 1 1 20em;
    min-width: 12em;
    max-width: 36em;
`,f=a.ZP.div`
    border-top: 1px solid #666;
    color: #000;
    text-align: center;
`,h=2e5,x=()=>{const[e]=(0,n.useState)((()=>d()(h,(()=>l()(50,100)))));return(0,c.jsx)(u,{estimatedRowHeight:75,rowsQuantity:h,children:t=>(0,c.jsxs)(f,{style:{lineHeight:`${e[t]}px`,background:`hsl(${11*t%360},60%,60%)`},children:["row ",t,": ",e[t],"px"]},t)})}}}]);
//# sourceMappingURL=d6eee879aea60a8e7d45.js.map