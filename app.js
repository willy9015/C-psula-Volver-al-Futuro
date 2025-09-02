// --- Utilidades ---
function uid() {
  return 'c_' + Math.random().toString(36).substr(2, 9);
}
function fmtDateInput(d) {
  return new Date(d).toISOString().slice(0,16);
}
function parseDateInput(v) {
  return new Date(v).getTime();
}

// --- Estado ---
let capsules = JSON.parse(localStorage.getItem("cvf_capsules") || "[]");

// --- Render Crear ---
function renderCreate() {
  const root = document.querySelector("main");
  root.innerHTML = `
    <section id="crear" class="card glass p-6 max-w-xl mx-auto">
      <h2 class="text-2xl font-bold mb-4">Crear nueva cápsula</h2>
      <label class="block mb-2 font-semibold">Título</label>
      <input id="capTitle" class="w-full p-2 border rounded-lg mb-4" placeholder="Ej: Mensaje de fin de curso">
      
      <label class="block mb-2 font-semibold">Mensaje</label>
      <textarea id="capMsg" rows="4" class="w-full p-2 border rounded-lg mb-4" placeholder="Escribe tu mensaje..."></textarea>
      
      <label class="block mb-2 font-semibold">Fecha de apertura</label>
      <input id="capDate" type="datetime-local" class="w-full p-2 border rounded-lg mb-4">
      
      <button id="saveBtn" class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">
        Guardar cápsula
      </button>
    </section>
  `;
  document.getElementById("capDate").value = fmtDateInput(Date.now() + 60000);
  document.getElementById("saveBtn").onclick = saveCapsule;
}

// --- Guardar cápsula ---
function saveCapsule() {
  const title = document.getElementById("capTitle").value.trim();
  const message = document.getElementById("capMsg").value.trim();
  const openAt = parseDateInput(document.getElementById("capDate").value);

  if (!title || !message || !openAt) {
    alert("Completa todos los campos.");
    return;
  }

  const capsule = { id: uid(), title, message, openAt, links: [] };
  capsules.push(capsule);
  localStorage.setItem("cvf_capsules", JSON.stringify(capsules));
  alert("✅ Cápsula guardada. Podés verla en 'Mis cápsulas'.");
  renderList();
}

// --- Render listado ---
function renderList() {
  const root = document.querySelector("main");
  if (capsules.length === 0) {
    root.innerHTML = `<p class="text-center text-slate-600">No tenés cápsulas guardadas.</p>`;
    return;
  }
  root.innerHTML = `
    <section id="mis" class="space-y-6">
      ${capsules.map(c => `
        <div class="card bg-white p-5">
          <h3 class="text-xl font-bold">${c.title}</h3>
          <p class="text-slate-600 mb-2">Abrir en: ${new Date(c.openAt).toLocaleString()}</p>
          <div id="qrcode-${c.id}" class="my-3"></div>
          <button onclick="openCapsule('${c.id}')" class="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
            Ver cápsula
          </button>
        </div>
      `).join("")}
    </section>
  `;
  // generar QR
  capsules.forEach(c => {
    new QRCode(document.getElementById("qrcode-" + c.id), {
      text: location.origin + location.pathname + "?id=" + c.id,
      width: 100, height: 100
    });
  });
}

// --- Abrir cápsula ---
function openCapsule(id) {
  const c = capsules.find(x => x.id === id);
  const now = Date.now();
  const root = document.querySelector("main");
  if (!c) { root.innerHTML = `<p>No encontrada</p>`; return; }

  if (now < c.openAt) {
    root.innerHTML = `
      <div class="card bg-white p-6 text-center">
        <h3 class="text-xl font-bold mb-2">${c.title}</h3>
        <p class="text-slate-600 mb-4">Todavía no está lista para abrir</p>
        <div class="text-3xl font-black text-indigo-700" id="countdown"></div>
      </div>
    `;
    tickCountdown(c.openAt);
  } else {
    root.innerHTML = `
      <div class="card bg-white p-6">
        <h3 class="text-2xl font-bold mb-4">${c.title}</h3>
        <p class="whitespace-pre-wrap text-slate-700">${c.message}</p>
      </div>
    `;
    confetti();
  }
}

// --- Countdown ---
function tickCountdown(openAt) {
  const el = document.getElementById("countdown");
  function update() {
    const diff = Math.max(0, openAt - Date.now());
    const s = Math.floor(diff/1000);
    const h = String(Math.floor(s/3600)).padStart(2,"0");
    const m = String(Math.floor((s%3600)/60)).padStart(2,"0");
    const ss = String(s%60).padStart(2,"0");
    el.textContent = `${h}:${m}:${ss}`;
    if (diff <= 0) location.reload();
  }
  update();
  setInterval(update, 1000);
}

// --- Routing simple ---
function handleHash() {
  if (location.hash === "#crear") renderCreate();
  else if (location.hash === "#mis") renderList();
  else renderCreate();
}
window.addEventListener("hashchange", handleHash);
window.addEventListener("load", handleHash);
