// Motor de avatares "poporing" (slime píxel-art 32x32), traído de
// github.com/meowrhino/poporingGenerator. Función pura: poporingSvg(code, color)
// → string SVG. Sin DOM, sin animación ni exportaciones (eso sigue allí).
//
// El avatar se guarda como índices separados por punto en el orden de FIELDS
// ("3.0.1.0..."); lo que no se entiende cae al 0 (el slime base).

const W=32,H=32;
const AF={};
let state={};

export const CO={bodyShape:[['round','redondo'],['tall','alto'],['wide','ancho'],['tiny','mini']],bodyTexture:[['normal','normal'],['ghost','fantasma'],['metallic','metal']],bodyPattern:[['none','liso'],['stripes','rayas'],['spots','lunares'],['bicolor','mitad']],bodyFx:[['none','nada'],['fire','fuego'],['ice','hielo'],['electric','rayo']],eyes:[['classic','clásicos'],['round','redondos'],['dot','puntos'],['sleepy','sueño'],['star','estrella'],['heart','corazón'],['dead','ko'],['angry','enfado'],['sparkle','brillo'],['wink','guiño']],mouth:[['smile','sonrisa'],['open','abierta'],['smirk','pícara'],['frown','mueca'],['tongue',':P'],['o','O'],['cat',':3'],['teeth','dientes']],cheeks:[['none','nada'],['blush','rubor'],['freckles','pecas'],['tears','lágrimas']],headTop:[['none','nada'],['leaf','hoja'],['droplet','gota'],['spike','pincho'],['antenna','antena']],headwear:[['none','nada'],['bow','lazo'],['crown','corona'],['witch','bruja'],['santa','gorro'],['party','fiesta'],['mushroom','seta'],['flower','flor'],['halo','halo'],['headphones','cascos']],ears:[['none','nada'],['cat','gato'],['bunny','conejo'],['bear','oso']],wings:[['none','nada'],['angel','ángel'],['demon','demonio']],heldItem:[['none','nada'],['sword','espada'],['shield','escudo'],['staff','vara'],['potion','poción'],['heart','corazón'],['star','estrella'],['fork','tenedor']],effect:[['none','nada'],['sparkles','chispas'],['hearts','corazones'],['music','música'],['zzz','zzz'],['anger','ira'],['sweat','sudor'],['question','?']],aura:[['none','nada'],['holy','santa'],['dark','oscura'],['fire','fuego'],['ice','hielo']]};
export const FIELDS=Object.keys(CO);
const FIXED={outlineStyle:'classic',bubble:'none',animation:'none'};

export function decode(code){
  const idx=String(code??'').split('.');
  const s={...FIXED};
  FIELDS.forEach((f,i)=>{const n=+idx[i];s[f]=CO[f][n>=0&&n<CO[f].length?n:0][0];});
  return s;
}
export function encode(s){return FIELDS.map(f=>Math.max(0,CO[f].findIndex(o=>o[0]===s[f]))).join('.');}
export function randomCode(){return FIELDS.map(f=>Math.floor(Math.random()*CO[f].length)).join('.');}

const h2r=h=>{const c=h.replace('#','');return[parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)];};
const r2h=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const lt=(h,a)=>{const[r,g,b]=h2r(h);return r2h(r+(255-r)*a,g+(255-g)*a,b+(255-b)*a);};
const dk=(h,a)=>{const[r,g,b]=h2r(h);return r2h(r*(1-a),g*(1-a),b*(1-a));};
const mkOL=h=>{const[r,g,b]=h2r(h);return r2h(r*.95+10,g*.75+10,b*.8+15);};
function pal(){
  const c=state.bodyColor,ol=state.outlineStyle==='dark'?dk(c,.6):state.outlineStyle==='none'?null:mkOL(c);
  return{outline:ol,s1:dk(c,.32),s2:dk(c,.16),s3:c,s4:lt(c,.26),s5:lt(c,.5),shine:lt(c,.78),pat:dk(c,.18),
    eye:'#1a1a22',eyeW:'#fff',heart:'#d84050',mouth:'#1a1a22',mouthIn:'#6a2838',tongue:'#d07088',
    cheek:'#e89098',freckle:dk(c,.35),tear:'#80c0f0',tearW:'#c8e8ff',
    leaf:'#7ac06a',leafD:'#3d7a3a',cherry:'#d03030',cherryW:'#ff8080',stem:'#5a3a20',
    spike:dk(c,.45),spikeW:lt(c,.2),antenna:'#808080',antennaT:'#f0e060',droplet:lt(c,.5),dropletW:'#fff',
    bow:'#e05080',bowD:'#a03060',crown:'#f0c830',crownD:'#b08810',gem:'#4080d0',
    witch:'#4a2070',witchD:'#2a1050',witchB:'#f0c830',witchStar:'#f0e060',
    santa:'#d03030',santaD:'#a02020',santaW:'#fff',party:'#40a0e0',partyB:'#f06080',partyC:'#f0c830',partyR:'#fff',
    petal:'#ffe860',petalC:'#e08030',halo:'#f0e060',haloD:'#c0b030',
    mush:'#d03030',mushD:'#fff',mushS:'#e8d8c0',hpB:'#333',hpC:'#e05080',
    wingW:'#e8e8f0',wingD:'#b0b0c0',wingDk:'#303048',wingDkL:'#484860',
    earA:dk(c,.25),earB:dk(c,.45),
    blade:'#c0c0d0',hilt:'#705830',shieldA:'#a0783c',shieldB:'#c09850',staffW:'#805020',staffT:'#60d0f0',
    potionG:'#50b850',potionB:'#e0d0a0',heartI:'#e05060',starI:'#f0d030',forkA:'#a0a0a0',forkB:'#808080',
    effA:'#f0e060',effB:'#e05060',effC:'#80c0f0',effD:'#fff',
    auraHoly:'#f8e870',auraDark:'#5030a0',auraFire:'#f05020',auraFireB:'#f0a040',auraIce:'#90d8f0',
    fxFire:'#f05020',fxFireB:'#f0a040',fxIce:'#90d8f0',fxIceB:'#c0e8ff',fxElec:'#f0e060',fxElecB:'#ffffa0',
    bubW:'#fff',bubB:'#1a1a22',bubSym:'#e05060',
    shadow:'rgba(0,0,0,.2)',metalA:lt(c,.55),
    scnA:'#88b8e0',scnB:'#e0e8f0',scnC:'#f0c0c8',scnD:'#a0d8f0',
  };
}

// ── body ────────────────────────────────────────────────────────────────
function baseBP(){switch(state.bodyShape){case'tall':return{cx:16,cy:16,rx:10,ry:13,nT:2,nB:2.5};case'wide':return{cx:16,cy:19,rx:14,ry:9,nT:2,nB:3.5};case'tiny':return{cx:16,cy:22,rx:8,ry:7,nT:2,nB:2.8};default:return{cx:16,cy:17,rx:12,ry:11,nT:2,nB:3};}}
function frameBP(fi){const b=baseBP(),fr=AF[state.animation];if(!fr)return b;const f=fr[fi%fr.length];return{cx:b.cx+(f.ox||0),cy:b.cy+(f.oy||0),rx:Math.round(b.rx*f.sx),ry:Math.round(b.ry*f.sy),nT:b.nT,nB:b.nB};}
function px(g,x,y,c){if(x>=0&&y>=0&&x<W&&y<H)g[y][x]=c;}

// ── grid ────────────────────────────────────────────────────────────────
function buildGrid(bp,fi){
  const{cx,cy,rx,ry,nT,nB}=bp;
  const raw=Array.from({length:H},()=>Array(W).fill(0));
  const clip=Math.min(cy+ry,H-4);
  for(let y=0;y<H;y++){if(y>clip)continue;for(let x=0;x<W;x++){const dx=Math.abs((x+.5-cx)/rx),dy=(y+.5-cy)/ry,n=dy<0?nT:nB;if(Math.pow(dx,n)+Math.pow(Math.abs(dy),n)<1)raw[y][x]=1;}}
  let bL=W,bR=0,bT=H,bB=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(raw[y][x]){if(x<bL)bL=x;if(x>bR)bR=x;if(y<bT)bT=y;if(y>bB)bB=y;}
  const bW=Math.max(1,bR-bL),bH=Math.max(1,bB-bT);
  const g=raw.map(r=>r.map(v=>v?'s3':null));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!raw[y][x])continue;const br=1-((x-bL)/bW*.55+(y-bT)/bH*.45);g[y][x]=br>.78?'s5':br>.58?'s4':br>.38?'s3':br>.2?'s2':'s1';}
  const hlx=cx-rx*.3,hly=cy-ry*.35,hlr=Math.max(2,rx*.2),hlry2=Math.max(2,ry*.18);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!g[y][x])continue;const d2=(x+.5-hlx)/hlr,d3=(y+.5-hly)/hlry2;if(d2*d2+d3*d3<1)g[y][x]='shine';}

  // patterns
  if(state.bodyPattern==='stripes')for(let y=bT;y<=bB;y++)if((y-bT)%3===0)for(let x=bL;x<=bR;x++)if(g[y][x]&&g[y][x]!=='shine')g[y][x]='pat';
  else if(state.bodyPattern==='spots')for(let y=bT+1;y<bB;y++)for(let x=bL+1;x<bR;x++)if((x*7+y*13)%11===0&&g[y][x]&&g[y][x]!=='shine')g[y][x]='pat';
  else if(state.bodyPattern==='bicolor'){const sp=bT+Math.round((bB-bT)*.55);for(let y=sp;y<=bB;y++)for(let x=0;x<W;x++)if(g[y][x]&&g[y][x]!=='shine')g[y][x]='pat';}
  if(state.bodyTexture==='metallic')for(let y=bT+2;y<bB-1;y+=3)for(let x=bL+2;x<bR-1;x+=4)if(g[y][x]&&g[y][x]!=='outline')g[y][x]='metalA';

  // body FX
  if(state.bodyFx!=='none'){
    for(let y=bT;y<=bB;y++)for(let x=bL;x<=bR;x++){
      if(!raw[y][x])continue;
      let near=false;for(const[dx2,dy2]of[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]){const nx=x+dx2,ny=y+dy2;if(nx<0||ny<0||nx>=W||ny>=H||!raw[ny][nx]){near=true;break;}}
      if(!near)continue;
      const h2=(x*3+y*7+(fi||0)*5)%7;
      if(state.bodyFx==='fire'&&h2<2)g[y][x]=h2===0?'fxFire':'fxFireB';
      else if(state.bodyFx==='ice'&&h2<2)g[y][x]=h2===0?'fxIce':'fxIceB';
      else if(state.bodyFx==='electric'&&h2<1)g[y][x]='fxElec';
    }
  }

  // outline
  if(state.outlineStyle!=='none')for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!g[y][x])continue;for(const[dx2,dy2]of[[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx2,ny=y+dy2;if(nx<0||ny<0||nx>=W||ny>=H||!raw[ny][nx]){g[y][x]='outline';break;}}}

  const eyeY=Math.round(cy-ry*.18),gap=Math.max(2,Math.round(rx*.28));
  const info={cx,cy,rx,ry,bT,bB,bL,bR,eL:{x:cx-gap-1,y:eyeY},eR:{x:cx+gap,y:eyeY},mo:{x:cx,y:Math.round(cy+ry*.15)},raw};
  paintCheeks(g,info);paintEyes(g,info);paintMouth(g,info);paintHeadTop(g,info);paintHeadwear(g,info);paintEars(g,info);paintWings(g,info);paintHeldItem(g,info);paintBubble(g,info);
  return{g,info};
}

// ── features ────────────────────────────────────────────────────────────
const EYE={classic:[[0,0,'eye'],[1,0,'eyeW'],[0,1,'eye'],[1,1,'eye']],round:[[0,0,'eye'],[1,0,'eye'],[0,1,'eye'],[1,1,'eyeW']],dot:[[0,0,'eye']],sleepy:[[0,0,'eye'],[1,0,'eye'],[2,0,'eye']],star:[[1,0,'eye'],[0,1,'eye'],[1,1,'eye'],[2,1,'eye'],[1,2,'eye']],heart:[[0,0,'heart'],[2,0,'heart'],[0,1,'heart'],[1,1,'heart'],[2,1,'heart'],[1,2,'heart']],dead:[[0,0,'eye'],[2,0,'eye'],[1,1,'eye'],[0,2,'eye'],[2,2,'eye']],sparkle:[[0,0,'eyeW'],[1,0,'eye'],[0,1,'eye'],[1,1,'eyeW']]};
const EYE_A={angry:{l:[[1,0,'eye'],[0,1,'eye'],[1,1,'eye'],[0,2,'eye']],r:[[0,0,'eye'],[0,1,'eye'],[1,1,'eye'],[1,2,'eye']]},wink:{l:EYE.classic,r:[[0,0,'eye'],[1,0,'eye']]}};
function paintEyes(g,i){const s=EYE[state.eyes],a=EYE_A[state.eyes];if(!s&&!a)return;const p=(an,ps)=>{for(const[dx,dy,c]of ps)px(g,an.x+dx,an.y+dy,c);};if(a){p(i.eL,a.l);p(i.eR,a.r);}else{p(i.eL,s);p(i.eR,s);}}
const MO={smile:[[-1,0,'mouth'],[0,1,'mouth'],[1,1,'mouth'],[2,0,'mouth']],open:[[0,0,'mouth'],[1,0,'mouth'],[0,1,'mouthIn'],[1,1,'tongue'],[0,2,'mouth'],[1,2,'mouth']],smirk:[[-1,1,'mouth'],[0,0,'mouth'],[1,0,'mouth'],[2,-1,'mouth']],frown:[[-1,1,'mouth'],[0,0,'mouth'],[1,0,'mouth'],[2,1,'mouth']],tongue:[[-1,0,'mouth'],[0,1,'mouth'],[1,1,'mouth'],[2,0,'mouth'],[0,2,'tongue'],[1,2,'tongue']],o:[[0,0,'mouth'],[1,0,'mouth'],[0,1,'mouth'],[1,1,'mouth']],cat:[[-1,0,'mouth'],[0,1,'mouth'],[1,0,'mouth'],[2,1,'mouth'],[3,0,'mouth']],teeth:[[0,0,'mouth'],[1,0,'mouth'],[0,1,'eyeW'],[1,1,'eyeW'],[0,2,'mouth'],[1,2,'mouth']]};
function paintMouth(g,i){const d=MO[state.mouth];if(!d)return;for(const[dx,dy,c]of d)px(g,i.mo.x+dx,i.mo.y+dy,c);}
function paintCheeks(g,i){const sp=Math.round(i.rx*.5),cy=i.eL.y+3;if(state.cheeks==='blush'){px(g,i.cx-sp,cy,'cheek');px(g,i.cx-sp+1,cy,'cheek');px(g,i.cx+sp-1,cy,'cheek');px(g,i.cx+sp,cy,'cheek');}else if(state.cheeks==='freckles'){px(g,i.cx-sp,cy,'freckle');px(g,i.cx-sp+1,cy+1,'freckle');px(g,i.cx+sp,cy,'freckle');px(g,i.cx+sp-1,cy+1,'freckle');}else if(state.cheeks==='tears'){for(let d=0;d<3;d++){px(g,i.eL.x,i.eL.y+2+d,'tear');px(g,i.eR.x+1,i.eR.y+2+d,'tear');}}}
function paintHeadTop(g,i){const t=i.bT,cx=i.cx;if(state.headTop==='leaf'){px(g,cx+1,t-4,'leafD');px(g,cx,t-3,'leaf');px(g,cx+1,t-3,'leafD');px(g,cx-1,t-2,'leaf');px(g,cx,t-2,'leaf');px(g,cx,t-1,'leafD');}else if(state.headTop==='droplet'){px(g,cx-2,t-2,'droplet');px(g,cx,t-3,'dropletW');px(g,cx+2,t-2,'droplet');}else if(state.headTop==='spike'){px(g,cx,t-4,'spike');px(g,cx,t-3,'spikeW');px(g,cx-1,t-2,'spike');px(g,cx,t-2,'spikeW');px(g,cx+1,t-2,'spike');px(g,cx,t-1,'spike');}else if(state.headTop==='antenna'){px(g,cx,t-4,'antennaT');px(g,cx+1,t-4,'antennaT');px(g,cx,t-3,'antenna');px(g,cx,t-2,'antenna');px(g,cx,t-1,'antenna');}}
function paintHeadwear(g,i){const t=i.bT,cx=i.cx,rx=i.rx,hw=state.headwear;if(hw==='none')return;if(hw==='bow'){const bx=cx+rx-2;px(g,bx-1,t,'bow');px(g,bx,t,'bowD');px(g,bx+1,t,'bow');px(g,bx-1,t+1,'bow');px(g,bx+1,t+1,'bow');}else if(hw==='crown'){for(let d=-4;d<=4;d++)px(g,cx+d,t,d%2?'crown':'crownD');for(let d=-3;d<=3;d++)px(g,cx+d,t-1,d%2?'crown':'crownD');px(g,cx-3,t-2,'crown');px(g,cx,t-2,'gem');px(g,cx+3,t-2,'crown');}else if(hw==='witch'){for(let d=-5;d<=5;d++)px(g,cx+d,t,'witchD');for(let d=-4;d<=4;d++)px(g,cx+d,t-1,'witch');for(let d=-4;d<=4;d++)px(g,cx+d,t-2,'witchB');for(let d=-3;d<=3;d++)px(g,cx+d,t-3,'witch');for(let d=-2;d<=2;d++)px(g,cx+d,t-4,'witch');for(let d=-1;d<=1;d++)px(g,cx+d,t-5,'witch');px(g,cx,t-6,'witch');px(g,cx+2,t-4,'witchStar');}else if(hw==='santa'){for(let d=-5;d<=5;d++)px(g,cx+d,t,'santaW');for(let d=-4;d<=4;d++)px(g,cx+d,t-1,'santa');for(let d=-3;d<=3;d++)px(g,cx+d,t-2,'santa');for(let d=-2;d<=2;d++)px(g,cx+d,t-3,'santaD');for(let d=-1;d<=1;d++)px(g,cx+d,t-4,'santaD');px(g,cx,t-5,'santaD');px(g,cx+4,t-4,'santaW');px(g,cx+5,t-5,'santaW');}else if(hw==='party'){for(let d=-4;d<=4;d++)px(g,cx+d,t,'partyR');for(let d=-3;d<=3;d++)px(g,cx+d,t-1,d%2?'party':'partyB');for(let d=-2;d<=2;d++)px(g,cx+d,t-2,d%2?'partyC':'party');for(let d=-1;d<=1;d++)px(g,cx+d,t-3,'partyB');px(g,cx,t-4,'partyR');}else if(hw==='mushroom'){for(let d=-4;d<=4;d++)px(g,cx+d,t-1,'mush');for(let d=-3;d<=3;d++)px(g,cx+d,t-2,'mush');for(let d=-2;d<=2;d++)px(g,cx+d,t-3,'mush');px(g,cx-2,t-2,'mushD');px(g,cx+1,t-2,'mushD');px(g,cx-1,t,'mushS');px(g,cx,t,'mushS');px(g,cx+1,t,'mushS');}else if(hw==='flower'){const fx=cx-rx+1;px(g,fx,t,'petal');px(g,fx+1,t,'petal');px(g,fx-1,t+1,'petal');px(g,fx,t+1,'petalC');px(g,fx+1,t+1,'petalC');px(g,fx+2,t+1,'petal');px(g,fx,t+2,'petal');px(g,fx+1,t+2,'petal');}else if(hw==='halo'){for(let d=-4;d<=4;d++){px(g,cx+d,t-3,'halo');px(g,cx+d,t-1,'halo');}px(g,cx-5,t-2,'haloD');px(g,cx+5,t-2,'haloD');}else if(hw==='headphones'){for(let d=-rx;d<=rx;d++)px(g,cx+d,t-1,'hpB');for(let d=-rx+1;d<=rx-1;d++)px(g,cx+d,t-2,'hpB');for(let d2=0;d2<2;d2++){px(g,i.bL-1,i.eL.y+d2,'hpC');px(g,i.bL-2,i.eL.y+d2,'hpC');px(g,i.bR+1,i.eR.y+d2,'hpC');px(g,i.bR+2,i.eR.y+d2,'hpC');}}}
function paintEars(g,i){if(state.ears==='none')return;const t=i.bT,lx=i.bL,rx2=i.bR;if(state.ears==='cat'){px(g,lx,t-2,'earA');px(g,lx+1,t-2,'earB');px(g,lx,t-1,'earA');px(g,lx+1,t-1,'earA');px(g,rx2,t-2,'earB');px(g,rx2-1,t-2,'earA');px(g,rx2,t-1,'earA');px(g,rx2-1,t-1,'earA');}else if(state.ears==='bunny'){px(g,lx+1,t-5,'earA');px(g,lx+1,t-4,'earA');px(g,lx+1,t-3,'earA');px(g,lx+1,t-2,'earB');px(g,lx+1,t-1,'earB');px(g,rx2-1,t-5,'earA');px(g,rx2-1,t-4,'earA');px(g,rx2-1,t-3,'earA');px(g,rx2-1,t-2,'earB');px(g,rx2-1,t-1,'earB');}else if(state.ears==='bear'){px(g,lx-1,t,'earA');px(g,lx,t,'earA');px(g,lx-1,t-1,'earA');px(g,lx,t-1,'earB');px(g,rx2+1,t,'earA');px(g,rx2,t,'earA');px(g,rx2+1,t-1,'earA');px(g,rx2,t-1,'earB');}}
function paintWings(g,i){if(state.wings==='none')return;const cy=i.cy-2,lx=i.bL,rx2=i.bR;if(state.wings==='angel'){px(g,lx-1,cy,'wingW');px(g,lx-2,cy,'wingW');px(g,lx-3,cy-1,'wingW');px(g,lx-1,cy-1,'wingD');px(g,lx-2,cy-1,'wingW');px(g,lx-1,cy+1,'wingD');px(g,rx2+1,cy,'wingW');px(g,rx2+2,cy,'wingW');px(g,rx2+3,cy-1,'wingW');px(g,rx2+1,cy-1,'wingD');px(g,rx2+2,cy-1,'wingW');px(g,rx2+1,cy+1,'wingD');}else if(state.wings==='demon'){px(g,lx-1,cy,'wingDk');px(g,lx-2,cy,'wingDkL');px(g,lx-3,cy-1,'wingDk');px(g,lx-4,cy-2,'wingDk');px(g,lx-1,cy+1,'wingDk');px(g,lx-2,cy-1,'wingDk');px(g,rx2+1,cy,'wingDk');px(g,rx2+2,cy,'wingDkL');px(g,rx2+3,cy-1,'wingDk');px(g,rx2+4,cy-2,'wingDk');px(g,rx2+1,cy+1,'wingDk');px(g,rx2+2,cy-1,'wingDk');}}
function paintHeldItem(g,i){const h=state.heldItem;if(h==='none')return;const hx=i.bR+2,hy=i.cy;if(h==='sword'){px(g,hx,hy-3,'blade');px(g,hx,hy-2,'blade');px(g,hx,hy-1,'blade');px(g,hx-1,hy,'hilt');px(g,hx,hy,'hilt');px(g,hx+1,hy,'hilt');px(g,hx,hy+1,'hilt');}else if(h==='shield'){px(g,hx,hy-1,'shieldA');px(g,hx+1,hy-1,'shieldA');px(g,hx,hy,'shieldB');px(g,hx+1,hy,'shieldA');px(g,hx,hy+1,'shieldA');px(g,hx+1,hy+1,'shieldA');}else if(h==='staff'){px(g,hx,hy-3,'staffT');px(g,hx,hy-2,'staffW');px(g,hx,hy-1,'staffW');px(g,hx,hy,'staffW');px(g,hx,hy+1,'staffW');}else if(h==='potion'){px(g,hx,hy-1,'potionB');px(g,hx+1,hy-1,'potionB');px(g,hx,hy,'potionG');px(g,hx+1,hy,'potionG');px(g,hx,hy+1,'potionG');px(g,hx+1,hy+1,'potionB');}else if(h==='heart'){px(g,hx,hy-1,'heartI');px(g,hx+2,hy-1,'heartI');px(g,hx,hy,'heartI');px(g,hx+1,hy,'heartI');px(g,hx+2,hy,'heartI');px(g,hx+1,hy+1,'heartI');}else if(h==='star'){px(g,hx+1,hy-2,'starI');px(g,hx,hy-1,'starI');px(g,hx+1,hy-1,'starI');px(g,hx+2,hy-1,'starI');px(g,hx+1,hy,'starI');}else if(h==='fork'){px(g,hx,hy-3,'forkA');px(g,hx-1,hy-3,'forkA');px(g,hx+1,hy-3,'forkA');px(g,hx,hy-2,'forkB');px(g,hx,hy-1,'forkB');px(g,hx,hy,'forkB');}}

// ── speech bubble ───────────────────────────────────────────────────────
function paintBubble(g,i){
  const b=state.bubble;if(b==='none')return;
  const bx=i.cx-2,by=i.bT-6;
  for(let dx=0;dx<5;dx++)px(g,bx+dx,by,'bubW');
  px(g,bx,by+1,'bubW');px(g,bx+4,by+1,'bubW');
  px(g,bx+1,by+1,'bubW');px(g,bx+2,by+1,'bubW');px(g,bx+3,by+1,'bubW');
  for(let dx=0;dx<5;dx++)px(g,bx+dx,by+2,'bubW');
  px(g,i.cx,by+3,'bubW');
  const sym=b==='heart'||b==='star'?(b==='heart'?'bubSym':'starI'):'bubB';
  if(b==='dots'){px(g,bx+1,by+1,sym);px(g,bx+2,by+1,sym);px(g,bx+3,by+1,sym);}
  else px(g,bx+2,by+1,sym);
}

// ── overlays ────────────────────────────────────────────────────────────
function buildOverlays(info,fi){
  const eg=Array.from({length:H},()=>Array(W).fill(null)),e=state.effect,i=info;
  if(e==='sparkles'){const pts=[[3,5],[i.bR+2,i.bT-1],[i.bR+3,i.bT+6]];for(const[sx,sy]of pts){px(eg,sx,sy-1,'effA');px(eg,sx-1,sy,'effA');px(eg,sx,sy,'effA');px(eg,sx+1,sy,'effA');px(eg,sx,sy+1,'effA');}}
  else if(e==='hearts'){const d=(sx,sy)=>{px(eg,sx,sy,'effB');px(eg,sx+2,sy,'effB');px(eg,sx,sy+1,'effB');px(eg,sx+1,sy+1,'effB');px(eg,sx+2,sy+1,'effB');px(eg,sx+1,sy+2,'effB');};d(i.bR+1,i.bT-2);d(2,i.bT+1);}
  else if(e==='music'){const d=(sx,sy)=>{px(eg,sx+1,sy,'effA');px(eg,sx+1,sy+1,'effA');px(eg,sx,sy+2,'effA');px(eg,sx,sy+3,'effA');};d(i.bR+1,i.bT-3);d(i.bR+3,i.bT);}
  else if(e==='zzz'){px(eg,i.bR+1,i.bT-4,'effD');px(eg,i.bR+2,i.bT-4,'effD');px(eg,i.bR+3,i.bT-4,'effD');px(eg,i.bR+2,i.bT-3,'effD');px(eg,i.bR+1,i.bT-2,'effD');px(eg,i.bR+2,i.bT-2,'effD');px(eg,i.bR+3,i.bT-2,'effD');px(eg,i.bR+3,i.bT,'effD');px(eg,i.bR+4,i.bT,'effD');px(eg,i.bR+4,i.bT+1,'effD');px(eg,i.bR+3,i.bT+1,'effD');}
  else if(e==='anger'){const sx=i.bR-1,sy=i.bT;px(eg,sx,sy,'effB');px(eg,sx+2,sy,'effB');px(eg,sx+1,sy+1,'effB');px(eg,sx,sy+2,'effB');px(eg,sx+2,sy+2,'effB');}
  else if(e==='sweat'){const sx=i.bR+1,sy=i.bT;px(eg,sx,sy,'effC');px(eg,sx,sy+1,'effC');px(eg,sx,sy+2,'effC');}
  else if(e==='question'){const sx=i.cx+1,sy=i.bT-5;px(eg,sx,sy,'effD');px(eg,sx+1,sy,'effD');px(eg,sx+1,sy+1,'effD');px(eg,sx,sy+2,'effD');px(eg,sx,sy+4,'effD');}
  if(state.aura!=='none'&&info.raw){for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(info.raw[y]&&info.raw[y][x])continue;let adj=false;for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H&&info.raw[ny]&&info.raw[ny][nx]){adj=true;break;}}if(!adj)continue;const h2=(x*7+y*13+fi*5)%9;if(state.aura==='holy'&&h2<2)px(eg,x,y,'auraHoly');else if(state.aura==='dark'&&h2<3)px(eg,x,y,'auraDark');else if(state.aura==='fire'&&y>info.cy&&h2<2){px(eg,x,y,'auraFire');if(y>0&&!eg[y-1][x])px(eg,x,y-1,'auraFireB');}else if(state.aura==='ice'&&h2<2)px(eg,x,y,'auraIce');}}
  return eg;
}

// ── a SVG (string) ──────────────────────────────────────────────────────
// Une píxeles contiguos del mismo color en una fila (un avatar pasa de ~25 KB a ~6 KB).
function rects(grid,c){let out='';for(let y=0;y<H;y++){let x=0;while(x<W){const k=grid[y][x];const color=k&&c[k];if(!color){x++;continue;}let w=1;while(x+w<W&&grid[y][x+w]===k)w++;out+=`<rect x="${x}" y="${y}" width="${w}" height="1" fill="${color}"/>`;x+=w;}}return out;}
export function poporingSvg(code,color){
  state={...decode(code),bodyColor:/^#[0-9a-f]{6}$/i.test(color||'')?color:'#a6c081'};
  const c=pal();const gd=buildGrid(baseBP(),0);const eg=buildOverlays(gd.info,0);
  const ghost=state.bodyTexture==='ghost'?' opacity="0.55"':'';
  return `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><g${ghost}>${rects(gd.g,c)}</g>${rects(eg,c)}</svg>`;
}
