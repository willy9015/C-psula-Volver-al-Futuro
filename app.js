/* Cápsula Volver al Futuro — MVP
 * - Sin backend obligatorio (localStorage). Firebase opcional para nube + storage.
 * - Crear cápsula (texto + enlaces BYO). Con Firebase: subidas de archivos.
 * - Compartir: enlace + QR. Email/WhatsApp (mock de pago). ICS para calendario.
 * - Abrir: vista sellada con countdown → confeti y contenido.
 * - Lista local de cápsulas.
 */

(function(){
  const $ = (id)=>document.getElementById(id);
  const state = { firebaseReady:false, db:null, storage:null, myCaps:[] };

  // ---------- Init Firebase (optional) ----------
  try{
    if(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey){
      firebase.initializeApp(window.FIREBASE_CONFIG);
      state.db = firebase.database();
      state.storage = firebase.storage();
      state.firebaseReady = true;
      console.log("Firebase listo");
    }
  }catch(e){ console.warn("Firebase no disponible", e); }

  // ---------- Helpers ----------
  function uuid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
  function now(){ return Date.now(); }
  function fmtDate(ts){ return new Date(ts).toLocaleString(); }
  const cof = document.getElementById("cofreHero");
  let demoT = now()+ 90*1000;
  setInterval(()=>{ // hero demo countdown
    const d = Math.max(0, demoT - now());
    const s = Math.floor(d/1000), h = String(Math.floor(s/3600)).padStart(2,'0'),
      m = String(Math.floor((s%3600)/60)).padStart(2,'0'), ss = String(s%60).padStart(2,'0');
    document.getElementById("countHero").textContent = `${h}:${m}:${ss}`;
    if(d<=0) cof.classList.add("open");
  },1000);

  // Load my capsules
  function loadLocal(){
    try{ state.myCaps = JSON.parse(localStorage.getItem("cvf_capsules")||"[]"); }
    catch{ state.myCaps = []; }
  }
  function saveLocal(){
    localStorage.setItem("cvf_capsules", JSON.stringify(state.myCaps));
  }
  function addLocal(c){
    state.myCaps.unshift(c);
    saveLocal();
    renderList();
  }

  // ---------- Create Capsule ----------
  const pinWrap = $("pinWrap");
  $("capPrivacy").addEventListener("change", ()=>{
    pinWrap.classList.toggle("hidden", $("capPrivacy").value!=="private");
  });

  // Preview QR placeholder
  let qrPrev = null;
  function updateQRPreview(id="DEMO"){
    if(!qrPrev) qrPrev = new QRCode("qrPreview",{text:location.origin+location.pathname+"?id="+id,width:160,height:160});
    else { document.getElementById("qrPreview").innerHTML=""; qrPrev = new QRCode("qrPreview",{text:location.origin+location.pathname+"?id="+id,width:160,height:160}); }
  }
  updateQRPreview();

  // Upload to Firebase Storage if configured
  async function uploadFilesIfAny(id){
    const input = $("capUpload");
    const prog = $("uploadProg");
    if(!input.files || !input.files.length) return [];
    if(!state.storage){ alert("Configura Firebase Storage para subir archivos."); return []; }
    const urls = [];
    prog.classList.remove("hidden");
    for(let i=0;i<input.files.length;i++){
      const f = input.files[i];
      const path = `capsules/${id}/${Date.now()}_${f.name}`;
      const ref = state.storage.ref().child(path);
      await ref.put(f);
      const url = await ref.getDownloadURL();
      urls.push(url);
      prog.value = (i+1)/input.files.length*100;
    }
    prog.classList.add("hidden");
    return urls;
  }

  // Save capsule: local + optional Firebase
  async function createCapsule(){
    const title = $("capTitle").value.trim();
    const message = $("capMessage").value.trim();
    const openStr = $("capOpen").value;
    const privacy = $("capPrivacy").value;
    const allowResponses = $("capAllowResponses").checked;
    const pin = $("capPIN").value.trim();
    const linkStr = $("capLinks").value.trim();
    if(!title) return alert("Poné un título.");
    if(!openStr) return alert("Define fecha de apertura.");
    const openAt = new Date(openStr).getTime();
    if(!openAt || openAt < now()+30*1000) return alert("La fecha debe ser al menos 30 segundos en el futuro.");

    const id = uuid();
    const links = linkStr ? linkStr.split(",").map(s=>s.trim()).filter(Boolean) : [];
    const uploaded = await uploadFilesIfAny(id);
    const capsule = {
      id, title, message, openAt, privacy, allowResponses, pin: privacy==="private"?pin:"",
      links: links.concat(uploaded),
      createdAt: now()
    };

    // Local
    addLocal(capsule);
    // Cloud
    if(state.db){
      await state.db.ref("capsules/"+id).set(capsule);
    }

    // Share
    const link = getCapsuleLink(id);
    updateQRPreview(id);
    alert("Cápsula creada. Link copiado.");
    navigator.clipboard?.writeText(link);
    // Reset minimal
    $("capTitle").value = ""; $("capMessage").value=""; $("capLinks").value=""; $("capUpload").value="";
  }

  function getCapsuleLink(id){
    const base = location.href.split("?")[0].split("#")[0];
    return `${base}?id=${id}`;
  }

  $("btnCreate").addEventListener("click", createCapsule);

  // ICS
  $("btnICS").addEventListener("click", ()=>{
    const title = $("capTitle").value.trim() || "Apertura de cápsula";
    const openStr = $("capOpen").value;
    if(!openStr) return alert("Define fecha de apertura.");
    const dt = new Date(openStr);
    const dtUTC = dt.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CapsulaVolverAlFuturo//ES
BEGIN:VEVENT
UID:${uuid()}@cvf
DTSTAMP:${dtUTC}
DTSTART:${dtUTC}
SUMMARY:${title}
DESCRIPTION:Recordatorio de apertura de cápsula
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([ics], {type:"text/calendar"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "apertura_capsula.ics";
    a.click();
  });

  // Preview
  $("btnPreview").addEventListener("click", ()=>{
    const title = $("capTitle").value.trim() || "Cápsula";
    const openStr = $("capOpen").value;
    const openAt = openStr ? new Date(openStr).getTime() : now()+60000;
    openViewer({ id:"DEMO", title, message:$("capMessage").value, openAt, privacy:$("capPrivacy").value, pin:$("capPIN").value, links:($("capLinks").value||"").split(",").map(s=>s.trim()).filter(Boolean) });
  });

  // ---------- List & Viewer ----------
  function renderList(){
    const box = $("myList");
    box.innerHTML = "";
    if(!state.myCaps.length){
      box.innerHTML = "<div class='text-slate-600'>Aún no creaste cápsulas.</div>";
      return;
    }
    for(const c of state.myCaps){
      const link = getCapsuleLink(c.id);
      const el = document.createElement("div");
      el.className = "border rounded-2xl p-4";
      el.innerHTML = `
        <div class="text-sm text-slate-600">${c.privacy==="private"?"Privada":"Pública"} • abre ${fmtDate(c.openAt)}</div>
        <div class="font-bold text-lg">${c.title}</div>
        <div class="text-slate-700 line-clamp-2">${(c.message||"").slice(0,160)}</div>
        <div class="mt-2 flex flex-wrap gap-2 items-center">
          <a class="px-3 py-2 rounded-xl bg-indigo-700 text-white hover:bg-indigo-800" href="${link}">Abrir/Vista</a>
          <button data-id="${c.id}" class="btn-share px-3 py-2 rounded-xl bg-white border">Compartir</button>
          <button data-id="${c.id}" class="btn-embed px-3 py-2 rounded-xl bg-white border">Embed</button>
          <button data-id="${c.id}" class="btn-wa px-3 py-2 rounded-xl bg-emerald-600 text-white">WhatsApp ($1)</button>
          <button data-id="${c.id}" class="btn-mail px-3 py-2 rounded-xl bg-slate-800 text-white">Email ($1)</button>
        </div>
      `;
      box.appendChild(el);
    }

    // Bind actions
    box.querySelectorAll(".btn-share").forEach(b=>b.addEventListener("click", ()=>shareCapsule(b.getAttribute("data-id"))));
    box.querySelectorAll(".btn-embed").forEach(b=>b.addEventListener("click", ()=>embedSnippet(b.getAttribute("data-id"))));
    box.querySelectorAll(".btn-wa").forEach(b=>b.addEventListener("click", ()=>sendWhatsApp(b.getAttribute("data-id"))));
    box.querySelectorAll(".btn-mail").forEach(b=>b.addEventListener("click", ()=>sendEmail(b.getAttribute("data-id"))));
  }

  function shareCapsule(id){
    const link = getCapsuleLink(id);
    const dlg = `Link copiado.
${link}

El QR se puede generar desde la sección "Crear".`;
    navigator.clipboard?.writeText(link);
    alert(dlg);
  }
  function embedSnippet(id){
    const url = `embed.html?id=${id}`;
    const code = `<iframe src="${url}" width="100%" height="520" frameborder="0"></iframe>`;
    navigator.clipboard?.writeText(code);
    alert("Snippet copiado a portapapeles.");
  }

  function sendWhatsApp(id){
    // Mock de pago: mostramos aviso y generamos deeplink sin cobro real
    const link = getCapsuleLink(id);
    alert("Este envío premium cuesta USD 1 (demo). Se abrirá WhatsApp para que completes el contacto.");
    const text = encodeURIComponent("Te dejo esta cápsula para abrir en la fecha 🤫 " + link);
    location.href = "https://wa.me/?text=" + text;
  }
  function sendEmail(id){
    const link = getCapsuleLink(id);
    alert("Este envío premium cuesta USD 1 (demo). Se abrirá tu cliente de correo.");
    const sub = encodeURIComponent("Cápsula para abrir en el futuro");
    const body = encodeURIComponent("Hola! Te comparto esta cápsula para abrir en la fecha indicada:\n\n" + link);
    location.href = "mailto:?subject="+sub+"&body="+body;
  }

  // Viewer by query param
  function openViewer(c){
    const existing = document.getElementById("cvf_viewer");
    if(existing) existing.remove();
    const wrap = document.createElement("div");
    wrap.id = "cvf_viewer";
    wrap.className = "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50";
    wrap.innerHTML = `
      <div class="max-w-2xl w-full bg-white rounded-2xl p-6">
        <div class="text-sm text-slate-600">${c.privacy==="private"?"Privada":"Pública"} • Abre ${fmtDate(c.openAt)}</div>
        <div class="text-2xl font-bold mb-2">${c.title||"Cápsula"}</div>
        <div class="flex items-center justify-center my-4">
          <div id="cvfChest" class="cofre ${now()>=c.openAt?'open':''}"><div class="tapa"></div><div class="base"></div></div>
        </div>
        <div id="cvfCountdown" class="text-3xl font-black text-center mb-3"></div>
        <div id="cvfPINwrap" class="${c.privacy!=='private'?'hidden':''} mb-3">
          <input id="cvfPIN" class="w-full p-3 border rounded-xl" placeholder="PIN">
        </div>
        <div id="cvfContent" class="hidden">
          <div class="p-3 bg-slate-50 rounded-xl whitespace-pre-wrap">${c.message||""}</div>
          ${ (c.links||[]).map(u=>`<div class='mt-2'><a class='text-indigo-700 underline break-all' href='${u}' target='_blank'>Adjunto</a></div>`).join("") }
          ${ c.allowResponses?`<div class='mt-4'>
            <label class='text-sm font-semibold'>Responder (48h)</label>
            <textarea id='respTxt' class='w-full p-2 border rounded-xl' placeholder='Tu mensaje...'></textarea>
            <button id='respSend' class='mt-2 px-3 py-2 rounded-xl bg-slate-800 text-white'>Enviar</button>
          </div>`:"" }
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button id="cvfClose" class="px-3 py-2 rounded-xl bg-white border">Cerrar</button>
          ${ now()>=c.openAt?`<button id="cvfOpen" class="px-3 py-2 rounded-xl bg-indigo-700 text-white">Ver contenido</button>`:"" }
        </div>
      </div>`;
    document.body.appendChild(wrap);

    function tick(){
      const d = Math.max(0, c.openAt - now());
      const s = Math.floor(d/1000);
      const h = String(Math.floor(s/3600)).padStart(2,'0');
      const m = String(Math.floor((s%3600)/60)).padStart(2,'0');
      const ss = String(s%60).padStart(2,'0');
      $("cvfCountdown").textContent = d>0?`${h}:${m}:${ss}`:"00:00:00";
      if(d<=0){
        document.getElementById("cvfChest").classList.add("open");
        clearInterval(timer);
      }
    }
    const timer = setInterval(tick,1000); tick();

    $("cvfClose").onclick = ()=>wrap.remove();
    const openBtn = $("cvfOpen");
    if(openBtn) openBtn.onclick = ()=>{
      if(c.privacy==="private"){
        const pin = $("cvfPIN").value.trim();
        if(!pin || pin!==c.pin){ alert("PIN incorrecto"); return; }
      }
      $("cvfContent").classList.remove("hidden");
      confetti({ particleCount: 180, spread: 70, origin:{ y: .6 } });
    };

    // response mock (local only)
    if(c.allowResponses){
      const send = ()=>{
        const t = $("respTxt").value.trim(); if(!t) return;
        alert("Respuesta registrada (demo). En la versión con nube se guarda y exporta.");
        $("respTxt").value="";
      };
      const b = document.getElementById("respSend");
      if(b) b.onclick = send;
    }
  }

  // Handle query ?id= for viewer
  const params = new URLSearchParams(location.search);
  const qid = params.get("id");
  if(qid){
    // try cloud first
    if(state.db){
      state.db.ref("capsules/"+qid).get().then(snap=>{
        const c = snap.val();
        if(c) openViewer(c);
        else {
          // local fallback
          loadLocal();
          const lc = state.myCaps.find(x=>x.id===qid);
          openViewer(lc || { id:qid, title:"Cápsula", message:"", openAt: now()+60000, privacy:"public", links:[] });
        }
      });
    }else{
      loadLocal();
      const c = state.myCaps.find(x=>x.id===qid) || { id:qid, title:"Cápsula", message:"", openAt: now()+60000, privacy:"public", links:[] };
      openViewer(c);
    }
  }

  // Initial list
  loadLocal();
  renderList();
})();
