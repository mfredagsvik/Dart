const $=s=>document.querySelector(s);const $$=s=>Array.from(document.querySelectorAll(s));
let settings={startScore:501,inRule:'single',outRule:'double',showCheckout:true,showAverage:true,saveThrows:true,showDailyHigh:true};
let players=['Marius','Dag Arne'];let game=null;let selectedMult='S';let dartBuffer=[];let liveLog=[];let allHistory=[];let selectedMatchId=null;const STORE='dartScoreHistoryV22';
function clone(obj){return JSON.parse(JSON.stringify(obj))}
const checkout={170:'T20 T20 Bull',167:'T20 T19 Bull',164:'T20 T18 Bull',161:'T20 T17 Bull',160:'T20 T20 D20',158:'T20 T20 D19',157:'T20 T19 D20',156:'T20 T20 D18',155:'T20 T19 D19',154:'T20 T18 D20',153:'T20 T19 D18',152:'T20 T20 D16',151:'T20 T17 D20',150:'T20 T18 D18',149:'T20 T19 D16',148:'T20 T20 D14',147:'T20 T17 D18',146:'T20 T18 D16',145:'T20 T15 D20',144:'T20 T20 D12',143:'T20 T17 D16',142:'T20 T14 D20',141:'T20 T19 D12',140:'T20 T20 D10',139:'T19 T14 D20',138:'T20 T18 D12',137:'T20 T19 D10',136:'T20 T20 D8',135:'T20 T17 D12',134:'T20 T14 D16',133:'T20 T19 D8',132:'Bull Bull D16',131:'T20 T13 D16',130:'T20 T18 D8',129:'T19 T16 D12',128:'T18 T18 D10',127:'T20 T17 D8',126:'T19 T19 D6',125:'Bull T17 D12',124:'T20 T16 D8',123:'T19 T16 D9',122:'T18 T18 D7',121:'T20 T11 D14',120:'T20 20 D20'};
function loadStore(){try{allHistory=JSON.parse(localStorage.getItem(STORE)||localStorage.getItem('dartScoreHistoryV21')||'[]')}catch(e){allHistory=[]}}function saveStore(){localStorage.setItem(STORE,JSON.stringify(allHistory))}loadStore();
async function loadImported(){let res=await fetch('imported-history.json');let rows=await res.json();let existing=new Set(allHistory.map(r=>`${r.matchId}|${r.round}|${r.player}|${r.allDarts||r.darts?.join(';')}`));let add=rows.filter(r=>!existing.has(`${r.matchId}|${r.round}|${r.player}|${r.allDarts}`)).map(r=>({...r,source:'Excel',timestamp:parseDateFromTitle(r.title)?.toISOString()||'',start:null,end:r.remaining,score:r.sum,darts:[r.dart1,r.dart2,r.dart3],bust:false,win:false}));allHistory=allHistory.concat(add);saveStore();renderHistoryScreen();alert(`Lastet inn ${add.length} historikkrader fra Excel-data.`)}
function parseDateFromTitle(t){let m=String(t||'').match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);if(!m)return null;return new Date(+m[3],+m[2]-1,+m[1],+m[4],+m[5])}
function renderPlayersList(){const list=$('#playersList');list.innerHTML='';players.forEach((p,i)=>{let el=document.createElement('div');el.className='player-chip';el.innerHTML=`<span>${p}</span><button data-i="${i}">Fjern</button>`;list.appendChild(el)});list.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(players.length>2){players.splice(+b.dataset.i,1);renderPlayersList()}})}
$('#addPlayerBtn').onclick=()=>{let n=$('#playerName').value.trim();if(n&&players.length<8){players.push(n);$('#playerName').value='';renderPlayersList()}};$('#playerName').addEventListener('keydown',e=>{if(e.key==='Enter')$('#addPlayerBtn').click()});
$$('.segmented button').forEach(btn=>btn.onclick=()=>{let group=btn.parentElement.dataset.group;btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');settings[group]=group==='startScore'?+btn.dataset.value:btn.dataset.value});
$('#startBtn').onclick=startGame;$('#newGameBtn').onclick=()=>{if(confirm('Starte nytt spill?')){$('#game').classList.add('hidden');$('#setup').classList.remove('hidden')}};$('#historyBtn').onclick=openHistory;$('#openHistoryBtnSetup').onclick=openHistory;$('#backBtn').onclick=()=>{ $('#historyScreen').classList.add('hidden'); (game?$('#game'):$('#setup')).classList.remove('hidden');};$('#importSeedBtn').onclick=loadImported;$('#exportCsvBtn').onclick=exportCSV;$('#clearHistoryBtn').onclick=()=>{if(confirm('Slette all lokal historikk?')){allHistory=[];saveStore();renderHistoryScreen()}};$('#historySearch').oninput=renderHistoryScreen;
function startGame(){settings.showCheckout=$('#showCheckout').checked;settings.showAverage=$('#showAverage').checked;settings.saveThrows=$('#saveThrows').checked;settings.showDailyHigh=$('#showDailyHigh').checked;game={id:String(Date.now()).slice(-6),active:0,over:false,created:new Date().toISOString(),players:players.map(n=>({name:n,score:settings.startScore,in:false,darts:0,totalScored:0,throws:[],yellow:0,helmet:0,winner:false}))};liveLog=[];dartBuffer=[];selectedMult='S';$('#setup').classList.add('hidden');$('#game').classList.remove('hidden');buildNumberGrid();updateAll()}
function buildNumberGrid(){const grid=$('#numberGrid');grid.innerHTML='';[20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,25].forEach(n=>{let b=document.createElement('button');b.textContent=n;b.className=[20,19,18,25].includes(n)?'hot':'';b.onclick=()=>hit(n);grid.appendChild(b)})}
$('#doubleBtn').onclick=()=>toggleMult('D');$('#tripleBtn').onclick=()=>toggleMult('T');$('#missBtn').onclick=()=>miss();function toggleMult(m){selectedMult=selectedMult===m?'S':m;updateMode()}function updateMode(){$('#doubleBtn').classList.toggle('selected',selectedMult==='D');$('#tripleBtn').classList.toggle('selected',selectedMult==='T');$('#modeLabel').textContent=selectedMult==='S'?'Single':selectedMult==='D'?'Dobbel':'Trippel'}
function value(mult,num){if(mult==='M')return 0;if(num===25&&mult==='T')return 25;if(num===25&&mult==='D')return 50;return (mult==='D'?2:mult==='T'?3:1)*num}function label(d){return d.mult==='M'?'M':`${d.mult}${d.num}`}
function hit(num){addDart({mult:selectedMult,num,raw:value(selectedMult,num)});selectedMult='S';updateMode()}function miss(){addDart({mult:'M',num:0,raw:0});selectedMult='S';updateMode()}
function addDart(d){if(game.over)return;dartBuffer.push(d);updateDartRow();if(dartBuffer.length===3)commitThrow()}
function effectiveThrow(p,buf){let opened=p.in||settings.inRule==='single';let sum=0;let effective=[];let opens=false;for(const d of buf){let raw=d.raw;if(!opened&&settings.inRule==='master'){if(d.mult==='D'||d.mult==='T'){opened=true;opens=true;sum+=raw;effective.push({...d,score:raw})}else{effective.push({...d,score:0})}}else{sum+=raw;effective.push({...d,score:raw})}}return{sum,effective,opens}}
function validOut(lastDart){if(settings.outRule==='single')return true;if(!lastDart)return false;if(settings.outRule==='double')return lastDart.mult==='D';if(settings.outRule==='master')return lastDart.mult==='D'||lastDart.mult==='T';return false}
function commitThrow(){
  let activeBefore=game.active;
  let p=game.players[activeBefore];
  let playerBefore=clone(p);
  let start=p.score;
  let res=effectiveThrow(p,dartBuffer);
  let end=start-res.sum;
  let bust=false;
  let win=false;
  if(end<0)bust=true;
  if(end===1&&settings.outRule!=='single')bust=true;
  if(end===0){
    let scoring=res.effective.filter(d=>d.score>0);
    let last=scoring[scoring.length-1];
    if(validOut(last))win=true;else bust=true;
  }
  if(!bust){
    p.score=end;
    p.totalScored+=res.sum;
    p.darts+=3;
    if(res.opens)p.in=true;
    if(settings.inRule==='single')p.in=true;
  }else{
    p.darts+=3;
  }
  const throwId=`${game.id}-${activeBefore}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  let throwObj={
    throwId,
    matchId:game.id,
    round:p.throws.length+1,
    player:p.name,
    playerIndex:activeBefore,
    start,
    score:bust?0:res.sum,
    rawScore:res.sum,
    end:bust?start:p.score,
    remaining:bust?start:p.score,
    bust,
    win,
    darts:res.effective.map(d=>`${label(d)}=${d.score}`),
    dart1:res.effective[0]?label(res.effective[0]):'',
    dart2:res.effective[1]?label(res.effective[1]):'',
    dart3:res.effective[2]?label(res.effective[2]):'',
    allDarts:res.effective.map(label).join(';'),
    helmet:p.helmet,
    yellow:p.yellow,
    timestamp:new Date().toISOString(),
    rules:`${settings.startScore} ${settings.inRule} in / ${settings.outRule} out`,
    undoState:{activeBefore,playerBefore,gameOverBefore:false}
  };
  p.throws.push(throwObj);
  if(settings.saveThrows){
    liveLog.unshift(throwObj);
    allHistory.push(throwObj);
    saveStore();
  }
  if(win){p.winner=true;game.over=true}
  dartBuffer=[];
  if(!game.over)game.active=(game.active+1)%game.players.length;
  updateAll();
}
function undoLastThrow(){
  if(!game)return;
  if(dartBuffer.length){dartBuffer.pop();updateDartRow();return;}
  const last=liveLog[0];
  if(!last){alert('Ingen kast å angre.');return;}
  if(!last.undoState){alert('Dette kastet kan ikke angres fordi det ble importert fra gammel historikk.');return;}
  const idx=last.undoState.activeBefore;
  game.players[idx]=clone(last.undoState.playerBefore);
  game.active=idx;
  game.over=false;
  game.players.forEach(pl=>{ if(pl.name!==game.players[idx].name || idx!==game.players.indexOf(pl)) pl.winner=false; });
  liveLog.shift();
  const pos=allHistory.findIndex(r=>r.throwId===last.throwId);
  if(pos>=0){allHistory.splice(pos,1);saveStore();}
  dartBuffer=[];
  selectedMult='S';
  updateAll();
}
function updateAll(){updateMode();updateHeader();renderScoreboard();updateActive();renderLiveLog();updateDartRow()}function updateHeader(){let inText=settings.inRule==='master'?'Master In':'Single In';let outText=settings.outRule==='double'?'Double Out':settings.outRule==='master'?'Master Out':'Single Out';$('#matchTitle').textContent=`${settings.startScore} · ${inText} · ${outText}`;let today=new Date().toISOString().slice(0,10);let highs=allHistory.filter(r=>(r.timestamp||'').slice(0,10)===today).map(r=>+r.score||+r.sum||0);let high=Math.max(0,...highs,...liveLog.map(t=>t.score||0));$('#dailyHigh').textContent=settings.showDailyHigh?high:'–';$('#lastThrow').textContent=liveLog[0]?`${liveLog[0].player}: ${liveLog[0].score}`:'–';let p=game.players[game.active];$('#checkoutSuggestion').textContent=settings.showCheckout?(checkout[p.score]||'–'):'–'}function avg(p){return p.darts?((p.totalScored/p.darts)*3).toFixed(1):'0.0'}
function renderScoreboard(){let wrap=$('#scoreboardPlayers');wrap.innerHTML='';game.players.forEach((p,i)=>{let card=document.createElement('div');card.className='score-card '+(i===game.active?'active ':'')+(p.winner?'winner':'');card.innerHTML=`<div class="badges"><span class="badge">🟨 ${p.yellow}</span><span class="badge">⛑ ${p.helmet}</span></div><h3>${p.name}</h3><div class="remaining">${p.score}</div><div class="meta"><div>AVG<strong>${settings.showAverage?avg(p):'–'}</strong></div><div>IN<strong>${p.in||settings.inRule==='single'?'JA':'NEI'}</strong></div><div>KAST<strong>${p.throws.length}</strong></div></div>`;wrap.appendChild(card)})}
function updateActive(){let p=game.players[game.active];$('#activeName').textContent=p.name;$('#activeScore').textContent=p.score}function updateDartRow(){let cells=$$('#dartRow div b');cells.forEach((c,i)=>{let d=dartBuffer[i];c.textContent=d?label(d):'–'})}
function renderLiveLog(){let h=$('#historyLog');h.innerHTML='';liveLog.slice(0,18).forEach(t=>{let el=document.createElement('div');el.className='log-item';el.innerHTML=`<strong>${t.player}</strong> ${t.bust?'BUST':t.score} <br>${(t.darts||[]).join(' · ')} <br>${t.start??''} → ${t.end??t.remaining}`;h.appendChild(el)})}
$('#undoBtn').onclick=undoLastThrow;$('#yellowBtn').onclick=()=>{game.players[game.active].yellow++;updateAll()};$('#helmetBtn').onclick=()=>{game.players[game.active].helmet++;updateAll()};
function openHistory(){if(game)$('#game').classList.add('hidden');else $('#setup').classList.add('hidden');$('#historyScreen').classList.remove('hidden');renderHistoryScreen()}
function groupMatches(){let map=new Map();for(const r of allHistory){let id=String(r.matchId||'Ukjent');if(!map.has(id))map.set(id,{id,rows:[],players:new Set(),date:r.timestamp||parseDateFromTitle(r.title)?.toISOString()||''});let m=map.get(id);m.rows.push(r);if(r.player)m.players.add(r.player);if(!m.date&&(r.timestamp||r.title))m.date=r.timestamp||parseDateFromTitle(r.title)?.toISOString()||''}return [...map.values()].sort((a,b)=>(b.date||'').localeCompare(a.date||''))}
function renderHistoryScreen(){let q=($('#historySearch')?.value||'').toLowerCase();let matches=groupMatches().filter(m=>!q||m.id.toLowerCase().includes(q)||[...m.players].join(' ').toLowerCase().includes(q));let ml=$('#matchList');ml.innerHTML='';matches.forEach((m,i)=>{if(!selectedMatchId&&i===0)selectedMatchId=m.id;let item=document.createElement('div');item.className='match-item '+(m.id===selectedMatchId?'active':'');let max=Math.max(...m.rows.map(r=>+r.score||+r.sum||0),0);item.innerHTML=`<b>Kamp ${m.id}</b><small>${fmtDate(m.date)} · ${m.players.size} spillere · ${m.rows.length} kast</small><small>Høyeste kast: ${max}</small>`;item.onclick=()=>{selectedMatchId=m.id;renderHistoryScreen()};ml.appendChild(item)});let selected=matches.find(m=>m.id===selectedMatchId)||matches[0];renderDetail(selected);renderPlayerStats()}
function fmtDate(s){if(!s)return 'Ukjent dato';let d=new Date(s);return isNaN(d)?s:d.toLocaleString('no-NO',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function renderDetail(m){let title=$('#detailTitle'),stats=$('#detailStats'),tbl=$('#throwTable');if(!m){title.textContent='Ingen historikk';stats.innerHTML='';tbl.innerHTML='';return}title.textContent=`Kamp ${m.id}`;let rows=m.rows.slice().sort((a,b)=>(+a.round||0)-(+b.round||0)||String(a.player).localeCompare(String(b.player)));let high=Math.max(...rows.map(r=>+r.score||+r.sum||0),0);let winner=rows.find(r=>r.win)?.player||'';let avg=(rows.reduce((s,r)=>s+(+r.score||+r.sum||0),0)/Math.max(1,rows.length)).toFixed(1);stats.innerHTML=`<div class="statbox">Spillere<strong>${m.players.size}</strong></div><div class="statbox">Kast<strong>${rows.length}</strong></div><div class="statbox">Høyeste<strong>${high}</strong></div><div class="statbox">Snitt/kast<strong>${avg}</strong></div><div class="statbox">Vinner<strong>${winner||'–'}</strong></div>`;tbl.innerHTML='<table><thead><tr><th>Runde</th><th>Spiller</th><th>Pil 1</th><th>Pil 2</th><th>Pil 3</th><th>Sum</th><th>Igjen</th><th>Gult</th><th>Hjelm</th></tr></thead><tbody>'+rows.map(r=>`<tr><td>${r.round||''}</td><td>${r.player||''}</td><td>${r.dart1||''}</td><td>${r.dart2||''}</td><td>${r.dart3||''}</td><td>${r.score??r.sum??''}</td><td>${r.remaining??r.end??''}</td><td>${r.yellow||''}</td><td>${r.helmet||''}</td></tr>`).join('')+'</tbody></table>'}
function renderPlayerStats(){let by={};allHistory.forEach(r=>{let p=r.player||'Ukjent';by[p]??={throws:0,total:0,high:0,n180:0,n140:0,n100:0,yellow:0,helmet:0};let s=+r.score||+r.sum||0;by[p].throws++;by[p].total+=s;by[p].high=Math.max(by[p].high,s);if(s>=180)by[p].n180++;if(s>=140)by[p].n140++;if(s>=100)by[p].n100++;by[p].yellow+=+r.yellow||0;by[p].helmet+=+r.helmet||0});let html=Object.entries(by).sort((a,b)=>b[1].high-a[1].high).map(([p,s])=>`<div class="player-stat"><b>${p}</b><div class="mini"><span>Kast: ${s.throws}</span><span>Avg: ${(s.total/Math.max(1,s.throws)).toFixed(1)}</span><span>Høyeste: ${s.high}</span><span>180: ${s.n180}</span><span>140+: ${s.n140}</span><span>100+: ${s.n100}</span><span>Gult: ${s.yellow}</span><span>Hjelm: ${s.helmet}</span></div></div>`).join('');$('#playerStats').innerHTML=html||'<p class="hint">Ingen data ennå.</p>'}
function exportCSV(){let cols=['matchId','timestamp','round','player','dart1','dart2','dart3','score','remaining','bust','win','yellow','helmet','rules','source'];let csv=[cols.join(';')].concat(allHistory.map(r=>cols.map(c=>`"${String(r[c]??'').replaceAll('"','""')}"`).join(';'))).join('\n');let blob=new Blob([csv],{type:'text/csv;charset=utf-8'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dart-score-historikk.csv';a.click();URL.revokeObjectURL(a.href)}
renderPlayersList();if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js');
