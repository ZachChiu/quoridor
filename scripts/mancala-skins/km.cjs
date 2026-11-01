/* eslint-disable */
// 試做用的一次性腳本（explore/mancala-skins）：從 scratchpad/mcl/src 的原件取樣、裁主視覺；路徑是相對那個資料夾
const sharp=require('/Users/zach/Desktop/projects/quoridor/node_modules/sharp');
const [f,l,t,w,h,k]=process.argv.slice(2);
(async()=>{const img=sharp(f);const m=await img.metadata();const ex={left:Math.round(+l*m.width),top:Math.round(+t*m.height),width:Math.round(+w*m.width),height:Math.round(+h*m.height)};
const {data,info}=await sharp(f).extract(ex).removeAlpha().resize(120).raw().toBuffer({resolveWithObject:true});
const px=[];for(let i=0;i<data.length;i+=3)px.push([data[i],data[i+1],data[i+2]]);
let K=+k||6,c=px.filter((_,i)=>i%Math.floor(px.length/K)==0).slice(0,K);
for(let it=0;it<20;it++){const s=c.map(()=>[0,0,0,0]);for(const p of px){let b=0,bd=1e9;c.forEach((q,j)=>{const d=(p[0]-q[0])**2+(p[1]-q[1])**2+(p[2]-q[2])**2;if(d<bd){bd=d;b=j}});s[b][0]+=p[0];s[b][1]+=p[1];s[b][2]+=p[2];s[b][3]++}c=s.map((v,j)=>v[3]?[v[0]/v[3],v[1]/v[3],v[2]/v[3]]:c[j]);var cnt=s.map(v=>v[3])}
c.map((q,j)=>[cnt[j],'#'+q.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('')]).sort((a,b)=>b[0]-a[0]).forEach(x=>console.log(x.join(' ')))})()
