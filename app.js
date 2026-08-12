(() => {
"use strict";

/* =========================================================
   16/16 BEAD — SINGLE-PAGE GAME ENGINE
   UI never mutates board state directly.
   INPUT -> VALIDATION -> ENGINE -> STATE -> RENDER
   ========================================================= */

const COLORS = { IVORY:"ivory", ONYX:"onyx" };
const OTHER = p => p === COLORS.IVORY ? COLORS.ONYX : COLORS.IVORY;
const STORAGE_KEY = "raxzen_1616_bead_save_v1";
const STATS_KEY = "raxzen_1616_bead_stats_v1";
const SETTINGS_KEY = "raxzen_1616_bead_settings_v1";

/* Board geometry mirrors the supplied reference:
   5x5 central lattice + top/bottom triangular extensions.
   35 playable points. */
const NODES = (() => {
  const a = [];
  // central 5x5 grid
  for(let r=0;r<5;r++) for(let c=0;c<5;c++)
    a.push({id:`g${r}${c}`, x:100+c*200, y:260+r*160});
  // top triangle (5 unique nodes)
  a.push({id:"t0",x:300,y:100},{id:"t1",x:500,y:100},{id:"t2",x:700,y:100},
         {id:"t3",x:400,y:180},{id:"t4",x:600,y:180});
  // bottom triangle (5 unique nodes)
  a.push({id:"b0",x:300,y:900},{id:"b1",x:500,y:900},{id:"b2",x:700,y:900},
         {id:"b3",x:400,y:980},{id:"b4",x:600,y:980});
  // outer visual bounds are 1000x1160; y positions are shifted later in SVG.
  return a.map((n,i)=>({...n,i}));
})();

const nodeIndex = Object.fromEntries(NODES.map((n,i)=>[n.id,i]));
const EDGES = [];
const edgeSet = new Set();
function edge(a,b){const k=a<b?`${a}-${b}`:`${b}-${a}`;if(!edgeSet.has(k)){edgeSet.add(k);EDGES.push([a,b])}}
function connectGrid(){
  for(let r=0;r<5;r++) for(let c=0;c<5;c++){
    const i=nodeIndex[`g${r}${c}`];
    if(c<4) edge(i,nodeIndex[`g${r}${c+1}`]);
    if(r<4) edge(i,nodeIndex[`g${r+1}${c}`]);
    // diagonal structure, matching the reference's crossed lattice
    if(r<4 && c<4) edge(i,nodeIndex[`g${r+1}${c+1}`]);
    if(r<4 && c>0) edge(i,nodeIndex[`g${r+1}${c-1}`]);
  }
  // top triangle connects to central top row
  edge(nodeIndex.t0,nodeIndex.t1); edge(nodeIndex.t1,nodeIndex.t2);
  edge(nodeIndex.t0,nodeIndex.t3); edge(nodeIndex.t1,nodeIndex.t3); edge(nodeIndex.t1,nodeIndex.t4); edge(nodeIndex.t2,nodeIndex.t4);
  edge(nodeIndex.t3,nodeIndex.t4);
  edge(nodeIndex.t3,nodeIndex["g02"]); edge(nodeIndex.t4,nodeIndex["g02"]);
  // bottom triangle
  edge(nodeIndex.b0,nodeIndex.b1); edge(nodeIndex.b1,nodeIndex.b2);
  edge(nodeIndex.b0,nodeIndex.b3); edge(nodeIndex.b1,nodeIndex.b3); edge(nodeIndex.b1,nodeIndex.b4); edge(nodeIndex.b2,nodeIndex.b4);
  edge(nodeIndex.b3,nodeIndex.b4);
  edge(nodeIndex.b3,nodeIndex["g42"]); edge(nodeIndex.b4,nodeIndex["g42"]);
}
connectGrid();

const ADJ = Array.from({length:NODES.length},()=>new Set());
EDGES.forEach(([a,b])=>{ADJ[a].add(b);ADJ[b].add(a)});

/* Initial 16 + 16 arrangement: each side occupies its triangular end
   and two rows of the central lattice; the three center points remain open. */
const INITIAL = Array(NODES.length).fill(null);
const blackIds = ["t0","t1","t2","t3","t4",
                  "g00","g01","g02","g03","g04",
                  "g10","g11","g12","g13","g14",
                  "g20"];
const whiteIds = ["b0","b1","b2","b3","b4",
                  "g44","g43","g42","g41","g40",
                  "g34","g33","g32","g31","g30",
                  "g24"];
blackIds.forEach(id=>INITIAL[nodeIndex[id]]=COLORS.ONYX);
whiteIds.forEach(id=>INITIAL[nodeIndex[id]]=COLORS.IVORY);

const state = {
  mode:"ai", difficulty:"medium", board:[...INITIAL], turn:COLORS.IVORY,
  selected:null, chainPiece:null, chainCaptures:[], history:[], paused:false,
  started:false, gameOver:false, winner:null, moveNumber:1, sound:true, vibration:true
};
let settings = load(SETTINGS_KEY,{sound:true,vibration:true,theme:"classic"});
let stats = load(STATS_KEY,{games:0,ivoryWins:0,onyxWins:0,draws:0,captures:0,moves:0,streak:0,bestStreak:0});
state.sound=settings.sound; state.vibration=settings.vibration;

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const svg=$("#board"), toast=$("#toast"), modalLayer=$("#modalLayer"), modalContent=$("#modalContent");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function load(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function commitStats(){save(STATS_KEY,stats)}
function cloneBoard(b){return [...b]}
function snapshot(){return {board:cloneBoard(state.board),turn:state.turn,moveNumber:state.moveNumber,chainPiece:state.chainPiece,chainCaptures:[...state.chainCaptures]}}
function restore(s){state.board=cloneBoard(s.board);state.turn=s.turn;state.moveNumber=s.moveNumber;state.chainPiece=s.chainPiece;state.chainCaptures=[...s.chainCaptures];state.selected=null;state.gameOver=false;state.winner=null;render()}

function neighbors(i){return [...ADJ[i]]}
function midpoint(a,b){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
function edgeExists(a,b){return ADJ[a].has(b)}
function landingByJump(from,over,to){return edgeExists(from,over)&&edgeExists(over,to)}
function legalSimpleMoves(board,player,from){
  return neighbors(from).filter(to=>board[to]===null);
}
function captureMoves(board,player,from,capturedSet=new Set()){
  const result=[];
  for(const over of neighbors(from)){
    if(board[over]!==OTHER(player) || capturedSet.has(over)) continue;
    for(const to of neighbors(over)){
      if(to===from || board[to]!==null || to===over) continue;
      if(!edgeExists(from,over)||!edgeExists(over,to)) continue;
      result.push({from,over,to});
    }
  }
  return result;
}
function allCaptureMoves(board,player){
  const out=[];
  board.forEach((p,i)=>{if(p===player) out.push(...captureMoves(board,player,i))});
  return out;
}
function hasAnyCapture(board,player){return allCaptureMoves(board,player).length>0}
function legalMoves(board,player){
  const captures=allCaptureMoves(board,player);
  if(captures.length) return captures.map(m=>({type:"capture",...m}));
  const moves=[];
  board.forEach((p,from)=>{if(p===player) legalSimpleMoves(board,player,from).forEach(to=>moves.push({type:"move",from,to}))});
  return moves;
}
function countPieces(board,p){return board.filter(x=>x===p).length}

/* The engine is the only code allowed to mutate board state. */
const Engine = {
  applyMove(move){
    if(state.gameOver || state.paused) return {ok:false};
    const player=state.turn;
    const legal=legalMoves(state.board,player);
    const isCapture=move.type==="capture";
    let valid;
    if(isCapture) valid=legal.find(m=>m.type==="capture"&&m.from===move.from&&m.to===move.to&&m.over===move.over);
    else valid=legal.find(m=>m.type==="move"&&m.from===move.from&&m.to===move.to);
    if(!valid) return {ok:false,reason:"Illegal move"};

    state.history.push(snapshot());
    state.board[valid.to]=player; state.board[valid.from]=null;
    if(isCapture){
      state.board[valid.over]=null;
      stats.captures++; commitStats();
      state.chainCaptures.push(valid.over);
    } else state.chainCaptures=[];

    if(isCapture){
      const nextCaptures=captureMoves(state.board,player,valid.to,new Set(state.chainCaptures));
      if(nextCaptures.length){
        state.chainPiece=valid.to; state.selected=valid.to;
        return {ok:true,chain:true,captures:nextCaptures};
      }
    }
    state.chainPiece=null; state.chainCaptures=[];
    state.turn=OTHER(player); state.moveNumber++;
    stats.moves++; commitStats();
    checkGameOver();
    return {ok:true,chain:false};
  },
  undo(){
    if(!state.history.length || state.gameOver) return false;
    restore(state.history.pop()); return true;
  },
  restart(){
    state.board=cloneBoard(INITIAL);state.turn=COLORS.IVORY;state.selected=null;state.chainPiece=null;
    state.chainCaptures=[];state.history=[];state.paused=false;state.gameOver=false;state.winner=null;state.moveNumber=1;
    saveGame();render();
  }
};

function checkGameOver(){
  const opponent=OTHER(state.turn);
  const currentCount=countPieces(state.board,state.turn), oppCount=countPieces(state.board,opponent);
  const currentMoves=legalMoves(state.board,state.turn);
  if(oppCount===0 || !legalMoves(state.board,opponent).length){
    state.gameOver=true; state.winner=state.turn;
  } else if(currentCount===0 || !currentMoves.length){
    state.gameOver=true; state.winner=opponent;
  }
  if(state.gameOver){
    stats.games++;
    if(state.winner===COLORS.IVORY){stats.ivoryWins++;stats.streak++;stats.bestStreak=Math.max(stats.bestStreak,stats.streak)}
    else {stats.onyxWins++;stats.streak=0}
    commitStats(); clearSave(); setTimeout(showGameOver,280);
  }
}

function selectNode(i){
  if(state.paused||state.gameOver||!state.started) return;
  if(state.mode==="ai" && state.turn===COLORS.ONYX) return;

  if(state.chainPiece!==null){
    if(i===state.chainPiece){state.selected=i;render();return}
    const caps=captureMoves(state.board,state.turn,state.chainPiece,new Set(state.chainCaptures));
    const m=caps.find(x=>x.to===i);
    if(m){performMove(m);return}
    toastMsg("Continue the capture chain.");
    return;
  }

  if(state.selected!==null){
    const legal=legalMoves(state.board,state.turn);
    const cap=legal.find(m=>m.type==="capture"&&m.from===state.selected&&m.to===i);
    const normal=legal.find(m=>m.type==="move"&&m.from===state.selected&&m.to===i);
    if(cap||normal){performMove(cap||normal);return}
  }

  if(state.board[i]===state.turn){state.selected=i;render()}
  else {state.selected=null;render()}
}

async function performMove(move){
  const result=Engine.applyMove(move);
  if(!result.ok){toastMsg("That move is not legal.");return}
  state.selected=result.chain?result.captures[0]?.from??move.to:null;
  buzz(move.type==="capture"?45:18);
  tone(move.type==="capture"?520:360,move.type==="capture"?.08:.045);
  render(); saveGame();
  if(result.chain){toastMsg("Another capture is mandatory.");return}
  await sleep(160);
  if(state.mode==="ai" && state.turn===COLORS.ONYX && !state.gameOver) aiTurn();
}

function legalDestinations(){
  if(state.selected===null) return [];
  const moves=legalMoves(state.board,state.turn);
  return moves.filter(m=>m.from===state.selected).map(m=>m.to);
}

/* Minimax with alpha-beta; deterministic tie-breaking and a small
   difficulty-dependent search depth. */
function aiChooseMove(){
  const depth={easy:1,medium:2,hard:3,expert:4}[state.difficulty]||2;
  const moves=legalMoves(state.board,COLORS.ONYX);
  if(!moves.length) return null;
  let best=-Infinity,bestMoves=[];
  for(const m of moves){
    const b=cloneBoard(state.board); applySim(b,m,COLORS.ONYX);
    const score=minimax(b,COLORS.IVORY,depth-1,-Infinity,Infinity);
    if(score>best){best=score;bestMoves=[m]}else if(score===best)bestMoves.push(m);
  }
  return bestMoves[Math.floor(bestMoves.length/2)];
}
function applySim(board,m,p){
  board[m.to]=p;board[m.from]=null;if(m.type==="capture")board[m.over]=null;
}
function evaluate(board){
  const o=countPieces(board,COLORS.ONYX), i=countPieces(board,COLORS.IVORY);
  const om=legalMoves(board,COLORS.ONYX).length, im=legalMoves(board,COLORS.IVORY).length;
  return (o-i)*100+(om-im)*2;
}
function minimax(board,player,depth,alpha,beta){
  const moves=legalMoves(board,player);
  if(!moves.length) return player===COLORS.ONYX?-100000:100000;
  if(depth<=0) return evaluate(board);
  if(player===COLORS.ONYX){
    let v=-Infinity;for(const m of moves){const b=cloneBoard(board);applySim(b,m,player);v=Math.max(v,minimax(b,COLORS.IVORY,depth-1,alpha,beta));alpha=Math.max(alpha,v);if(beta<=alpha)break}return v;
  }else{
    let v=Infinity;for(const m of moves){const b=cloneBoard(board);applySim(b,m,player);v=Math.min(v,minimax(b,COLORS.ONYX,depth-1,alpha,beta));beta=Math.min(beta,v);if(beta<=alpha)break}return v;
  }
}
async function aiTurn(){
  if(state.gameOver||state.paused||state.turn!==COLORS.ONYX)return;
  $("#turnLabel").textContent="COMPUTER THINKING…";
  await sleep(state.difficulty==="easy"?260:520);
  if(state.paused||state.gameOver)return;
  const move=aiChooseMove();
  if(move) performMove(move);
}

function startGame(mode){
  state.mode=mode;state.difficulty=settings.difficulty||"medium";state.started=true;
  state.board=cloneBoard(INITIAL);state.turn=COLORS.IVORY;state.selected=null;state.chainPiece=null;state.chainCaptures=[];
  state.history=[];state.paused=false;state.gameOver=false;state.winner=null;state.moveNumber=1;
  $("#homeScreen").classList.remove("active");$("#gameScreen").classList.add("active");
  $("#p1Name").textContent=mode==="ai"?"You":"Player 1";$("#p2Name").textContent=mode==="ai"?"Computer":"Player 2";
  render();saveGame();
}
function saveGame(){
  if(!state.started||state.gameOver)return;
  save(STORAGE_KEY,{mode:state.mode,difficulty:state.difficulty,board:state.board,turn:state.turn,moveNumber:state.moveNumber,paused:state.paused,history:state.history,chainPiece:state.chainPiece,chainCaptures:state.chainCaptures});
}
function clearSave(){try{localStorage.removeItem(STORAGE_KEY)}catch{}}
function resumeGame(){
  const s=load(STORAGE_KEY,null);if(!s)return;
  state.mode=s.mode;state.difficulty=s.difficulty||"medium";state.board=s.board;state.turn=s.turn;state.moveNumber=s.moveNumber||1;
  state.paused=false;state.history=s.history||[];state.chainPiece=s.chainPiece??null;state.chainCaptures=s.chainCaptures||[];
  state.started=true;state.gameOver=false;state.selected=null;
  $("#p1Name").textContent=state.mode==="ai"?"You":"Player 1";$("#p2Name").textContent=state.mode==="ai"?"Computer":"Player 2";
  $("#homeScreen").classList.remove("active");$("#gameScreen").classList.add("active");render();
}
function updateSavedBanner(){ $("#savedBanner").classList.toggle("hidden",!load(STORAGE_KEY,null)) }

function render(){
  renderBoard();updateHud();updateSavedBanner();
}
function updateHud(){
  $("#ivoryCount").textContent=countPieces(state.board,COLORS.IVORY);
  $("#onyxCount").textContent=countPieces(state.board,COLORS.ONYX);
  $("#ivoryPill").classList.toggle("active",state.turn===COLORS.IVORY);
  $("#onyxPill").classList.toggle("active",state.turn===COLORS.ONYX);
  const human=state.mode==="friend"||state.turn===COLORS.IVORY;
  $("#turnLabel").textContent=state.gameOver?`${state.winner===COLORS.IVORY?"IVORY":"ONYX"} WINS`:state.paused?"PAUSED":human?"YOUR MOVE":"COMPUTER MOVE";
  $("#captureNote").classList.toggle("hidden",!hasAnyCapture(state.board,state.turn)||state.gameOver);
  const track=$("#beadTrack");track.innerHTML="";
  const count=countPieces(state.board,state.turn);for(let i=0;i<Math.min(count,16);i++){const d=document.createElement("i");d.className=state.turn==="ivory"?"iv":"";track.appendChild(d)}
  $("#undoBtn").disabled=state.history.length===0;$("#undoBtn").style.opacity=state.history.length?".":"0.45";
}
function renderBoard(){
  svg.innerHTML="";
  svg.innerHTML=`<defs>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3a2918"/><stop offset=".45" stop-color="#24190f"/><stop offset="1" stop-color="#120d08"/></linearGradient>
    <radialGradient id="ivoryGrad" cx=".3" cy=".25"><stop stop-color="#fffdf5"/><stop offset=".48" stop-color="#e9dfca"/><stop offset="1" stop-color="#9f8d68"/></radialGradient>
    <radialGradient id="onyxGrad" cx=".28" cy=".22"><stop stop-color="#777"/><stop offset=".45" stop-color="#292929"/><stop offset="1" stop-color="#050505"/></radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="1.7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="softGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <pattern id="woodgrain" width="90" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(-22)">
      <rect width="90" height="24" fill="url(#wood)"/><path d="M0 8 C25 3,45 15,90 8 M0 17 C20 12,60 22,90 14" fill="none" stroke="#a16e31" opacity=".12" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="1000" height="1160" fill="url(#woodgrain)"/>
  <rect x="16" y="16" width="968" height="1128" rx="22" fill="none" stroke="#6b4d21" stroke-width="3"/>
  <g id="edges"></g><g id="nodes"></g>`;
  const eg=$("#edges");
  EDGES.forEach(([a,b])=>{
    const p=NODES[a],q=NODES[b];const line=document.createElementNS("http://www.w3.org/2000/svg","line");
    line.setAttribute("x1",p.x);line.setAttribute("y1",p.y+70);line.setAttribute("x2",q.x);line.setAttribute("y2",q.y+70);line.setAttribute("class","edge");eg.appendChild(line)
  });
  const ng=$("#nodes"), legal=new Set(legalDestinations());
  NODES.forEach((n,i)=>{
    const g=document.createElementNS("http://www.w3.org/2000/svg","g");g.dataset.index=i;g.setAttribute("class","node");
    if(i===state.selected)g.classList.add("selected");
    if(legal.has(i))g.classList.add("legal");
    if(state.chainPiece===i)g.classList.add("capture");
    g.setAttribute("transform",`translate(${n.x},${n.y+70})`);
    const ring=document.createElementNS("http://www.w3.org/2000/svg","circle");ring.setAttribute("r",state.board[i]?"30":"24");ring.setAttribute("class","node-ring");
    const dot=document.createElementNS("http://www.w3.org/2000/svg","circle");dot.setAttribute("r","5");dot.setAttribute("class","node-dot");
    g.append(ring,dot);
    if(state.board[i]){
      const c=document.createElementNS("http://www.w3.org/2000/svg","circle");c.setAttribute("r","26");c.setAttribute("class",`piece ${state.board[i]}`);
      if(i===state.selected)c.classList.add("piece-pulse");g.appendChild(c)
    }
    g.addEventListener("click",()=>selectNode(i));
    ng.appendChild(g);
  });
}

/* ---------- UI / modal ---------- */
function openModal(html){modalContent.innerHTML=html;modalLayer.classList.add("open");modalLayer.setAttribute("aria-hidden","false")}
function closeModal(){modalLayer.classList.remove("open");modalLayer.setAttribute("aria-hidden","true")}
function showTutorial(){
 openModal(`<button class="close-modal" onclick="window.closeModal()">×</button><h2>How to Play</h2>
 <p><b>Goal:</b> capture all opposing beads, or leave the opponent with no legal move.</p>
 <div class="modal-section"><h3>Move</h3><p>Select your bead, then tap a connected empty point. A normal move travels one line.</p>
 <h3>Capture</h3><p>If an opponent bead is next to yours and the connected point beyond it is empty, jump over it to capture. Capture is mandatory whenever any capture exists.</p>
 <h3>Multiple capture</h3><p>After a capture, if the same bead can capture again, you must continue the chain before your turn ends.</p>
 <h3>Tips</h3><p>Protect groups, create double threats, and avoid leaving isolated beads. The Expert computer searches deeper than the lower levels.</p></div>
 <div class="modal-actions"><button class="gold-btn" onclick="window.closeModal()">Got it</button></div>`);
}
function showStats(){
 openModal(`<button class="close-modal" onclick="window.closeModal()">×</button><h2>Statistics</h2>
 <div class="stat-grid">
 <div class="stat"><b>${stats.games}</b><span>GAMES</span></div><div class="stat"><b>${stats.ivoryWins}</b><span>IVORY WINS</span></div>
 <div class="stat"><b>${stats.onyxWins}</b><span>ONYX WINS</span></div><div class="stat"><b>${stats.captures}</b><span>CAPTURES</span></div>
 <div class="stat"><b>${stats.moves}</b><span>MOVES</span></div><div class="stat"><b>${stats.bestStreak}</b><span>BEST IVORY STREAK</span></div>
 </div><div class="modal-actions"><button class="dark-btn" id="resetStats">Reset Stats</button><button class="gold-btn" onclick="window.closeModal()">Close</button></div>`);
 $("#resetStats").onclick=()=>{stats={games:0,ivoryWins:0,onyxWins:0,captures:0,moves:0,streak:0,bestStreak:0};commitStats();showStats()}
}
function showSettings(){
 openModal(`<button class="close-modal" onclick="window.closeModal()">×</button><h2>Settings</h2>
 <div class="setting"><div><label>Sound</label><small>Move and capture sounds</small></div><button class="toggle ${settings.sound?"on":""}" id="soundToggle"></button></div>
 <div class="setting"><div><label>Vibration</label><small>Use device vibration when supported</small></div><button class="toggle ${settings.vibration?"on":""}" id="vibeToggle"></button></div>
 <div class="setting"><div><label>Computer difficulty</label><small>Search depth changes by level</small></div><select id="difficultySelect" class="dark-btn"><option>easy</option><option>medium</option><option>hard</option><option>expert</option></select></div>
 <div class="modal-section"><p>Everything is stored locally in this browser. No backend, account or network connection is required.</p></div>
 <div class="modal-actions"><button class="gold-btn" onclick="window.closeModal()">Done</button></div>`);
 $("#difficultySelect").value=state.difficulty||"medium";
 $("#soundToggle").onclick=()=>{settings.sound=!settings.sound;state.sound=settings.sound;save(SETTINGS_KEY,settings);showSettings()}
 $("#vibeToggle").onclick=()=>{settings.vibration=!settings.vibration;state.vibration=settings.vibration;save(SETTINGS_KEY,settings);showSettings()}
 $("#difficultySelect").onchange=e=>{state.difficulty=e.target.value;settings.difficulty=state.difficulty;save(SETTINGS_KEY,settings)}
}
function showGameOver(){
 tone(720,.18);
 openModal(`<div class="pause-overlay"><div class="pause-mark">✦</div><h2>${state.winner===COLORS.IVORY?"Ivory Wins":"Onyx Wins"}</h2>
 <p>${state.winner===COLORS.IVORY?"A clean tactical finish.":"The opponent found the decisive position."}</p>
 <div class="modal-actions"><button class="dark-btn" id="overHome">Home</button><button class="gold-btn" id="overRestart">Play Again</button></div></div>`);
 $("#overHome").onclick=()=>{closeModal();goHome()};$("#overRestart").onclick=()=>{closeModal();Engine.restart()}
}
function showPause(){
 openModal(`<div class="pause-overlay"><div class="pause-mark">Ⅱ</div><h2>Game Paused</h2><p>Your current position is saved locally. Resume whenever you're ready.</p><div class="modal-actions"><button class="gold-btn" id="resumePause">Resume</button><button class="dark-btn" id="pauseHome">Home</button></div></div>`);
 $("#resumePause").onclick=()=>{state.paused=false;closeModal();render();saveGame()};$("#pauseHome").onclick=()=>{closeModal();goHome()}
}
window.closeModal=closeModal;

function goHome(){state.started=false;state.paused=false;$("#gameScreen").classList.remove("active");$("#homeScreen").classList.add("active");updateSavedBanner()}
function toastMsg(s){toast.textContent=s;toast.classList.add("show");clearTimeout(toastMsg.t);toastMsg.t=setTimeout(()=>toast.classList.remove("show"),1800)}
function buzz(ms){if(state.vibration&&navigator.vibrate)try{navigator.vibrate(ms)}catch{}}
let audioCtx=null;
function tone(freq,duration){if(!state.sound)return;try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;o.type="sine";g.gain.setValueAtTime(.025,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}catch{}}

/* ---------- menu / events ---------- */
$("#menuBtn").onclick=()=>{$("#sidePanel").classList.add("open");$("#panelBackdrop").classList.add("open")}
$("#closeMenu").onclick=()=>closeSide();$("#panelBackdrop").onclick=()=>closeSide();
function closeSide(){$("#sidePanel").classList.remove("open");$("#panelBackdrop").classList.remove("open")}
$("#settingsBtn").onclick=showSettings;
$("#tutorialBtn").onclick=showTutorial;$("#statsBtn").onclick=showStats;
$$(".mode-card").forEach(b=>b.onclick=()=>startGame(b.dataset.mode));
$("#resumeBtn").onclick=resumeGame;$("#discardSaveBtn").onclick=()=>{clearSave();updateSavedBanner()}
$("#backBtn").onclick=goHome;
$("#restartBtn").onclick=()=>{if(confirm("Restart this match?"))Engine.restart()};
$("#pauseBtn").onclick=()=>{if(state.gameOver)return;state.paused=true;saveGame();showPause()};
$("#undoBtn").onclick=()=>{if(state.mode==="ai" && state.history.length>=2){state.history.pop();Engine.undo()}else Engine.undo();saveGame();render()};
$$(".side-panel>button").forEach(b=>b.onclick=()=>{closeSide();({tutorial:showTutorial,stats:showStats,settings:showSettings}[b.dataset.panel])()});
modalLayer.addEventListener("click",e=>{if(e.target===modalLayer)closeModal()});
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"){closeModal();closeSide()}
 if(e.key===" " && $("#gameScreen").classList.contains("active")&&!modalLayer.classList.contains("open")){$("#pauseBtn").click()}
});

settings.difficulty=settings.difficulty||"medium";
updateSavedBanner();
render();
})();