import{r as n,j as t,c as i}from"./client-CTX9W2TG.js";import{R as d,O as l,z as s,t as c}from"./index-Cin6IX-a.js";const a="_row_1q20g_1",x="_bottom0_1q20g_9",_="_top0_1q20g_13",j="_item_1q20g_17",r={row:a,bottom0:x,top0:_,item:j},h=n.memo(({i:e,model:o})=>t.jsxs("div",{ref:m=>o.el(e,m),className:r.item,children:["row ",e]})),p=()=>{const e=d({itemCount:15e4,estimatedItemSize:45});return t.jsx(l,{model:e,header:t.jsx("div",{className:`${r.row} ${r.top0}`,ref:o=>e.setStickyHeader(o),children:t.jsx(s,{model:e,events:[c.RANGE],children:()=>t.jsxs(t.Fragment,{children:["Rendered ",e.to-e.from," items. Range:"," ",e.from," - ",e.to]})})}),footer:t.jsxs("div",{className:`${r.row} ${r.bottom0}`,ref:o=>e.setStickyFooter(o),children:["Scroll size:"," ",t.jsx(s,{model:e,events:[c.SCROLL_SIZE],children:()=>e.scrollSize}),"px"]}),children:h})},f=document.getElementById("root"),S=i(f);S.render(t.jsx(n.StrictMode,{children:t.jsx(p,{})}));
