var A=Object.defineProperty;var G=(e,t,s)=>t in e?A(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s;var r=(e,t,s)=>(G(e,typeof t!="symbol"?t+"":t,s),s);import{r as o,j as m}from"./client-CTX9W2TG.js";const u={RANGE:0,SCROLL_SIZE:1,SIZES:2},_=[0,1,2],R=e=>e(),W=(e,t)=>{if(!e)throw Error(t)},X=(e,t)=>{if(e instanceof HTMLElement){const s=new ResizeObserver(t);return s.observe(e),()=>s.disconnect()}return t(),addEventListener("resize",t),()=>removeEventListener("resize",t)},Y=(e,t,s)=>{const i=new Uint32Array(t);return i.set(e),i.fill(s,e.length),i},Z=(e,t)=>{e.set(t,1);for(let s,i=1,n=e.length;n>i;i++)s=i+(i&-i),n>s&&(e[s]+=e[i])},x=(e,t,s,i)=>{for(;i>t;t+=t&-t)e[t]+=s},N=(e,t,s)=>{for(;s>t;t+=t&-t);return Math.min(t,e.length)},y=(e,t)=>e.getBoundingClientRect()[t],U=(e,t,s,i)=>t&&e&&e!==t?e[s]+Math.round(y(t,i)-(e instanceof HTMLElement?y(e,i):0)):0,g=new Set,a={t:0,i(){this.t++},h(){--this.t==0&&(g.forEach(R),g.clear())},o:e=>g.add(e)},O={box:"border-box"},w=new Uint32Array(0),E=2147483647,I=["offsetHeight","offsetWidth","innerHeight","innerWidth"],$=["scrollTop","scrollLeft","scrollY","scrollX"],b=["blockSize","inlineSize"],C=["top","left"],M=(e,t)=>Math.round(e.borderBoxSize[0][t]);let D=class{constructor(t){r(this,"l",I[0]);r(this,"_",$[0]);r(this,"u",b[0]);r(this,"m",C[0]);r(this,"S",0);r(this,"v",0);r(this,"T",0);r(this,"p",0);r(this,"M",0);r(this,"O",0);r(this,"I",0);r(this,"R",0);r(this,"k",6);r(this,"L",40);r(this,"C",null);r(this,"H",null);r(this,"F",w);r(this,"K",w);r(this,"A",0);r(this,"horizontal",!1);r(this,"scrollSize",0);r(this,"from",0);r(this,"to",0);r(this,"sizesHash",0);r(this,"P",new Map);r(this,"U",new Map);r(this,"W",[null,null]);r(this,"G",[0,0]);r(this,"Z",new ResizeObserver(t=>{let s=0;for(const i of t){const n=this.W.indexOf(i.target);if(n!==-1){const h=M(i,this.u)-this.G[n];this.G[n]+=h,s+=h}}this.q(s)}));r(this,"N",new ResizeObserver(t=>{let s=0,i=!1;const n=N(this.K,this.from+1,this.to);for(const h of t){const l=this.P.get(h.target);if(n>l){const c=M(h,this.u)-this.F[l];c&&(i=!0,this.F[l]+=c,s+=c,x(this.K,l+1,c,n))}}i&&(a.i(),s!==0&&(x(this.K,n,s,this.K.length),this.scrollSize+=s,this.X(1),0>s&&this.Y()),this.sizesHash=this.sizesHash+1&E,this.X(2),a.h())}));r(this,"$",_.map(()=>[]));r(this,"B",()=>{const t=this.C[this.l]-this.O;t!==this.R&&(this.R=t,this.updateScrollerOffset(),this.Y())});r(this,"D",()=>{});r(this,"st",t=>{this.S=t.timeStamp,this.V()});t&&(this.horizontal=!!t.horizontal,this.M=t.estimatedScrollElementOffset||0,this.R=t.estimatedWidgetSize??200,this.set(t))}j(){const t=this.horizontal?1:0,s=t+2*(this.C instanceof HTMLElement?0:1);this.l=I[s],this._=$[s],this.u=b[t],this.m=C[t]}q(t){t&&(this.O+=t,this.R-=t,this.Y())}on(t,s){return s.forEach(i=>this.$[i].push(t)),()=>s.forEach(i=>this.$[i].splice(this.$[i].indexOf(t)>>>0,1))}X(t){this.$[t].forEach(a.t===0?R:a.o)}getIndex(t){if(0>=t)return 0;if(t>=this.scrollSize)return this.I-1;let s=0;for(let i=this.A,n=0;i>0;i>>=1)n=s+i,n<=this.I&&t>this.K[n]&&(s=n,t-=this.K[n]);return s}getOffset(t){let s=0;for(;t>0;t-=t&-t)s+=this.K[t];return s}getSize(t){return this.F[t]}get visibleFrom(){const t=this.J;return t+(this.p-this.getOffset(t))/this.F[t]}V(){const t=this.p,s=Math.round(this.C[this._])-this.M;s!==t&&(this.p=s,s>t?this.Y():this.tt())}setScroller(t){var s;t!==this.C&&(clearInterval(this.v),clearTimeout(this.T),this.D(),(s=this.C)==null||s.removeEventListener("scroll",this.st),this.C=t,t&&(this.j(),this.D=X(t,this.B),t.addEventListener("scroll",this.st,{passive:!0}),this.updateScrollerOffset(),this.V()))}setContainer(t){t!==this.H&&(this.H=t,this.updateScrollerOffset())}updateScrollerOffset(){clearTimeout(this.T),this.T=setTimeout(()=>{if(this.C){const t=U(this.C,this.H,this._,this.m),s=t-this.M;s&&(this.M=t,this.p-=s,this.V())}},256)}el(t,s){const i=this.U.get(t);i&&(this.U.delete(t),this.P.delete(i),this.N.unobserve(i)),s&&(this.P.set(s,t),this.U.set(t,s),this.N.observe(s,O))}it(t,s){const i=this.W[t];i&&(this.Z.unobserve(i),this.q(-this.G[t]),this.W[t]=null,this.G[t]=0),s&&(this.W[t]=s,this.Z.observe(s,O))}setStickyHeader(t){this.it(0,t)}setStickyFooter(t){this.it(1,t)}get J(){return this.getIndex(this.p)}get et(){return this.I&&1+this.getIndex(this.p+this.R)}Y(){const{et:t}=this;t>this.to&&(this.to=Math.min(this.I,t+this.k),this.from=this.J,this.X(0))}tt(){const{J:t}=this;t<this.from&&(this.from=Math.max(0,t-this.k),this.to=this.et,this.X(0))}scrollToOffset(t,s){var i;(i=this.C)==null||i.scroll({[this.m]:this.M+t,behavior:s?"smooth":"instant"})}scrollToIndex(t,s){clearInterval(this.v);let i=5;this.v=setInterval(()=>{if(!s||performance.now()-this.S>128){--i||clearInterval(this.v);const n=Math.trunc(t),h=Math.min(this.scrollSize-this.R,this.getOffset(n)+Math.round(this.F[n]*(t-n)));this.scrollToOffset(h,s)}},s?50:16)}setItemCount(t){if(this.I!==t){if(a.i(),W(E>=t,`itemCount must be <= 2147483647. Got: ${t}.`),this.I=t,this.A=t&&1<<31-Math.clz32(t),t>this.F.length){const s=Math.min(t+32,E);this.F=Y(this.F,s,this.L||40),this.K=new Uint32Array(s+1),Z(this.K,this.F)}this.scrollSize=this.getOffset(t),this.X(1),this.to>t&&(this.to=-1),this.Y(),a.h()}}set(t){t.estimatedItemSize&&(this.L=t.estimatedItemSize),t.overscanCount!==void 0&&(this.k=t.overscanCount),t.itemCount!==void 0&&this.setItemCount(t.itemCount)}};var L={exports:{}},j={};/**
 * @license React
 * use-sync-external-store-shim.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var d=o;function V(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var q=typeof Object.is=="function"?Object.is:V,B=d.useState,J=d.useEffect,P=d.useLayoutEffect,Q=d.useDebugValue;function tt(e,t){var s=t(),i=B({inst:{value:s,getSnapshot:t}}),n=i[0].inst,h=i[1];return P(function(){n.value=s,n.getSnapshot=t,z(n)&&h({inst:n})},[e,s,t]),J(function(){return z(n)&&h({inst:n}),e(function(){z(n)&&h({inst:n})})},[e]),Q(s),s}function z(e){var t=e.getSnapshot;e=e.value;try{var s=t();return!q(e,s)}catch{return!0}}function et(e,t){return t()}var st=typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"?et:tt;j.useSyncExternalStore=d.useSyncExternalStore!==void 0?d.useSyncExternalStore:st;L.exports=j;var it=L.exports;const nt=(e,t)=>{const s=[];for(let i=e.from,n=e.to;n>i;i++)s.push(t(i));return s},pt=(e,t)=>{const s=[];for(let i=e.from,n=e.to,h=e.getOffset(i);n>i;h+=e.getSize(i),i++)s.push(t(i,h));return s},T={position:"relative",overflow:"hidden",contain:"strict",zIndex:-1},rt={...T,height:"100%"},ht={...T,width:"100%"},H={position:"absolute",contain:"strict",overflow:"hidden",top:0,left:0},ot={...H,display:"flex",height:"100%"},lt={...H,display:"block",width:"100%"},ct=e=>{const[t,s]=o.useState(null),[i,n]=o.useState(null);return o.useLayoutEffect(()=>{if(e&&t&&i){const h=()=>{t.style[e.horizontal?"width":"height"]=e.scrollSize+"px"},l=()=>{const S=e.getOffset(e.from),p=e.getOffset(e.to);i.style.transform=`translate${e.horizontal?"X":"Y"}(${S}px)`,i.style[e.horizontal?"width":"height"]=p-S+"px"},c=e.on(h,[u.SCROLL_SIZE]),v=e.on(l,[u.RANGE,u.SIZES]);return Object.assign(t.style,e.horizontal?rt:ht),Object.assign(i.style,e.horizontal?ot:lt),h(),l(),()=>{c(),v()}}},[e,t,i]),[s,n]};function ft(e){switch(e){case u.RANGE:return this.to**2+this.from;case u.SCROLL_SIZE:return this.scrollSize;default:return this.sizesHash}}const at=(e,t)=>{const[s,i]=o.useMemo(()=>[n=>e.on(n,t),()=>t.map(ft,e).join()],[e,t]);it.useSyncExternalStore(s,i,i)},ut=e=>(at(e.model,e.events),e.children()),gt=e=>{const{model:t,children:s,itemData:i,component:n="div",header:h=null,footer:l=null,getKey:c=f=>f,tabIndex:v=-1,style:S,...p}=e,[K,k]=ct(t);return m.jsxs(n,{...p,style:{overflow:"auto",contain:"strict",...S},ref:o.useCallback(f=>t.setScroller(f),[t]),tabIndex:v,children:[h,m.jsx("div",{ref:K,children:m.jsx("div",{ref:k,children:m.jsx(ut,{model:t,events:[u.RANGE],children:()=>nt(t,f=>m.jsx(s,{model:t,i:f,data:i},c(f,i)))})})}),l]})},F=typeof window<"u"?o.useLayoutEffect:o.useEffect,Et=(e,t)=>F(()=>(e.setScroller(t),()=>e.setScroller(null)),[e,t]),zt=(e,t,s)=>o.useEffect(()=>{if(s)return s(),e.on(s,t)},[e,s,t]),dt=e=>{var t;return(t=o.useRef()).current||(t.current=new D(e))},xt=e=>{const t=dt(e);return F(()=>t.set(e)),t};export{Et as E,zt as I,gt as O,xt as R,nt as d,pt as f,dt as j,u as t,at as v,ct as w,ut as z};
