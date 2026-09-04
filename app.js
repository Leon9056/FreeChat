/* Conversa Live v2.0.3 — conexão robusta, UI/UX, amigos, DMs e música */
function serverUrl(){return window.SIGNALING_URL?window.SIGNALING_URL.replace(/\/$/,""):(location.protocol==="https:"?"https://"+location.host:"http://"+location.host)}
(function(){
 const $=id=>document.getElementById(id),
       applyTheme=()=>{const t=localStorage.getItem("conversaLiveTheme")||"dark";document.documentElement.dataset.theme=t;const b=$("themeToggle");if(b)b.textContent=t==="dark"?"☀️":"🌙";},
       toggleTheme=()=>{const t=(localStorage.getItem("conversaLiveTheme")||"dark")==="dark"?"light":"dark";localStorage.setItem("conversaLiveTheme",t);applyTheme();};
 applyTheme();
 document.addEventListener("DOMContentLoaded",()=>{applyTheme();$("themeToggle")?.addEventListener("click",toggleTheme);});
 const login=$("login"),menu=$("callMenu"),app=$("app"),email=$("email"),password=$("password"),name=$("name");
let mode="login";
const setStatus=(msg,type="error")=>{const el=$("loginStatus");el.textContent=msg||"";el.className="status "+type};
const setBusy=(el,busy,label)=>{if(!el)return;el.disabled=busy;if(busy){el.dataset.originalText=el.textContent;el.textContent=label||"Aguarde..."}else if(el.dataset.originalText){el.textContent=el.dataset.originalText;delete el.dataset.originalText}};
function modeSet(m){
 mode=m;
 $("loginTab").classList.toggle("active",m==="login");$("registerTab").classList.toggle("active",m==="register");
 $("registerFields").classList.toggle("hidden",m!=="register");$("confirmPasswordWrap").classList.toggle("hidden",m!=="register");
 $("passwordStrength").classList.toggle("hidden",m!=="register");$("loginBtn").classList.remove("hidden");
 $("loginBtn").textContent=m==="register"?"✨ Criar conta":"🚀 Entrar";
 $("authSubtitle").textContent=m==="register"?"Crie sua conta para começar.":"Entre na sua conta para continuar";
 setStatus("");
}

let friendRequestSnapshot=new Set(),friendPollTimer=null,audioNotifyContext=null;
let musicAudioContext=null,musicElement=null,musicSource=null,musicDestination=null,musicMicSource=null,musicGainNode=null,musicTrack=null,musicHost=false,musicVolume=.7,musicState=null;

function playFriendNotificationSound(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return;
    audioNotifyContext=audioNotifyContext||new AC();
    if(audioNotifyContext.state==="suspended")audioNotifyContext.resume().catch(()=>{});
    const now=audioNotifyContext.currentTime;
    const gain=audioNotifyContext.createGain();
    gain.gain.setValueAtTime(0.0001,now);
    gain.gain.exponentialRampToValueAtTime(0.055,now+0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001,now+0.23);
    gain.connect(audioNotifyContext.destination);
    const osc=audioNotifyContext.createOscillator();
    osc.type="sine";osc.frequency.setValueAtTime(740,now);
    osc.frequency.exponentialRampToValueAtTime(980,now+0.11);
    osc.connect(gain);osc.start(now);osc.stop(now+0.24);
  }catch(e){}
}
function unlockNotificationAudio(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return;
    audioNotifyContext=audioNotifyContext||new AC();
    if(audioNotifyContext.state==="suspended")audioNotifyContext.resume().catch(()=>{});
  }catch(e){}
}
document.addEventListener("pointerdown",unlockNotificationAudio,{passive:true});

function showFriendToast(name){
  let t=document.getElementById("friendToast");
  if(!t){
    t=document.createElement("div");t.id="friendToast";t.className="friend-toast";
    document.body.appendChild(t);
  }
  t.innerHTML='<span class="friend-toast-icon">👥</span><div><b>Novo convite de amizade</b><small></small></div>';
  t.querySelector("small").textContent=(name||"Alguém")+" enviou uma solicitação para você.";
  t.classList.add("show");
  clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove("show"),5200);
  t.onclick=()=>{$("friendsPanel")?.classList.remove("hidden");renderFriends();t.classList.remove("show")};
}
async function pollFriendRequests(){
  if(!window.CONVERSA_TOKEN)return;
  try{
    const d=await api("/api/friends");
    const current=new Set((d.requests||[]).map(x=>x.code));
    const isFirst=friendRequestSnapshot.size===0 && !window.CONVERSA_FRIEND_POLL_STARTED;
    window.CONVERSA_FRIEND_POLL_STARTED=true;
    if(!isFirst){
      (d.requests||[]).forEach(u=>{
        if(!friendRequestSnapshot.has(u.code)){
          playFriendNotificationSound();
          showFriendToast(u.name);
        }
      });
    }
    friendRequestSnapshot=current;
    window.friendDirectory=d;
    if($("friendsPanel")&&!$("friendsPanel").classList.contains("hidden"))renderFriends();
  }catch(e){}
}
function startFriendRequestPolling(){
  clearInterval(friendPollTimer);
  friendRequestSnapshot=new Set();
  window.CONVERSA_FRIEND_POLL_STARTED=false;
  pollFriendRequests();
  friendPollTimer=setInterval(pollFriendRequests,2500);
}

function showApp(d){
 localStorage.setItem("conversaLiveToken",d.token);localStorage.setItem("conversaLiveUser",JSON.stringify(d.user));
 window.CONVERSA_TOKEN=d.token;window.CONVERSA_USER=d.user;login.classList.add("hidden");menu.classList.remove("hidden");
 $("welcomeName").textContent=d.user.name;$("myCode").textContent=d.user.code;$("sideCode").textContent=d.user.code;window.renderFriends?.();startFriendRequestPolling();
}
function passwordScore(p){let n=0;if(p.length>=6)n++;if(p.length>=10)n++;if(/[a-z]/.test(p)&&/[A-Z]/.test(p))n++;if(/\d/.test(p))n++;if(/[^A-Za-z0-9]/.test(p))n++;return Math.min(n,4)}
function updatePasswordStrength(){const p=password.value,score=passwordScore(p),bar=$("strengthBar"),text=$("strengthText");if(!bar||!text)return;bar.style.width=(p?score*25:0)+"%";text.textContent=p?["Muito fraca","Fraca","Razoável","Boa","Forte"][score]:"Digite uma senha";bar.dataset.score=score;text.dataset.score=score}
function togglePasswordField(inputId,buttonId){const input=$(inputId),btn=$(buttonId);if(!input||!btn)return;const visible=input.type==="password";input.type=visible?"text":"password";btn.setAttribute("aria-pressed",String(visible));btn.setAttribute("aria-label",visible?"Ocultar senha":"Mostrar senha");btn.classList.toggle("visible",visible)}
async function auth(){
 const em=email.value.trim().toLowerCase(),pw=password.value,nm=name?.value.trim()||"",confirm=$("confirmPassword")?.value||"";
 if(!/^\S+@\S+\.\S+$/.test(em)){setStatus("Digite um e-mail válido.");email.focus();return}
 if(mode==="register"&&nm.length<2){setStatus("Digite um nome com pelo menos 2 caracteres.");name.focus();return}
 if(mode==="register"&&pw.length<6){setStatus("A senha precisa ter pelo menos 6 caracteres.");password.focus();return}
 if(mode==="register"&&pw!==confirm){setStatus("As senhas não coincidem.");$("confirmPassword").focus();return}
 const btn=$("loginBtn");setBusy(btn,true,mode==="register"?"Criando conta...":"Entrando...");setStatus("Conectando ao servidor...","loading");
 try{
  const r=await fetch(serverUrl()+"/api/"+(mode==="register"?"register":"login"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(mode==="register"?{name:nm,email:em,password:pw}:{email:em,password:pw})});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"Não foi possível concluir a operação.");showApp(d);
 }catch(e){setStatus(e.message||"Não foi possível conectar ao servidor. Verifique o backend no Render.");}
 finally{setBusy(btn,false,mode==="register"?"✨ Criar conta":"🚀 Entrar")}
}
$("loginTab").onclick=()=>modeSet("login");$("registerTab").onclick=()=>modeSet("register");$("loginBtn").onclick=auth;
 $("togglePassword").onclick=()=>togglePasswordField("password","togglePassword");$("toggleConfirmPassword").onclick=()=>togglePasswordField("confirmPassword","toggleConfirmPassword");
 password.addEventListener("input",updatePasswordStrength);$("confirmPassword")?.addEventListener("input",()=>{$("confirmPassword").setCustomValidity(password.value!==$("confirmPassword").value?"As senhas não coincidem.":"")});
 [email,password,name,$("confirmPassword")].filter(Boolean).forEach(el=>el.addEventListener("keydown",e=>{if(e.key==="Enter")auth()}));
 const t=localStorage.getItem("conversaLiveToken"),u=localStorage.getItem("conversaLiveUser");if(t&&u)try{window.CONVERSA_TOKEN=t;window.CONVERSA_USER=JSON.parse(u);login.classList.add("hidden");menu.classList.remove("hidden");$("welcomeName").textContent=window.CONVERSA_USER.name;$("myCode").textContent=window.CONVERSA_USER.code;$("sideCode").textContent=window.CONVERSA_USER.code;window.renderFriends?.()}catch(e){localStorage.removeItem("conversaLiveToken");localStorage.removeItem("conversaLiveUser")}
 async function api(path,opts={}){const r=await fetch(serverUrl()+path,{...opts,headers:{"Content-Type":"application/json",Authorization:"Bearer "+(window.CONVERSA_TOKEN||localStorage.getItem("conversaLiveToken")),...(opts.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"Erro.");return d} 
 let unreadCounts={};
 async function refreshUnreadCounts(){try{const d=await api("/api/messages/unread");unreadCounts=d.unread||{};window.renderFriends?.()}catch(e){}}
 window.friendDirectory={friends:[],requests:[]};
window.friendSearchTerm="";
function filterFriends(v){window.friendSearchTerm=String(v||"");renderFriends()}

window.renderFriends=async()=>{
 let d;try{d=await api("/api/friends")}catch(e){d=window.friendDirectory||{friends:[],requests:[]}};window.friendDirectory=d;
 [$("friendsList"),$("friendsAppList")].filter(Boolean).forEach(list=>{
  list.innerHTML="";const term=String(window.friendSearchTerm||"").trim().toLowerCase(),requests=d.requests||[],friends=(d.friends||[]).filter(u=>!term||String(u.name||"").toLowerCase().includes(term)||String(u.code||"").toLowerCase().includes(term));
  if(list.id==="friendsList"&&requests.length){const t=document.createElement("div");t.className="friends-section-title";t.innerHTML="<span>Solicitações</span><small>"+requests.length+"</small>";list.appendChild(t);
   requests.forEach(u=>{const x=document.createElement("div");x.className="friend-item friend-request";x.innerHTML='<div class="friend-avatar"></div><div class="friend-info"><b></b><small></small></div><button class="accept-friend-btn">Aceitar</button><button class="reject-friend-btn">×</button>';x.querySelector(".friend-avatar").textContent=(u.name||"?").trim().charAt(0).toUpperCase();x.querySelector("b").textContent=u.name||"Usuário";x.querySelector("small").textContent=u.code+" • enviou um convite";x.querySelector(".accept-friend-btn").onclick=async()=>{try{await api("/api/friends/accept",{method:"POST",body:JSON.stringify({code:u.code})});appToast("Convite aceito!","success");renderFriends()}catch(e){appToast(e.message,"error")}};x.querySelector(".reject-friend-btn").onclick=async()=>{try{await api("/api/friends/reject",{method:"POST",body:JSON.stringify({code:u.code})})}catch(e){}renderFriends()};list.appendChild(x)})}
  if(friends.length){const t=document.createElement("div");t.className="friends-section-title";t.innerHTML="<span>Amigos</span><small>"+friends.length+"</small>";list.appendChild(t)}
  friends.forEach(u=>{const online=[...people.values()].some(p=>p.code===u.code),unread=Number(unreadCounts[u.code]||0),x=document.createElement("div");x.className="friend-item";x.innerHTML='<div class="friend-avatar"></div><span class="friend-dot"></span><div class="friend-info"><b></b><small></small></div><span class="friend-unread" hidden></span><button class="message-friend-btn" title="Mensagem">💬</button><button class="friend-call-btn" title="Call">📞</button><button class="remove-friend-btn" title="Remover">×</button>';x.querySelector(".friend-avatar").textContent=(u.name||"?").trim().charAt(0).toUpperCase();x.querySelector(".friend-dot").classList.toggle("online",online);x.querySelector("b").textContent=u.name||"Usuário";x.querySelector("small").textContent=online?"● Online":"○ Offline";const b=x.querySelector(".friend-unread");if(unread){b.textContent=unread>99?"99+":String(unread);b.hidden=false}x.querySelector(".message-friend-btn").onclick=()=>openMessages(u);x.querySelector(".friend-call-btn").onclick=()=>{const room=makeCallCode();openApp(room,true)};x.querySelector(".remove-friend-btn").onclick=async()=>{if(!confirm("Remover "+(u.name||"este amigo")+" da sua lista?"))return;try{await api("/api/friends/remove",{method:"POST",body:JSON.stringify({code:u.code})});delete unreadCounts[u.code];appToast("Amigo removido");renderFriends()}catch(e){appToast(e.message,"error")}};list.appendChild(x)});
  if(!friends.length&&!(list.id==="friendsList"&&requests.length)){const q=document.createElement("div");q.className="friends-empty";q.innerHTML='<div class="friends-empty-icon">👥</div><b>'+(term?"Nenhum resultado":"Sua lista está vazia")+'</b><small>'+(term?"Tente outro nome ou código.":"Adicione amigos pelo código.")+'</small>';list.appendChild(q)}
 });
};async function addFriend(input,status){const code=input.value.trim().toUpperCase();if(!/^CL-[A-Z0-9]{6}$/.test(code)){status.textContent="Código inválido. Use CL-XXXXXX.";return}try{const d=await api("/api/friends/request",{method:"POST",body:JSON.stringify({code})});status.textContent=d.message||"Convite enviado!";input.value="";renderFriends()}catch(e){status.textContent=e.message}}
 $("addFriendBtn").onclick=()=>addFriend($("friendCodeInput"),$("friendStatus"));$("addFriendApp").onclick=()=>addFriend($("friendCodeApp"),$("friendAppStatus"));$("refreshFriends").onclick=window.renderFriends;$("friendsBtn").onclick=()=>{$("friendsPanel").classList.remove("hidden");renderFriends()};$("friendsClose").onclick=()=>$('friendsPanel').classList.add("hidden");$("copyUserCode").onclick=()=>navigator.clipboard?.writeText($("myCode").textContent);refreshUnreadCounts();
 $("logoutBtn").onclick=()=>{clearInterval(friendPollTimer);localStorage.removeItem("conversaLiveToken");localStorage.removeItem("conversaLiveUser");location.href=location.pathname}; 
 function makeCallCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let c="";for(let i=0;i<6;i++)c+=chars[Math.floor(Math.random()*chars.length)];return c;}
 function openApp(targetRoom,autoCall=true){
   const c=String(targetRoom||"").trim().toUpperCase().replace(/[^A-Z0-9_-]/g,"").slice(0,32);if(!c)return;
   const n=window.CONVERSA_USER?.name||localStorage.getItem("conversaLiveName")||"Visitante";
   window.CONVERSA_AUTO_CALL=!!autoCall;$("callMenu").classList.add("hidden");$("joinBox")?.classList.add("hidden");
   try{history.replaceState(null,"","?room="+encodeURIComponent(c))}catch(e){}
   joinRoom(c,n);
 }
 $("createCallBtn").onclick=()=>{const c=makeCallCode();$("roomCodeInput").value=c;openApp(c,true)};
 $("joinCallBtn").onclick=()=>{$("joinBox").classList.toggle("hidden");if(!$("joinBox").classList.contains("hidden"))$("roomCodeInput").focus()};
 $("confirmJoinBtn").onclick=()=>{const c=$("roomCodeInput").value.trim().toUpperCase();if(c)openApp(c,true)};
 $("roomCodeInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("confirmJoinBtn").click()});
})();
const $=id=>document.getElementById(id);
const ICE={
  iceServers:[
    {urls:"stun:stun.l.google.com:19302"},
    {urls:"stun:stun1.l.google.com:19302"},
    {urls:"stun:stun.cloudflare.com:3478"},
    {urls:"stun:stun.nextcloud.com:443"},
    ...(Array.isArray(window.TURN_SERVERS)?window.TURN_SERVERS:[])
  ],
  iceCandidatePoolSize:10
};

let socket=null,name="",room="",localStream=null,screenTrack=null;
let peers=new Map(),people=new Map(),inCall=false;
let micOn=true,camOn=true,callHostId=null,remoteMuted=new Set(),kicked=false,forcedMuted=false;
let callReady=false;
let joiningCall=false,pingTimer=null,pingStarted=0,lastRtt=null;
let audioContext=null, micAnalyser=null, micSource=null, micMeterTimer=null;

function joinRoom(roomValue,nameValue){
  name=(nameValue||window.CONVERSA_USER_NAME||"Visitante").trim().slice(0,24)||"Visitante";
  room=(roomValue||window.CONVERSA_ROOM||"geral").trim().toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,32)||"geral";
  $("app").classList.remove("hidden");
  $("me").textContent=name;
  $("avatar").textContent=name[0].toUpperCase();
  $("roomName").textContent="# "+room;
  $("headRoom").textContent=room;
  connect();
}
window.addEventListener("conversa:open-room",e=>{
  const d=e.detail||{};
  joinRoom(d.room,d.name);
});
const urlRoom=new URLSearchParams(location.search).get("room");
if(urlRoom){
  const saved=localStorage.getItem("conversaLiveName")||"Visitante";
  joinRoom(urlRoom,saved);
}
function serverUrl(){
  if(window.SIGNALING_URL)return window.SIGNALING_URL.replace(/\/$/,"");
  return location.protocol==="https:" ? "https://"+location.host : "http://"+location.host;
}
function setConnectionLevel(level,text){const m=$("connectionMeter"),s=$("sideConnection"),c=["off","bad","medium","ok","good"][Math.max(0,Math.min(4,level))];if(m){m.className="connection-meter "+c;$("connectionText").textContent=text||["Offline","Fraca","Média","Boa","Excelente"][level]}if(s)s.className="connection-mini "+c}
function startConnectionMonitor(){clearInterval(pingTimer);const p=()=>{if(!socket?.connected){setConnectionLevel(0,"Offline");return}pingStarted=performance.now();socket.emit("client-ping",pingStarted)};p();pingTimer=setInterval(p,4000)}
let socketScriptLoading=false;
function connect(){
  if(socket?.connected)return;
  if(window.io){startSocket();return;}
  loadSocketIO();
}
function loadSocketIO(){
  if(window.io){startSocket();return;}
  if(socketScriptLoading)return;
  socketScriptLoading=true;
  const s=document.createElement("script");
  // Load the Socket.IO client from the CDN instead of depending on the sleeping
  // Render service to serve the client script. The actual socket still connects
  // to SIGNALING_URL below. A fallback to Render keeps self-hosted deployments working.
  s.src="https://cdn.socket.io/4.8.1/socket.io.min.js";
  s.onload=()=>{socketScriptLoading=false;startSocket()};
  s.onerror=()=>{
    socketScriptLoading=false;
    const fallback=document.createElement("script");
    fallback.src=serverUrl()+"/socket.io/socket.io.js";
    fallback.onload=startSocket;
    fallback.onerror=()=>{$("status").textContent="Servidor offline — tentando reconectar...";setConnectionLevel(0,"Offline")};
    document.head.appendChild(fallback);
  };
  document.head.appendChild(s);
}
function startSocket(){
  if(!window.io||socket?.connected)return;
  socket=io(serverUrl(),{
    auth:{token:window.CONVERSA_TOKEN||localStorage.getItem("conversaLiveToken")},
    transports:["polling","websocket"],
    upgrade:true,
    timeout:20000,
    reconnection:true,
    reconnectionAttempts:Infinity,
    reconnectionDelay:1000,
    reconnectionDelayMax:5000,
    randomizationFactor:0.2
  });

  socket.on("connect",()=>{
    $("status").textContent="Conectado";setConnectionLevel(4,"Conectado");startConnectionMonitor();
    socket.emit("join",{room});
    if(window.CONVERSA_AUTO_CALL&&!inCall){
      setTimeout(()=>{if(!inCall&&socket?.connected)openCall()},450);
      window.CONVERSA_AUTO_CALL=false;
    }
    if(inCall)setTimeout(()=>socket.emit("call-ready",{room}),250);
  });
  socket.on("connect_error",err=>{
    const msg=String(err?.message||"");
    if(/sessão|sessao|expirada|inválida|invalida/i.test(msg)){
      localStorage.removeItem("conversaLiveToken");
      window.CONVERSA_TOKEN="";
      $("status").textContent="Sessão expirada — entre novamente.";
      setConnectionLevel(0,"Sessão expirada");
      login?.classList.remove("hidden");
      menu?.classList.add("hidden");
      appToast?.("Sua sessão expirou. Entre novamente para reconectar.","error");
      return;
    }
    $("status").textContent="Servidor offline — tentando reconectar...";
    setConnectionLevel(0,msg?"Offline • "+msg:"Offline");
  });
  socket.on("disconnect",()=>{setConnectionLevel(0,"Offline");$("status").textContent="Reconectando...";});
  socket.on("client-pong",sent=>{const r=performance.now()-Number(sent);lastRtt=r;let l=r<90?4:r<160?3:r<250?2:r<500?1:0;setConnectionLevel(l,(l===4?"Excelente":l===3?"Boa":l===2?"Média":l===1?"Fraca":"Muito fraca")+" • "+Math.round(r)+" ms")});
  socket.on("room-users",list=>{
    people.clear();
    list.forEach(u=>people.set(u.id,u));
    renderPeople();window.renderFriends?.();
    // A lista de usuários não é uma fonte confiável para eleger o criador localmente.
    // O servidor envia o host de forma autoritativa via call-host/call-state.
    if(callHostId===null){
      const serverHost=list.find(u=>u.host)?.id||null;
      if(serverHost) callHostId=serverHost;
    }
  });
  socket.on("user-joined",u=>{
    people.set(u.id,u);renderPeople();
    addSystem(u.name+" entrou na sala.");
  });
  socket.on("user-left",u=>{
    people.delete(u.id);renderPeople();closePeer(u.id);
    if(u.id===callHostId)callHostId=null;
    addSystem(u.name+" saiu da sala.");
  });
  socket.on("chat",m=>addMessage(m.name,m.text,m.time));
  socket.on("signal",handleSignal);
  socket.on("system",addSystem);

  socket.on("call-host",id=>{
    callHostId=id||null;
    renderPeople();
    if(inCall){
      if(isHost()){
        setCallStatus("Você é o criador da call. 🎙️📷","ok");
        requestReadyPeers();
      }else{
        setCallStatus("Conectado à call. Aguardando os outros participantes...");
      }
      if(callReady) socket.emit("call-ready",{room});
    }
  });

  socket.on("call-state",state=>{
    if(!state)return;
    callHostId=state.active ? (state.host||null) : null;
    renderPeople();
    if(inCall && callReady && state.active){
      socket.emit("call-ready",{room});
      if(isHost()) requestReadyPeers();
    }
  });

  socket.on("music-state",async state=>{
    musicState=state||null; updateMusicUI(state);
    if(state?.hostId===socket?.id&&state.track){
      musicHost=true;
      try{if(musicTrack?.id!==state.track.id)await applyMusicTrackToPeers(state.track,state);else syncMusicPlayback(state);}
      catch(e){setCallStatus(e.message||"Erro no bot de música.","error")}
    }else if(state?.hostId!==socket?.id)stopMusicLocal(false);
  });
  socket.on("music-stop",()=>{musicState=null;stopMusicLocal(false);setCallStatus("Música parada.")});
  socket.on("music-command-error",m=>appToast(m||"Comando recusado.","error"));
  socket.on("call-ended",()=>{
    callHostId=null;
    if(inCall)leaveCall(false);
    addSystem("A chamada foi encerrada pelo criador.");
  });

  socket.on("call-removed",()=>{
    kicked=true;leaveCall(false);
    addSystem("Você foi removido da chamada pelo criador.");
  });
  socket.on("call-participant-left",({id})=>{
    if(id)closePeer(id);
  });

  socket.on("call-ready-users",ids=>{
    if(!inCall)return;
    ids.forEach(id=>{
      if(id!==socket.id && !peers.has(id) && isHost()){
        createPeer(id,true).catch(console.error);
      }
    });
  });

  socket.on("call-participant-ready",({id})=>{
    if(inCall && isHost() && id!==socket.id && !peers.has(id)){
      createPeer(id,true).catch(console.error);
    }
  });

  socket.on("participant-muted",({id,name:mutedName,muted})=>{
    if(id===socket.id){
      forcedMuted=!!muted;
      if(localStream)localStream.getAudioTracks().forEach(t=>t.enabled=!forcedMuted&&micOn);
      updateMicButton();
      $("callStatus").textContent=forcedMuted?"Você foi silenciado pelo criador.":"Seu microfone foi liberado.";
    }
    addSystem((mutedName||"Participante")+(muted?" foi silenciado pelo criador da call.":" foi liberado pelo criador da call."));
    renderPeople();
  });
}
function isHost(){return !!socket&&callHostId===socket.id;}

function renderPeople(){
  $("people").innerHTML="";
  people.forEach(u=>{
    const d=document.createElement("div");d.className="person";
    const dot=document.createElement("i");
    const span=document.createElement("span");span.className="person-name";
    span.textContent=u.name+(u.id===socket?.id?" (você)":"");
    if(u.id===callHostId){
      const b=document.createElement("small");b.className="host-badge";b.textContent="CRIADOR";span.appendChild(b);
    }
    d.append(dot,span);
    if(isHost()&&u.id!==socket.id&&inCall){
      const actions=document.createElement("div");actions.className="person-actions";
      const mute=document.createElement("button");mute.title="Silenciar";mute.textContent=remoteMuted.has(u.id)?"🔊":"🔇";
      mute.onclick=()=>hostMute(u.id,u.name);
      const kick=document.createElement("button");kick.className="kick";kick.title="Expulsar da call";kick.textContent="✕";
      kick.onclick=()=>hostKick(u.id,u.name);
      actions.append(mute,kick);d.appendChild(actions);
    }
    $("people").appendChild(d);
  });
}
function hostMute(id,n){
  if(!isHost())return;
  const muted=!remoteMuted.has(id);
  if(muted)remoteMuted.add(id);else remoteMuted.delete(id);
  socket.emit("host-mute",{to:id,name:n,room,muted});
  renderPeople();
}
function hostKick(id,n){
  if(!isHost()||!confirm("Expulsar "+n+" da chamada?"))return;
  socket.emit("host-kick",{to:id,name:n,room});
  closePeer(id);renderPeople();
}
function addSystem(t){$("emptyChat")?.remove();const d=document.createElement("div");d.className="system";d.textContent=t;$("messages").appendChild(d);scroll();}
function addMessage(n,t,time){
  const d=document.createElement("div");d.className="msg";
  const b=document.createElement("b");b.textContent=n;
  const tm=document.createElement("time");tm.textContent=time||"";
  const p=document.createElement("p");p.textContent=t;d.append(b,tm,p);$("messages").appendChild(d);scroll();
}
function scroll(){$("messages").scrollTop=$("messages").scrollHeight;}
$("msg")?.addEventListener("input",()=>{const el=$("msg"),c=$("msgCount");if(c)c.textContent=el.value.length+"/1000";});
$("form").onsubmit=e=>{
  e.preventDefault();const t=$("msg").value.trim();
  if(!t||!socket?.connected)return;
  if(handleMusicCommand(t)){ $("msg").value=""; return; }
  socket.emit("chat",{room,text:t});$("msg").value="";
};

// ---------------- Emoji picker ----------------
const EMOJI_CATEGORIES = {
  "😀": ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥳","🤩","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🫡","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑"],
  "❤️": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","❤️‍🔥","❤️‍🩹","💋","💯","💢","💥","💫","💦","💨"],
  "👍": ["👍","👎","👌","✌️","🤞","🤟","🤘","🤙","👏","🙌","👐","🤝","🙏","💪","👊","✊","🤲","🫶","☝️","👇","👆","👉","👈","✋","🤚","🖐️","🖖","👋","🤏","✍️","💅","🫵"],
  "🎮": ["🎮","🕹️","🎲","🎯","🏆","🥇","🥈","🥉","⚽","🏀","🏈","⚾","🎾","🏐","🎱","🎳","🏓","🎸","🎹","🥁","🎤","🎧","🎬","🎨","🧩","🚀","🔥","⭐","✨","💎","⚡","💡","🔔","🎉","🎊","🎁"],
  "🍔": ["🍔","🍕","🍟","🌭","🌮","🌯","🍿","🍩","🍪","🍰","🧁","🍫","🍎","🍌","🍓","🍉","🍇","🍒","🥭","🍍","🥝","🍋","🥑","🍗","🍖","🍜","🍣","🍱","🍚","🍦","🍭","☕","🧃","🥤"],
  "🐶": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🦄","🐝","🦋","🐢","🐍","🦖","🐙","🦑","🦀","🐠","🐟","🐬","🦈"],
  "🔧": ["🔧","🔨","⚙️","🛠️","🔒","🔓","🔑","💻","🖥️","📱","⌨️","🖱️","💾","📷","🎥","🎙️","📡","🔋","💡","📌","📎","✏️","📝","📚","🗑️","🧹","🚪","🏠","🌎","☀️","🌙","☁️","🌧️","❄️","🌈"]
};
let emojiCategory = Object.keys(EMOJI_CATEGORIES)[0];

function insertAtCursor(text){
  const input=$("msg");
  const start=input.selectionStart ?? input.value.length;
  const end=input.selectionEnd ?? input.value.length;
  input.value=input.value.slice(0,start)+text+input.value.slice(end);
  input.focus();
  const pos=start+text.length;
  input.setSelectionRange(pos,pos);
}
function renderEmojiPicker(){
  const tabs=$("emojiTabs"), grid=$("emojiGrid"), search=($("emojiSearch").value||"").trim().toLowerCase();
  tabs.innerHTML="";
  Object.keys(EMOJI_CATEGORIES).forEach(cat=>{
    const b=document.createElement("button"); b.type="button"; b.className="emoji-tab"+(cat===emojiCategory?" active":"");
    b.textContent=cat; b.title="Categoria"; b.onclick=()=>{emojiCategory=cat;renderEmojiPicker();};
    tabs.appendChild(b);
  });
  const base=EMOJI_CATEGORIES[emojiCategory]||[];
  const list=search ? Object.values(EMOJI_CATEGORIES).flat() : base;
  grid.innerHTML="";
  [...new Set(list)].forEach(e=>{
    const b=document.createElement("button"); b.type="button"; b.className="emoji-item"; b.textContent=e; b.title=e;
    b.onclick=()=>insertAtCursor(e);
    grid.appendChild(b);
  });
}
$("emoji").onclick=()=>{
  const p=$("emojiPicker"); p.classList.toggle("hidden");
  if(!p.classList.contains("hidden")){renderEmojiPicker();$("emojiSearch").focus();}
};
$("emojiClose").onclick=()=>$("emojiPicker").classList.add("hidden");
$("emojiSearch").addEventListener("input",renderEmojiPicker);
document.addEventListener("click",e=>{
  const p=$("emojiPicker"), btn=$("emoji");
  if(!p.classList.contains("hidden")&&!p.contains(e.target)&&e.target!==btn)p.classList.add("hidden");
});

$("invite").onclick=async()=>{
  const u=location.href.split("?")[0]+"?room="+encodeURIComponent(room);
  try{await navigator.clipboard.writeText(u);$("invite").textContent="✓ Convite copiado";}
  catch(e){prompt("Copie o convite:",u);}
  setTimeout(()=>{$("invite").textContent="🔗 Copiar convite";},1600);
};

$("audioUnlock").onclick=unlockAllAudio;$("musicStop")?.addEventListener("click",()=>musicControl("music-stop"));$("musicSkip")?.addEventListener("click",()=>musicControl("music-next"));
$("callOpen").onclick=openCall;
$("callClose").onclick=()=>leaveCall(true);
$("hang").onclick=()=>leaveCall(true);


function setCallStatus(text,kind=""){
  const el=$("callStatus"); if(!el)return;
  el.textContent=text; el.className="callStatus"+(kind?" "+kind:"");
}
function stopMicMeter(){
  if(micMeterTimer)cancelAnimationFrame(micMeterTimer);
  micMeterTimer=null;
  try{micSource?.disconnect();}catch(e){}
  try{micAnalyser?.disconnect();}catch(e){}
  micSource=null; micAnalyser=null;
  const btn=$("mic"); if(btn)btn.classList.remove("speaking");
  if(audioContext){audioContext.close().catch(()=>{});audioContext=null;}
}
async function startMicMeter(){
  stopMicMeter();
  const track=localStream?.getAudioTracks?.()[0];
  if(!track)return;
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;
    audioContext=new Ctx();
    if(audioContext.state==="suspended")await audioContext.resume().catch(()=>{});
    micSource=audioContext.createMediaStreamSource(new MediaStream([track]));
    micAnalyser=audioContext.createAnalyser();
    micAnalyser.fftSize=512;
    micAnalyser.smoothingTimeConstant=.75;
    micSource.connect(micAnalyser);
    const data=new Uint8Array(micAnalyser.fftSize);
    const loop=()=>{
      if(!micAnalyser||!localStream){return;}
      micAnalyser.getByteTimeDomainData(data);
      let sum=0;
      for(let i=0;i<data.length;i++){const x=(data[i]-128)/128;sum+=x*x;}
      const rms=Math.sqrt(sum/data.length);
      const speaking=rms>.035 && micOn && !forcedMuted;
      $("mic")?.classList.toggle("speaking",speaking);
      micMeterTimer=requestAnimationFrame(loop);
    };
    loop();
  }catch(e){
    // O indicador é opcional; a chamada continua funcionando mesmo se Web Audio falhar.
  }
}
function updateMicButton(){
  const b=$("mic"); if(!b)return;
  b.textContent="";
  const icon=document.createElement("span");
  icon.textContent=micOn&&!forcedMuted?"🎙️":"🔇";
  b.appendChild(icon);
  const label=document.createElement("span"); label.textContent="Microfone"; b.appendChild(label);
  b.classList.toggle("muted",!micOn||forcedMuted);
}
function enableRemoteAudio(v){
  if(!v)return;
  v.autoplay=true;
  v.playsInline=true;
  v.muted=false;
  v.volume=1;
  const p=v.play();
  if(p?.catch)p.catch(()=>{});
}
function unlockAllAudio(){
  document.querySelectorAll("#videos video").forEach(v=>enableRemoteAudio(v));
  $("audioUnlock")?.classList.add("hidden");
  setCallStatus("Áudio ativado. 🎧","ok");
}

function refreshAudioStatus(){
  if(!inCall)return;
  const active=[...document.querySelectorAll("#videos video")].filter(v=>v.dataset?.id!=="local");
  const hasRemoteAudio=active.some(v=>v.srcObject?.getAudioTracks?.().some(t=>t.readyState==="live"));
  if(hasRemoteAudio && !active.some(v=>v.paused && !v.muted)){
    // Do not overwrite a more useful status while connected.
  }
}


function formatMusicTime(sec){sec=Math.max(0,Math.floor(Number(sec)||0));return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");}
function updateMusicUI(state){
 const b=$("musicBot");if(!b)return;const t=b.querySelector(".music-title"),m=b.querySelector(".music-meta"),q=b.querySelector(".music-queue-count"),x=b.querySelector(".music-stop"),sk=b.querySelector(".music-skip");
 if(state?.track){b.classList.remove("idle");if(t)t.textContent="🎵 "+state.track.title;if(m)m.textContent=(state.paused?"⏸ pausada":"▶ tocando")+" • "+(state.track.artist||"Artista")+" • "+formatMusicTime(state.position||0);if(q)q.textContent=(state.queue?.length||0)+" na fila";if(x)x.disabled=false;if(sk)sk.disabled=false;}
 else{b.classList.add("idle");if(t)t.textContent="Nenhuma música tocando";if(m)m.textContent="Use /m nome da música no chat";if(q)q.textContent="";if(x)x.disabled=true;if(sk)sk.disabled=true;}
}
function ensureMusicAudio(){if(musicAudioContext)return musicAudioContext;const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)throw Error("Seu navegador não suporta áudio.");musicAudioContext=new Ctx();musicDestination=musicAudioContext.createMediaStreamDestination();return musicAudioContext;}
async function applyMusicTrackToPeers(track,state){
 const ctx=ensureMusicAudio();if(ctx.state==="suspended")await ctx.resume().catch(()=>{});
 if(musicElement)try{musicElement.pause()}catch(e){} if(musicSource)try{musicSource.disconnect()}catch(e){}
 musicElement=new Audio();musicElement.crossOrigin="anonymous";musicElement.preload="auto";musicElement.src=serverUrl()+"/api/music/stream/"+encodeURIComponent(track.id);
 musicSource=ctx.createMediaElementSource(musicElement);musicGainNode=ctx.createGain();musicGainNode.gain.value=musicVolume;
 musicSource.connect(musicGainNode);musicGainNode.connect(musicDestination);musicSource.connect(ctx.destination);
 if(localStream?.getAudioTracks?.().length){musicMicSource=ctx.createMediaStreamSource(new MediaStream([localStream.getAudioTracks()[0]]));const g=ctx.createGain();g.gain.value=1;musicMicSource.connect(g);g.connect(musicDestination);}
 const mixed=musicDestination.stream.getAudioTracks()[0];peers.forEach(pc=>{const snd=pc.getSenders().find(x=>x.track?.kind==="audio");if(snd&&mixed)snd.replaceTrack(mixed).catch(()=>{})});
 musicTrack=track;musicElement.onended=()=>{if(musicHost&&socket?.connected)socket.emit("music-next",{room})};
 try{if(Number(state?.position)>0)musicElement.currentTime=Number(state.position)}catch(e){}
 try{await musicElement.play()}catch(e){setCallStatus("Clique na tela e tente a música novamente.","warn")}syncMusicPlayback(state);
}
function syncMusicPlayback(state){if(!musicElement||!state?.track)return;musicVolume=Math.max(0,Math.min(1,Number(state.volume??musicVolume)));if(musicGainNode)musicGainNode.gain.value=musicVolume;if(state.paused)musicElement.pause();else if(musicElement.paused)musicElement.play().catch(()=>{});}
function restoreMicTrack(){const mic=localStream?.getAudioTracks?.()[0];peers.forEach(pc=>{const snd=pc.getSenders().find(x=>x.track?.kind==="audio");if(snd)snd.replaceTrack(mic||null).catch(()=>{})});}
function stopMusicLocal(clear=true){musicHost=false;musicTrack=null;if(clear)musicState=null;if(musicElement){try{musicElement.pause()}catch(e){}musicElement.removeAttribute("src");musicElement.load();musicElement=null;}if(musicSource)try{musicSource.disconnect()}catch(e){}musicSource=null;if(musicGainNode)try{musicGainNode.disconnect()}catch(e){}musicGainNode=null;restoreMicTrack();updateMusicUI(null);}
async function searchAndPlayMusic(term){if(!inCall||!socket?.connected){appToast("Entre em uma call para usar o bot de música.","error");return false;}const q=String(term||"").trim();if(q.length<2){appToast("Use /m nome da música","error");return false;}try{const d=await api("/api/music/search?q="+encodeURIComponent(q));const track=d.tracks?.[0];if(!track)throw Error("Não encontrei essa música.");socket.emit("music-play",{room,track});return true}catch(e){setCallStatus(e.message||"Não foi possível tocar a música.","error");return false;}}
function musicControl(ev,p={}){if(!inCall||!socket?.connected){appToast("Entre em uma call para usar o bot de música.","error");return;}socket.emit(ev,{room,...p});}
function handleMusicCommand(t){t=String(t||"").trim();if(!/^\/(m|skip|pause|resume|volume|queue|stop|music)\b/i.test(t))return false;let m=t.match(/^\/m\s+(.+)$/i);if(m){searchAndPlayMusic(m[1]);return true;}if(/^\/skip$/i.test(t)){musicControl("music-next");return true;}if(/^\/pause$/i.test(t)){musicControl("music-pause");return true;}if(/^\/resume$/i.test(t)){musicControl("music-resume");return true;}if(/^\/queue$/i.test(t)){musicControl("music-queue");return true;}if(/^\/stop$/i.test(t)){musicControl("music-stop");return true;}m=t.match(/^\/volume\s+(\d{1,3})$/i);if(m){const n=Number(m[1]);if(n>100){appToast("Volume entre 0 e 100.","error");return true;}musicControl("music-volume",{volume:n/100});return true;}if(/^\/music$/i.test(t)){appToast("/m música • /queue • /skip • /pause • /resume • /volume 0-100 • /stop","info");return true;}return true;}
function stopMusic(){if(socket?.connected&&musicHost)socket.emit("music-stop",{room});stopMusicLocal();}
async function openCall(){
  if(inCall)return;
  if(!socket?.connected){
    $("callStatus").textContent="Conectando ao servidor...";
    addSystem("Aguarde a conexão com o servidor.");
    return;
  }

  joiningCall=true;
  $("call").classList.remove("hidden");
  $("app").classList.add("call-open");
  setCallStatus("Entrando na call... 🎧");

  if(!navigator.mediaDevices?.getUserMedia){
    joiningCall=false;
    $("callStatus").textContent="Câmera/microfone indisponíveis. Use o site em HTTPS.";
    $("call").classList.add("hidden");
    $("app").classList.remove("call-open");
    return;
  }

  let stream=null;
  try{
    try{
      stream=await navigator.mediaDevices.getUserMedia({
      audio:{
        echoCancellation:true,
        noiseSuppression:true,
        autoGainControl:true,
        channelCount:1,
        sampleRate:48000
      },
      video:{
        width:{ideal:640,max:1280},
        height:{ideal:360,max:720},
        frameRate:{ideal:24,max:30}
      }
    });
    }catch(e){
      // Se a câmera estiver indisponível/bloqueada, ainda tentamos entrar só com áudio.
      try{
        stream=await navigator.mediaDevices.getUserMedia({audio:true});
      }catch(e2){
        throw e2;
      }
      try{
        const v=await navigator.mediaDevices.getUserMedia({video:true});
        v.getVideoTracks().forEach(t=>stream.addTrack(t));
      }catch(e3){}
    }
  }catch(e){
    joiningCall=false;
    inCall=false;
    $("videos").innerHTML="";
    $("call").classList.add("hidden");
    $("app").classList.remove("call-open");
    const msg=e?.name==="NotAllowedError"
      ?"Permissão negada. Libere o microfone/câmera no cadeado 🔒 do navegador e tente novamente."
      :e?.name==="NotFoundError"
        ?"Nenhum microfone/câmera foi encontrado. Conecte um dispositivo e tente novamente."
        :"Não foi possível acessar seu microfone. Verifique as permissões do navegador.";
    $("callStatus").textContent=msg;
    addSystem(msg);
    return;
  }

  localStream=stream;
  stopMusicLocal();
  const localAudio=localStream.getAudioTracks()[0];
  if(localAudio){
    try{await localAudio.applyConstraints({
      echoCancellation:true,noiseSuppression:true,autoGainControl:true,
      channelCount:1,sampleRate:48000
    });}catch(e){}
  }
  micOn=localStream.getAudioTracks().length>0;
  camOn=localStream.getVideoTracks().length>0;
  forcedMuted=false;
  updateMicButton();
  $("cam").textContent=camOn?"📷":"🚫";
  addVideo("Você",localStream,"local");
  startMicMeter();

  // Só agora consideramos que a pessoa realmente entrou na call.
  inCall=true;
  joiningCall=false;
  setCallStatus("Conectando à chamada...");

  // O servidor decide quem é o criador. Mesmo que o cliente ainda não saiba
  // o host, call-start retorna o host atual. Isso evita eleger a própria pessoa
  // por engano quando ela entra em uma call existente.
  socket.emit("call-start",{room});
  callReady=true;
  socket.emit("call-ready",{room});

  setTimeout(()=>{
    if(!inCall)return;
    if(isHost()){
      setCallStatus("Você é o criador da call. 🎙️📷","ok");
      requestReadyPeers();
    }else if(callHostId){
      setCallStatus("Conectado à call. Aguardando os outros participantes...");
    }else{
      $("callStatus").textContent="Entrando na call...";
    }
  },300);
}
function requestReadyPeers(){
  if(socket?.connected)socket.emit("call-ready-request",{room});
}

async function createPeer(id,initiator){
  if(peers.has(id)||!localStream||!socket?.connected)return peers.get(id);

  const pc=new RTCPeerConnection(ICE);
  pc.pendingIce=[];
  peers.set(id,pc);

  // Prefer Opus for voice and enable packet-loss resilience when supported.
  try{
    const caps=RTCRtpSender.getCapabilities?.("audio");
    if(caps?.codecs){
      const opus=caps.codecs.filter(c=>
        /opus/i.test(c.mimeType) &&
        (!c.channels || c.channels===2)
      );
      const rest=caps.codecs.filter(c=>!opus.includes(c));
      if(opus.length)pc.getTransceivers()
        .filter(t=>t.receiver?.track?.kind==="audio" || t.sender?.track?.kind==="audio")
        .forEach(t=>{ try{t.setCodecPreferences([...opus,...rest]);}catch(e){} });
    }
  }catch(e){}

  localStream.getTracks().forEach(t=>pc.addTrack(t,localStream));
  if(musicHost&&musicDestination){const mixed=musicDestination.stream.getAudioTracks()[0];const snd=pc.getSenders().find(x=>x.track?.kind==="audio");if(snd&&mixed)snd.replaceTrack(mixed).catch(()=>{});}

  // Tune the audio sender for stable conversational voice.
  try{
    const sender=pc.getSenders().find(s=>s.track?.kind==="audio");
    if(sender){
      const p=sender.getParameters();
      p.encodings=p.encodings?.length?p.encodings:[{}];
      p.encodings[0].maxBitrate=64000;
      p.encodings[0].networkPriority="high";
      await sender.setParameters(p);
    }
  }catch(e){}

  pc.onicecandidate=e=>{
    if(e.candidate)socket.emit("signal",{to:id,data:{type:"ice",candidate:e.candidate}});
  };

  pc.ontrack=e=>{
    let stream=e.streams?.[0];
    if(!stream){
      stream=new MediaStream();
      stream.addTrack(e.track);
    }
    e.track.enabled=true;
    const u=people.get(id);
    addVideo(u?.name||"Participante",stream,id);

    if(e.track.kind==="audio"){
      const tile=document.querySelector(`[data-id="${CSS.escape(id)}"]`);
      const v=tile?.querySelector("video");
      if(v){
        v.muted=false;
        v.volume=1;
        const p=v.play();
        if(p?.catch)p.catch(()=>{
          showAudioButton(tile,v);
          $("audioUnlock")?.classList.remove("hidden");
        });
      }
    }
  };

  pc.onconnectionstatechange=()=>{
    if(pc.connectionState==="connected"){
      setCallStatus("Call conectada. 🎉 Áudio e vídeo conectados.","ok");
    }
    if(["failed","closed"].includes(pc.connectionState))closePeer(id);
  };

  pc.oniceconnectionstatechange=()=>{
    if(pc.iceConnectionState==="failed"){
      // One ICE restart gives the connection a chance to recover from a
      // temporary network/NAT change without creating another peer.
      if(initiator && pc.restartIce) {
        try{
          pc.restartIce();
          setTimeout(async()=>{
            if(pc.connectionState==="failed" && pc.signalingState!=="closed"){
              try{
                const offer=await pc.createOffer({iceRestart:true});
                await pc.setLocalDescription(offer);
                socket.emit("signal",{to:id,data:{type:"offer",sdp:pc.localDescription}});
              }catch(e){}
            }
          },350);
        }catch(e){}
      }
    }
  };

  if(initiator){
    const offer=await pc.createOffer({
      offerToReceiveAudio:true,
      offerToReceiveVideo:true
    });
    await pc.setLocalDescription(offer);
    socket.emit("signal",{to:id,data:{type:"offer",sdp:pc.localDescription}});
  }
  return pc;
}
async function handleSignal(m){
  if(!inCall)return;
  const id=m.from,d=m.data;
  if(!id||!d)return;

  if(d.type==="offer"){
    const pc=await createPeer(id,false);
    if(!pc)return;
    await pc.setRemoteDescription(new RTCSessionDescription(d.sdp));
    for(const c of pc.pendingIce.splice(0))await pc.addIceCandidate(c).catch(()=>{});
    const answer=await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("signal",{to:id,data:{type:"answer",sdp:pc.localDescription}});
  }else if(d.type==="answer"){
    const pc=peers.get(id);
    if(pc && pc.signalingState==="have-local-offer"){
      await pc.setRemoteDescription(new RTCSessionDescription(d.sdp));
      for(const c of pc.pendingIce.splice(0))await pc.addIceCandidate(c).catch(()=>{});
    }
  }else if(d.type==="ice"){
    const pc=peers.get(id);
    if(pc){
      if(pc.remoteDescription)await pc.addIceCandidate(d.candidate).catch(()=>{});
      else pc.pendingIce.push(d.candidate);
    }
  }
}

function closePeer(id){
  const pc=peers.get(id);
  if(pc){try{pc.close();}catch(e){}peers.delete(id);}
  removeVideo(id);
}
function addVideo(n,s,id){
  let tile=document.querySelector(`[data-id="${CSS.escape(id)}"]`);
  let v=tile?.querySelector("video");
  if(!tile){
    tile=document.createElement("div");
    tile.className="tile";
    tile.dataset.id=id;
    v=document.createElement("video");
    const label=document.createElement("span");
    label.className="video-label";
    label.textContent=n;
    tile.append(v,label);
    tile.addEventListener("click",e=>{
      if(e.target?.closest?.("button"))return;
      const wasFocused=tile.classList.contains("tile-focused");
      document.querySelectorAll("#videos .tile-focused").forEach(t=>t.classList.remove("tile-focused"));
      if(!wasFocused)tile.classList.add("tile-focused");
    });
    $("videos").appendChild(tile);
  }
  const u=people.get(id);
  const label=tile.querySelector(".video-label");
  if(label)label.textContent=(n||u?.name||"Participante")+(id==="local" && micOn && !forcedMuted ? " • 🎙️" : "");
  v.autoplay=true;
  v.playsInline=true;
  v.muted=id==="local";
  v.volume=1;
  if(v.srcObject!==s)v.srcObject=s;
  const tryPlay=()=>{
    if(id!=="local")v.muted=false;
    else v.muted=true;
    v.volume=1;
    const p=v.play();
    if(id!=="local" && p?.catch){
      p.catch(()=>{
        showAudioButton(tile,v);
        $("audioUnlock")?.classList.remove("hidden");
      });
    }
  };
  if(v.readyState>=2)tryPlay();
  else v.onloadedmetadata=tryPlay;
}
function showAudioButton(tile,v){
  if(tile.querySelector(".audio-unlock"))return;
  const b=document.createElement("button");
  b.className="audio-unlock";
  b.type="button";
  b.textContent="🔊 Ativar áudio";
  b.onclick=()=>{
    enableRemoteAudio(v);
    v.play().then(()=>{b.remove();$("audioUnlock")?.classList.add("hidden");}).catch(()=>{});
  };
  tile.appendChild(b);
}
function removeVideo(id){document.querySelector(`[data-id="${CSS.escape(id)}"]`)?.remove();}

function leaveCall(ending){
  const wasHost=isHost();
  if(ending&&wasHost&&socket)socket.emit("call-end",{room});
  if(socket?.connected)socket.emit("call-leave",{room});
  inCall=false;callReady=false;joiningCall=false;
  peers.forEach(pc=>{try{pc.close();}catch(e){}});
  peers.clear();
  $("videos").innerHTML="";
  if(screenTrack){try{screenTrack.stop();}catch(e){}screenTrack=null;}
  stopMusic();
  if(musicAudioContext){try{musicAudioContext.close()}catch(e){}musicAudioContext=null;musicDestination=null;musicGainNode=null;}
  if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null;}
  stopMicMeter();
  $("call").classList.add("hidden");
  $("app").classList.remove("call-open");
  $("callStatus").textContent="Pronto.";
  forcedMuted=false;
  if(wasHost)callHostId=null;
  renderPeople();
}

$("mic").onclick=()=>{
  if(!localStream)return;
  if(forcedMuted){$("callStatus").textContent="O criador silenciou seu microfone.";return;}
  micOn=!micOn;
  localStream.getAudioTracks().forEach(t=>t.enabled=micOn);
  updateMicButton();
};
$("cam").onclick=()=>{
  if(!localStream)return;
  camOn=!camOn;
  localStream.getVideoTracks().forEach(t=>t.enabled=camOn);
  $("cam").textContent=camOn?"📷":"🚫";
};
$("screen").onclick=async()=>{
  if(!localStream){$("callStatus").textContent="Entre na call antes de compartilhar a tela.";return;}
  if(!navigator.mediaDevices?.getDisplayMedia){
    $("callStatus").textContent="Seu navegador não oferece compartilhamento de tela.";
    return;
  }
  try{
    const s=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
    const track=s.getVideoTracks()[0];
    screenTrack=track;
    peers.forEach(async pc=>{
      const sender=pc.getSenders().find(x=>x.track?.kind==="video");
      if(sender)try{await sender.replaceTrack(track);}catch(e){}
    });
    const v=document.querySelector('[data-id="local"] video');
    if(v){v.srcObject=s;v.play().catch(()=>{});}
    $("callStatus").textContent="Transmitindo sua tela. 🖥️";
    track.onended=()=>{
      const cameraTrack=localStream?.getVideoTracks()[0];
      if(cameraTrack){
        peers.forEach(pc=>{
          const sender=pc.getSenders().find(x=>x.track?.kind==="video");
          if(sender)sender.replaceTrack(cameraTrack).catch(()=>{});
        });
        const localVideo=document.querySelector('[data-id="local"] video');
        if(localVideo){localVideo.srcObject=localStream;localVideo.play().catch(()=>{});}
      }
      screenTrack=null;
      $("callStatus").textContent="Câmera restaurada.";
    };
  }catch(e){
    $("callStatus").textContent=e?.name==="NotAllowedError"?"Compartilhamento cancelado.":"Não foi possível compartilhar a tela.";
  }
};

document.addEventListener("keydown",e=>{
  if(e.key==="Escape")document.querySelectorAll("#videos .tile-focused").forEach(t=>t.classList.remove("tile-focused"));
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="e"){
    e.preventDefault();$("emoji").click();
  }
});

window.addEventListener("beforeunload",()=>{try{if(inCall&&socket?.connected)socket.emit("call-leave",{room});}catch(e){}});

/* FreeChat 1.9 — mensagens diretas */
let activeFriendCode=null, messageTimer=null;
const messageEscape=s=>{const d=document.createElement("div");d.textContent=s??"";return d.innerHTML};
async function loadMessages(scroll=true){
 if(!activeFriendCode)return;
 try{
  const d=await api("/api/messages/"+encodeURIComponent(activeFriendCode)),list=$("messagesList");
  if(!list)return;
  list.innerHTML=d.messages?.length?d.messages.map(m=>{
   const mine=String(m.sender_id)===String(window.CONVERSA_USER?.id);
   return `<div class="message-bubble ${mine?"mine":"theirs"}"><div>${messageEscape(m.body)}</div><small>${new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</small></div>`;
  }).join(""):'<div class="muted">Nenhuma mensagem ainda. Diga olá! 👋</div>';
  if(scroll)list.scrollTop=list.scrollHeight;
 }catch(e){$("messageStatus").textContent=e.message||"Erro ao carregar mensagens."}
}

function formatMessageTime(v){
  const d=new Date(v); if(Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}
window.openMessages=function(friend){ if(!friend?.code)return; unreadCounts[friend.code]=0; 
 if(!friend?.code)return;
 activeFriendCode=friend.code;$("messagesFriendName").textContent=(friend.name||friend.code)+" • "+friend.code;
 $("messagesPanel").classList.remove("hidden");$("messageStatus").textContent="";$("messageInput").focus();loadMessages(true);
};
$("messageForm")?.addEventListener("submit",async e=>{
 e.preventDefault();const input=$("messageInput"),body=input.value.trim();if(!activeFriendCode||!body)return;
 const btn=e.currentTarget.querySelector("button");btn.disabled=true;
 try{await api("/api/messages",{method:"POST",body:JSON.stringify({code:activeFriendCode,body})});input.value="";await loadMessages(true)}
 catch(err){$("messageStatus").textContent=err.message||"Erro ao enviar."}
 finally{btn.disabled=false;input.focus()}
});
$("messagesClose")?.addEventListener("click",()=>{$("messagesPanel").classList.add("hidden");activeFriendCode=null;refreshUnreadCounts()});
$("messageInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("messageForm")?.requestSubmit()}});
messageTimer=setInterval(()=>{refreshUnreadCounts();if(activeFriendCode&&!$("messagesPanel")?.classList.contains("hidden"))loadMessages(false)},5000);

document.addEventListener("DOMContentLoaded",()=>{$("friendsSearch")?.addEventListener("input",e=>{window.friendSearchTerm=e.target.value;renderFriends()});$("messagesSearch")?.addEventListener("input",()=>loadMessages(true))});
