/*! For license information please see 4129037d01ed73f98216.js.LICENSE.txt */
(self.webpackChunkaf_virtual_scroll=self.webpackChunkaf_virtual_scroll||[]).push([[31],{6029:(e,r,t)=>{"use strict";t.d(r,{Z:()=>i});var s=t(19756),n=t(67294),a=(t(45697),t(90975)),d=t(24178),l=t(85893);const o=e=>{let{children:r}=e,t=(0,s.Z)(e,["children"]);return(0,l.jsx)(d.Z,Object.assign({},t,{children:e=>(0,l.jsx)(a.Z,{model:e,renderRow:r})}))},i=(0,n.memo)(o)},90975:(e,r,t)=>{"use strict";t.d(r,{Z:()=>c});var s=t(19756),n=t(26593),a=t(92549);const d={spacer:"_2q9_Y-5hrbxfXeVDNj4Bxk"};var l=t(85893);const o=[a.Vd,a.wN],i=Math.random().toString(36),c=e=>{let{model:r,renderRow:t,Spacer:a="div"}=e,c=(0,s.Z)(e,["model","renderRow","Spacer"]);return(0,n.Z)(r,(({startIndex:e,endIndex:r,virtualTopOffset:s,setSpacerNode:n})=>{const o=[(0,l.jsx)(a,{className:d.wrapper,"aria-hidden":"true",style:{height:s},ref:n},i)];for(let s=e;s<r;s++)o.push(t(s,c));return o}),o)}},94031:(e,r,t)=>{"use strict";t.r(r),t.d(r,{default:()=>x});var s=t(67294),n=t(6029),a=t(29163),d=t(98913),l=t.n(d),o=t(83608),i=t.n(o),c=t(85893);const h=(0,a.ZP)(n.Z)`
    flex: 1 1 20em;
    min-width: 12em;
    max-width: 36em;
`,u=a.ZP.div`
    border-top: 1px solid #666;
    color: #000;
    text-align: center;
`,p=2e5,x=()=>{const[e]=(0,s.useState)((()=>l()(p,(()=>i()(50,100)))));return(0,c.jsx)(h,{estimatedRowHeight:75,rowsQuantity:p,children:r=>(0,c.jsxs)(u,{style:{lineHeight:`${e[r]}px`,background:`hsl(${11*r%360},60%,60%)`},children:["row ",r,": ",e[r],"px"]},r)})}}}]);
//# sourceMappingURL=4129037d01ed73f98216.js.map