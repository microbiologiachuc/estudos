/* app.js */
const state = {
  items: [],
  tags: new Set(),
  activeTags: new Set(),
  query: ""
};

const els = {
  results: document.getElementById("results"),
  tags: document.getElementById("tagsContainer"),
  search: document.getElementById("searchInput"),
  dialog: document.getElementById("detailDialog"),
  closeDialog: document.getElementById("closeDialog"),
  dTitle: document.getElementById("detailTitle"),
  dSummary: document.getElementById("detailSummary"),
  dContent: document.getElementById("detailContent")
};

document.getElementById("year").textContent = new Date().getFullYear();

async function loadData(){
  const res = await fetch("data.json");
  state.items = await res.json();

  // recolhe tags únicas
  state.items.forEach(it => (it.tags||[]).forEach(t => state.tags.add(t)));

  renderTags();
  renderGrid(state.items);
}

function renderTags(){
  els.tags.innerHTML = "";
  [...state.tags].sort().forEach(tag => {
    const b = document.createElement("button");
    b.className = "tag";
    b.textContent = tag;
    b.setAttribute("data-tag", tag);
    b.onclick = () => {
      if (state.activeTags.has(tag)) state.activeTags.delete(tag);
      else state.activeTags.add(tag);
      b.classList.toggle("active");
      applyFilters();
    };
    els.tags.appendChild(b);
  });
}

function renderGrid(items){
  els.results.innerHTML = items.map(it => `
    <article class="card" data-id="${it.id}" tabindex="0" role="button" aria-label="${it.titulo}">
      <h3>${escapeHtml(it.titulo)}</h3>
      <p class="muted">${escapeHtml(it.resumo||"")}</p>
      <div class="badges">
        ${(it.tags||[]).map(t=>`<span class="badge">${escapeHtml(t)}</span>`).join("")}
      </div>
    </article>
  `).join("");

  // eventos para abrir detalhe
  els.results.querySelectorAll(".card").forEach(card=>{
    card.addEventListener("click", ()=>openDetail(card.dataset.id));
    card.addEventListener("keydown", (e)=>{ if(e.key==="Enter") openDetail(card.dataset.id); });
  });
}

function applyFilters(){
  const q = state.query.toLowerCase().trim();
  const active = state.activeTags;

  const filtered = state.items.filter(it=>{
    const hay = `${it.titulo} ${it.resumo} ${(it.tags||[]).join(" ")}`.toLowerCase();
    const matchQuery = q ? hay.includes(q) : true;
    const matchTags = active.size ? (it.tags||[]).some(t=>active.has(t)) : true;
    return matchQuery && matchTags;
  });

  renderGrid(filtered);
}

function openDetail(id){
  const it = state.items.find(x=>x.id===id);
  if(!it) return;
  els.dTitle.textContent = it.titulo;
  els.dSummary.textContent = it.resumo || "";
  els.dContent.innerHTML = it.conteudo || "";
  els.dialog.showModal();
}

els.closeDialog.addEventListener("click", ()=>els.dialog.close());
els.search.addEventListener("input", (e)=>{ state.query = e.target.value; applyFilters(); });

// util simples para evitar HTML injection nos campos de texto
function escapeHtml(s=""){return s.replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]))}

loadData();
