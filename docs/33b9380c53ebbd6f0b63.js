/*! For license information please see 33b9380c53ebbd6f0b63.js.LICENSE.txt */
(self.webpackChunkaf_virtual_scroll=self.webpackChunkaf_virtual_scroll||[]).push([[747],{89104:(e,t,r)=>{"use strict";r.d(t,{Z:()=>R});var s=r(19756),n=r(85893),a=r(67294),o=(r(45697),r(67175)),d=r(55089),i=r(16336),l=r(73462),c=r(78611),u=r(84625),f=r(92549),h=r(26593);const w=[f.Vd,f.wN],x=({dataRef:e,renderRow:t})=>(0,h.Z)((r=>{const{startIndex:s,endIndex:a,virtualTopOffset:o}=r,d=[];for(let e=s;e<a;e++)d.push(t(e));return(0,n.jsx)("div",{ref:e,style:{transform:`translateY(${o}px)`},children:d})}),w),m=(0,a.memo)(x),v=e=>{let{fixed:t,children:r,estimatedRowHeight:u,rowsQuantity:f,overscanRowsCount:h,dataRef:w}=e,x=(0,s.Z)(e,["fixed","children","estimatedRowHeight","rowsQuantity","overscanRowsCount","dataRef"]);const[v,R]=(0,a.useState)(),Z=(0,d.Z)(t?l.Z:i.Z,w,u,h,f,v);return(0,n.jsx)(o.Z.Provider,{value:Z,children:(0,n.jsx)(c.Z,Object.assign({},x,{children:(0,n.jsx)(m,{dataRef:R,renderRow:r})}))})};v.defaultProps=u.Z;const R=(0,a.memo)(v)},94031:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>w});var s=r(85893),n=r(67294),a=r(89104),o=r(29163),d=r(98913),i=r.n(d),l=r(83608),c=r.n(l);const u=(0,o.ZP)(a.Z)`
    flex: 1 1 20em;
    min-width: 12em;
    max-width: 36em;
`,f=o.ZP.div`
    border-top: 1px solid #666;
    color: #000;
    text-align: center;
`,h=2e5,w=()=>{const[e]=(0,n.useState)((()=>i()(h,(()=>c()(50,100)))));return(0,s.jsx)(u,{estimatedRowHeight:75,overscanRowsCount:5,rowsQuantity:h,children:t=>(0,s.jsxs)(f,{style:{lineHeight:`${e[t]}px`,background:`hsl(${11*t%360},60%,60%)`},children:["row ",t,": ",e[t],"px"]},t)})}}}]);
//# sourceMappingURL=33b9380c53ebbd6f0b63.js.map