const SYSTEMS=[
{name:"Cardiovascular",h:24,r:[["Baroreflex",2],["Bezold–Jarisch reflex",12],["Oculocardiac reflex",15],["Trigeminocardiac reflex",18]]},
{name:"Respiratory",h:66,r:[["Respiratory sinus arrhythmia",4],["Pulmonary stretch reflex",5],["Chemoreflex",8]]},
{name:"Protective",h:5,r:[["Laryngeal closure reflex",3],["Cough reflex",6],["Swallowing reflex",8],["Nausea–vomiting reflex",90]]},
{name:"Gastrointestinal",h:202,r:[["Esophagogastric reflex",45],["Gastric accommodation",120],["Vagovagal gastric reflex",180],["Gastrocolic reflex",300],["Enterogastric reflex",420],["Ileogastric reflex",480]]},
{name:"Metabolic",h:256,r:[["Pancreatic secretory reflex",600],["Satiety reflex",900]]},
{name:"Immune",h:312,r:[["Inflammatory reflex",3600]]}
];

const $=id=>document.getElementById(id);
const c=$("c"),ctx=c.getContext("2d"),slider=$("speed"),speedOut=$("speedOut"),clockOut=$("clock");
const prev=$("prev"),next=$("next"),systemName=$("systemName"),count=$("count"),tip=$("tip"),carousel=$("carousel");
const tour=$("tour"),tt=$("tt"),tx=$("tx"),tc=$("tc"),tn=$("tn");

let W=0,H=0,dpr=1,last=performance.now(),simTime=0,paused=false,active=0;
let view={x:0,y:0,s:1},anim=null,dragging=false,dragStart=null,viewStart=null,moved=false;
let hit=[],ripples=[],cycles=new Map(),touchStart=null,tourStep=0;
const TOTAL=SYSTEMS.length+1;

const speed=()=>3600**(+slider.value/1000);
const sliderValue=x=>Math.log(x)/Math.log(3600)*1000;
const fmtSpeed=x=>x<60?(x<10?x.toFixed(1):Math.round(x))+" s / s":x<3600?((x/60)<10?(x/60).toFixed(1):Math.round(x/60))+" min / s":"1 h / s";
const fmtClock=x=>{x=((x%86400)+86400)%86400;return[Math.floor(x/3600),Math.floor(x%3600/60),Math.floor(x%60)].map(q=>String(q).padStart(2,"0")).join(":")};
const periodLabel=x=>x<60?x+" s":x<3600?Math.round(x/60)+" min":Math.round(x/3600)+" h";
const radius=n=>150+Math.sqrt(n)*28;

function resize(){
  dpr=Math.min(2,devicePixelRatio||1);
  W=innerWidth;H=innerHeight;
  c.width=W*dpr;c.height=H*dpr;c.style.width=W+"px";c.style.height=H+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  select(active,false);
}
addEventListener("resize",resize);

function target(i){
  if(i===SYSTEMS.length)return{s:Math.max(.52,Math.min(.9,Math.min(W/1200,H/760))),x:W/2,y:H/2+40};
  const r=radius(SYSTEMS[i].r.length),mobile=W<760;
  const aw=mobile?W-18:Math.max(520,W-500),ah=mobile?H*.64:H-150;
  const z=Math.max(mobile?1.0:.8,Math.min(mobile?2.55:2.25,Math.min(aw/(r*2.35),ah/(r*2.35))));
  return{s:z,x:mobile?W/2:Math.max(330,W*.42),y:mobile?H*.46:H*.58};
}
function recommended(i){
  if(i===SYSTEMS.length)return 30;
  const periods=SYSTEMS[i].r.map(x=>x[1]).sort((a,b)=>a-b);
  return Math.max(1,Math.min(3600,periods[Math.floor(periods.length/2)]/4));
}
function systemColor(){
  if(active===SYSTEMS.length)return "#dfe5ea";
  return `hsl(${SYSTEMS[active].h} 78% 72%)`;
}
function updateCarousel(){
  systemName.textContent=active===SYSTEMS.length?"All Systems":SYSTEMS[active].name;
  count.textContent=String(active+1).padStart(2,"0")+" / "+String(TOTAL).padStart(2,"0");
  document.documentElement.style.setProperty("--system-color",systemColor());
}
function select(i,animate=true){
  active=(i+TOTAL)%TOTAL;
  updateCarousel();
  slider.value=sliderValue(recommended(active));
  speedOut.textContent=fmtSpeed(speed());
  const q=target(active);
  if(animate)anim={from:{...view},to:q,start:performance.now(),dur:650};
  else Object.assign(view,q);
}
prev.onclick=()=>select(active-1);
next.onclick=()=>select(active+1);

function label(text,x,y,size=15,weight=500,alpha=.95){
  ctx.save();ctx.font=`${weight} ${size}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.shadowColor="#000";ctx.shadowBlur=6;ctx.fillStyle=`rgba(243,245,247,${alpha})`;ctx.fillText(text,x,y);ctx.restore();
}
function wrap(text){
  if(text.length<=20)return[text];
  const words=text.split(" ");let best=[text],score=1e9;
  for(let i=1;i<words.length;i++){const a=words.slice(0,i).join(" "),b=words.slice(i).join(" "),s=Math.abs(a.length-b.length);if(s<score){score=s;best=[a,b]}}
  return best;
}
function comet(x,y,r,a,h,boost=1){
  const norm=Math.min(1,Math.log10(speed()+1)/Math.log10(3601)),tail=(.55+.75*norm)*boost,n=26;
  for(let i=n;i>=0;i--){const f=i/n,q=a-tail*f,px=x+Math.cos(q)*r,py=y+Math.sin(q)*r;ctx.beginPath();ctx.arc(px,py,.8+(1-f)*1.9,0,7);ctx.fillStyle=`hsla(${h},85%,74%,${(1-f)*.62})`;ctx.fill()}
  const hx=x+Math.cos(a)*r,hy=y+Math.sin(a)*r,g=ctx.createRadialGradient(hx,hy,0,hx,hy,11);
  g.addColorStop(0,`hsla(${h},95%,94%,1)`);g.addColorStop(.28,`hsla(${h},90%,78%,.6)`);g.addColorStop(1,`hsla(${h},90%,70%,0)`);
  ctx.beginPath();ctx.arc(hx,hy,11,0,7);ctx.fillStyle=g;ctx.fill();ctx.beginPath();ctx.arc(hx,hy,2.8,0,7);ctx.fillStyle=`hsla(${h},100%,96%,1)`;ctx.fill();
}
function layoutFor(n,cr,full){
  if(full)return{rr:n===1?0:cr*.42,orbit:26,label:34};
  if(n===1)return{rr:0,orbit:cr*.53,label:cr*.18};
  if(n===2)return{rr:cr*.34,orbit:cr*.28,label:cr*.16};
  if(n===3)return{rr:cr*.39,orbit:cr*.23,label:cr*.14};
  if(n===4)return{rr:cr*.43,orbit:cr*.20,label:cr*.13};
  if(n===5)return{rr:cr*.45,orbit:cr*.17,label:cr*.12};
  return{rr:cr*.47,orbit:cr*.145,label:cr*.11};
}
function drawSystem(s,i,ox=0,oy=0,scale=1,full=false){
  const n=s.r.length,cr=radius(n)*scale,L=layoutFor(n,cr,full);
  ctx.beginPath();ctx.arc(ox,oy,cr,0,7);ctx.strokeStyle=`hsla(${s.h},55%,62%,.12)`;ctx.lineWidth=1/view.s;ctx.stroke();
  if(full||W>=760)label(s.name.toUpperCase(),ox,oy-cr-38,full?16:20,650,.92);
  s.r.forEach((rf,j)=>{
    const a=-Math.PI/2+j*Math.PI*2/n,x=ox+Math.cos(a)*L.rr,y=oy+Math.sin(a)*L.rr,p=rf[1];
    const o=full?26+Math.min(12,Math.log10(p+1)*3):L.orbit;
    ctx.beginPath();ctx.arc(x,y,o,0,7);ctx.strokeStyle=`hsla(${s.h},65%,68%,.23)`;ctx.lineWidth=(full?1.2:1.5)/view.s;ctx.stroke();
    comet(x,y,o,(simTime%p)/p*Math.PI*2-Math.PI/2,s.h,full?1:1.12);
    const cycle=Math.floor(simTime/p),key=i+"-"+j,old=cycles.get(key);
    if(old===undefined)cycles.set(key,cycle);else if(cycle>old){cycles.set(key,cycle);ripples.push({x,y,h:s.h,age:0})}
    const lr=o+L.label,lx=x+Math.cos(a)*lr,ly=y+Math.sin(a)*lr,lines=wrap(rf[0]);
    lines.forEach((z,k)=>label(z,lx,ly+(k-(lines.length-1)/2)*(full?16:19),full?13:15,550,.96));
    const sx=view.x+x*view.s,sy=view.y+y*view.s;
    hit.push({x:sx,y:sy,r:(o+18)*view.s,n:rf[0],p,sys:s.name});
  });
}
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(anim){const u=Math.min(1,(now-anim.start)/anim.dur),e=1-(1-u)**3;view.s=anim.from.s+(anim.to.s-anim.from.s)*e;view.x=anim.from.x+(anim.to.x-anim.from.x)*e;view.y=anim.from.y+(anim.to.y-anim.from.y)*e;if(u>=1)anim=null}
  if(!paused)simTime+=dt*speed();
  speedOut.textContent=fmtSpeed(speed());clockOut.textContent=fmtClock(simTime);
  ctx.clearRect(0,0,W,H);hit=[];ctx.save();ctx.translate(view.x,view.y);ctx.scale(view.s,view.s);
  if(active<SYSTEMS.length)drawSystem(SYSTEMS[active],active,0,0,1,false);
  else{
    const pos=[[-300,-180],[0,-220],[300,-150],[260,190],[-40,220],[-320,170]];
    SYSTEMS.forEach((s,i)=>drawSystem(s,i,pos[i][0],pos[i][1],.48,true));
  }
  ripples.forEach(r=>{r.age+=dt;const u=r.age/1.6;ctx.beginPath();ctx.arc(r.x,r.y,24+u*46,0,7);ctx.strokeStyle=`hsla(${r.h},70%,75%,${Math.max(0,.14*(1-u))})`;ctx.lineWidth=1/view.s;ctx.stroke()});
  ripples=ripples.filter(r=>r.age<1.6);ctx.restore();requestAnimationFrame(frame);
}
function tooltip(e){
  const f=hit.find(o=>Math.hypot(e.clientX-o.x,e.clientY-o.y)<=o.r+8);
  if(f){tip.style.display="block";tip.style.left=Math.min(W-320,e.clientX+14)+"px";tip.style.top=Math.min(H-100,e.clientY+14)+"px";tip.innerHTML=`<b>${f.n}</b><span>${f.sys} · dominant period ${periodLabel(f.p)}</span>`}
  else tip.style.display="none";
}
c.onwheel=e=>{e.preventDefault();const wx=(e.clientX-view.x)/view.s,wy=(e.clientY-view.y)/view.s,z=Math.exp(-e.deltaY*.0015);view.s=Math.max(.35,Math.min(4.5,view.s*z));view.x=e.clientX-wx*view.s;view.y=e.clientY-wy*view.s};
c.onpointerdown=e=>{c.setPointerCapture(e.pointerId);dragging=true;moved=false;c.classList.add("dragging");dragStart={x:e.clientX,y:e.clientY};viewStart={x:view.x,y:view.y}};
c.onpointermove=e=>{tooltip(e);if(dragging){const dx=e.clientX-dragStart.x,dy=e.clientY-dragStart.y;if(Math.hypot(dx,dy)>3)moved=true;view.x=viewStart.x+dx;view.y=viewStart.y+dy}};
c.onpointerup=()=>{dragging=false;c.classList.remove("dragging")};
c.onclick=()=>{if(!moved)paused=!paused};

carousel.addEventListener("touchstart",e=>{if(e.touches.length===1)touchStart=e.touches[0].clientX},{passive:true});
carousel.addEventListener("touchend",e=>{if(touchStart===null)return;const end=e.changedTouches[0].clientX,dx=end-touchStart;touchStart=null;if(Math.abs(dx)>38)select(active+(dx<0?1:-1))},{passive:true});

const T=[
["Switch","Use the large arrows—or swipe on this control—to move between physiological systems.",()=>carousel],
["Slide","Use this slider to compress or expand physiological time.",()=>document.querySelector(".controls")]
];
function showTour(){
  const q=T[tourStep],r=q[2]().getBoundingClientRect();
  tt.textContent=q[0];tx.textContent=q[1];tc.textContent=tourStep+1+" / 2";tn.textContent=tourStep===1?"Begin":"Next";
  tour.className="tour show";tour.style.left=Math.max(12,Math.min(W-265,r.left))+"px";tour.style.top=Math.max(12,r.bottom+10)+"px";
}
tn.onclick=()=>{if(tourStep<1){tourStep++;showTour()}else{tour.classList.remove("show");localStorage.setItem("vagusTimeTutorial3","1")}};

resize();select(0,false);
if(!localStorage.getItem("vagusTimeTutorial3"))setTimeout(showTour,500);
requestAnimationFrame(frame);
