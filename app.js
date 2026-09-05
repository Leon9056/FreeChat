/* FreeChat v3.0.0 — UI completa, feed full-screen, temas e WebRTC reforçado */
function serverUrl(){return window.SIGNALING_URL?window.SIGNALING_URL.replace(/\/$/,""):(location.protocol==="https:"?"https://"+location.host:"http://"+location.host)}
(function(){
 const $=id=>document.getElementById(id),
       THEME_ACCENTS=["purple","blue","cyan","green","orange","pink"],
       THEME_NAMES={purple:"Roxo Neon",blue:"Azul",cyan:"Ciano",green:"Verde",orange:"Laranja",pink:"Rosa"},
       applyTheme=()=>{const t=localStorage.getItem("conversaLiveTheme")||"dark",a=localStorage.getItem("conversaLiveAccent")||"purple";document.documentElement.dataset.theme=t;document.documentElement.dataset.accent=a;document.documentElement.classList.toggle("reduce-motion",localStorage.getItem("freechatReduceMotion")==="1");},
       setAccent=a=>{if(!THEME_ACCENTS.includes(a))a="purple";localStorage.setItem("conversaLiveAccent",a);applyTheme();renderThemeChoices?.();},
       toggleTheme=()=>{localStorage.setItem("conversaLiveTheme",(localStorage.getItem("conversaLiveTheme")||"dark")==="dark"?"light":"dark");applyTheme();renderThemeChoices?.();};
 applyTheme();
 document.addEventListener("DOMContentLoaded",()=>{applyTheme();});
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


function renderThemeChoices(){
 const box=$("themeChoices");if(!box)return;const active=localStorage.getItem("conversaLiveAccent")||"purple";
 box.innerHTML=THEME_ACCENTS.map(a=>`<button type="button" class="theme-choice ${a===active?"active":""}" data-theme-accent="${a}"><i></i><span>${THEME_NAMES[a]}</span><small>${a===active?"Ativo":"Aplicar"}</small></button>`).join("");
 box.querySelectorAll("[data-theme-accent]").forEach(b=>b.onclick=()=>setAccent(b.dataset.themeAccent));
 const r=$("reduceMotionToggle");if(r)r.checked=localStorage.getItem("freechatReduceMotion")==="1";
}
function securityText(v){const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML}
async function loadSecuritySettings(){
 try{
  const [sd,pd,bd]=await Promise.all([api("/api/security/sessions"),api("/api/security/privacy"),api("/api/security/blocked")]);
  const box=$("securitySessions");
  if(box){
   box.innerHTML=(sd.sessions||[]).map(x=>{
    const device=x.current?"🟢 Este dispositivo":"💻 "+securityText(x.user_agent);
    const action=x.current?'<span class="security-current">Atual</span>':`<button class="secondary-btn tiny-btn" data-revoke-session="${x.id}">Encerrar</button>`;
    return `<div class="security-item"><div><b>${device}</b><small>Último acesso: ${new Date(x.last_seen_at).toLocaleString()} • expira ${new Date(x.expires_at).toLocaleDateString()}</small></div>${action}</div>`;
   }).join("")||'<span class="muted">Nenhuma sessão ativa.</span>';
   box.querySelectorAll("[data-revoke-session]").forEach(b=>b.onclick=async()=>{try{await api("/api/security/revoke",{method:"POST",body:JSON.stringify({id:b.dataset.revokeSession})});appToast("Sessão encerrada.","success");loadSecuritySettings()}catch(e){appToast(e.message,"error")}});
  }
  if($("privacyMessages"))$("privacyMessages").value=pd.message_policy||"friends";
  if($("privacyCalls"))$("privacyCalls").value=pd.call_policy||"friends";
  if($("privacyFriends"))$("privacyFriends").value=pd.friend_policy||"everyone";
  const bb=$("blockedUsers");
  if(bb){
   bb.innerHTML=(bd.blocked||[]).map(x=>`<div class="security-item"><div><b>🚫 ${securityText(x.name)}</b><small>${securityText(x.code)}</small></div><button class="secondary-btn tiny-btn" data-unblock="${securityText(x.code)}">Desbloquear</button></div>`).join("")||'<span class="muted">Nenhum usuário bloqueado.</span>';
   bb.querySelectorAll("[data-unblock]").forEach(b=>b.onclick=async()=>{try{await api("/api/security/unblock",{method:"POST",body:JSON.stringify({code:b.dataset.unblock})});appToast("Usuário desbloqueado.","success");loadSecuritySettings()}catch(e){appToast(e.message,"error")}});
  }
 }catch(e){$("securityStatus")?.replaceChildren(document.createTextNode(e.message||"Não foi possível carregar a segurança."))}
}
async function changeSecurityPassword(){const status=$("securityStatus");try{setBusy($("changePasswordBtn"),true,"Salvando...");const d=await api("/api/security/password",{method:"POST",body:JSON.stringify({currentPassword:$("currentPassword")?.value||"",newPassword:$("newPassword")?.value||""})});if(status)status.textContent=d.message||"Senha alterada.";$("currentPassword").value="";$("newPassword").value="";appToast("Senha alterada com sucesso.","success");loadSecuritySettings()}catch(e){if(status)status.textContent=e.message||"Erro.";appToast(e.message||"Erro ao alterar senha.","error")}finally{setBusy($("changePasswordBtn"),false)}}
async function savePrivacy(){try{const d=await api("/api/security/privacy",{method:"PATCH",body:JSON.stringify({message_policy:$("privacyMessages").value,call_policy:$("privacyCalls").value,friend_policy:$("privacyFriends").value})});appToast("Privacidade atualizada.","success")}catch(e){appToast(e.message,"error")}}
function openSettings(){const p=$("settingsPanel");if(!p)return;p.classList.remove("hidden");renderThemeChoices();loadSecuritySettings();}
function closeSettings(){$("settingsPanel")?.classList.add("hidden");}
function initSettings(){
 $("settingsBtn")?.addEventListener("click",openSettings);$("settingsClose")?.addEventListener("click",closeSettings);$("securityRefresh")?.addEventListener("click",loadSecuritySettings);$("changePasswordBtn")?.addEventListener("click",changeSecurityPassword);$("savePrivacyBtn")?.addEventListener("click",savePrivacy);$("securityRevokeAll")?.addEventListener("click",async()=>{try{await api("/api/security/revoke-all",{method:"POST"});appToast("Outras sessões encerradas.","success");loadSecuritySettings()}catch(e){appToast(e.message,"error")}});
 $("modeToggle")?.addEventListener("click",toggleTheme);
 $("reduceMotionToggle")?.addEventListener("change",e=>{localStorage.setItem("freechatReduceMotion",e.target.checked?"1":"0");applyTheme();});
 $("settingsPanel")?.addEventListener("click",e=>{if(e.target.id==="settingsPanel")closeSettings()});
}
window.renderThemeChoices=renderThemeChoices;
document.addEventListener("DOMContentLoaded",initSettings);
let friendRequestSnapshot=new Set(),friendPollTimer=null,audioNotifyContext=null;

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
window.playFriendNotificationSound=playFriendNotificationSound;

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
window.showFriendToast=showFriendToast;
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
 window.CONVERSA_TOKEN=d.token;window.CONVERSA_USER=d.user;login.classList.add("hidden");menu.classList.remove("hidden");animateMainMenu();
 $("welcomeName").textContent=d.user.name;$("myCode").textContent=d.user.code;$("sideCode").textContent=d.user.code;window.renderFriends?.();startFriendRequestPolling();connectLobby();
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
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
  const r=await fetch(serverUrl()+"/api/"+(mode==="register"?"register":"login"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(mode==="register"?{name:nm,email:em,password:pw}:{email:em,password:pw}),signal:controller.signal});
  clearTimeout(timer);
  const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"Não foi possível concluir a operação.");showApp(d);
 }catch(e){setStatus(e.message||"Não foi possível conectar ao servidor. Verifique o backend no Render.");}
 finally{setBusy(btn,false,mode==="register"?"✨ Criar conta":"🚀 Entrar")}
}
$("loginTab").onclick=()=>modeSet("login");$("registerTab").onclick=()=>modeSet("register");$("loginBtn").onclick=auth;
 $("togglePassword").onclick=()=>togglePasswordField("password","togglePassword");$("toggleConfirmPassword").onclick=()=>togglePasswordField("confirmPassword","toggleConfirmPassword");
 password.addEventListener("input",updatePasswordStrength);$("confirmPassword")?.addEventListener("input",()=>{$("confirmPassword").setCustomValidity(password.value!==$("confirmPassword").value?"As senhas não coincidem.":"")});
 [email,password,name,$("confirmPassword")].filter(Boolean).forEach(el=>el.addEventListener("keydown",e=>{if(e.key==="Enter")auth()}));
 const t=localStorage.getItem("conversaLiveToken"),u=localStorage.getItem("conversaLiveUser");if(t&&u)try{window.CONVERSA_TOKEN=t;window.CONVERSA_USER=JSON.parse(u);login.classList.add("hidden");menu.classList.remove("hidden");animateMainMenu();$("welcomeName").textContent=window.CONVERSA_USER.name;$("myCode").textContent=window.CONVERSA_USER.code;$("sideCode").textContent=window.CONVERSA_USER.code;window.renderFriends?.();startFriendRequestPolling();connectLobby()}catch(e){localStorage.removeItem("conversaLiveToken");localStorage.removeItem("conversaLiveUser")}
 async function api(path,opts={}){const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);let externalAbort;try{if(opts.signal){externalAbort=()=>controller.abort();if(opts.signal.aborted)controller.abort();else opts.signal.addEventListener("abort",externalAbort,{once:true})}const isForm=typeof FormData!=="undefined"&&opts.body instanceof FormData;const baseHeaders={Authorization:"Bearer "+(window.CONVERSA_TOKEN||localStorage.getItem("conversaLiveToken"))};if(!isForm)baseHeaders["Content-Type"]="application/json";const r=await fetch(serverUrl()+path,{...opts,signal:controller.signal,headers:{...baseHeaders,...(opts.headers||{})}});const d=await r.json().catch(()=>({}));if(r.status===401){localStorage.removeItem("conversaLiveToken");localStorage.removeItem("conversaLiveUser");window.CONVERSA_TOKEN="";throw Error("Sua sessão expirou. Entre novamente.")}if(!r.ok)throw Error(d.error||"Erro.");return d}catch(e){if(e?.name==="AbortError")throw Error("O servidor demorou demais para responder. Tente novamente.");throw e}finally{clearTimeout(timeout);if(externalAbort&&opts.signal)opts.signal.removeEventListener("abort",externalAbort)}} 
 let unreadCounts={},unreadInitialized=false;
 async function refreshUnreadCounts(){try{const d=await api("/api/messages/unread");const next=d.unread||{};if(unreadInitialized){Object.keys(next).forEach(code=>{const before=Number(unreadCounts[code]||0),after=Number(next[code]||0);if(after>before&&code!==activeFriendCode){const friend=(window.friendDirectory?.friends||[]).find(x=>x.code===code);window.notifyIncomingMessage?.(friend?.name||code,{body:"Nova mensagem"})}})}unreadCounts=next;unreadInitialized=true;window.renderFriends?.()}catch(e){}}
 function bumpUnread(code){unreadCounts[code]=(unreadCounts[code]||0)+1;window.renderFriends?.();}
 window.refreshUnreadCounts=refreshUnreadCounts; window.conversaApi=api; window.api=api; window.bumpUnread=bumpUnread;
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
  friends.forEach(u=>{
    const online=!!u.online||[...people.values()].some(p=>p.code===u.code),unread=Number(unreadCounts[u.code]||0);
    const x=document.createElement("div");x.className="friend-item";
    x.innerHTML='<div class="friend-avatar"></div><span class="friend-dot"></span><div class="friend-info"><b></b><small></small></div><span class="friend-unread" hidden></span><button class="message-friend-btn" title="Mensagem">💬</button><button class="friend-call-btn" title="Chamar para call">📞</button><button class="friend-block-btn" title="Bloquear">🚫</button><button class="friend-report-btn" title="Denunciar">⚑</button><button class="remove-friend-btn" title="Remover">×</button>';
    x.querySelector(".friend-avatar").textContent=(u.name||"?").trim().charAt(0).toUpperCase();
    x.querySelector(".friend-dot").classList.toggle("online",online);
    x.querySelector("b").textContent=u.name||"Usuário";
    x.querySelector("small").textContent=online?"● Online":"○ Offline";
    const b=x.querySelector(".friend-unread");if(unread){b.textContent=unread>99?"99+":String(unread);b.hidden=false}
    x.querySelector(".message-friend-btn").onclick=()=>openMessages(u);
    const callBtn=x.querySelector(".friend-call-btn");
    if(!online){callBtn.disabled=true;callBtn.title="Amigo offline — não é possível chamar agora"}
    callBtn.onclick=()=>{const newRoom=makeCallCode();openApp(newRoom,true);inviteFriendToCall(u.code,newRoom,u.name)};
    x.querySelector(".remove-friend-btn").onclick=async()=>{if(!confirm("Remover "+(u.name||"este amigo")+" da sua lista?"))return;try{await api("/api/friends/remove",{method:"POST",body:JSON.stringify({code:u.code})});delete unreadCounts[u.code];appToast("Amigo removido");renderFriends()}catch(e){appToast(e.message,"error")}};
    list.appendChild(x);
  });
  if(!friends.length&&!(list.id==="friendsList"&&requests.length)){const q=document.createElement("div");q.className="friends-empty";q.innerHTML='<div class="friends-empty-icon">👥</div><b>'+(term?"Nenhum resultado":"Sua lista está vazia")+'</b><small>'+(term?"Tente outro nome ou código.":"Adicione amigos pelo código.")+'</small>';list.appendChild(q)}
 });
};async function addFriend(input,status){const code=input.value.trim().toUpperCase();if(!/^CL-[A-Z0-9]{6}$/.test(code)){status.textContent="Código inválido. Use CL-XXXXXX.";return}try{const d=await api("/api/friends/request",{method:"POST",body:JSON.stringify({code})});status.textContent=d.message||"Convite enviado!";input.value="";renderFriends()}catch(e){status.textContent=e.message}}
 $("addFriendBtn").onclick=()=>addFriend($("friendCodeInput"),$("friendStatus"));$("addFriendApp").onclick=()=>addFriend($("friendCodeApp"),$("friendAppStatus"));$("refreshFriends").onclick=window.renderFriends;$("friendsBtn").onclick=()=>{$("friendsPanel").classList.remove("hidden");renderFriends()};$("friendsClose").onclick=()=>$('friendsPanel').classList.add("hidden");$("copyUserCode").onclick=()=>navigator.clipboard?.writeText($("myCode").textContent);refreshUnreadCounts();
 $("logoutBtn").onclick=async()=>{clearInterval(friendPollTimer);try{await api("/api/logout",{method:"POST"})}catch(e){}try{socket?.disconnect?.();}catch(e){}localStorage.removeItem("conversaLiveToken");localStorage.removeItem("conversaLiveUser");window.CONVERSA_TOKEN="";location.href=location.pathname}; 
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
 window.openApp=openApp;
})();
const $=id=>document.getElementById(id);
window.addEventListener("unhandledrejection",e=>{console.warn("FreeChat unhandled rejection",e.reason);if(e.reason?.name!=="AbortError")appToast("Algo demorou mais que o esperado. Tente novamente.","error")});
window.addEventListener("error",e=>{console.warn("FreeChat runtime error",e.error||e.message)});

function appToast(msg,type="info"){
  let t=document.getElementById("appToast");
  if(!t){t=document.createElement("div");t.id="appToast";t.className="app-toast";document.body.appendChild(t);}
  t.textContent=msg||"";
  t.dataset.type=type;
  t.classList.add("show");
  clearTimeout(t._hideTimer);
  t._hideTimer=setTimeout(()=>t.classList.remove("show"),3200);
}
function inviteFriendToCall(code,targetRoom,friendName){
  if(!socket?.connected){appToast("Conectando... tente novamente em instantes.","error");return;}
  socket.emit("call-invite",{code,room:targetRoom},res=>{
    if(res?.ok)appToast("Convite de call enviado para "+(friendName||"seu amigo")+"! 📞","success");
    else appToast(res?.error||"Não foi possível enviar o convite.","error");
  });
}
function showCallInvite(invitedRoom,fromCode,fromName){
  let el=document.getElementById("callInviteBanner");
  if(!el){
    el=document.createElement("div");el.id="callInviteBanner";el.className="call-invite-banner";
    el.innerHTML='<div class="call-invite-icon">📞</div><div class="call-invite-info"><b></b><small>está te chamando para uma call</small></div><button class="call-invite-accept" type="button">Aceitar</button><button class="call-invite-decline" type="button">✕</button>';
    document.body.appendChild(el);
  }
  el.querySelector("b").textContent=fromName||"Alguém";
  clearTimeout(el._timer);
  const cleanup=()=>{el.classList.remove("show")};
  el.querySelector(".call-invite-accept").onclick=()=>{cleanup();window.openApp?window.openApp(invitedRoom,true):window.dispatchEvent(new CustomEvent("conversa:open-room",{detail:{room:invitedRoom}}))};
  el.querySelector(".call-invite-decline").onclick=()=>{cleanup();socket?.emit("call-invite-decline",{toCode:fromCode,room:invitedRoom})};
  el.classList.add("show");
  window.playFriendNotificationSound?.();
  el._timer=setTimeout(cleanup,20000);
}
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
let peers=new Map(),pendingRemoteIce=new Map(),remoteAudioEls=new Map(),people=new Map(),inCall=false;
let micOn=true,camOn=true,callHostId=null,remoteMuted=new Set(),kicked=false,forcedMuted=false;
let callVolumeMuted=localStorage.getItem("freechatCallVolumeMuted")==="1",callVolumeLevel=Math.max(0,Math.min(1,Number(localStorage.getItem("freechatCallVolumeLevel")??100)/100));
let callReady=false;
let joiningCall=false,pingTimer=null,pingStarted=0,lastRtt=null,callAttempt=0;
let audioContext=null, micAnalyser=null, micSource=null, micMeterTimer=null;

function enterRoomAfterConnect(){
  if(!socket?.connected||!room)return;
  socket.emit("join",{room});
  if(window.CONVERSA_AUTO_CALL&&!inCall){
    setTimeout(()=>{if(!inCall&&socket?.connected)openCall()},450);
    window.CONVERSA_AUTO_CALL=false;
  }
  if(inCall)setTimeout(()=>socket.emit("call-ready",{room}),250);
}
function connectLobby(){
  if(room)return; // já existe uma sala alvo, o fluxo normal cuida da conexão
  connect();
}
function joinRoom(roomValue,nameValue){
  name=(nameValue||window.CONVERSA_USER_NAME||"Visitante").trim().slice(0,24)||"Visitante";
  room=(roomValue||window.CONVERSA_ROOM||"geral").trim().toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,32)||"geral";
  $("callMenu")?.classList.add("hidden");
  $("app").classList.remove("hidden");
  $("me").textContent=name;
  $("avatar").textContent=name[0].toUpperCase();
  $("roomName").textContent="# "+room;
  $("headRoom").textContent=room;
  if(socket?.connected)enterRoomAfterConnect();
  else connect();
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
    path:"/socket.io",
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
    $("status").textContent=room?"Conectado":"Online";setConnectionLevel(4,room?"Conectado":"Online");startConnectionMonitor();
    enterRoomAfterConnect();
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
  socket.on("chat",m=>{addMessage(m.name,m.text,m.time);callChatHistory.push(m);if(callChatHistory.length>80)callChatHistory.shift();if(!$("callSidePanel")?.classList.contains("hidden")&&$("callPanelTitle")?.textContent==="Chat da call")openCallPanel("chat");});
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

  socket.on("call-invite",({room:invitedRoom,fromCode,fromName})=>{
    showCallInvite(invitedRoom,fromCode,fromName);
  });
  socket.on("call-invite-declined",({byName})=>{
    appToast((byName||"Seu amigo")+" recusou o convite para a call.","info");
  });
  socket.on("notification-new",n=>{handleNewNotification(n)});
  socket.on("friend-request",({name:reqName})=>{
    window.playFriendNotificationSound?.();window.showFriendToast?.(reqName);window.refreshUnreadCounts?.();window.renderFriends?.();
  });
  socket.on("friend-accepted",({name:accName})=>{
    appToast((accName||"Seu amigo")+" aceitou seu convite de amizade!","success");window.renderFriends?.();
  });
  socket.on("dm-new",({code:fromCode,message,fromName})=>{
    if(fromCode===activeFriendCode && !$("messagesPanel")?.classList.contains("hidden")){
      lastLoadedMessages.push(message);
      renderMessagesList(true);
      api("/api/messages/"+encodeURIComponent(activeFriendCode)).then(d=>{lastLoadedMessages=d.messages||lastLoadedMessages;renderMessagesList(true)}).catch(()=>{});
    }else{
      window.bumpUnread?.(fromCode);
      window.notifyIncomingMessage?.(fromName||fromCode,message);
    }
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
  if(micMeterTimer)clearInterval(micMeterTimer);
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
    // Um "poll" leve a ~12x/s é suficiente para o indicador visual e custa
    // bem menos CPU do que recalcular a cada frame (60x/s) com requestAnimationFrame.
    const tick=()=>{
      if(!micAnalyser||!localStream)return;
      micAnalyser.getByteTimeDomainData(data);
      let sum=0;
      for(let i=0;i<data.length;i++){const x=(data[i]-128)/128;sum+=x*x;}
      const rms=Math.sqrt(sum/data.length);
      const speaking=rms>.035 && micOn && !forcedMuted;
      $("mic")?.classList.toggle("speaking",speaking);
    };
    tick();
    micMeterTimer=setInterval(tick,80);
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
  v.volume=callVolumeLevel;
  const p=v.play();
  if(p?.catch)p.catch(()=>{});
}

function unlockAllAudio(){
  document.querySelectorAll("#videos video").forEach(v=>{if(v.dataset.local!=="1")enableRemoteAudio(v)});
  remoteAudioEls.forEach(v=>{v.muted=false;v.volume=callVolumeLevel;v.play().catch(()=>{})});
  if(musicAudioContext?.state==="suspended")musicAudioContext.resume().catch(()=>{});
  if(musicElement?.paused)musicElement.play().catch(()=>{});
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
let musicUiTickTimer=null;
function updateMusicUI(state){
 const b=$("musicBot");if(!b)return;
 const t=b.querySelector(".music-title"),m=b.querySelector(".music-meta"),q=b.querySelector(".music-queue-count"),x=b.querySelector(".music-stop"),sk=b.querySelector(".music-skip"),fill=b.querySelector(".music-progress-fill");
 clearInterval(musicUiTickTimer);musicUiTickTimer=null;
 if(state?.track){
   b.classList.remove("idle");
   if(t)t.textContent="🎵 "+state.track.title;
   const dur=Number(state.track.duration||0);
   const basePos=Number(state.position||0),syncAt=Date.now();
   const renderTick=()=>{
     const pos=state.paused?basePos:basePos+(Date.now()-syncAt)/1000;
     if(m)m.textContent=(state.paused?"⏸ pausada":"▶ tocando")+" • "+(state.track.artist||"Artista")+" • "+formatMusicTime(pos)+(dur?"/"+formatMusicTime(dur):"");
     if(fill)fill.style.width=(dur>0?Math.min(100,pos/dur*100):0)+"%";
   };
   renderTick();
   if(!state.paused)musicUiTickTimer=setInterval(renderTick,1000);
   if(q)q.textContent=(state.queue?.length||0)+" na fila";if(x)x.disabled=false;if(sk)sk.disabled=false;
 }else{
   b.classList.add("idle");if(t)t.textContent="Nenhuma música tocando";if(m)m.textContent="Use /m nome da música no chat";if(q)q.textContent="";if(x)x.disabled=true;if(sk)sk.disabled=true;if(fill)fill.style.width="0%";
 }
}
function setPeersAudioProfile(profile){
  const maxBitrate=profile==="music"?160000:64000;
  peers.forEach(pc=>{
    const sender=pc.getSenders().find(s=>s.track?.kind==="audio");
    if(!sender)return;
    try{
      const p=sender.getParameters();
      p.encodings=p.encodings?.length?p.encodings:[{}];
      p.encodings[0].maxBitrate=maxBitrate;
      p.encodings[0].networkPriority="high";
      sender.setParameters(p).catch(()=>{});
    }catch(e){}
  });
}
function ensureMusicAudio(){if(musicAudioContext)return musicAudioContext;const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)throw Error("Seu navegador não suporta áudio.");musicAudioContext=new Ctx();musicDestination=musicAudioContext.createMediaStreamDestination();return musicAudioContext;}
async function applyMusicTrackToPeers(track,state){
 const ctx=ensureMusicAudio();if(ctx.state==="suspended")await ctx.resume().catch(()=>{});
 if(musicElement)try{musicElement.pause()}catch(e){} if(musicSource)try{musicSource.disconnect()}catch(e){}
 if(musicMicSource)try{musicMicSource.disconnect()}catch(e){} musicMicSource=null;
 try{const td=await api("/api/music/token");musicMediaToken=td.token||"";}catch(e){setCallStatus(e.message||"Não foi possível preparar o áudio.","error");return;}
 musicElement=new Audio();musicElement.crossOrigin="anonymous";musicElement.preload="auto";musicElement.src=serverUrl()+"/api/music/stream/"+encodeURIComponent(track.id)+"?mt="+encodeURIComponent(musicMediaToken);
 let handledError=false;
 musicElement.addEventListener("error",()=>{
   if(handledError)return;handledError=true;
   if(musicHost&&socket?.connected){
     setCallStatus("Essa faixa falhou. Pulando para a próxima... ⏭","warn");
     socket.emit("music-next",{room});
   }else{
     setCallStatus("O áudio não pôde ser carregado. Tente outra música.","error");
   }
 });
 musicSource=ctx.createMediaElementSource(musicElement);musicGainNode=ctx.createGain();musicGainNode.gain.value=localMusicMuted?0:localMusicVolume;
 musicSource.connect(musicGainNode);musicGainNode.connect(musicDestination);musicSource.connect(ctx.destination);
 if(localStream?.getAudioTracks?.().length){musicMicSource=ctx.createMediaStreamSource(new MediaStream([localStream.getAudioTracks()[0]]));const g=ctx.createGain();g.gain.value=1;musicMicSource.connect(g);g.connect(musicDestination);}
 const mixed=musicDestination.stream.getAudioTracks()[0];peers.forEach(pc=>{const snd=pc.getSenders().find(x=>x.track?.kind==="audio");if(snd&&mixed)snd.replaceTrack(mixed).catch(()=>{})});
 setPeersAudioProfile("music");
 musicTrack=track;musicElement.onended=()=>{if(musicHost&&socket?.connected)socket.emit("music-next",{room})};
 try{if(Number(state?.position)>0)musicElement.currentTime=Number(state.position)}catch(e){}
 try{await musicElement.play();$("audioUnlock")?.classList.add("hidden");}catch(e){$("audioUnlock")?.classList.remove("hidden");setCallStatus("Clique em 🔊 Ativar áudio para iniciar a música.","warn")}syncMusicPlayback(state);
}
function syncMusicPlayback(state){if(!musicElement||!state?.track)return;musicVolume=Math.max(0,Math.min(1,Number(state.volume??musicVolume)));if(musicGainNode)musicGainNode.gain.value=localMusicMuted?0:localMusicVolume;if(state.paused)musicElement.pause();else if(musicElement.paused)musicElement.play().catch(()=>{});renderLocalMusicVolume();}
function restoreMicTrack(){const mic=localStream?.getAudioTracks?.()[0];peers.forEach(pc=>{const snd=pc.getSenders().find(x=>x.track?.kind==="audio");if(snd)snd.replaceTrack(mic||null).catch(()=>{})});setPeersAudioProfile("voice");}
function stopMusicLocal(clear=true){musicHost=false;musicTrack=null;musicMediaToken="";if(clear)musicState=null;if(musicElement){try{musicElement.pause()}catch(e){}musicElement.removeAttribute("src");musicElement.load();musicElement=null;}if(musicSource)try{musicSource.disconnect()}catch(e){}musicSource=null;if(musicGainNode)try{musicGainNode.disconnect()}catch(e){}musicGainNode=null;if(musicMicSource)try{musicMicSource.disconnect()}catch(e){}musicMicSource=null;restoreMicTrack();updateMusicUI(null);}
async function searchAndPlayMusic(term){if(!inCall||!socket?.connected){appToast("Entre em uma call para usar o bot de música.","error");return false;}const q=String(term||"").trim();if(q.length<2){appToast("Use /m nome da música","error");return false;}try{const d=await api("/api/music/search?q="+encodeURIComponent(q));const track=d.tracks?.[0];if(!track)throw Error("Não encontrei essa música.");socket.emit("music-play",{room,track});return true}catch(e){setCallStatus(e.message||"Não foi possível tocar a música.","error");return false;}}
function musicControl(ev,p={}){if(!inCall||!socket?.connected){appToast("Entre em uma call para usar o bot de música.","error");return;}socket.emit(ev,{room,...p});}
function handleMusicCommand(t){t=String(t||"").trim();if(!/^\/(m|skip|pause|resume|volume|queue|stop|music)\b/i.test(t))return false;let m=t.match(/^\/m\s+(.+)$/i);if(m){try{const c=ensureMusicAudio();if(c.state==="suspended")c.resume().catch(()=>{});}catch(e){}searchAndPlayMusic(m[1]);return true;}if(/^\/skip$/i.test(t)){musicControl("music-next");return true;}if(/^\/pause$/i.test(t)){musicControl("music-pause");return true;}if(/^\/resume$/i.test(t)){musicControl("music-resume");return true;}if(/^\/queue$/i.test(t)){musicControl("music-queue");return true;}if(/^\/stop$/i.test(t)){musicControl("music-stop");return true;}m=t.match(/^\/volume\s+(\d{1,3})$/i);if(m){const n=Number(m[1]);if(n>100){appToast("Volume entre 0 e 100.","error");return true;}musicControl("music-volume",{volume:n/100});return true;}if(/^\/music$/i.test(t)){appToast("/m música • /queue • /skip • /pause • /resume • /volume 0-100 • /stop","info");return true;}return true;}
let musicAudioContext=null,musicElement=null,musicSource=null,musicDestination=null,musicMicSource=null,musicGainNode=null,musicTrack=null,musicHost=false,musicVolume=.7,musicState=null,musicMediaToken="",localMusicVolume=Number(localStorage.getItem("freechatLocalMusicVolume")??70)/100,localMusicMuted=false;
function renderLocalMusicVolume(){const v=Math.round(localMusicVolume*100);$("musicLocalVolume")?.setAttribute("value",String(v));$("musicLocalVolumeValue")?.replaceChildren(document.createTextNode(v+"%"));const b=$("musicLocalMute");if(b){b.textContent=localMusicMuted?"🔇 Som desligado":"🔊 Som ligado";b.classList.toggle("muted",localMusicMuted);}}
function setLocalMusicVolume(v){localMusicVolume=Math.max(0,Math.min(1,Number(v)/100));localStorage.setItem("freechatLocalMusicVolume",String(Math.round(localMusicVolume*100)));localMusicMuted=localMusicVolume===0;if(localMusicVolume>0)localMusicMuted=false;if(musicGainNode)musicGainNode.gain.value=localMusicMuted?0:localMusicVolume;renderLocalMusicVolume();}
function toggleLocalMusicMute(){localMusicMuted=!localMusicMuted;if(musicGainNode)musicGainNode.gain.value=localMusicMuted?0:localMusicVolume;renderLocalMusicVolume();}
function stopMusic(){if(socket?.connected&&musicHost)socket.emit("music-stop",{room});stopMusicLocal();}
function withTimeout(promise,ms){
  return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Object.assign(new Error("MEDIA_TIMEOUT"),{name:"TimeoutError"})),ms))]);
}


/* FreeChat 2.5.1 — navegação por gesto no celular */
let mobileView=0;
let mobileSwipe={active:false,startX:0,startY:0,pointerId:null};
function isMobileLayout(){return window.matchMedia?.("(max-width: 900px)").matches===true}
function animateMainMenu(){const menu=document.getElementById("callMenu");if(!menu)return;menu.classList.remove("menu-enter");void menu.offsetWidth;menu.classList.add("menu-enter");setTimeout(()=>menu.classList.remove("menu-enter"),650)}
function setMobileView(view){
 view=Math.max(0,Math.min(2,Number(view)||0)); mobileView=view;
 const root=$("app"),nav=$("mobileNav"); if(!root)return;
 root.classList.toggle("mobile-view-call",view===0); root.classList.toggle("mobile-view-chat",view===1); root.classList.toggle("mobile-view-social",view===2);
 if(nav){nav.classList.toggle("hidden",!isMobileLayout()||!inCall);nav.querySelectorAll("[data-mobile-view]").forEach(b=>b.classList.toggle("active",Number(b.dataset.mobileView)===view));}
 const pos=$("mobileCallPosition"); if(pos)pos.textContent=view===0?"1/3 • Call":view===1?"2/3 • Chat":"3/3 • Social";
 const hint=$("mobileSwipeHint"); if(hint)hint.textContent=view===0?"Deslize ← para o chat • deslize novamente para Social":view===1?"Deslize ← para Social • → para voltar à call":"← para voltar ao chat • → para voltar à call";
 if(view===2){$("friendsPanel")?.classList.add("hidden");openSocial("feed");} else {$("socialPanel")?.classList.add("hidden");}
}
function syncMobileLayout(){if(!isMobileLayout()){$("mobileNav")?.classList.add("hidden");$("app")?.classList.remove("mobile-view-call","mobile-view-chat","mobile-view-social");return;} if(inCall)setMobileView(mobileView);else $("mobileNav")?.classList.add("hidden");}
function handleMobileSwipeStart(e){if(!isMobileLayout()||!inCall)return;if(e.pointerType==="mouse"&&e.button!==0)return;mobileSwipe={active:true,startX:e.clientX,startY:e.clientY,pointerId:e.pointerId};try{e.currentTarget.setPointerCapture?.(e.pointerId)}catch(_){} }
function handleMobileSwipeEnd(e){if(!mobileSwipe.active||e.pointerId!==mobileSwipe.pointerId)return;const dx=e.clientX-mobileSwipe.startX,dy=e.clientY-mobileSwipe.startY;mobileSwipe.active=false;if(Math.abs(dx)<58||Math.abs(dx)<Math.abs(dy)*1.15)return;if(dx<0)setMobileView(mobileView+1);else setMobileView(mobileView-1);}
function initMobileNavigation(){const call=$("call");if(call&&!call.dataset.swipeReady){call.dataset.swipeReady="1";call.addEventListener("pointerdown",handleMobileSwipeStart,{passive:true});call.addEventListener("pointerup",handleMobileSwipeEnd,{passive:true});call.addEventListener("pointercancel",handleMobileSwipeEnd,{passive:true});} document.querySelectorAll("#mobileNav [data-mobile-view]").forEach(b=>b.addEventListener("click",()=>setMobileView(Number(b.dataset.mobileView))));window.addEventListener("resize",syncMobileLayout,{passive:true});window.addEventListener("orientationchange",()=>setTimeout(syncMobileLayout,120),{passive:true});syncMobileLayout();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initMobileNavigation);else initMobileNavigation();


/* FreeChat 3.0.1 — WebRTC media hardening */
function getVideoDuration(file){
 return new Promise((resolve,reject)=>{
   const url=URL.createObjectURL(file),v=document.createElement("video");
   v.preload="metadata";v.onloadedmetadata=()=>{const d=Number(v.duration);URL.revokeObjectURL(url);if(!Number.isFinite(d)||d<=0)reject(new Error("Duração inválida"));else resolve(d)};
   v.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Vídeo inválido"))};v.src=url;
 });
}
function mediaUrl(media){return serverUrl()+String(media?.url||"");}
let selectedPostMedia=null,callStatsTimer=null,callChatHistory=[],callFocusedTile=null,postPreviewObjectUrl=null;
function clearPostMedia(){selectedPostMedia=null;const i=$("postMedia");if(i)i.value="";const p=$("postMediaPreview");if(p){p.innerHTML="";p.classList.add("hidden")}if(postPreviewObjectUrl){URL.revokeObjectURL(postPreviewObjectUrl);postPreviewObjectUrl=null}}
function renderPostMediaPreview(file){
 const p=$("postMediaPreview");if(!p)return;
 p.classList.remove("hidden");p.innerHTML="";
 const wrap=document.createElement("div");wrap.className="post-preview-inner";
 const remove=document.createElement("button");remove.type="button";remove.className="preview-remove";remove.textContent="×";remove.onclick=clearPostMedia;
 postPreviewObjectUrl=URL.createObjectURL(file);
 if(file.type.startsWith("image/")){const img=document.createElement("img");img.src=postPreviewObjectUrl;wrap.appendChild(img)}
 else{const v=document.createElement("video");v.controls=true;v.playsInline=true;v.src=postPreviewObjectUrl;wrap.appendChild(v)}
 const info=document.createElement("span");info.textContent=file.name+" • "+(file.size/1024/1024).toFixed(1)+" MB";
 wrap.append(info,remove);p.appendChild(wrap);
}
$("postMediaBtn")?.addEventListener("click",()=>$("postMedia")?.click());
$("postMedia")?.addEventListener("change",async e=>{
 const f=e.target.files?.[0];if(!f)return;
 if(f.size>20*1024*1024){appToast("A mídia precisa ter no máximo 20 MB.","error");clearPostMedia();return}
 if(!/^(image\/|video\/)/i.test(f.type)){appToast("Use uma foto ou vídeo.","error");clearPostMedia();return}
 if(f.type.startsWith("video/")){
   try{const d=await getVideoDuration(f);if(d>60.5){appToast("O vídeo precisa ter até 1 minuto.","error");clearPostMedia();return}f._freechatDuration=d}catch(err){appToast("Não foi possível verificar a duração do vídeo.","error");clearPostMedia();return}
 }
 selectedPostMedia=f;renderPostMediaPreview(f);
});

function updateCallParticipantCount(){
 const n=Math.max(people?.size||0,document.querySelectorAll("#videos .tile").length);
 $("callParticipantCount")?.replaceChildren(document.createTextNode(String(n)));
 $("callEmptyState")?.classList.toggle("hidden",n>0);
}
function openCallPanel(kind="participants"){
 const panel=$("callSidePanel");if(!panel)return;
 panel.classList.remove("hidden");
 const title=$("callPanelTitle"),content=$("callPanelContent");if(!title||!content)return;
 if(kind==="chat"){
   title.textContent="Chat da call";
   content.innerHTML=`<div class="call-chat-list" id="callChatList">${callChatHistory.map(m=>`<div><b>${messageEscape(m.name)}</b><span>${messageEscape(m.text)}</span><small>${messageEscape(m.time||"")}</small></div>`).join("")}</div><form id="callChatForm" class="call-chat-form"><input id="callChatInput" maxlength="1000" placeholder="Mensagem para a call..."><button>➤</button></form>`;
   const list=$("callChatList");if(list)list.scrollTop=list.scrollHeight;
   $("callChatForm")?.addEventListener("submit",e=>{e.preventDefault();const v=$("callChatInput").value.trim();if(v&&socket?.connected){socket.emit("chat",{room,text:v});$("callChatInput").value="";$("callChatInput").focus()}});
 }else{
   title.textContent="Participantes • "+(people?.size||0);
   content.innerHTML=[...people.values()].map(u=>`<div class="call-person-row"><span class="call-person-avatar">${messageEscape((u.name||"?").charAt(0).toUpperCase())}</span><div><b>${messageEscape(u.name||"Participante")}</b><small>${u.id===socket?.id?"Você":(u.id===callHostId?"Criador da call":"Participante")}</small></div><span class="call-person-state">${u.id===callHostId?"👑":"🎙️"}</span></div>`).join("")||'<div class="muted">Nenhum participante.</div>';
 }
}
function closeCallPanel(){$("callSidePanel")?.classList.add("hidden")}
function setCallPanelFromChat(){openCallPanel("chat")}
$("callParticipantsBtn")?.addEventListener("click",()=>openCallPanel("participants"));
$("callParticipantsBtnBottom")?.addEventListener("click",()=>openCallPanel("participants"));
$("callChatBtn")?.addEventListener("click",setCallPanelFromChat);
$("callChatBtnBottom")?.addEventListener("click",setCallPanelFromChat);
$("callPanelClose")?.addEventListener("click",closeCallPanel);
$("callSettingsBtn")?.addEventListener("click",()=>{$("callSettingsPanel")?.classList.toggle("hidden");closeCallPanel()});
$("callSettingsClose")?.addEventListener("click",()=>$("callSettingsPanel")?.classList.add("hidden"));
$("callVolumeBtn")?.addEventListener("click",toggleCallVolume);
$("callMusicBtn")?.addEventListener("click",()=>{$("callMusicPanel")?.classList.toggle("hidden");$("callMusicSearch")?.focus()});
$("callMusicClose")?.addEventListener("click",()=>$("callMusicPanel")?.classList.add("hidden"));
$("musicLocalVolume")?.addEventListener("input",e=>setLocalMusicVolume(e.target.value));
$("musicLocalMute")?.addEventListener("click",toggleLocalMusicMute);
renderLocalMusicVolume();
$("callMusicSearchBtn")?.addEventListener("click",async()=>{
 const q=$("callMusicSearch")?.value.trim();if(!q)return;
 try{const d=await api("/api/music/search?q="+encodeURIComponent(q));const box=$("callMusicResults");box.innerHTML=(d.tracks||[]).map(t=>`<button class="music-result" type="button" data-track="${messageEscape(JSON.stringify(t))}"><b>${messageEscape(t.title)}</b><small>${messageEscape(t.artist)}</small></button>`).join("")||'<span class="muted">Nenhum resultado.</span>';
 box.querySelectorAll("[data-track]").forEach(b=>b.onclick=()=>{try{socket.emit("music-play",{room,track:JSON.parse(b.dataset.track)})}catch(e){}$("callMusicPanel")?.classList.add("hidden")});
 }catch(e){appToast(e.message,"error")}
});
$("callSettingsPanel")?.addEventListener("change",e=>{if(e.target.id==="reduceCallMotion")document.documentElement.classList.toggle("reduce-call-motion",e.target.checked)});

function updateCallQualityUI(q){
 const ping=q?.rtt!=null?Math.round(q.rtt)+" ms":"-- ms",fps=q?.fps!=null?Math.round(q.fps)+" fps":"-- fps";
 $("callStatsMini")?.replaceChildren(document.createTextNode(ping+" • "+fps));
 $("callPingValue")?.replaceChildren(document.createTextNode(ping));
 $("callFpsValue")?.replaceChildren(document.createTextNode(fps));
 $("callResValue")?.replaceChildren(document.createTextNode(q?.width&&q?.height?`${q.width}×${q.height}`:"--"));
 $("callLossValue")?.replaceChildren(document.createTextNode(q?.loss!=null?`${q.loss.toFixed(1)}%`:"--"));
 const quality=q?.rtt>400||q?.loss>8?"Instável":q?.rtt>220||q?.loss>3?"Boa":"Excelente";
 $("callQualityText")?.replaceChildren(document.createTextNode(quality));
 const qel=$("callQualityText");if(qel)qel.className=quality==="Instável"?"quality-bad":quality==="Boa"?"quality-good":"quality-best";
}
async function collectCallStats(){
 if(!inCall||!peers?.size)return;
 let best=null;
 for(const pc of peers.values()){
   try{
     const stats=await pc.getStats();let rtt=null,loss=null,width=null,height=null,fps=null;
     stats.forEach(s=>{
       if(s.type==="candidate-pair"&&s.state==="succeeded"&&s.currentRoundTripTime!=null)rtt=Math.min(rtt==null?999:rtt,Number(s.currentRoundTripTime)*1000);
       if(s.type==="inbound-rtp"&&s.kind==="video"){width=Number(s.frameWidth||width||0);height=Number(s.frameHeight||height||0);fps=Number(s.framesPerSecond||fps||0);const total=Number(s.packetsReceived||0)+Number(s.packetsLost||0);if(total)loss=(Number(s.packetsLost||0)/total)*100;}
     });
     const cur={rtt,loss,width,height,fps};if(!best||((rtt??999)+(loss??99)*20)<((best.rtt??999)+(best.loss??99)*20))best=cur;
   }catch(e){}
 }
 updateCallQualityUI(best||{});
}
function startCallStats(){clearInterval(callStatsTimer);callStatsTimer=setInterval(collectCallStats,2200);collectCallStats()}
function stopCallStats(){clearInterval(callStatsTimer);callStatsTimer=null;updateCallQualityUI({})}

const originalAddVideo=addVideo;
addVideo=function(n,s,id){
 originalAddVideo(n,s,id);updateCallParticipantCount();
 const tile=document.querySelector(`[data-id="${CSS.escape(id)}"]`);if(!tile)return;
 tile.classList.add("neon-tile");
 if(id==="local")tile.classList.add("local-tile");
 let badge=tile.querySelector(".tile-status");if(!badge){badge=document.createElement("div");badge.className="tile-status";tile.appendChild(badge)}
 badge.textContent=id==="local"?"Você":(n||"Participante");
};
const originalRemoveVideo=removeVideo;
removeVideo=function(id){originalRemoveVideo(id);updateCallParticipantCount();};
const originalRenderPeople=renderPeople;
renderPeople=function(){originalRenderPeople();updateCallParticipantCount();if(!$("callSidePanel")?.classList.contains("hidden"))openCallPanel("participants")};

const originalOpenCall=openCall;
openCall=async function(){
 await originalOpenCall();
 if(inCall){$("callRoomLabel")?.replaceChildren(document.createTextNode("# "+room));startCallStats();updateCallParticipantCount();applyCallVolumeState();}else{applyCallVolumeState();}
};
const originalLeaveCall=leaveCall;
leaveCall=function(ending){stopCallStats();closeCallPanel();$("callMusicPanel")?.classList.add("hidden");$("callSettingsPanel")?.classList.add("hidden");originalLeaveCall(ending);updateCallParticipantCount()};

const oldChatHandlerMarker="__freechat25chat";
if(!window[oldChatHandlerMarker]){
 window[oldChatHandlerMarker]=true;
 const oldAddMessage=addMessage;
 // Capture lobby messages in a lightweight call-side history without changing the main chat.
 socket?.on?.("chat",m=>{callChatHistory.push(m);if(callChatHistory.length>80)callChatHistory.shift();if(!$("callSidePanel")?.classList.contains("hidden")&&$("callPanelTitle")?.textContent==="Chat da call")openCallPanel("chat")});
}

/* FreeChat 2.5.1 — Social, notificações e PWA */
let socialLoaded=false;
function openSocial(tab="feed"){const panel=$("socialPanel");if(!panel)return;panel.classList.remove("hidden");panel.classList.remove("feed-mode");switchSocialTab(tab);if(tab==="feed")loadFeed();if(tab==="friends")window.renderFriends?.();if(tab==="notifications")loadNotifications();if(tab==="profile")loadProfile();}
function openFeed(){const panel=$("socialPanel");if(!panel)return;panel.classList.remove("hidden");panel.classList.add("feed-mode");switchSocialTab("feed");loadFeed();document.body.classList.add("feed-open","feed-page-open");}
function closeSocialPanel(){$("socialPanel")?.classList.add("hidden");$("socialPanel")?.classList.remove("feed-mode");document.body.classList.remove("feed-open","feed-page-open");}
function switchSocialTab(tab){document.querySelectorAll(".social-tab").forEach(b=>b.classList.toggle("active",b.dataset.socialTab===tab));["feed","friends","notifications","profile"].forEach(x=>$("social"+x.charAt(0).toUpperCase()+x.slice(1))?.classList.toggle("hidden",x!==tab));}
async function loadFeed(){try{
 const d=await api("/api/feed");const list=$("feedList");if(!list)return;
 if(!d.posts?.length){list.innerHTML='<div class="social-empty">📰<b>Seu feed está vazio</b><span>Publique texto, fotos ou vídeos de até 1 minuto.</span></div>';return}
 list.innerHTML=d.posts.map(p=>{
   const safe=messageEscape(p.body||"");const initial=messageEscape((p.name||"?").trim().charAt(0).toUpperCase());
   const date=new Date(p.created_at).toLocaleString([],{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
   let media="";
   if(p.media?.id){
     const src=mediaUrl(p.media);
     if(p.media.type==="image") media=`<div class="post-media"><a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="${messageEscape(p.media.name||"Foto")}" loading="lazy"></a></div>`;
     else media=`<div class="post-media"><video controls playsinline preload="metadata" src="${src}"></video><small>🎬 ${Math.round(p.media.duration||0)}s</small></div>`;
   }
   return `<article class="post-card"><div class="post-head"><div class="post-avatar">${initial}</div><div><b>${messageEscape(p.name)}</b><small>${messageEscape(p.code)} · ${date}</small></div></div>${safe?`<div class="post-body">${safe.replace(/\n/g,"<br>")}</div>`:""}${media}<button class="post-like ${p.liked?"liked":""}" data-like="${p.id}">❤️ <span>${Number(p.likes||0)}</span></button></article>`;
 }).join("");
 list.querySelectorAll("[data-like]").forEach(b=>b.onclick=async()=>{try{const d=await api("/api/feed/"+b.dataset.like+"/like",{method:"POST"});b.classList.toggle("liked",d.liked);b.querySelector("span").textContent=d.likes}catch(e){appToast(e.message,"error")}})
}catch(e){appToast(e.message,"error")}}
async function loadNotifications(){try{const d=await api("/api/notifications");const list=$("notificationList"),badge=$("notificationBadge");if(badge){badge.textContent=d.unread||0;badge.classList.toggle("hidden",!d.unread)}if(!list)return;if(!d.notifications?.length){list.innerHTML='<div class="social-empty">🔔<b>Nenhuma notificação</b><span>Quando algo acontecer, aparecerá aqui.</span></div>';return}list.innerHTML=d.notifications.map(n=>`<div class="notification-item ${n.read_at?"":"unread"}"><span class="notification-icon">${n.type==="message"?"💬":n.type==="friend"?"👥":"✨"}</span><div><b>${messageEscape(n.title)}</b><p>${messageEscape(n.body||"")}</p><small>${new Date(n.created_at).toLocaleString([],{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</small></div></div>`).join("")}catch(e){}}
async function loadProfile(){try{const d=await api("/api/me");const u=d.user||{};$('profileName').textContent=u.name||"Usuário";$('profileCode').textContent=u.code||"";$('profileNameInput').value=u.name||"";$('profileAvatar').textContent=(u.name||"?").trim().charAt(0).toUpperCase()}catch(e){}}
async function saveProfile(){const input=$("profileNameInput"),name=input?.value.trim();if(!name)return;try{const d=await api("/api/me",{method:"PATCH",body:JSON.stringify({name})});window.CONVERSA_USER={...window.CONVERSA_USER,...d.user};localStorage.setItem("conversaLiveUser",JSON.stringify(window.CONVERSA_USER));$("welcomeName").textContent=d.user.name;$("me").textContent=d.user.name;appToast("Perfil atualizado!","success");loadProfile();renderFriends()}catch(e){$("profileStatus").textContent=e.message||"Erro ao salvar."}}
function handleNewNotification(n){playFriendNotificationSound?.();appToast(n?.title||"Nova notificação","info");loadNotifications();}window.openSocial=openSocial;
$("socialBtn")?.addEventListener("click",()=>openSocial("feed"));$("feedBtn")?.addEventListener("click",openFeed);$("socialClose")?.addEventListener("click",closeSocialPanel);$("saveProfileBtn")?.addEventListener("click",saveProfile);$("socialRefreshFriends")?.addEventListener("click",()=>renderFriends());$("socialFriendsSearch")?.addEventListener("input",e=>{window.friendSearchTerm=e.target.value;renderFriends()});$("postBody")?.addEventListener("input",e=>$("postCount").textContent=e.target.value.length+"/1000");document.querySelectorAll(".social-tab").forEach(b=>b.addEventListener("click",()=>{$("socialPanel")?.classList.remove("feed-mode");switchSocialTab(b.dataset.socialTab);const t=b.dataset.socialTab;if(t==="feed")loadFeed();if(t==="friends")renderFriends();if(t==="notifications")loadNotifications();if(t==="profile")loadProfile()}));$("postForm")?.addEventListener("submit",async e=>{
 e.preventDefault();
 const body=$("postBody").value.trim(),file=$("postMedia")?.files?.[0];
 if(!body&&!file){appToast("Escreva algo ou escolha uma foto/vídeo.","error");return}
 const btn=e.currentTarget.querySelector("button[type=submit]");btn.disabled=true;
 try{
   if(file){
     let duration=0;
     if(file.type.startsWith("video/"))duration=await getVideoDuration(file);
     const fd=new FormData();if(body)fd.append("body",body);fd.append("file",file);if(duration)fd.append("duration",String(duration));
     await api("/api/feed/media",{method:"POST",body:fd});
   }else await api("/api/feed",{method:"POST",body:JSON.stringify({body})});
   $("postBody").value="";$("postCount").textContent="0/1000";clearPostMedia();await loadFeed();
 }catch(err){appToast(err.message,"error")}
 finally{btn.disabled=false}
});
$("markNotificationsRead")?.addEventListener("click",async()=>{try{await api("/api/notifications/read",{method:"POST"});loadNotifications()}catch(e){}});async function openCall(){
  if(inCall||joiningCall)return;
  const attempt=++callAttempt;
  if(!socket?.connected){
    $("callStatus").textContent="Conectando ao servidor...";
    addSystem("Aguarde a conexão com o servidor.");
    return;
  }

  joiningCall=true;
  $("call").classList.remove("hidden");
  $("app").classList.add("call-open");
  if(isMobileLayout())setMobileView(0);
  setCallStatus("Entrando na call... 🎧");

  if(!navigator.mediaDevices?.getUserMedia){
    joiningCall=false;
    $("callStatus").textContent="Câmera/microfone indisponíveis. Use o site em HTTPS.";
    $("call").classList.add("hidden");
    $("app").classList.remove("call-open");
    return;
  }

  let stream=null;
  let mediaWarning="";
  try{
    try{
      stream=await withTimeout(navigator.mediaDevices.getUserMedia({
        audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1},
        video:{width:{ideal:640,max:1280},height:{ideal:360,max:720},frameRate:{ideal:24,max:30}}
      }),8000);
    }catch(e){
      try{
        stream=await withTimeout(navigator.mediaDevices.getUserMedia({audio:true}),6000);
        mediaWarning="Câmera indisponível; entrando somente com áudio.";
      }catch(e2){
        // Não deixa a entrada da call travada se o navegador não liberar mídia.
        // Entramos sem mídia e permitimos tentar novamente pelos botões.
        stream=new MediaStream();
        mediaWarning=(e2?.name==="NotAllowedError")
          ? "Permissão de microfone/câmera negada. Você entrou sem mídia."
          : "Não foi possível acessar microfone/câmera. Você entrou sem mídia.";
      }
    }
  }catch(e){
    stream=new MediaStream();
    mediaWarning="Você entrou sem câmera/microfone. Tente ativá-los pelos controles da call.";
  }

  if(attempt!==callAttempt||!joiningCall){
    try{stream?.getTracks?.().forEach(t=>t.stop())}catch(e){}
    return;
  }

  localStream=stream;
  // A successful getUserMedia call can still return disabled tracks after a previous call.
  localStream.getTracks().forEach(t=>{t.enabled=true});
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
  const b=$("cam");if(b){b.innerHTML=`<span class="control-icon">${camOn?"📷":"🚫"}</span><span>${camOn?"Câmera":"Câmera off"}</span>`;b.classList.toggle("muted",!camOn);}
  addVideo("Você",localStream,"local");
  startMicMeter();

  // Só agora consideramos que a pessoa realmente entrou na call.
  inCall=true;
  joiningCall=false;
  if(isMobileLayout())setMobileView(0);
  setCallStatus(mediaWarning||"Conectando à chamada...");

  // O servidor decide quem é o criador. Mesmo que o cliente ainda não saiba
  // o host, call-start retorna o host atual. Isso evita eleger a própria pessoa
  // por engano quando ela entra em uma call existente.
  callReady=true;
  setCallStatus("Conectando à chamada...", "warn");

  // O servidor confirma explicitamente que a entrada na call foi registrada.
  // Isso evita ficar preso no estado "Entrando na call..." quando o evento
  // call-host chega depois ou há uma reconexão do Socket.IO.
  if(attempt!==callAttempt||!inCall||!socket?.connected)return;
  socket.emit("call-start",{room},(ack)=>{
    if(!inCall)return;
    if(ack?.ok){
      callHostId=ack.host||callHostId;
      setCallStatus(isHost()?"Você é o criador da call. 🎙️📷":"Conectado à call. Aguardando os outros participantes...", "ok");
      socket.emit("call-ready",{room});
      if(isHost())requestReadyPeers();
    }else{
      setCallStatus("Não foi possível entrar na call. Tente novamente.","error");
    }
  });

  // Fallback para servidores/reconexões que não retornem acknowledgement.
  setTimeout(()=>{
    if(!inCall||attempt!==callAttempt)return;
    if(callHostId){
      setCallStatus(isHost()?"Você é o criador da call. 🎙️📷":"Conectado à call. Aguardando os outros participantes...", "ok");
      if(isHost())requestReadyPeers();
    }else if(socket?.connected){
      setCallStatus("Call ativa. Aguardando participantes...", "ok");
      socket.emit("call-ready",{room});
    }
  },1500);
}
function requestReadyPeers(){
  if(socket?.connected)socket.emit("call-ready-request",{room});
}

async function createPeer(id,initiator){
  if(peers.has(id)||!localStream||!socket?.connected)return peers.get(id);

  const pc=new RTCPeerConnection(ICE);
  pc.pendingIce=[];
  peers.set(id,pc);

  const earlyIce=pendingRemoteIce.get(id)||[];
  pendingRemoteIce.delete(id);
  if(earlyIce.length)pc.pendingIce.push(...earlyIce);

  // Use the standard addTrack path. It creates the correct sendrecv
  // transceivers for both microphone and camera and is less error-prone than
  // manually constructing transceivers for each track.
  for(const track of localStream.getTracks()){
    try{pc.addTrack(track,localStream)}catch(e){console.warn("addTrack",id,track.kind,e)}
  }

  // Prefer Opus for voice when the browser exposes codec capabilities.
  try{
    const caps=RTCRtpSender.getCapabilities?.("audio");
    if(caps?.codecs){
      const opus=caps.codecs.filter(c=>/opus/i.test(c.mimeType));
      const rest=caps.codecs.filter(c=>!opus.includes(c));
      pc.getTransceivers().filter(t=>t.sender?.track?.kind==="audio").forEach(t=>{
        try{t.setCodecPreferences([...opus,...rest])}catch(e){}
      });
    }
  }catch(e){}

  pc.onicecandidate=e=>{
    if(e.candidate)socket.emit("signal",{to:id,data:{type:"ice",candidate:e.candidate}});
  };
  pc.onicecandidateerror=e=>{
    if(e?.errorCode&&e.errorCode!==701)console.warn("WebRTC ICE candidate error",id,e.errorCode,e.url||"");
  };

  pc.ontrack=e=>{
    const track=e.track;
    if(!track)return;
    track.enabled=true;

    let stream=e.streams?.[0];
    if(!stream){stream=new MediaStream([track]);}

    const u=people.get(id);
    // Always make sure the remote tile exists. Video is rendered muted and
    // audio is rendered by a dedicated <audio> element so browser autoplay
    // policies cannot interfere with the remote video element's media track.
    addVideo(u?.name||"Participante",stream,id);
    const tile=document.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if(!tile)return;

    const video=tile.querySelector("video");
    if(video)video.muted=true;

    if(track.kind==="audio"){
      let audio=remoteAudioEls.get(id);
      if(!audio){
        audio=document.createElement("audio");
        audio.className="remote-call-audio";
        audio.autoplay=true;
        audio.playsInline=true;
        audio.setAttribute("aria-label","Áudio de "+(u?.name||"participante"));
        document.body.appendChild(audio);
        remoteAudioEls.set(id,audio);
      }
      audio.srcObject=new MediaStream([track]);
      audio.muted=callVolumeMuted;
      audio.volume=callVolumeMuted?0:callVolumeLevel;
      const play=audio.play();
      if(play?.catch)play.catch(()=>{
        showAudioButton(tile,audio);
        $("audioUnlock")?.classList.remove("hidden");
      });
      setCallStatus("Áudio remoto recebido. 🎧","ok");
    }else if(track.kind==="video"){
      if(video){
        // If the browser supplied separate streams for audio/video, keep the
        // video element bound to the video stream only.
        video.srcObject=new MediaStream([track]);
        video.muted=true;
        video.autoplay=true;
        video.playsInline=true;
        video.play().catch(()=>{});
      }
    }
  };

  pc.onconnectionstatechange=()=>{
    const st=pc.connectionState;
    if(st==="connected"){
      setCallStatus("Call conectada. 🎉 Áudio e vídeo conectados.","ok");
      startCallStats();
    }else if(st==="disconnected"){
      setCallStatus("Conexão interrompida — tentando recuperar...","warn");
    }else if(st==="failed"){
      setCallStatus("Falha na conexão WebRTC. Tentando reconectar...","error");
      try{
        if(pc.restartIce)pc.restartIce();
        if(initiator) setTimeout(async()=>{
          if(!peers.has(id)||pc.signalingState==="closed")return;
          try{
            const offer=await pc.createOffer({iceRestart:true});
            await pc.setLocalDescription(offer);
            socket.emit("signal",{to:id,data:{type:"offer",sdp:pc.localDescription}});
          }catch(e){console.warn("ICE restart",e)}
        },300);
      }catch(e){}
    }
    if(st==="closed")closePeer(id);
  };

  pc.oniceconnectionstatechange=()=>{
    const st=pc.iceConnectionState;
    if(st==="connected"||st==="completed")setCallStatus("Conexão WebRTC estabelecida. 🎧📷","ok");
    if(st==="failed"&&initiator){
      try{pc.restartIce?.()}catch(e){}
    }
  };

  if(initiator){
    const offer=await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("signal",{to:id,data:{type:"offer",sdp:pc.localDescription}});
  }
  return pc;
}

async function handleSignal(m){
  if(!inCall)return;
  const id=m.from,d=m.data;
  if(!id||!d)return;

  try{
    if(d.type==="offer"){
      let pc=peers.get(id);
      if(!pc)pc=await createPeer(id,false);
      if(!pc)return;
      // If an old offer arrives while negotiating, replace the stale peer and
      // answer the newest offer instead of silently dropping it.
      if(pc.signalingState!=="stable"&&pc.signalingState!=="have-remote-offer"){
        try{pc.close()}catch(e){}
        peers.delete(id);
        pc=await createPeer(id,false);
        if(!pc)return;
      }
      await pc.setRemoteDescription(new RTCSessionDescription(d.sdp));
      for(const c of pc.pendingIce.splice(0))await pc.addIceCandidate(c).catch(()=>{});
      const answer=await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("signal",{to:id,data:{type:"answer",sdp:pc.localDescription}});
    }else if(d.type==="answer"){
      const pc=peers.get(id);
      if(pc&&pc.signalingState==="have-local-offer"){
        await pc.setRemoteDescription(new RTCSessionDescription(d.sdp));
        for(const c of pc.pendingIce.splice(0))await pc.addIceCandidate(c).catch(()=>{});
      }
    }else if(d.type==="ice"){
      const pc=peers.get(id);
      if(pc){
        if(pc.remoteDescription)await pc.addIceCandidate(d.candidate).catch(()=>{});
        else pc.pendingIce.push(d.candidate);
      }else{
        const q=pendingRemoteIce.get(id)||[];
        q.push(d.candidate);
        if(q.length>100)q.shift();
        pendingRemoteIce.set(id,q);
      }
    }
  }catch(err){
    console.error("WebRTC signal error",id,d.type,err);
    setCallStatus("Erro na negociação da call. Tentando novamente...","error");
  }
}

function closePeer(id){
  pendingRemoteIce.delete(id);
  const pc=peers.get(id);
  if(pc){try{pc.close();}catch(e){}peers.delete(id);}
  const audio=remoteAudioEls.get(id);
  if(audio){try{audio.pause()}catch(e){}try{audio.srcObject=null}catch(e){}audio.remove();remoteAudioEls.delete(id);}
  removeVideo(id);
}
function applyCallVolumeState(){
 localStorage.setItem("freechatCallVolumeLevel",String(Math.round(callVolumeLevel*100)));
 document.querySelectorAll("#videos .tile video").forEach(v=>{if(v.closest(".local-tile")||v.dataset.local==="1")return;v.muted=true;}); remoteAudioEls.forEach(v=>{v.muted=callVolumeMuted;v.volume=callVolumeLevel;});
 const b=$("callVolumeBtn");if(b){b.classList.toggle("muted",callVolumeMuted);const i=b.querySelector(".control-icon");if(i)i.textContent=callVolumeMuted?"🔇":"🔊";const t=b.querySelector("span:not(.control-icon)");if(t)t.textContent=callVolumeMuted?"Sem som":"Volume";}
}
function toggleCallVolume(){callVolumeMuted=!callVolumeMuted;localStorage.setItem("freechatCallVolumeMuted",callVolumeMuted?"1":"0");applyCallVolumeState();}
function addVideo(n,s,id){
  let tile=document.querySelector(`[data-id="${CSS.escape(id)}"]`);
  let v=tile?.querySelector("video");
  if(!tile){
    tile=document.createElement("div");
    tile.className="tile"+(id==="local"?" local-tile":"");
    tile.dataset.id=id;
    v=document.createElement("video");
    const label=document.createElement("span");
    label.className="video-label";
    label.textContent=n;
    tile.append(v,label);
    tile.addEventListener("click",e=>{
      if(e.target?.closest?.("button"))return;
      enterOrExitTileFocus(tile);
    });
    $("videos").appendChild(tile);
  }
  const u=people.get(id);
  const label=tile.querySelector(".video-label");
  if(label)label.textContent=(n||u?.name||"Participante")+(id==="local" && micOn && !forcedMuted ? " • 🎙️" : "");
  v.autoplay=true;
  v.playsInline=true;
  v.muted=id==="local";
  v.dataset.local=id==="local"?"1":"0";
  v.volume=1;
  if(v.srcObject!==s)v.srcObject=s;
  const tryPlay=()=>{
    if(id!=="local"){v.muted=callVolumeMuted;v.volume=callVolumeLevel;}
    else v.muted=true;
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
function enterOrExitTileFocus(tile){
  const isFs=document.fullscreenElement===tile||document.webkitFullscreenElement===tile;
  if(isFs){
    if(document.exitFullscreen)document.exitFullscreen().catch(()=>{});
    else if(document.webkitExitFullscreen)document.webkitExitFullscreen();
    return;
  }
  if(tile.requestFullscreen){
    tile.requestFullscreen().catch(()=>fallbackTileFocus(tile));
    return;
  }
  const video=tile.querySelector("video");

  video?.setAttribute("playsinline","");
  video?.setAttribute("autoplay","");
  if(video.dataset.local==="1"){video.muted=true;video.volume=0;video.play().catch(()=>{});}
  else{video.muted=true;video.play().catch(()=>{});}
  applyCallVolumeState();
}
function fallbackTileFocus(tile){
  const wasFocused=tile.classList.contains("tile-focused");
  document.querySelectorAll("#videos .tile-focused").forEach(t=>t.classList.remove("tile-focused"));
  if(!wasFocused)tile.classList.add("tile-focused");
}
document.addEventListener("fullscreenchange",()=>{
  document.querySelectorAll("#videos .tile-focused").forEach(t=>t.classList.remove("tile-focused"));
});

async function refreshCallStats(){
 if(!inCall)return;
 let connected=0,inAudio=0,inVideo=0,outAudio=0,outVideo=0,relay=0;
 for(const pc of peers.values()){
  if(pc.connectionState==="connected")connected++;
  try{const rep=await pc.getStats();rep.forEach(x=>{if(x.type==="inbound-rtp"){if(x.kind==="audio")inAudio+=Number(x.packetsReceived||0);if(x.kind==="video")inVideo+=Number(x.packetsReceived||0)}if(x.type==="outbound-rtp"){if(x.kind==="audio")outAudio+=Number(x.packetsSent||0);if(x.kind==="video")outVideo+=Number(x.packetsSent||0)}if(x.type==="candidate-pair"&&x.state==="succeeded"&&x.localCandidateId){/* candidate type resolved below when available */}})}catch(e){}
 }
 const state=connected===peers.size&&peers.size?"Conectado":"Conectando";
 if($("callQualityText"))$("callQualityText").textContent=state+" • "+connected+" conexão(ões)";
 if($("callStatsMini"))$("callStatsMini").textContent=(lastRtt==null?"--":Math.round(lastRtt))+" ms • "+inVideo+" pacotes vídeo";
 if($("callLossValue"))$("callLossValue").textContent=(inAudio+inVideo+outAudio+outVideo?"Ativo":"Sem tráfego");
}
function startCallStats(){clearInterval(callStatsTimer);refreshCallStats();callStatsTimer=setInterval(refreshCallStats,2500)}
function leaveCall(ending){
  clearInterval(callStatsTimer);callStatsTimer=null;
  ++callAttempt;
  const wasHost=isHost();
  if(ending&&wasHost&&socket)socket.emit("call-end",{room});
  if(socket?.connected)socket.emit("call-leave",{room});
  inCall=false;callReady=false;joiningCall=false;
  peers.forEach(pc=>{try{pc.close();}catch(e){}});
  peers.clear();
  $("videos").innerHTML="";
  if(screenTrack){try{screenTrack.stop();}catch(e){}screenTrack=null;}
  updateScreenButton();
  stopMusic();
  if(musicAudioContext){try{musicAudioContext.close()}catch(e){}musicAudioContext=null;musicDestination=null;musicGainNode=null;}
  if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null;}
  stopMicMeter();
  $("call").classList.add("hidden");
  $("app").classList.remove("call-open","mobile-view-call","mobile-view-chat","mobile-view-social");
  $("mobileNav")?.classList.add("hidden");
  mobileView=0;
  $("callStatus").textContent="Pronto.";
  forcedMuted=false;
  if(wasHost)callHostId=null;
  renderPeople();
}

function updateScreenButton(){
  const btn=$("screen");if(!btn)return;
  if(screenTrack){btn.innerHTML='🛑 <span>Parar tela</span>';btn.classList.add("active-share");btn.title="Parar de transmitir a tela";}
  else{btn.innerHTML='🖥️ <span>Tela</span>';btn.classList.remove("active-share");btn.title="Compartilhar tela";}
}
function restoreCameraAfterScreenShare(){
  const cameraTrack=localStream?.getVideoTracks()[0];
  if(cameraTrack){
    peers.forEach(pc=>{
      const sender=pc.getSenders().find(x=>x.track?.kind==="video");
      if(sender)sender.replaceTrack(cameraTrack).catch(()=>{});
    });
    const localVideo=document.querySelector('[data-id="local"] video');
    if(localVideo){localVideo.srcObject=localStream;localVideo.play().catch(()=>{});}
  }
  document.querySelector('[data-id="local"]')?.classList.remove("sharing");
  screenTrack=null;
  updateScreenButton();
  $("callStatus").textContent="Câmera restaurada.";
}
function stopScreenSharing(){
  if(!screenTrack)return;
  try{screenTrack.stop();}catch(e){}
  restoreCameraAfterScreenShare();
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
  const b=$("cam");if(b){b.innerHTML=`<span class="control-icon">${camOn?"📷":"🚫"}</span><span>${camOn?"Câmera":"Câmera off"}</span>`;b.classList.toggle("muted",!camOn);}
};
$("screen").onclick=async()=>{
  if(screenTrack){stopScreenSharing();return;}
  if(!localStream){$("callStatus").textContent="Entre na call antes de compartilhar a tela.";return;}
  if(!navigator.mediaDevices?.getDisplayMedia){
    $("callStatus").textContent="Seu navegador não oferece compartilhamento de tela.";
    return;
  }
  try{
    const s=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
    const track=s.getVideoTracks()[0];
    screenTrack=track;
    updateScreenButton();
    document.querySelector('[data-id="local"]')?.classList.add("sharing");
    peers.forEach(async pc=>{
      const sender=pc.getSenders().find(x=>x.track?.kind==="video");
      if(sender)try{await sender.replaceTrack(track);}catch(e){}
    });
    const v=document.querySelector('[data-id="local"] video');
    if(v){v.srcObject=s;v.play().catch(()=>{});}
    $("callStatus").textContent="Transmitindo sua tela. 🖥️";
    track.onended=()=>{
      if(screenTrack!==track)return; // já foi trocada/parada por outra ação
      restoreCameraAfterScreenShare();
    };
  }catch(e){
    $("callStatus").textContent=e?.name==="NotAllowedError"?"Compartilhamento cancelado.":"Não foi possível compartilhar a tela.";
  }
};
function leaveChatRoom(){
  if(!room)return;
  if(inCall&&!confirm("Você está em uma call. Sair do chat também vai encerrar sua participação na call. Continuar?"))return;
  if(inCall)leaveCall(true);
  if(socket?.connected)socket.emit("leave-room",{room});
  room="";
  people.clear();renderPeople();
  $("videos").innerHTML="";
  $("messages").innerHTML='<div class="empty-chat" id="emptyChat"><div>💬</div><b>Comece a conversa</b><span>Envie uma mensagem para a sala.</span></div>';
  $("app").classList.add("hidden");$("socialPanel")?.classList.add("hidden");
  try{history.replaceState(null,"",location.pathname)}catch(e){}
  $("callMenu")?.classList.remove("hidden"); animateMainMenu();
  window.renderFriends?.();
}
$("leaveChat")?.addEventListener("click",leaveChatRoom);

document.addEventListener("keydown",e=>{
  if(e.key==="Escape")document.querySelectorAll("#videos .tile-focused").forEach(t=>t.classList.remove("tile-focused"));
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="e"){
    e.preventDefault();$("emoji").click();
  }
});

window.addEventListener("beforeunload",()=>{try{if(inCall&&socket?.connected)socket.emit("call-leave",{room});}catch(e){}});

/* FreeChat 2.5.1 — chat privado com fotos, vídeos e notificações */
let activeFriendCode=null, messageTimer=null, lastLoadedMessages=[], selectedMessageFile=null;
const messageEscape=s=>{const d=document.createElement("div");d.textContent=s??"";return d.innerHTML};
function mediaUrl(m){return serverUrl()+String(m?.url||("/api/messages/media/"+encodeURIComponent(m?.id||"")))}
function requestDesktopNotifications(){try{if("Notification" in window&&Notification.permission==="default")Notification.requestPermission().catch(()=>{})}catch(e){}}
function notifyIncomingMessage(name,message){
  window.playFriendNotificationSound?.();
  appToast((name||"Alguém")+" enviou uma mensagem 💬","info");
  try{if(document.hidden&&"Notification" in window&&Notification.permission==="granted"){const n=new Notification("Nova mensagem — Conversa Live",{body:message?.body||"Enviou uma foto ou vídeo",icon:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%236d5dfc'/%3E%3Cpath d='M17 19h30v22H29l-8 7v-7h-4z' fill='white'/%3E%3C/svg%3E"});n.onclick=()=>{window.focus();if(activeFriendCode)loadMessages(true);n.close()}}}catch(e){}
}
window.notifyIncomingMessage=notifyIncomingMessage;
function renderMessagesList(scroll=true){
 const list=$("messagesList");if(!list)return;
 const term=($("messagesSearch")?.value||"").trim().toLowerCase();
 const msgs=term?lastLoadedMessages.filter(m=>String(m.body||"").toLowerCase().includes(term)||String(m.media?.name||"").toLowerCase().includes(term)):lastLoadedMessages;
 if(msgs.length){
  list.innerHTML=msgs.map(m=>{
   const mine=String(m.sender_id)===String(window.CONVERSA_USER?.id);
   let media="";
   if(m.media?.id){
    const src=mediaUrl(m.media),name=messageEscape(m.media.name||"arquivo");
    if(m.media.type==="image") media=`<a class="dm-media-link" href="${src}" target="_blank" rel="noopener"><img class="dm-media-image" src="${src}" alt="${name}" loading="lazy"></a>`;
    else media=`<video class="dm-media-video" controls preload="metadata" playsinline src="${src}"></video><a class="dm-download" href="${src}" target="_blank" rel="noopener">▶ Abrir vídeo</a>`;
   }
   const body=m.body?`<div class="dm-body">${messageEscape(m.body)}</div>`:"";
   return `<div class="message-bubble ${mine?"mine":"theirs"}">${media}${body}<small>${formatMessageTime(m.created_at)}</small></div>`;
  }).join("");
 }else list.innerHTML=term?'<div class="muted">Nenhuma mensagem encontrada para "'+messageEscape(term)+'".</div>':'<div class="dm-empty"><div>💬</div><b>Conversa privada</b><span>Envie uma mensagem, foto ou vídeo.</span></div>';
 if(scroll)list.scrollTop=list.scrollHeight;
}
async function loadMessages(scroll=true){
 if(!activeFriendCode)return;
 try{const d=await api("/api/messages/"+encodeURIComponent(activeFriendCode));lastLoadedMessages=d.messages||[];renderMessagesList(scroll);$("messagesFriendState").textContent=d.friend?.online?"● Online":"Conversa privada";}
 catch(e){$("messageStatus").textContent=e.message||"Erro ao carregar mensagens."}
}
function formatMessageTime(v){const d=new Date(v);if(Number.isNaN(d.getTime()))return "";return d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
function setSelectedMessageFile(file){selectedMessageFile=file||null;const info=$("messageFileInfo");if(!info)return;if(!file){info.textContent="";info.classList.add("hidden");return}info.classList.remove("hidden");info.innerHTML=`<span>${file.type.startsWith("image/")?"🖼️":"🎬"} ${messageEscape(file.name)}</span><button type="button" id="messageFileClear" aria-label="Remover arquivo">×</button>`;$("messageFileClear").onclick=()=>setSelectedMessageFile(null)}
window.openMessages=function(friend){
 if(!friend?.code)return;requestDesktopNotifications();unreadCounts[friend.code]=0;activeFriendCode=friend.code;lastLoadedMessages=[];setSelectedMessageFile(null);
 $("messagesFriendName").textContent=friend.name||friend.code;$("messagesFriendAvatar").textContent=(friend.name||"?").trim().charAt(0).toUpperCase();$("messagesFriendState").textContent=friend.online?"● Online":"Conversa privada";$("messagesPanel").classList.remove("hidden");$("messageStatus").textContent="";if($("messagesSearch"))$("messagesSearch").value="";loadMessages(true);setTimeout(()=>$("messageInput")?.focus(),80);
};
$("messageAttach")?.addEventListener("click",()=>{$("messageFile")?.click()});
$("messageFile")?.addEventListener("change",async e=>{
 const f=e.target.files?.[0];if(!f)return;
 const ok=/^(image\/|video\/)/i.test(f.type);
 if(!ok){appToast("Escolha uma foto ou vídeo válido.","error");e.target.value="";return}
 if(f.size>20*1024*1024){appToast("O arquivo precisa ter no máximo 20 MB.","error");e.target.value="";return}
 if(f.type.startsWith("video/")){
   try{const duration=await getVideoDuration(f);if(duration>60.5){appToast("O vídeo precisa ter até 1 minuto.","error");e.target.value="";return}f._freechatDuration=duration}catch(err){appToast("Não foi possível verificar a duração do vídeo.","error");e.target.value="";return}
 }
 setSelectedMessageFile(f)
});
$("messageForm")?.addEventListener("submit",async e=>{
 e.preventDefault();const input=$("messageInput"),body=input.value.trim(),file=selectedMessageFile;if(!activeFriendCode||(!body&&!file))return;const btn=e.currentTarget.querySelector("button[type=submit]");btn.disabled=true;$("messageStatus").textContent=file?"Enviando arquivo...":"Enviando...";
 try{if(file){const fd=new FormData();fd.append("code",activeFriendCode);if(body)fd.append("body",body);fd.append("file",file);if(file._freechatDuration)fd.append("duration",String(file._freechatDuration));await api("/api/messages/media",{method:"POST",body:fd});$("messageFile").value="";setSelectedMessageFile(null)}else{await api("/api/messages",{method:"POST",body:JSON.stringify({code:activeFriendCode,body})})}input.value="";$("messageStatus").textContent="";await loadMessages(true)}catch(err){$("messageStatus").textContent=err.message||"Erro ao enviar."}finally{btn.disabled=false;input.focus()}
});
function closePrivateChat(){ $("messagesPanel")?.classList.add("hidden");activeFriendCode=null;setSelectedMessageFile(null);refreshUnreadCounts(); }
$("messagesClose")?.addEventListener("click",closePrivateChat);$("messagesBack")?.addEventListener("click",closePrivateChat);
$("messageInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("messageForm")?.requestSubmit()}});
messageTimer=setInterval(()=>{if(!window.CONVERSA_TOKEN)return;refreshUnreadCounts();if(activeFriendCode&&!$("messagesPanel")?.classList.contains("hidden"))loadMessages(false)},4000);
document.addEventListener("DOMContentLoaded",()=>{$("friendsSearch")?.addEventListener("input",e=>{window.friendSearchTerm=e.target.value;renderFriends()});$("friendsSearchApp")?.addEventListener("input",e=>{window.friendSearchTerm=e.target.value;renderFriends()});$("messagesSearch")?.addEventListener("input",()=>renderMessagesList(false))});

/* FreeChat 2.5.1 — estabilidade global, rede e mobile polish */
(function(){
  let offlineToast=null;
  function setNetworkState(online){
    document.documentElement.classList.toggle("is-offline",!online);
    if(online){
      if(offlineToast){offlineToast.remove();offlineToast=null;}
      if(window.CONVERSA_TOKEN && typeof connectLobby==="function" && (!socket || !socket.connected)){
        try{connectLobby()}catch(e){}
      }
    }else if(!offlineToast){
      offlineToast=document.createElement("div");
      offlineToast.className="network-banner";
      offlineToast.setAttribute("role","status");
      offlineToast.textContent="Você está offline. Algumas funções ficam pausadas até a conexão voltar.";
      document.body.appendChild(offlineToast);
    }
  }
  window.addEventListener("online",()=>setNetworkState(true));
  window.addEventListener("offline",()=>setNetworkState(false));
  setNetworkState(navigator.onLine);

  function syncViewportHeight(){
    const h=window.visualViewport?.height||window.innerHeight;
    document.documentElement.style.setProperty("--app-vh",`${h}px`);
  }
  syncViewportHeight();
  window.addEventListener("resize",syncViewportHeight,{passive:true});
  window.visualViewport?.addEventListener("resize",syncViewportHeight,{passive:true});

  const updateScrollLock=()=>{
    const modalOpen=[...document.querySelectorAll(".modal:not(.hidden)")].length>0;
    const mobileMenu=document.getElementById("callMenu");
    const authVisible=document.getElementById("login")&&!document.getElementById("login").classList.contains("hidden");
    document.body.classList.toggle("modal-open",modalOpen||authVisible);
  };
  const observer=new MutationObserver(updateScrollLock);
  observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:["class"]});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){document.querySelectorAll(".modal:not(.hidden)").forEach(m=>m.classList.add("hidden"));updateScrollLock()}});
  updateScrollLock();
})();

/* PWA */
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();window._installPrompt=e;let b=$("pwaInstallBtn");if(!b){b=document.createElement("button");b.id="pwaInstallBtn";b.className="pwa-install";b.textContent="📲 Instalar FreeChat";document.body.appendChild(b);b.onclick=async()=>{try{await window._installPrompt?.prompt();window._installPrompt=null;b.remove()}catch(e){}}}});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(r=>r.update()).catch(()=>{}));
