// app.js — lista ordenada alfabeticamente + separadores por letra (estilo SNS24)
// Funciona com data.json no mesmo diretório (campos: id, titulo, resumo, tags[], conteudo)

// Estado global
const state = {
  items: [],
  tags: new Set(),
  activeTags: new Set(),
  query: "",
  activeLetter: null // ex.: 'A'; null = Todas
};

const els = {
  results: document.getElementById("results"),
  tags: document.getElementById("tagsContainer"),
  search: document.getElementById("searchInput"),
  dialog: document.getElementById("detailDialog"),
  closeDialog: document.getElementById("closeDialog"),
  dTitle: document.getElementById("detailTitle"),
  dSummary: document.getElementById("detailSummary"),
  dContent: document.getElementById("detailContent"),
  alphaNav: document.getElementById("alphaNav")
};

document.getElementById("year").textContent = new Date().getFullYear();

// Util: primeira letra normalizada (A–Z) ou '#'
function firstLetterPT(str = "") {
  const s = (str || "").trim().toUpperCase();
  if (!s) return "#";
  // Remover acentos (Unicode) e obter primeiro carácter base
  const base = s.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
  const ch = base[0];
  return /[A-Z]/.test(ch) ? ch : "#";
}

async function loadData() {
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha a carregar data.json");
    state.items = await res.json();

    // ✅ Ordenar A→Z pelo título (Nome da análise), ignorando acentos/maiúsculas
    state.items.sort((a, b) =>
      a.titulo.localeCompare(b.titulo, "pt", { sensitivity: "base" })
    );
  } catch (e) {
    console.error(e);
    state.items = [];
  }

  // Recolher tags únicas
  state.items.forEach((it) => (it.tags || []).forEach((t) => state.tags.add(t)));

  renderTags();
  renderAlphaNav();
  renderGrid(state.items);
}

function renderTags() {
  els.tags.innerHTML = "";
  [...state.tags]
    .sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }))
    .forEach((tag) => {
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

// Barra A–Z (apenas letras existentes)
function renderAlphaNav() {
  if (!els.alphaNav) return; // caso não exista no HTML
  const letters = new Set(state.items.map((it) => firstLetterPT(it.titulo)));
  const order = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  const frag = document.createDocumentFragment();

  const btnAll = document.createElement("button");
  btnAll.className = "alpha-btn all" + (state.activeLetter ? "" : " active");
  btnAll.textContent = "Todos";
  btnAll.onclick = () => {
    state.activeLetter = null;
    updateAlphaActive();
    applyFilters();
  };
  frag.appendChild(btnAll);

  order.forEach((L) => {
    if (!letters.has(L)) return; // só mostra letras com itens
    const b = document.createElement("button");
    b.className = "alpha-btn" + (state.activeLetter === L ? " active" : "");
    b.textContent = L;
    b.setAttribute("data-letter", L);
    b.onclick = () => {
      state.activeLetter = state.activeLetter === L ? null : L;
      updateAlphaActive();
      applyFilters();
    };
    frag.appendChild(b);
  });

  if (letters.has("#")) {
    const b = document.createElement("button");
    b.className = "alpha-btn" + (state.activeLetter === "#" ? " active" : "");
    b.textContent = "#";
    b.setAttribute("data-letter", "#");
    b.onclick = () => {
      state.activeLetter = state.activeLetter === "#" ? null : "#";
      updateAlphaActive();
      applyFilters();
    };
    frag.appendChild(b);
  }

  els.alphaNav.innerHTML = "";
  els.alphaNav.appendChild(frag);
}

function updateAlphaActive() {
  els.alphaNav.querySelectorAll(".alpha-btn").forEach((btn) => {
    const L = btn.getAttribute("data-letter");
    if (!L) btn.classList.toggle("active", state.activeLetter === null); // "Todos"
    else btn.classList.toggle("active", state.activeLetter === L);
  });
}

// Render com separadores por letra
function renderGrid(items) {
  // Agrupar por primeira letra
  const groups = new Map();
  items.forEach((it) => {
    const L = firstLetterPT(it.titulo);
    if (!groups.has(L)) groups.set(L, []);
    groups.get(L).push(it);
  });

  // Ordem de letras A→Z; '#' no fim
  const order = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  if (groups.has("#")) order.push("#");

  const html = order
    .filter((L) => groups.has(L))
    .map((L) => {
      const cards = groups
        .get(L)
        .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt", { sensitivity: "base" }))
        .map(
          (it) => `
          <article class="card" data-id="${it.id}" tabindex="0" role="button" aria-label="${escapeHtml(
            it.titulo
          )}">
            <h3>${escapeHtml(it.titulo)}</h3>
            <p class="muted">${escapeHtml(it.resumo || "")}</p>
            <div class="badges">
              ${(it.tags || []).map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join("")}
            </div>
          </article>`
        )
        .join("");
      return `
        <h2 class="letter-sep" id="letter-${L}">${L}</h2>
        <div class="section-cards">${cards}</div>
      `;
    })
    .join("");

  els.results.innerHTML = html || '<p class="muted">Sem resultados.</p>';

  // Eventos nas cartas
  els.results.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => openDetail(card.dataset.id));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter") openDetail(card.dataset.id);
    });
  });
}

function applyFilters() {
  const q = state.query.toLowerCase().trim();
  const active = state.activeTags;
  const L = state.activeLetter;

  const filtered = state.items.filter((it) => {
    const hay = `${it.titulo} ${it.resumo} ${(it.tags || []).join(" ")}`.toLowerCase();
    const matchQuery = q ? hay.includes(q) : true;
    const matchTags = active.size ? (it.tags || []).some((t) => active.has(t)) : true;
    const matchLetter = L ? firstLetterPT(it.titulo) === L : true;
    return matchQuery && matchTags && matchLetter;
  });

  // A ordenação A→Z mantém-se por grupo dentro de renderGrid()
  renderGrid(filtered);
}

function openDetail(id) {
  const it = state.items.find((x) => x.id === id);
  if (!it) return;
  els.dTitle.textContent = it.titulo;
  els.dSummary.textContent = it.resumo || "";
  els.dContent.innerHTML = it.conteudo || "";
  els.dialog.showModal();
}

els.closeDialog.addEventListener("click", () => els.dialog.close());
els.search.addEventListener("input", (e) => {
  state.query = e.target.value;
  applyFilters();
});

// Util para evitar injeção ao escrever textos
function escapeHtml(s = "") {
  return s.replace(/[&<>\"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

// Arranque
loadData();
