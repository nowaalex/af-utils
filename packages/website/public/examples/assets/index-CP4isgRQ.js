import{r as n,j as e,R as i,w as f,z as l,t as m,d,c as a}from"./index-1n1vToaV.js";const x="_list_pegmc_1",j="_item_pegmc_5",_="_offset1_pegmc_10",h="_offset2_pegmc_18",o={list:x,item:j,offset1:_,offset2:h},v=n.memo(({i:s,model:c})=>e.jsxs("div",{ref:r=>c.el(s,r),className:o.item,children:["row ",s]})),p=()=>{const s=i({itemCount:5e3}),[c,r]=f(s);return e.jsxs("div",{className:o.list,ref:t=>s.setScroller(t),children:[e.jsx("div",{className:o.offset1,children:"Some offset"}),e.jsxs("div",{children:[e.jsx("div",{className:o.offset2,children:"Some offset 2"}),e.jsx("div",{ref:t=>s.setContainer(t),children:e.jsx("div",{ref:c,children:e.jsx("div",{ref:r,children:e.jsx(l,{model:s,events:[m.RANGE],children:()=>d(s,t=>e.jsx(v,{model:s,i:t},t))})})})})]})]})},R=document.getElementById("root"),g=a(R);g.render(e.jsx(n.StrictMode,{children:e.jsx(p,{})}));