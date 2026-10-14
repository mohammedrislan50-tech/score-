const STORE_KEY = "sl-softball-demo-v1";
const $ = (id) => document.getElementById(id);
const uid = () => Math.random().toString(36).slice(2, 10);
let db = loadDB();
let currentScoreMatchId = null;
let toastTimer;

function loadDB(){
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {tournaments:[],teams:[],matches:[]}; }
  catch { return {tournaments:[],teams:[],matches:[]}; }
}
function saveDB(){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); }
  catch(e){ notify("Storage is full. Try smaller logo/photo files."); }
  renderAll();
}
function notify(message){
  const t=$("toast"); t.textContent=message; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"),2600);
}
function esc(value=""){return String(value).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function imageData(fileInput){
  const file=fileInput?.files?.[0];
  return new Promise(resolve=>{
    if(!file) return resolve(null);
    if(file.size>900000){notify("Please use an image smaller than 900 KB.");return resolve(null);}
    const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=()=>resolve(null); reader.readAsDataURL(file);
  });
}
function tournament(id){return db.tournaments.find(x=>x.id===id);}
function team(id){return db.teams.find(x=>x.id===id);}
function match(id){return db.matches.find(x=>x.id===id);}
function tournamentTeams(tid){return db.teams.filter(t=>t.tournamentId===tid);}
function tournamentMatches(tid){return db.matches.filter(m=>m.tournamentId===tid);}
function initials(name="SL"){return name.trim().split(/\s+/).slice(0,2).map(s=>s[0]||"").join("").toUpperCase()||"SL";}
function logoHTML(item,cls="logo-box"){return `<div class="${cls}">${item?.logo?`<img src="${item.logo}" alt="">`:esc(initials(item?.name||"SL"))}</div>`;}
function teamSelectOptions(tid,selected=""){
  return tournamentTeams(tid).map(t=>`<option value="${t.id}" ${t.id===selected?"selected":""}>${esc(t.name)}</option>`).join("");
}
function fillTournamentSelect(id,selected){
  const el=$(id); if(!el)return;
  const prev=selected||el.value;
  el.innerHTML=db.tournaments.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("");
  if(!db.tournaments.length) el.innerHTML='<option value="">Create a tournament first</option>';
  if(db.tournaments.some(t=>t.id===prev))el.value=prev;
}
function renderAll(){
  renderHome(); fillTournamentSelect("teamTournament");fillTournamentSelect("matchTournament");fillTournamentSelect("tableTournament");fillTournamentSelect("statsTournament");fillTournamentSelect("overlayTournament");fillTournamentSelect("fixtureTournament");
  renderTeams();renderMatches();renderTable();renderStats();renderOverlay();
}
function renderHome(){
  $("metricTournaments").textContent=db.tournaments.length;
  $("metricTeams").textContent=db.teams.length;
  $("metricMatches").textContent=db.matches.length;
  $("metricLive").textContent=db.matches.filter(m=>m.status==="LIVE").length;
  $("tournamentCount").textContent=`${db.tournaments.length} tournament${db.tournaments.length===1?"":"s"}`;
  const host=$("tournamentList");
  if(!db.tournaments.length){host.innerHTML=`<div class="empty-state"><strong>No tournaments yet</strong>Create your first tournament to get started.<br><br><button class="btn btn-primary" onclick="openTournamentDialog()">＋ Create Tournament</button></div>`;return;}
  host.innerHTML=db.tournaments.map(t=>`<article class="tournament-card"><div class="card-top">${logoHTML(t)}<div style="flex:1;min-width:0"><h3>${esc(t.name)}</h3><p>${t.type==="league"?"League Tournament":"Knockout Tournament"} · ${esc(t.dates||"Dates not set")}</p><div style="margin-top:8px"><span class="tag ${t.type==="league"?"lime":""}">${t.type==="league"?"POINTS TABLE":"KNOCKOUT"}</span> <span class="tag">${tournamentTeams(t.id).length} teams</span></div></div></div><div class="card-actions"><button class="btn btn-primary" onclick="openTournament('${t.id}')">Open Tournament</button><button class="btn btn-secondary" onclick="editTournament('${t.id}')">Edit</button><button class="btn btn-danger" onclick="deleteTournament('${t.id}')">Delete</button></div></article>`).join("");
}
function showPage(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${name}`));
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
  const labels={home:"Home",teams:"Teams & Players",matches:"Matches",table:"Points Table",stats:"Statistics",overlay:"OBS Overlay"};
  $("pageTitle").textContent=labels[name]||"Home";
  if(name==="teams")renderTeams();if(name==="matches")renderMatches();if(name==="table")renderTable();if(name==="stats")renderStats();if(name==="overlay")renderOverlay();
}
function openTournamentDialog(t=null){
  $("tournamentForm").dataset.editId=t?.id||"";
  $("tournamentName").value=t?.name||"";
  $("tournamentType").value=t?.type||"league";
  $("tournamentWickets").value=t?.wickets??10;
  $("tournamentGroups").value=t?.groups??1;
  $("tournamentDates").value=t?.dates||"";
  $("tournamentLogo").value="";
  $("tournamentDialog").showModal();
  toggleTournamentType();
}
function toggleTournamentType(){$("wicketsField").style.display=$("tournamentType").value==="league"?"flex":"none";}
async function submitTournament(e){
  e.preventDefault();
  const id=$("tournamentForm").dataset.editId;
  const existing=id?tournament(id):null;
  const logo=await imageData($("tournamentLogo"))||existing?.logo||null;
  const item={id:id||uid(),name:$("tournamentName").value.trim(),type:$("tournamentType").value,wickets:Number($("tournamentWickets").value)||10,groups:Math.max(1,Number($("tournamentGroups").value)||1),dates:$("tournamentDates").value.trim(),logo};
  if(existing)db.tournaments=db.tournaments.map(t=>t.id===id?item:t);else db.tournaments.unshift(item);
  $("tournamentDialog").close();saveDB();notify(existing?"Tournament updated":"Tournament created successfully");
}
function editTournament(id){openTournamentDialog(tournament(id));}
function deleteTournament(id){
  const t=tournament(id);if(!t||!confirm(`Delete "${t.name}" and its teams/matches?`))return;
  const teamIds=db.teams.filter(x=>x.tournamentId===id).map(x=>x.id);
  db.tournaments=db.tournaments.filter(x=>x.id!==id);db.teams=db.teams.filter(x=>x.tournamentId!==id);db.matches=db.matches.filter(x=>x.tournamentId!==id||(!teamIds.includes(x.teamAId)&&!teamIds.includes(x.teamBId)));
  saveDB();notify("Tournament deleted");
}
function openTournament(id){fillTournamentSelect("teamTournament",id);fillTournamentSelect("matchTournament",id);fillTournamentSelect("tableTournament",id);fillTournamentSelect("statsTournament",id);fillTournamentSelect("overlayTournament",id);showPage("teams");}
function openTeamDialog(t=null){
  if(!db.tournaments.length){notify("Create a tournament first");openTournamentDialog();return;}
  const tid=$("teamTournament").value||db.tournaments[0].id;
  $("teamForm").dataset.tournamentId=tid;$("editTeamId").value=t?.id||"";
  $("teamDialogTitle").textContent=t?"Edit Team":"Add New Team";
  $("teamName").value=t?.name||"";$("teamShort").value=t?.shortName||"";
  $("teamColor").value=t?.color||"#8cff35";$("teamLogo").value="";
  fillGroupSelect(tid,t?.group||"A");
  $("teamDialog").showModal();
}
function fillGroupSelect(tid,selected="A"){
  const t=tournament(tid),n=Math.max(1,Number(t?.groups)||1);
  const opts=Array.from({length:n},(_,i)=>String.fromCharCode(65+i));
  $("teamGroup").innerHTML=opts.map(g=>`<option value="${g}" ${g===selected?"selected":""}>Group ${g}</option>`).join("");
}
function shortFromName(name){return name.trim().split(/\s+/).map(w=>w[0]).join("").toUpperCase().slice(0,6);}
$("teamName").addEventListener("input",()=>{if(!$("editTeamId").value||!$("teamShort").dataset.touched)$("teamShort").value=shortFromName($("teamName").value);});
$("teamShort").addEventListener("input",()=>{$("teamShort").dataset.touched="1";});
async function submitTeam(e){
  e.preventDefault();const id=$("editTeamId").value,existing=id?team(id):null,tid=$("teamForm").dataset.tournamentId;
  const logo=await imageData($("teamLogo"))||existing?.logo||null;
  const item={id:id||uid(),tournamentId:tid,name:$("teamName").value.trim(),shortName:$("teamShort").value.trim()||shortFromName($("teamName").value),group:$("teamGroup").value,color:$("teamColor").value,logo,players:existing?.players||[]};
  if(existing)db.teams=db.teams.map(x=>x.id===id?item:x);else db.teams.push(item);
  $("teamDialog").close();$("teamShort").dataset.touched="";saveDB();notify(existing?"Team updated":"Team saved");
}
function renderTeams(){
  const tid=$("teamTournament").value,host=$("teamsList");
  if(!host)return;
  const list=tournamentTeams(tid);
  if(!tid||!list.length){host.innerHTML=`<div class="empty-state"><strong>${tid?"No teams in this tournament":"Create a tournament first"}</strong>Add teams to set up squads and matches.</div>`;return;}
  host.innerHTML=list.map(t=>`<article class="team-card"><div class="card-top">${logoHTML(t)}<div style="flex:1;min-width:0"><h3>${esc(t.name)}</h3><p>${esc(t.shortName)} · Group ${esc(t.group)}</p><div style="margin-top:7px"><span class="tag">${t.players.length} players</span></div></div><span style="width:9px;height:35px;background:${esc(t.color)};border-radius:5px"></span></div><div class="card-actions"><button class="btn btn-primary" onclick="openPlayerDialog('${t.id}')">＋ Add Player</button><button class="btn btn-secondary" onclick="editTeam('${t.id}')">Edit Team</button><button class="btn btn-danger" onclick="deleteTeam('${t.id}')">Delete</button></div><div style="margin-top:13px">${t.players.length?t.players.map(p=>`<div class="player-line"><span>${p.photo?`<img src="${p.photo}" style="width:24px;height:24px;object-fit:cover;border-radius:50%;vertical-align:middle;margin-right:7px">`:""}${esc(p.name)}</span><span><button class="btn btn-secondary" style="padding:5px 8px" onclick="editPlayer('${t.id}','${p.id}')">Edit</button> <button class="btn btn-danger" style="padding:5px 8px" onclick="deletePlayer('${t.id}','${p.id}')">×</button></span></div>`).join(""):'<p class="muted">No players added yet.</p>'}</div></article>`).join("");
}
function editTeam(id){openTeamDialog(team(id));}
function deleteTeam(id){const t=team(id);if(!t||!confirm(`Delete team "${t.name}"?`))return;db.teams=db.teams.filter(x=>x.id!==id);saveDB();notify("Team deleted");}
function openPlayerDialog(tid,p=null){
  $("playerTeamId").value=tid;$("editPlayerId").value=p?.id||"";$("playerName").value=p?.name||"";$("playerPhoto").value="";$("playerDialogTitle").textContent=p?"Edit Player":"Add Player";$("playerDialog").showModal();
}
async function submitPlayer(e){
  e.preventDefault();const tid=$("playerTeamId").value,t=team(tid);if(!t)return;
  const id=$("editPlayerId").value,old=t.players.find(p=>p.id===id),photo=await imageData($("playerPhoto"))||old?.photo||null;
  const p={id:id||uid(),name:$("playerName").value.trim(),photo};
  if(old)t.players=t.players.map(x=>x.id===id?p:x);else t.players.push(p);
  $("playerDialog").close();saveDB();notify(old?"Player updated":"Player added to squad");
}
function editPlayer(tid,pid){const t=team(tid);openPlayerDialog(tid,t?.players.find(p=>p.id===pid));}
function deletePlayer(tid,pid){const t=team(tid);if(!t||!confirm("Delete this player?"))return;t.players=t.players.filter(p=>p.id!==pid);saveDB();notify("Player deleted");}
function openMatchDialog(){
  if(!db.tournaments.length){notify("Create a tournament first");openTournamentDialog();return;}
  $("matchForm").reset();$("matchOvers").value=7;$("ballsPerOver").value=6;
  fillTournamentSelect("fixtureTournament",$("matchTournament").value||db.tournaments[0].id);updateFixtureTeams();$("matchDialog").showModal();
}
function updateFixtureTeams(){
  const tid=$("fixtureTournament").value,ts=tournamentTeams(tid);
  $("matchTeamA").innerHTML=ts.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("");
  $("matchTeamB").innerHTML=ts.map((t,i)=>`<option value="${t.id}" ${i===1?"selected":""}>${esc(t.name)}</option>`).join("");
  if(ts.length<2)notify("Add at least two teams before creating a match");
}
function submitMatch(e){
  e.preventDefault();const tid=$("fixtureTournament").value,a=$("matchTeamA").value,b=$("matchTeamB").value;
  if(!a||!b||a===b){notify("Select two different teams");return;}
  const item={id:uid(),tournamentId:tid,teamAId:a,teamBId:b,overs:Number($("matchOvers").value)||7,ballsPerOver:Number($("ballsPerOver").value)||6,type:$("matchType").value,date:$("matchDate").value,status:"SCHEDULED",innings:1,battingTeamId:a,fieldingTeamId:b,tossWinnerId:null,tossDecision:null,score:{},events:[],strikerId:null,nonStrikerId:null,bowlerId:null};
  item.score[a]={runs:0,wickets:0,legalBalls:0};item.score[b]={runs:0,wickets:0,legalBalls:0};
  db.matches.unshift(item);$("matchDialog").close();fillTournamentSelect("matchTournament",tid);saveDB();notify("Match created successfully");
}
function renderMatches(){
  const tid=$("matchTournament").value,host=$("matchesList");if(!host)return;
  const list=tournamentMatches(tid);
  if(!tid||!list.length){host.innerHTML='<div class="empty-state"><strong>No matches yet</strong>Create a fixture after adding at least two teams.</div>';return;}
  host.innerHTML=list.map(m=>{const a=team(m.teamAId),b=team(m.teamBId),sa=m.score[m.teamAId]||{runs:0,wickets:0,legalBalls:0},sb=m.score[m.teamBId]||{runs:0,wickets:0,legalBalls:0};return `<div class="match-row"><div style="min-width:0"><div class="match-teams"><div class="mini-team">${logoHTML(a,"mini-logo")}${esc(a?.shortName||"Team A")}</div><span class="vs">VS</span><div class="mini-team">${logoHTML(b,"mini-logo")}${esc(b?.shortName||"Team B")}</div></div><div class="match-meta">${esc(m.type)} · ${esc(m.date||"Date not set")} · ${esc(m.status)}</div><div class="match-meta">${sa.runs}/${sa.wickets} (${oversText(sa.legalBalls,m.ballsPerOver)}) &nbsp;—&nbsp; ${sb.runs}/${sb.wickets} (${oversText(sb.legalBalls,m.ballsPerOver)})</div></div><div class="row-actions"><button class="btn btn-primary" onclick="openScore('${m.id}')">${m.status==="LIVE"?"Continue Scoring":"Open Score"}</button><button class="btn btn-secondary" onclick="deleteMatch('${m.id}')">Delete</button></div></div>`;}).join("");
}
function deleteMatch(id){if(!confirm("Delete this match?"))return;db.matches=db.matches.filter(m=>m.id!==id);saveDB();notify("Match deleted");}
function oversText(balls,bpo=6){return `${Math.floor((balls||0)/bpo)}.${(balls||0)%bpo}`;}
function openScore(id){
  const m=match(id);if(!m)return;currentScoreMatchId=id;
  if(!m.strikerId||!m.nonStrikerId||!m.bowlerId){/* selectors can be set in the scoring panel */}
  $("scoreMatchTitle").textContent=`${team(m.teamAId)?.name||"Team A"} vs ${team(m.teamBId)?.name||"Team B"}`;
  $("scoreDialog").showModal();renderScore();
}
function playersOptions(tid,selected,placeholder){
  const t=team(tid),ps=t?.players||[];
  return `<option value="">${placeholder}</option>`+ps.map(p=>`<option value="${p.id}" ${p.id===selected?"selected":""}>${esc(p.name)}</option>`).join("");
}
function renderScore(){
  const m=match(currentScoreMatchId);if(!m)return;
  const batting=team(m.battingTeamId),fielding=team(m.fieldingTeamId),s=m.score[m.battingTeamId]||{runs:0,wickets:0,legalBalls:0},overs=m.overs*m.ballsPerOver;
  const striker=batting?.players.find(p=>p.id===m.strikerId),non=batting?.players.find(p=>p.id===m.nonStrikerId),bowler=fielding?.players.find(p=>p.id===m.bowlerId);
  const target=m.target?`Target ${m.target} · Need ${Math.max(0,m.target-s.runs)} runs`:"";
  $("scoreBody").innerHTML=`
    <div class="scoreboard-top"><div><h3>${esc(batting?.name||"Batting team")} <span style="color:var(--muted)">vs</span> ${esc(fielding?.name||"Fielding team")}</h3><p class="muted">${esc(m.type)} · Innings ${m.innings} · ${m.overs} overs</p></div><div style="text-align:right"><div class="score-big">${s.runs}/${s.wickets}</div><div class="muted">${oversText(s.legalBalls,m.ballsPerOver)} overs</div></div></div>
    <div class="score-controls">
      <div class="score-panel"><h3>Batting · ${esc(batting?.shortName||"")}</h3><div class="score-numbers"><strong>${s.runs}/${s.wickets}</strong><span>${oversText(s.legalBalls,m.ballsPerOver)} ov</span></div><p class="muted">${target||"Current innings score"}</p>
        <label class="field">Striker<select id="scoreStriker">${playersOptions(m.battingTeamId,m.strikerId,"Select striker")}</select></label>
        <label class="field">Non-striker<select id="scoreNon">${playersOptions(m.battingTeamId,m.nonStrikerId,"Select non-striker")}</select></label>
        <div class="innings-actions"><button class="btn btn-secondary" onclick="swapBatters()">⇄ Swap batters</button><button class="btn btn-secondary" onclick="editCurrentScore()">Edit score</button></div>
      </div>
      <div class="score-panel"><h3>Bowling · ${esc(fielding?.shortName||"")}</h3><label class="field">Bowler<select id="scoreBowler">${playersOptions(m.fieldingTeamId,m.bowlerId,"Select bowler")}</select></label><p class="muted">Select players from the saved team squads. Add missing players from Teams & Players.</p><div class="player-line"><span>Match status</span><strong>${esc(m.status)}</strong></div><div class="player-line"><span>Innings</span><strong>${m.innings}</strong></div><div class="player-line"><span>Remaining legal balls</span><strong>${Math.max(0,overs-s.legalBalls)}</strong></div></div>
    </div>
    <div class="score-panel" style="margin-top:14px"><h3>This ball · Add score</h3><div class="score-buttons">
      ${[0,1,2,3,4,5,6].map(n=>`<button class="run" onclick="scoreBall('runs',${n})">${n}</button>`).join("")}
      <button onclick="scoreBall('wide',1)">Wide</button><button onclick="scoreBall('noball',1)">No-ball</button><button onclick="scoreBall('bye',1)">Bye</button><button onclick="scoreBall('legbye',1)">Leg-bye</button><button class="wicket" onclick="scoreBall('wicket',0)">OUT</button>
    </div>
    <div class="score-buttons"><button onclick="scoreBall('wide',2)">Wide + run</button><button onclick="scoreBall('noball',2)">No-ball + run</button><button onclick="scoreBall('penalty',5)">Penalty +5</button><button onclick="undoBall()">↶ Undo last</button><button class="wicket" onclick="endInnings()">End innings</button></div>
    <p class="help">Demo scoring rules: wides and no-balls add one extra and do not count as legal balls. Byes/leg-byes count as legal balls. Use Undo to reverse the last scoring action. Check your competition's softball rules before official use.</p></div>
    <div class="score-panel" style="margin-top:14px"><h3>Recent deliveries</h3>${m.events.length?m.events.slice(-8).reverse().map(ev=>`<div class="player-line"><span>${esc(ev.label)}</span><span>${esc(ev.teamName)} · ${esc(ev.scoreAfter)}</span></div>`).join(""):'<p class="muted">No balls recorded yet.</p>'}</div>
    <div class="innings-actions"><button class="btn btn-primary" onclick="savePlayerSelections()">Save player selections</button><button class="btn btn-secondary" onclick="startNextInnings()">Start next innings</button><button class="btn btn-secondary" onclick="finishMatch()">Finish match</button></div>`;
  ["scoreStriker","scoreNon","scoreBowler"].forEach(id=>$(id)?.addEventListener("change",savePlayerSelections));
}
function savePlayerSelections(){
  const m=match(currentScoreMatchId);if(!m)return;
  m.strikerId=$("scoreStriker")?.value||m.strikerId;m.nonStrikerId=$("scoreNon")?.value||m.nonStrikerId;m.bowlerId=$("scoreBowler")?.value||m.bowlerId;
  if(m.strikerId&&m.strikerId===m.nonStrikerId){notify("Striker and non-striker must be different");m.nonStrikerId=null;}
  saveDB();renderScore();
}
function swapBatters(){const m=match(currentScoreMatchId);if(!m)return;[m.strikerId,m.nonStrikerId]=[m.nonStrikerId,m.strikerId];saveDB();renderScore();}
function scoreBall(kind,value){
  const m=match(currentScoreMatchId);if(!m)return;
  savePlayerSelectionsQuiet(m);
  const tid=m.battingTeamId,s=m.score[tid];if(!s)return;
  if(s.legalBalls>=m.overs*m.ballsPerOver){notify("Overs completed. End the innings or start next innings.");return;}
  const before=JSON.parse(JSON.stringify({score:m.score,innings:m.innings,battingTeamId:m.battingTeamId,fieldingTeamId:m.fieldingTeamId,status:m.status,strikerId:m.strikerId,nonStrikerId:m.nonStrikerId,bowlerId:m.bowlerId,target:m.target}));
  let total=0,legal=true,label="";
  if(kind==="runs"){total=value;label=`${value} run${value===1?"":"s"}`;s.runs+=value;if(value%2===1)[m.strikerId,m.nonStrikerId]=[m.nonStrikerId,m.strikerId];}
  else if(kind==="wide"){total=1+Math.max(0,value-1);label=`Wide +${total}`;s.runs+=total;legal=false;}
  else if(kind==="noball"){total=1+Math.max(0,value-1);label=`No-ball +${total}`;s.runs+=total;legal=false;}
  else if(kind==="bye"||kind==="legbye"){total=value;s.runs+=value;label=`${kind==="bye"?"Bye":"Leg-bye"} +${value}`;if(value%2===1)[m.strikerId,m.nonStrikerId]=[m.nonStrikerId,m.strikerId];}
  else if(kind==="penalty"){total=value;s.runs+=value;label=`Penalty +${value}`;legal=false;}
  else if(kind==="wicket"){s.wickets++;label="WICKET";legal=true;if(m.strikerId){m.strikerId=null;}else if(m.nonStrikerId){m.nonStrikerId=null;} }
  if(legal)s.legalBalls++;
  m.status="LIVE";
  const event={id:uid(),before,kind,value,label,teamName:team(tid)?.shortName||"Batting",scoreAfter:`${s.runs}/${s.wickets} (${oversText(s.legalBalls,m.ballsPerOver)})`};
  m.events.push(event);
  if(s.legalBalls>=m.overs*m.ballsPerOver||s.wickets>=Number(tournament(m.tournamentId)?.wickets||10)){notify("Innings limit reached");}
  saveDB();renderScore();
}
function savePlayerSelectionsQuiet(m){
  m.strikerId=$("scoreStriker")?.value||m.strikerId;m.nonStrikerId=$("scoreNon")?.value||m.nonStrikerId;m.bowlerId=$("scoreBowler")?.value||m.bowlerId;
}
function undoBall(){
  const m=match(currentScoreMatchId);if(!m||!m.events.length){notify("Nothing to undo");return;}
  const ev=m.events.pop();Object.assign(m,ev.before);saveDB();renderScore();notify("Last scoring action undone");
}
function editCurrentScore(){
  const m=match(currentScoreMatchId),s=m?.score[m?.battingTeamId];if(!m||!s)return;
  const runs=prompt("Enter corrected total runs:",s.runs);if(runs===null)return;
  const wickets=prompt("Enter corrected wickets:",s.wickets);if(wickets===null)return;
  const balls=prompt("Enter legal balls bowled:",s.legalBalls);if(balls===null)return;
  if([runs,wickets,balls].some(v=>v.trim()===""||!Number.isFinite(Number(v))||Number(v)<0)){notify("Enter valid non-negative numbers");return;}
  s.runs=Number(runs);s.wickets=Number(wickets);s.legalBalls=Number(balls);saveDB();renderScore();notify("Score corrected");
}
function endInnings(){const m=match(currentScoreMatchId);if(!m)return;if(!confirm("End this innings?"))return;m.status="INNINGS BREAK";m.target=m.score[m.battingTeamId].runs+1;saveDB();renderScore();notify("Innings ended");}
function startNextInnings(){
  const m=match(currentScoreMatchId);if(!m)return;
  if(m.innings>=2){notify("This demo supports two innings per match");return;}
  const firstBat=m.battingTeamId;m.battingTeamId=m.fieldingTeamId;m.fieldingTeamId=firstBat;m.innings=2;m.target=m.score[firstBat].runs+1;m.strikerId=null;m.nonStrikerId=null;m.bowlerId=null;m.status="LIVE";
  if(!m.score[m.battingTeamId])m.score[m.battingTeamId]={runs:0,wickets:0,legalBalls:0};
  saveDB();renderScore();notify(`Second innings started. Target: ${m.target}`);
}
function finishMatch(){const m=match(currentScoreMatchId);if(!m)return;m.status="COMPLETED";saveDB();$("scoreDialog").close();notify("Match marked completed");}
function renderTable(){
  const tid=$("tableTournament")?.value,host=$("pointsTable");if(!host)return;const t=tournament(tid);
  if(!t||t.type!=="league"){host.innerHTML='<div class="empty-state"><strong>Points table not required</strong>Choose a league tournament. Knockout tournaments do not use a league points table.</div>';return;}
  const groups=[...new Set(tournamentTeams(tid).map(x=>x.group||"A"))].sort();
  const groupSel=$("tableGroup"),old=groupSel.value;
  groupSel.innerHTML='<option value="all">All groups</option>'+groups.map(g=>`<option value="${g}">Group ${g}</option>`).join("");
  if([...groups,"all"].includes(old))groupSel.value=old;
  let teams=tournamentTeams(tid);if(groupSel.value!=="all")teams=teams.filter(x=>x.group===groupSel.value);
  const rows=teams.map(tm=>{
    let played=0,wins=0,losses=0,ties=0,forRuns=0,against=0;
    tournamentMatches(tid).filter(m=>m.status==="COMPLETED"&&m.innings>=2).forEach(m=>{
      if(![m.teamAId,m.teamBId].includes(tm.id))return;
      played++;const mine=m.score[tm.id]?.runs||0,oppId=m.teamAId===tm.id?m.teamBId:m.teamAId,opp=m.score[oppId]?.runs||0;forRuns+=mine;against+=opp;
      if(mine>opp)wins++;else if(mine<opp)losses++;else ties++;
    });
    return {...tm,played,wins,losses,ties,points:wins*2+ties,runDiff:forRuns-against};
  }).sort((a,b)=>b.points-a.points||b.runDiff-a.runDiff);
  if(!rows.length){host.innerHTML='<div class="empty-state"><strong>No teams yet</strong>Add teams to populate the table.</div>';return;}
  host.innerHTML=`<table><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>T</th><th>Pts</th><th>Run diff</th><th></th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td class="rank">${i+1}</td><td><strong>${esc(r.name)}</strong><div class="muted">Group ${esc(r.group)}</div></td><td>${r.played}</td><td>${r.wins}</td><td>${r.losses}</td><td>${r.ties}</td><td><strong>${r.points}</strong></td><td>${r.runDiff>0?"+":""}${r.runDiff}</td><td><button class="btn btn-secondary" onclick="notify('Group ${esc(r.group)} standings displayed')">Show</button></td></tr>`).join("")}</tbody></table>`;
}
function renderStats(){
  const tid=$("statsTournament")?.value,host=$("statsCards");if(!host)return;const ms=tournamentMatches(tid);
  const completed=ms.filter(m=>m.status==="COMPLETED");
  const totalRuns=completed.reduce((sum,m)=>sum+Object.values(m.score).reduce((s,x)=>s+(x.runs||0),0),0);
  const totalWickets=completed.reduce((sum,m)=>sum+Object.values(m.score).reduce((s,x)=>s+(x.wickets||0),0),0);
  host.innerHTML=[["Matches",ms.length],["Completed",completed.length],["Total runs",totalRuns],["Wickets",totalWickets]].map(([l,n])=>`<div class="metric-card"><span class="metric-label">${l}</span><strong>${n}</strong><small>Tournament summary</small></div>`).join("");
  $("scoreSummaries").innerHTML=ms.length?ms.map(m=>`<div class="match-row"><div><strong>${esc(team(m.teamAId)?.name||"Team A")} vs ${esc(team(m.teamBId)?.name||"Team B")}</strong><div class="match-meta">${esc(m.type)} · ${esc(m.status)}</div></div><strong>${m.score[m.teamAId]?.runs||0}/${m.score[m.teamAId]?.wickets||0} — ${m.score[m.teamBId]?.runs||0}/${m.score[m.teamBId]?.wickets||0}</strong></div>`).join(""):'<p class="muted">No matches yet.</p>';
}
function renderOverlay(){
  const tid=$("overlayTournament")?.value,host=$("overlayPreview");if(!host)return;
  const m=tournamentMatches(tid).find(x=>x.status==="LIVE")||tournamentMatches(tid)[0];
  if(!tid||!m){host.innerHTML='<div class="empty-state" style="width:100%"><strong>No match data yet</strong>Create a match and add a score to preview the overlay.</div>';return;}
  host.innerHTML=overlayHTML(m);
}
function overlayHTML(m){
  const batting=team(m.battingTeamId),fielding=team(m.fieldingTeamId),s=m.score[m.battingTeamId]||{runs:0,wickets:0,legalBalls:0};
  const teamBlock=(tm,sub,right=false)=>`<div class="overlay-team ${right?"right":""}">${right?"":logoHTML(tm,"overlay-logo")}<div><div class="overlay-name">${esc(tm?.name||"TEAM")}</div><div class="overlay-sub">${esc(sub||"SOFTBALL LIVE")}</div></div>${right?logoHTML(tm,"overlay-logo"):""}</div>`;
  return `<div class="score-overlay">${teamBlock(batting,`${s.runs}/${s.wickets} · ${oversText(s.legalBalls,m.ballsPerOver)} OV`)}<div class="overlay-score"><strong>${s.runs} / ${s.wickets}</strong><span>${esc(m.type)} · INNINGS ${m.innings} · ${oversText(s.legalBalls,m.ballsPerOver)} OV</span></div>${teamBlock(fielding,`FIELDING · ${esc(m.status)}`,true)}</div>`;
}
function previewOverlay(){
  const tid=$("overlayTournament").value,m=tournamentMatches(tid).find(x=>x.status==="LIVE")||tournamentMatches(tid)[0];
  if(!m){notify("Create a match first");return;}
  const url=new URL(location.href);url.searchParams.set("overlay",tid);
  window.open(url.toString(),"_blank","noopener");
}
function copyOverlay(){
  const tid=$("overlayTournament").value;if(!tid){notify("Create a tournament first");return;}
  const url=new URL(location.href);url.searchParams.set("overlay",tid);
  navigator.clipboard?.writeText(url.toString()).then(()=>notify("Overlay link copied")).catch(()=>prompt("Copy this overlay URL:",url.toString()));
}
function clearOverlay(){const tid=$("overlayTournament").value;if(!tid)return;db.matches.filter(m=>m.tournamentId===tid).forEach(m=>{if(m.status==="LIVE")m.status="SCHEDULED";});saveDB();notify("Live status cleared");}
function renderStandaloneOverlay(tid){
  document.body.innerHTML=`<div style="background:transparent;min-height:100vh;display:flex;align-items:flex-end"><div id="standaloneOverlay" style="width:100%"></div></div>`;
  const draw=()=>{const m=tournamentMatches(tid).find(x=>x.status==="LIVE")||tournamentMatches(tid)[0];$("standaloneOverlay").innerHTML=m?overlayHTML(m):"";};
  draw();
}
function init(){
  document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
  $("heroCreate").onclick=()=>openTournamentDialog();$("createTop").onclick=()=>openTournamentDialog();
  $("tournamentType").addEventListener("change",toggleTournamentType);
  $("tournamentForm").addEventListener("submit",submitTournament);
  $("teamForm").addEventListener("submit",submitTeam);$("addTeamBtn").onclick=()=>openTeamDialog();
  $("teamTournament").addEventListener("change",()=>{fillGroupSelect($("teamTournament").value);renderTeams();});
  $("playerForm").addEventListener("submit",submitPlayer);
  $("newMatchBtn").onclick=openMatchDialog;$("matchForm").addEventListener("submit",submitMatch);
  $("fixtureTournament").addEventListener("change",updateFixtureTeams);
  $("matchTournament").addEventListener("change",renderMatches);
  $("tableTournament").addEventListener("change",renderTable);$("tableGroup").addEventListener("change",renderTable);
  $("statsTournament").addEventListener("change",renderStats);$("overlayTournament").addEventListener("change",renderOverlay);
  $("previewOverlay").onclick=previewOverlay;$("copyOverlay").onclick=copyOverlay;$("clearOverlay").onclick=clearOverlay;
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>$(b.dataset.close).close()));
  $("tournamentForm").addEventListener("submit",()=>{});
  renderAll();
  const params=new URLSearchParams(location.search),overlayId=params.get("overlay");
  if(overlayId){renderStandaloneOverlay(overlayId);return;}
  const hash=location.hash.replace("#","");if(["home","teams","matches","table","stats","overlay"].includes(hash))showPage(hash);
}
init();
