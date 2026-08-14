const STORE='dart-score-v16-big-scoreboard';const DEFAULT_NAMES=['Marius','Dag Arne','Sven Tore'];
function freshHits(){const h={M:0,Bull:0};for(let i=1;i<=20;i++)h[i]=0;h[25]=0;return h}function freshHitDetail(){const h={};for(let i=1;i<=20;i++)h[i]={S:0,D:0,T:0};h[25]={S:0,D:0,T:0};h.Bull={S:0,D:0,T:0};h.M={M:0};return h}
function newPlayer(name,score=501,inRule='master'){return{name,score,inOpen:inRule==='single',darts:0,total:0,high:0,n180:0,lastSum:0,wins:0,helmet:0,helmetPending:0,yellow:0,hundredPlus:0,weakSum:0,gay:0,busts:0,inAttempts:0,masterHistory:[],hits:freshHits(),hitDetail:freshHitDetail(),todayHits:freshHits(),todayHitDetail:freshHitDetail(),throwsThisGame:0,pilesThrown:0,winner:false}}
function defaultRecords(){return{highestThrow:{player:'-',score:0,date:'-'},highestCheckout:{player:'-',score:0,date:'-'},masterWorst:{player:'-',darts:0,date:'-'}}}
function defaultState(){const now=new Date();return{startScore:501,inRule:'master',outRule:'master',active:0,selected:null,current:[],throws:[],games:[],known:[...DEFAULT_NAMES],allPlayers:{},players:DEFAULT_NAMES.map(n=>newPlayer(n,501,'master')),dailyHigh:0,totalThrows:0,message:'',roastMain:'Klar.',roastSub:'Ingen slipper unna.',shootout:false,shootoutScores:{},shootoutDone:{},shootoutRound:0,settings:{roast:true,helmet:true,shootout:true},records:defaultRecords(),seasonId:`season-${Date.now()}`,seasonName:`Sesong ${now.getFullYear()}`,seasonStartedAt:now.toISOString(),seasonEndedAt:null,seasonActive:true,seasons:[]}}
let state=JSON.parse(localStorage.getItem(STORE)||'null')||defaultState();
function normalizePlayer(p){const base=newPlayer((p&&p.name)||'Spiller',state.startScore||501,state.inRule||'master');const out=Object.assign(base,p||{});out.hits=out.hits||freshHits();out.hitDetail=out.hitDetail||freshHitDetail();out.todayHits=out.todayHits||freshHits();out.todayHitDetail=out.todayHitDetail||freshHitDetail();out.masterHistory=out.masterHistory||[];return out}
function syncPlayersToDB(){state.allPlayers=state.allPlayers||{};(state.players||[]).forEach(p=>state.allPlayers[p.name]=normalizePlayer(p))}
function getAllPlayerNames(){syncPlayersToDB();return[...new Set([...(state.known||[]),...Object.keys(state.allPlayers),...(state.players||[]).map(p=>p.name),...(state.throws||[]).map(t=>t.player)])]}
function getAllPlayerList(){return getAllPlayerNames().map(n=>state.allPlayers[n]||newPlayer(n,state.startScore||501,state.inRule||'master'))}

/* ===== DART SCORE v17 CLOUD / NEON =====
   Neon er "source of truth" når det finnes data i skyen.
   localStorage beholdes som lokal/offline backup.
*/
let cloudSaveTimer=null;
let cloudReady=false;
let cloudSaving=false;
let cloudSaveQueued=false;

async function loadCloudState(){
  try{
    const response=await fetch('/api/state',{method:'GET',cache:'no-store'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);

    const data=await response.json();
    const cloudState=data&&data.ok&&data.state&&typeof data.state==='object'
      ? data.state
      : null;

    if(cloudState&&Object.keys(cloudState).length>0){
      state=cloudState;
      localStorage.setItem(STORE,JSON.stringify(state));
      console.info('DART SCORE: state lastet fra Neon');
      return true;
    }

    console.info('DART SCORE: Neon er tom – bruker lokal state og synkroniserer den opp');
    return false;
  }catch(error){
    console.warn('DART SCORE: kunne ikke laste fra Neon. Bruker localStorage.',error);
    return false;
  }finally{
    cloudReady=true;
  }
}

async function saveCloudState(){
  if(!cloudReady)return;

  if(cloudSaving){
    cloudSaveQueued=true;
    return;
  }

  cloudSaving=true;
  try{
    const snapshot=JSON.parse(JSON.stringify(state));
    const response=await fetch('/api/state',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({state:snapshot})
    });

    if(!response.ok)throw new Error(`HTTP ${response.status}`);
  }catch(error){
    console.warn('DART SCORE: kunne ikke lagre til Neon. Lokal backup er fortsatt lagret.',error);
  }finally{
    cloudSaving=false;
    if(cloudSaveQueued){
      cloudSaveQueued=false;
      saveCloudState();
    }
  }
}

function save(){
  syncPlayersToDB();

  // Lokal/offline backup – skjer umiddelbart.
  localStorage.setItem(STORE,JSON.stringify(state));

  // Sky-lagring – debounce hindrer unødvendige kall fra render().
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer=setTimeout(()=>{
    if(cloudReady)saveCloudState();
  },500);
}

async function resetCloudState(nextState){
  try{
    const response=await fetch('/api/state',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({state:nextState})
    });
    return response.ok;
  }catch(error){
    console.warn('DART SCORE: kunne ikke nullstille Neon-state.',error);
    return false;
  }
}

/* ===== DART SCORE v19 DISPLAY PROFILE =====
   Display mode is intentionally local per device, not synced to Neon.
*/
const DISPLAY_STORE='dart-score-display-v19';

function getDisplayMode(){
  return localStorage.getItem(DISPLAY_STORE)||'auto';
}

function setDisplayMode(mode){
  localStorage.setItem(DISPLAY_STORE,mode);
  applyDisplayMode();
}

function applyDisplayMode(){
  const root=document.documentElement;
  const mode=getDisplayMode();
  root.dataset.display=mode;

  let virtualWidth=0,virtualHeight=0;
  if(mode==='ultrawide3440'){virtualWidth=3440;virtualHeight=1440}
  if(mode==='tablet1920'){virtualWidth=1920;virtualHeight=1200}

  if(virtualWidth&&virtualHeight){
    const scale=Math.min(window.innerWidth/virtualWidth,window.innerHeight/virtualHeight);
    const left=Math.max(0,(window.innerWidth-(virtualWidth*scale))/2);
    const top=Math.max(0,(window.innerHeight-(virtualHeight*scale))/2);
    root.style.setProperty('--virtual-width',virtualWidth+'px');
    root.style.setProperty('--virtual-height',virtualHeight+'px');
    root.style.setProperty('--display-scale',String(scale));
    root.style.setProperty('--display-left',left+'px');
    root.style.setProperty('--display-top',top+'px');
  }else{
    root.style.removeProperty('--virtual-width');
    root.style.removeProperty('--virtual-height');
    root.style.removeProperty('--display-scale');
    root.style.removeProperty('--display-left');
    root.style.removeProperty('--display-top');
  }

  const info=document.getElementById('displayInfo');
  if(info){
    const dpr=window.devicePixelRatio||1;
    info.textContent=`Nettleser: ${window.innerWidth}×${window.innerHeight} CSS-px · DPR ${dpr.toFixed(2)} · fysisk ca. ${Math.round(window.innerWidth*dpr)}×${Math.round(window.innerHeight*dpr)}`;
  }
}
window.addEventListener('resize',applyDisplayMode);

/* ===== DART SCORE v19 SEASONS ===== */
function deepCopy(obj){return JSON.parse(JSON.stringify(obj))}

function currentSeasonSnapshot(){
  syncPlayersToDB();
  return{
    id:state.seasonId,
    name:state.seasonName,
    startedAt:state.seasonStartedAt,
    endedAt:state.seasonEndedAt,
    games:deepCopy(state.games||[]),
    throws:deepCopy(state.throws||[]),
    players:deepCopy(state.allPlayers||{}),
    records:deepCopy(state.records||defaultRecords()),
    totalThrows:state.totalThrows||0
  };
}

function seasonList(){
  const archived=[...(state.seasons||[])].slice().reverse();
  const current={
    id:'current',
    name:state.seasonName+(state.seasonActive?' · AKTIV':' · AVSLUTTET'),
    startedAt:state.seasonStartedAt,
    endedAt:state.seasonEndedAt,
    games:state.games||[],
    throws:state.throws||[],
    players:state.allPlayers||{},
    records:state.records||defaultRecords(),
    totalThrows:state.totalThrows||0,
    current:true
  };
  return[current,...archived];
}

function getHistorySeason(){
  const id=document.getElementById('historySeason')?.value||'current';
  if(id==='current')return seasonList()[0];
  return(state.seasons||[]).find(s=>s.id===id)||seasonList()[0];
}

function endSeason(){
  if(!state.seasonActive)return alert('Sesongen er allerede avsluttet.');
  if(!confirm(`Avslutte ${state.seasonName}? Historikken blir bevart og låst som tidligere sesong.`))return;

  syncPlayersToDB();
  const archived=currentSeasonSnapshot();
  archived.endedAt=new Date().toISOString();
  state.seasons=state.seasons||[];
  state.seasons.push(archived);
  state.seasonEndedAt=archived.endedAt;
  state.seasonActive=false;
  save();
  renderHistory();
  alert(`${state.seasonName} er avsluttet. Du kan nå starte en ny sesong.`);
}

function startNewSeason(){
  if(state.seasonActive){
    return alert('Avslutt aktiv sesong før du starter en ny.');
  }
  const suggested=`Sesong ${new Date().getFullYear()}`;
  const name=prompt('Navn på ny sesong:',suggested);
  if(!name||!name.trim())return;

  const oldKnown=[...(state.known||[])];
  const oldSettings=state.settings;
  const oldSeasons=[...(state.seasons||[])];

  const fresh=defaultState();
  fresh.known=oldKnown;
  fresh.settings=oldSettings;
  fresh.seasons=oldSeasons;
  fresh.seasonId=`season-${Date.now()}`;
  fresh.seasonName=name.trim();
  fresh.seasonStartedAt=new Date().toISOString();
  fresh.seasonEndedAt=null;
  fresh.seasonActive=true;
  fresh.allPlayers={};
  oldKnown.forEach(n=>fresh.allPlayers[n]=newPlayer(n,fresh.startScore,fresh.inRule));
  fresh.players=oldKnown.slice(0,Math.max(2,Math.min(3,oldKnown.length))).map(n=>newPlayer(n,fresh.startScore,fresh.inRule));
  state=fresh;
  save();
  renderHistory();
  alert(`${state.seasonName} er startet.`);
}

function ensure(){
  state.settings=state.settings||defaultState().settings;
  state.records=state.records||defaultRecords();
  state.known=state.known||[...DEFAULT_NAMES];
  state.allPlayers=state.allPlayers||{};
  state.players=state.players||DEFAULT_NAMES.map(n=>newPlayer(n,state.startScore||501,state.inRule||'master'));
  state.seasons=state.seasons||[];
  if(!state.seasonId)state.seasonId=`season-migrated-${Date.now()}`;
  if(!state.seasonName)state.seasonName=`Sesong ${new Date().getFullYear()}`;
  if(!state.seasonStartedAt)state.seasonStartedAt=new Date().toISOString();
  if(typeof state.seasonActive!=='boolean')state.seasonActive=true;
  if(typeof state.seasonEndedAt==='undefined')state.seasonEndedAt=null;
  state.players.forEach(p=>{p.hits=p.hits||freshHits();p.hitDetail=p.hitDetail||freshHitDetail();p.todayHits=p.todayHits||freshHits();p.todayHitDetail=p.todayHitDetail||freshHitDetail();p.masterHistory=p.masterHistory||[];p.hundredPlus=p.hundredPlus||0;p.weakSum=p.weakSum||0;p.yellow=p.yellow||0;p.helmetPending=p.helmetPending||0;p.pilesThrown=p.pilesThrown||0});
}
function pick(a){return a[Math.floor(Math.random()*a.length)]}function roast(cat,main,sub=''){if(!state.settings.roast){state.roastMain='';state.roastSub='';return}const arr=(window.ROAST_LIBRARY&&window.ROAST_LIBRARY[cat])||[];state.roastMain=main;state.roastSub=arr.length?pick(arr):sub}
function showPage(id){document.getElementById('game').style.display='none';document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active');if(id==='start')renderStart();if(id==='history')renderHistory();if(id==='profile')renderProfile();if(id==='settings')renderSettings()}function showGame(){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById('game').style.display='grid';render()}
function val(d){if(!d||d.mod==='M')return 0;let v=d.num*(d.mod==='D'?2:d.mod==='T'?3:1);if(d.num===25&&d.mod==='D')v=50;if(d.num===25&&d.mod==='T')v=25;return v}function liveDarts(){const pl=state.players[state.active];let opened=pl.inOpen||state.inRule==='single';return state.current.map(d=>{let x={...d,value:val(d),label:d.mod==='M'?'M':`${d.mod}${d.num}`};if(state.inRule==='master'&&!opened){if(d.mod==='D'||d.mod==='T'){opened=true}else{x.value=0;x.label=x.label==='M'?'M':x.label+'=0'}}return x})}function liveSum(){return liveDarts().reduce((a,d)=>a+d.value,0)}function scoreNow(){if(state.shootout)return '—';const s=state.players[state.active].score-liveSum();return s<0?state.players[state.active].score:s}function avgMaster(p){return p.masterHistory.length?p.masterHistory.reduce((a,b)=>a+b,0)/p.masterHistory.length:0}
function playerRoast(p){const avgIn=avgMaster(p),worst=p.masterHistory.length?Math.max(...p.masterHistory):0,rounds=Math.max(1,p.throwsThisGame||0),weakPct=Math.round(((p.weakSum||0)/rounds)*100);if((p.helmetPending||0)>0)return'🪖 HJELM NESTE SPILL';if(!p.inOpen&&state.inRule==='master'){const n=(p.inAttempts||0)+(state.players[state.active]===p?state.current.length:0);if(n>=15)return`🚪 ${n} piler ute – rekordfare`;if(n>=10)return`🏕️ ${n} piler ute`;if(n>=5)return`🚪 ${n} piler før inn`;return'🚪 Ikke inne'}if(worst>=15)return`🚪 Verste inn: ${worst} piler`;if(avgIn>=8)return`🚪 Snitt inn ${avgIn.toFixed(1)} piler`;if((p.gay||0)>=3)return`🌈 26 x${p.gay}`;if(weakPct>=50&&rounds>=4)return`📉 Svake summer ${weakPct}%`;if((p.busts||0)>=3)return`💥 Bust x${p.busts}`;if((p.hundredPlus||0)>=5)return`🔥 100+ x${p.hundredPlus}`;if((p.lastSum||0)>=140)return`💪 Sterkt kast`;if((p.lastSum||0)>=100)return`✅ 100+`;if((p.yellow||0)>0)return`🟨 Gult x${p.yellow}`;return'🎯 Klar'}
function render(){ensure();const pl=state.players[state.active];document.documentElement.style.setProperty('--cols',Math.min(state.players.length,4));document.getElementById('gameTitle').textContent=state.shootout?`BONUSRUNDE / ${state.shootoutRound||1}`:`SPILL / ${state.startScore}`;document.getElementById('players').innerHTML=state.players.map((p,i)=>`<div class="player ${i===state.active?'active':''}"><div class="pname">${p.name}${p.winner?' 🏆':''}</div><div class="proast">${playerRoast(p)}</div><div class="pscore">${state.shootout?'BONUS':(i===state.active?scoreNow():p.score)}</div><div class="pstats"><div>SISTE<b>${p.lastSum||0}</b></div><div>AVG<b>${p.darts?((p.total/p.darts)*3).toFixed(1):'0.0'}</b></div><div>100+<b>${p.hundredPlus||0}</b></div><div>SVAK<b>${p.weakSum||0}</b></div><div>HJELM<b>${p.helmet||0}</b></div></div></div>`).join('');document.getElementById('activeName').textContent=pl.name;document.getElementById('activeScore').textContent=state.shootout?'BONUS':scoreNow();document.getElementById('beforeScore').textContent=state.shootout?'Bonusrunde':pl.score;document.getElementById('status').textContent=state.message||'';document.getElementById('checkout').textContent=state.shootout?'Høyeste sum vinner':checkout(scoreNow());const darts=liveDarts();document.getElementById('dartCards').innerHTML=[0,1,2].map(i=>{const d=darts[i];return`<div class="dart ${d?'filled':''} ${i===state.current.length?'active':''}"><h4>KAST ${i+1}</h4><div class="dot"></div><div class="dval">${d?d.value:'—'}</div><div class="dlab">${d?d.label:'—'}</div></div>`}).join('');document.getElementById('sumNow').textContent=liveSum();document.getElementById('scoreNow').textContent=state.shootout?'—':scoreNow();let run=pl.score,trail=[run];darts.forEach(d=>{run-=d.value;trail.push(run<0?pl.score:run)});document.getElementById('trail').innerHTML=state.shootout?'BONUS: høyeste sum vinner':trail.join(' → ');document.getElementById('dartsThrown').textContent=pl.pilesThrown||0;document.getElementById('inDarts').textContent=pl.inOpen?'IN':(pl.inAttempts+state.current.length);document.getElementById('yellow').textContent=pl.yellow||0;document.getElementById('helmet').textContent=pl.helmet||0;document.getElementById('roastMain').textContent=state.roastMain||'';document.getElementById('roastSub').textContent=state.roastSub||'';document.getElementById('btnD').classList.toggle('selected',state.selected==='D');document.getElementById('btnT').classList.toggle('selected',state.selected==='T');save()}
function buildNumbers(){const nums=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,25];document.getElementById('numbers').innerHTML=nums.map(n=>`<button class="${[20,19,25].includes(n)?'hot':''}" onclick="hit(${n})">${n}</button>`).join('')+`<button class="wide1" onclick="undoDart()">↶ PIL</button><button class="wide2" onclick="undoThrow()">↶ KAST</button><button class="wide3" onclick="forceNext()">OK / NESTE</button>`}
function toggleMod(m){state.selected=state.selected===m?null:m;render()}function hit(n){if(state.current.length>=3)return;state.message='';state.current.push({num:n,mod:state.selected||'S'});state.selected=null;if(state.current.length>=3||shouldEnd())saveThrow();else render()}function miss(){if(state.current.length>=3)return;state.message='';state.current.push({num:0,mod:'M'});if(state.current.length>=3||shouldEnd())saveThrow();else render()}function undoDart(){state.current.pop();render()}function shouldEnd(){if(state.shootout)return state.current.length>=3;const after=state.players[state.active].score-liveSum();return after<=1}function isValidOut(last){return state.outRule==='single'||(state.outRule==='double'&&last?.mod==='D')||(state.outRule==='master'&&(last?.mod==='D'||last?.mod==='T'))}function forceNext(){saveThrow()}
function recordHits(pl,darts){darts.forEach(d=>{if(d.mod==='M'){pl.hits.M++;pl.todayHits.M++;pl.hitDetail.M.M++;pl.todayHitDetail.M.M++;return}let key=d.num===25&&d.mod==='D'?'Bull':String(d.num);pl.hits[key]=(pl.hits[key]||0)+1;pl.todayHits[key]=(pl.todayHits[key]||0)+1;if(!pl.hitDetail[key])pl.hitDetail[key]={S:0,D:0,T:0};if(!pl.todayHitDetail[key])pl.todayHitDetail[key]={S:0,D:0,T:0};pl.hitDetail[key][d.mod]=(pl.hitDetail[key][d.mod]||0)+1;pl.todayHitDetail[key][d.mod]=(pl.todayHitDetail[key][d.mod]||0)+1})}
function saveThrow(){while(state.current.length<3)state.current.push({num:0,mod:'M'});const idx=state.active,pl=state.players[idx],before=pl.score,darts=liveDarts(),sum=darts.reduce((a,d)=>a+d.value,0);if(state.shootout)return saveShootout(pl,darts,sum);let after=before-sum,bust=after<0||after===1,win=false,msg='',openedNow=false;const last=[...darts].reverse().find(d=>d.value>0);if(state.inRule==='master'&&!pl.inOpen){const oi=darts.findIndex(d=>d.mod==='D'||d.mod==='T');if(oi>=0){openedNow=true;pl.inAttempts+=oi+1}else pl.inAttempts+=3}if(after===0){if(isValidOut(last)){win=true;msg=`${pl.name} vant!`}else{bust=true;msg='BUST – feil utslag'}}else if(bust)msg='BUST – neste spiller';pl.lastSum=sum;pl.throwsThisGame++;pl.pilesThrown=(pl.pilesThrown||0)+3;state.totalThrows+=3;state.throws.push({time:new Date().toLocaleString('no-NO'),player:pl.name,playerIndex:idx,before,darts,sum,after:bust?before:after,bust});recordHits(pl,darts);if(sum<100)pl.weakSum++;else pl.hundredPlus++;if(sum===26)pl.gay++;if(!bust){pl.score=after;pl.darts+=darts.length;pl.total+=sum;pl.high=Math.max(pl.high,sum);if(sum===180)pl.n180++;if(sum>(state.records.highestThrow.score||0))state.records.highestThrow={player:pl.name,score:sum,date:new Date().toLocaleString('no-NO')};if(openedNow){pl.inOpen=true;pl.masterHistory.push(pl.inAttempts);if(pl.inAttempts>=5){state.roastMain=`🚪 ${pl.name}: ${pl.inAttempts} piler før Master In.`;state.roastSub=window.getMasterInRoast?window.getMasterInRoast(pl.inAttempts):''}if(pl.inAttempts>(state.records.masterWorst.darts||0))state.records.masterWorst={player:pl.name,darts:pl.inAttempts,date:new Date().toLocaleString('no-NO')}}if(win){finishWin(pl,before);return}}state.current=[];state.message=msg;analyzeRoast(pl,sum,bust,openedNow);if(state.settings.shootout&&state.players.every(p=>(p.pilesThrown||0)>=45&&!p.winner))enterShootout();else next();render()}
function finishWin(pl,checkoutScore){let helmets=[];if(state.settings.helmet)helmets=state.players.filter(p=>p!==pl&&p.score>=100);helmets.forEach(p=>{p.helmet++;p.helmetPending=(p.helmetPending||0)+1});pl.winner=true;pl.wins++;state.games.unshift({date:new Date().toLocaleString('no-NO'),winner:pl.name,score:state.startScore,checkout:checkoutScore,helmets:helmets.map(p=>p.name).join(', ')});if(checkoutScore>(state.records.highestCheckout.score||0))state.records.highestCheckout={player:pl.name,score:checkoutScore,date:new Date().toLocaleString('no-NO')};state.current=[];state.message=helmets.length?`HJELM: ${helmets.map(p=>p.name).join(', ')}`:`${pl.name} vant`;roast(helmets.length?'helmet':'win',helmets.length?'🪖 HJELMALARM!':'🏆 VINNER');render();showWinner(pl.name,helmets)}
function analyzeRoast(pl,sum,bust,opened){if(bust){pl.busts++;return roast('bust',`💥 BUST, ${pl.name}!`)}if(opened&&pl.inAttempts<5)return roast('masterIn',`🚪 ${pl.name} kom inn!`,`Brukte ${pl.inAttempts} piler.`);if(sum===26)return roast('gay26',`🌈 26, ${pl.name}!`);if(sum>=100){if(sum===180)return roast('max180',`🔥 180, ${pl.name}!`);if(sum>=140)return roast('highScore',`🔥 ${sum}, ${pl.name}!`);return roast('hundredPlus',`✅ 100+, ${pl.name}!`)}state.roastMain='';state.roastSub=''}function next(){state.active=(state.active+1)%state.players.length}function giveYellow(){const p=state.players[state.active];p.yellow=(p.yellow||0)+1;state.message=`Gult kort til ${p.name}`;roast('yellow',`🟨 GULT KORT: ${p.name}`);render()}
function enterShootout(){state.shootout=true;state.shootoutRound=1;state.shootoutScores={};state.shootoutDone={};state.players.forEach(p=>{state.shootoutScores[p.name]=null;state.shootoutDone[p.name]=false});state.current=[];state.message='BONUSRUNDE – aktiv score teller ikke';roast('shootout','🚨 45-PILERS BONUSRUNDE!','Aktiv score er nå død. Alle får 3 piler hver. Høyeste sum vinner spillet.')}function saveShootout(pl,darts,sum){pl.lastSum=sum;pl.pilesThrown=(pl.pilesThrown||0)+3;pl.darts+=3;pl.total+=sum;pl.high=Math.max(pl.high,sum);if(sum>=100)pl.hundredPlus++;else pl.weakSum++;if(sum===180)pl.n180++;recordHits(pl,darts);state.shootoutScores[pl.name]=sum;state.shootoutDone[pl.name]=true;state.throws.push({time:new Date().toLocaleString('no-NO'),player:pl.name,playerIndex:state.active,before:'BONUS',darts,sum,after:'BONUS',bust:false,shootout:true});state.current=[];if(state.players.every(p=>state.shootoutDone[p.name]))return finishShootout();nextShootout();render()}function nextShootout(){for(let i=1;i<=state.players.length;i++){const n=(state.active+i)%state.players.length;if(!state.shootoutDone[state.players[n].name]){state.active=n;return}}}function finishShootout(){const scores=state.players.map(p=>({p,score:state.shootoutScores[p.name]||0}));const max=Math.max(...scores.map(x=>x.score));const winners=scores.filter(x=>x.score===max);if(winners.length===1){const winner=winners[0].p;winner.winner=true;winner.wins++;state.games.unshift({date:new Date().toLocaleString('no-NO'),winner:winner.name,score:state.startScore,checkout:'Shootout',shootout:true,shootoutScore:max});render();showBonusWinner(winner.name,max);return}const names=winners.map(x=>x.p.name);state.players.forEach(p=>{state.shootoutDone[p.name]=!names.includes(p.name);state.shootoutScores[p.name]=names.includes(p.name)?null:-1});state.active=state.players.findIndex(p=>names.includes(p.name));state.shootoutRound++;state.current=[];roast('shootout','⚔️ UAVGJORT BONUSRUNDE!',`${names.join(', ')} må kaste igjen.`);render()}
function undoThrow(){const t=state.throws.pop();if(!t)return;state.active=t.playerIndex;state.message='Kast angret';render()}function checkout(s){s=Number(s);if(!s||s<2||s>180)return '—';const hits=[];for(let n=1;n<=20;n++){hits.push({label:String(n),value:n,mod:'S'});hits.push({label:'D'+n,value:2*n,mod:'D'});hits.push({label:'T'+n,value:3*n,mod:'T'})}hits.push({label:'25',value:25,mod:'S'},{label:'Bull',value:50,mod:'D'});const ok=h=>state.outRule==='single'||(state.outRule==='double'&&h.mod==='D')||(state.outRule==='master'&&(h.mod==='D'||h.mod==='T'));const fin=hits.filter(ok);for(const a of fin)if(a.value===s)return a.label;for(const a of hits)for(const b of fin)if(a.value+b.value===s)return`${a.label} · ${b.label}`;for(const a of hits)for(const b of hits)for(const c of fin)if(a.value+b.value+c.value===s)return`${a.label} · ${b.label} · ${c.label}`;return '—'}function closeWinner(){document.getElementById('winnerModal').classList.remove('show')}function showWinner(name,helmets=[]){document.getElementById('winnerTitle').textContent=helmets.length?'🪖 HJELMALARM':'🏆 VINNER';document.getElementById('winnerText').textContent=helmets.length?`${helmets.map(p=>p.name).join(', ')} må ha hjelm!`:name;document.getElementById('winnerModal').classList.add('show')}function showBonusWinner(name,score){document.getElementById('winnerTitle').textContent='🏆 BONUSRUNDE-VINNER';document.getElementById('winnerText').textContent=`${name} vant med ${score}`;document.getElementById('winnerModal').classList.add('show')}
function renderStart(){const names=getAllPlayerNames();document.getElementById('pickList').innerHTML=names.map(n=>`<label class="pick"><input type="checkbox" class="pickName" value="${n}" ${state.players.some(p=>p.name===n)?'checked':''}> ${n}</label>`).join('')}function addPlayerName(){const n=document.getElementById('newName').value.trim();if(n&&!state.known.includes(n))state.known.push(n);if(n&&!state.allPlayers[n])state.allPlayers[n]=newPlayer(n,state.startScore||501,state.inRule||'master');document.getElementById('newName').value='';save();renderStart()}function startGame(){if(!state.seasonActive)return alert('Sesongen er avsluttet. Start en ny sesong under Historikk først.');syncPlayersToDB();const names=[...document.querySelectorAll('.pickName:checked')].map(x=>x.value);if(names.length<2)return alert('Velg minst 2 spillere');const oldAll=state.allPlayers,oldRecords=state.records,oldKnown=state.known,oldSettings=state.settings,oldThrows=state.throws,oldGames=state.games,oldSeasons=state.seasons,oldSeasonId=state.seasonId,oldSeasonName=state.seasonName,oldSeasonStartedAt=state.seasonStartedAt,oldSeasonEndedAt=state.seasonEndedAt,oldSeasonActive=state.seasonActive;state=defaultState();state.known=oldKnown;state.settings=oldSettings;state.records=oldRecords;state.throws=oldThrows;state.games=oldGames;state.allPlayers=oldAll;state.seasons=oldSeasons;state.seasonId=oldSeasonId;state.seasonName=oldSeasonName;state.seasonStartedAt=oldSeasonStartedAt;state.seasonEndedAt=oldSeasonEndedAt;state.seasonActive=oldSeasonActive;state.startScore=+document.getElementById('startScore').value;state.inRule=document.getElementById('inRule').value;state.outRule=document.getElementById('outRule').value;state.players=names.map(n=>{const prev=state.allPlayers[n];const p=newPlayer(n,state.startScore,state.inRule);if(prev){['hits','hitDetail','todayHits','todayHitDetail','helmet','helmetPending','yellow','hundredPlus','weakSum','gay','busts','wins','masterHistory','high','n180'].forEach(k=>p[k]=prev[k]||p[k])}return p});state.active=Math.floor(Math.random()*state.players.length);const starter=state.players[state.active]?.name||'';const helmets=state.players.filter(p=>(p.helmetPending||0)>0);let msg=starter?'Starter tilfeldig: '+starter:'';if(helmets.length){msg+=(msg?'\n':'')+'HJELM NESTE SPILL: '+helmets.map(p=>p.name).join(', ');helmets.forEach(p=>p.helmetPending=0)}if(msg)alert(msg);showGame()}
function statsFor(p){return{avg:p.darts?((p.total/p.darts)*3).toFixed(1):'0.0',wins:p.wins||0,hundred:p.hundredPlus||0,weak:p.weakSum||0,gay:p.gay||0,helmet:p.helmet||0,high:p.high||0,worst:(p.masterHistory||[]).length?Math.max(...p.masterHistory):0,avgIn:avgMaster(p)?avgMaster(p).toFixed(1):'0.0'}}

function renderHistory(){
  ensure();
  const seasonSel=document.getElementById('historySeason');
  const oldSeason=seasonSel.value||'current';
  const seasons=seasonList();
  seasonSel.innerHTML=seasons.map(s=>`<option value="${s.current?'current':s.id}">${s.name}</option>`).join('');
  seasonSel.value=[...seasonSel.options].some(o=>o.value===oldSeason)?oldSeason:'current';

  const season=getHistorySeason();
  const playerMap=season.players||{};
  const names=[...new Set([...Object.keys(playerMap),...(season.throws||[]).map(t=>t.player)])].sort();
  const playerSel=document.getElementById('historyPlayer');
  const oldPlayer=playerSel.value||'';
  playerSel.innerHTML='<option value="">Alle spillere</option>'+names.map(n=>`<option value="${n}">${n}</option>`).join('');
  playerSel.value=names.includes(oldPlayer)?oldPlayer:'';
  const selected=playerSel.value;

  const seasonLabel=document.getElementById('seasonStatus');
  if(seasonLabel){
    const start=season.startedAt?new Date(season.startedAt).toLocaleDateString('no-NO'):'—';
    const end=season.endedAt?new Date(season.endedAt).toLocaleDateString('no-NO'):'Pågår';
    seasonLabel.innerHTML=`<b>${season.name}</b><span>${start} → ${end}</span><span>${(season.games||[]).length} kamper · ${season.totalThrows||0} piler</span>`;
  }

  const endBtn=document.getElementById('endSeasonBtn');
  const newBtn=document.getElementById('newSeasonBtn');
  if(endBtn)endBtn.disabled=!state.seasonActive||seasonSel.value!=='current';
  if(newBtn)newBtn.disabled=state.seasonActive;

  const list=names.map(n=>playerMap[n]).filter(Boolean);
  const ps=selected?list.filter(p=>p.name===selected):list;
  document.getElementById('historyStats').innerHTML=
    '<tr><th>Spiller</th><th>Seiere</th><th>Avg</th><th>High</th><th>100+</th><th>Svake</th><th>26</th><th>Hjelm</th><th>Snitt inn</th><th>Verst inn</th></tr>'+
    ps.map(p=>{const st=statsFor(p);return`<tr><td>${p.name}</td><td>${st.wins}</td><td>${st.avg}</td><td>${st.high}</td><td>${st.hundred}</td><td>${st.weak}</td><td>${st.gay}</td><td>${st.helmet}</td><td>${st.avgIn}</td><td>${st.worst}</td></tr>`}).join('');

  const rows=(season.throws||[]).filter(t=>!selected||t.player===selected).slice().reverse();
  document.getElementById('historyThrows').innerHTML=
    '<tr><th>Tid</th><th>Spiller</th><th>Før</th><th>Kast</th><th>Sum</th><th>Etter</th><th>Status</th></tr>'+
    rows.map(t=>`<tr><td>${t.time}</td><td>${t.player}</td><td>${t.before}</td><td>${(t.darts||[]).map(d=>d.label).join(' | ')}</td><td>${t.sum}</td><td>${t.after}</td><td>${t.shootout?'Bonus':(t.bust?'Bust':'')}</td></tr>`).join('');
}

function renderProfile(){const sel=document.getElementById('profilePlayer');const old=sel.value;const allList=getAllPlayerList();sel.innerHTML=allList.map(p=>`<option>${p.name}</option>`).join('');sel.value=old||allList[0].name;const p=allList.find(x=>x.name===sel.value)||allList[0];const total=Object.values(p.hits).reduce((a,b)=>a+(+b||0),0);const singles=Object.values(p.hitDetail).reduce((a,x)=>a+(x.S||0),0);const doubles=Object.values(p.hitDetail).reduce((a,x)=>a+(x.D||0),0);const triples=Object.values(p.hitDetail).reduce((a,x)=>a+(x.T||0),0);document.getElementById('profileCards').innerHTML=`<div class="card"><small>Total piler</small><b>${total}</b></div><div class="card"><small>Single</small><b>${singles}</b></div><div class="card"><small>Dobbel</small><b>${doubles}</b></div><div class="card"><small>Trippel</small><b>${triples}</b></div><div class="card"><small>20</small><b>${p.hits[20]||0}</b></div><div class="card"><small>High</small><b>${p.high||0}</b></div>`;const keys=[20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,25,'Bull','M'];document.getElementById('hitTable').innerHTML=`<table class="table"><tr><th>Tall</th><th>Total</th><th>S</th><th>D</th><th>T</th></tr>${keys.map(k=>{const d=p.hitDetail[k]||{};return`<tr><td>${k}</td><td>${p.hits[k]||0}</td><td>${d.S||0}</td><td>${d.D||0}</td><td>${d.T||0}</td></tr>`}).join('')}</table>`}
function renderSettings(){
  document.getElementById('setRoast').checked=state.settings.roast;
  document.getElementById('setHelmet').checked=state.settings.helmet;
  document.getElementById('setShootout').checked=state.settings.shootout;
  const display=document.getElementById('displayMode');
  if(display)display.value=getDisplayMode();
  applyDisplayMode();
}
function saveSettings(){
  state.settings={roast:setRoast.checked,helmet:setHelmet.checked,shootout:setShootout.checked};
  const display=document.getElementById('displayMode');
  if(display)setDisplayMode(display.value);
  save();
  alert('Lagret');
}
function exportBackup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({version:'v17-cloud',state},null,2)],{type:'application/json'}));a.download='dart-score-backup.json';a.click()}
function importBackup(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const d=JSON.parse(r.result);if(!d.state)return alert('Ugyldig backup');state=d.state;state.allPlayers=state.allPlayers||{};syncPlayersToDB();save();location.reload()};r.readAsText(f)}
function clearAllStats(){if(!confirm('Slette statistikk i AKTIV sesong? Tidligere avsluttede sesonger beholdes.'))return;const names=state.known,settings=state.settings,seasons=state.seasons,seasonId=state.seasonId,seasonName=state.seasonName,seasonStartedAt=state.seasonStartedAt,seasonActive=state.seasonActive,seasonEndedAt=state.seasonEndedAt;state=defaultState();state.known=names;state.settings=settings;state.seasons=seasons;state.seasonId=seasonId;state.seasonName=seasonName;state.seasonStartedAt=seasonStartedAt;state.seasonActive=seasonActive;state.seasonEndedAt=seasonEndedAt;state.allPlayers={};names.forEach(n=>state.allPlayers[n]=newPlayer(n,state.startScore,state.inRule));save();location.reload()}
async function factoryReset(){
  if(!confirm('Nullstille hele appen – både lokalt og i Neon?'))return;
  const clean=defaultState();
  await resetCloudState(clean);
  localStorage.removeItem(STORE);
  location.reload();
}
async function initApp(){
  // Prøv skyen først. Hvis Neon er tom/utilgjengelig, beholdes lokal state.
  await loadCloudState();

  ensure();
  applyDisplayMode();
  buildNumbers();
  render();

  // Hvis Neon var tom, vil render()->save() synkronisere lokal state etter 500 ms.
  if('serviceWorker'in navigator){
    navigator.serviceWorker.register('service-worker.js').catch(error=>{
      console.warn('DART SCORE: service worker kunne ikke registreres.',error);
    });
  }
}

initApp();