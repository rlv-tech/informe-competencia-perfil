
const DATA_URL = "./data.json";

let dashboardData = null;
let currentCategory = "hipercompetencia";
let currentSort = "notas";
let lastFocusedElement = null;

/* =========================
   ELEMENTOS
========================= */

const loading = document.getElementById("loading");
const error = document.getElementById("error");
const content = document.getElementById("content");
const analysisDate = document.getElementById("analysisDate");
const priorities = document.getElementById("priorities");
const themeGrid = document.getElementById("themeGrid");
const emptyState = document.getElementById("emptyState");
const categoryTitle = document.getElementById("categoryTitle");
const categoryDescription = document.getElementById("categoryDescription");
const sortSelect = document.getElementById("sortSelect");
const categoryTabs = document.querySelectorAll(".category-tab");

const drawer = document.getElementById("themeDrawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const drawerClose = document.getElementById("drawerClose");
const drawerTitle = document.getElementById("drawerTitle");
const drawerCategory = document.getElementById("drawerCategory");
const drawerContent = document.getElementById("drawerContent");

/* =========================
   CONFIGURACIÓN
========================= */

const categoryConfig = {
  hipercompetencia: {
    label: "Hipercompetencia",
    description: "Temas donde la competencia tiene mayor cobertura."
  },

  perfil_pierde: {
    label: "Perfil pierde",
    description: "Temas donde otros medios publicaron y Perfil no tuvo cobertura."
  },

  sin_cobertura_perfil: {
    label: "Sin cobertura",
    description: "Temas relevantes cubiertos por la competencia sin presencia de Perfil."
  },

  oportunidades: {
    label: "Oportunidades",
    description: "Temas con posibilidades de desarrollo editorial."
  },

  mas_temas: {
    label: "Más temas",
    description: "Otras temáticas detectadas que también pueden tener interés editorial."
  }
};

/* =========================
   INICIO
========================= */

document.addEventListener("DOMContentLoaded", loadData);

/* =========================
   CARGA DE DATOS
========================= */

async function loadData() {
  try {
    const separator = DATA_URL.includes("?") ? "&" : "?";

    const response = await fetch(
      `${DATA_URL}${separator}t=${Date.now()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    dashboardData = await response.json();

    renderDashboard();

    loading.classList.add("hidden");
    error.classList.add("hidden");
    content.classList.remove("hidden");

  } catch (err) {
    console.error("Error cargando data.json:", err);

    loading.classList.add("hidden");
    content.classList.add("hidden");
    error.classList.remove("hidden");
  }
}

/* =========================
   DASHBOARD
========================= */

function renderDashboard() {
  renderDate();
  renderPriorities();
  renderCategory();
}

/* =========================
   FECHA
========================= */

function renderDate() {
  if (!dashboardData?.fecha_analisis) {
    analysisDate.textContent = "Análisis editorial";
    return;
  }

  const date = parseLocalDate(dashboardData.fecha_analisis);

  if (!date) {
    analysisDate.textContent = `Análisis: ${dashboardData.fecha_analisis}`;
    return;
  }

  const formatted = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);

  analysisDate.textContent = `Análisis: ${formatted}`;
}

/* =========================
   PRIORIDADES DEL DÍA
========================= */

function renderPriorities() {
  priorities.innerHTML = "";

  const items = Array.isArray(dashboardData?.prioridades_del_dia)
    ? dashboardData.prioridades_del_dia.slice(0, 3)
    : [];

  if (!items.length) {
    priorities.innerHTML = `
      <div class="empty-state">
        No hay prioridades disponibles.
      </div>
    `;
    return;
  }

  items.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "priority-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Ver categoría de ${item.tema || "la prioridad"}`);

    const image = getImage(item);

    card.innerHTML = `
      ${
        image
          ? `<img class="priority-image" src="${escapeAttribute(image)}" alt="" loading="lazy">`
          : `<div class="priority-image"></div>`
      }

      <div class="priority-content">
        <div class="priority-number">${String(index + 1).padStart(2, "0")}</div>

        <div class="priority-category">
          ${escapeHtml(getCategoryLabel(item.tipo))}
        </div>

        <h3>${escapeHtml(item.tema || "Tema sin título")}</h3>

        ${
          item.por_que_importa
            ? `<p class="priority-description">${escapeHtml(item.por_que_importa)}</p>`
            : ""
        }
      </div>
    `;

    const openCategory = () => {
      if (item.tipo && categoryConfig[item.tipo]) {
        setCategory(item.tipo);
      }

      document.getElementById("monitoringSection")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    };

    card.addEventListener("click", openCategory);

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCategory();
      }
    });

    priorities.appendChild(card);
  });
}

/* =========================
   CAMBIO DE CATEGORÍA
========================= */

function setCategory(category) {
  if (!categoryConfig[category]) return;

  currentCategory = category;

  categoryTabs.forEach(tab => {
    const active = tab.dataset.category === category;

    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", String(active));
  });

  renderCategory();
}

/* =========================
   CATEGORÍA
========================= */

function renderCategory() {
  const config = categoryConfig[currentCategory] || categoryConfig.hipercompetencia;

  categoryTitle.textContent = config.label;
  categoryDescription.textContent = config.description;

  let items = Array.isArray(dashboardData?.[currentCategory])
    ? [...dashboardData[currentCategory]]
    : [];

  items = sortItems(items);

  themeGrid.innerHTML = "";

  if (!items.length) {
    emptyState.textContent = currentCategory === "mas_temas"
      ? "No hay más temas disponibles."
      : "No hay temas para esta categoría.";

    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  items.forEach(item => {
    themeGrid.appendChild(createThemeCard(item));
  });
}

/* =========================
   ORDENAMIENTO
========================= */

function sortItems(items) {
  return items.sort((a, b) => {
    if (currentSort === "brecha") {
      return Number(b.brecha || 0) - Number(a.brecha || 0);
    }

    if (currentSort === "notas") {
      return getTotalNotes(b) - getTotalNotes(a);
    }

    if (currentSort === "medios") {
      return getMediaCount(b) - getMediaCount(a);
    }

    if (currentSort === "az") {
      return String(a.tema || "").localeCompare(
        String(b.tema || ""),
        "es",
        { sensitivity: "base" }
      );
    }

    return 0;
  });
}

function getTotalNotes(item) {
  const explicit = Number(item?.total_notas);

  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }

  return Array.isArray(item?.noticias) ? item.noticias.length : 0;
}

function getMediaCount(item) {
  const value = item?.cantidad_medios ?? item?.cantidad_medios_competencia;

  if (value !== undefined && value !== null && value !== "") {
    return Number(value) || 0;
  }

  if (item?.cobertura && typeof item.cobertura === "object") {
    return Object.keys(item.cobertura).length;
  }

  return 0;
}

/* =========================
   TARJETA DE TEMA
========================= */

function createThemeCard(item) {
  const card = document.createElement("article");
  card.className = "theme-card";

  const image = getImage(item);
  const totalNotas = getTotalNotes(item);
  const cantidadMedios = getMediaCount(item);
  const rawGap = Number(item.brecha || 0);

  const displayGap = rawGap > 0 ? `-${rawGap}` : `${rawGap}`;
  const gapClass = rawGap !== 0 ? "theme-stat theme-stat-gap" : "theme-stat";

  card.innerHTML = `
    <div class="theme-hero">
      ${
        image
          ? `<img class="theme-image" src="${escapeAttribute(image)}" alt="" loading="lazy">`
          : `<div class="theme-image"></div>`
      }
    </div>

    <div class="theme-body">
      <div class="theme-category">
        ${escapeHtml(getCategoryLabel(item.tipo || currentCategory))}
      </div>

      <h3 class="theme-title">
        ${escapeHtml(item.tema || "Tema sin título")}
      </h3>

      <div class="theme-stats">
        <div class="theme-stat">
          <span>Notas</span>
          <strong>${totalNotas}</strong>
        </div>

        <div class="theme-stat">
          <span>Medios</span>
          <strong>${cantidadMedios}</strong>
        </div>

        <div class="${gapClass}">
          <span>Brecha Perfil</span>
          <strong>${displayGap}</strong>
        </div>
      </div>

      ${renderCoverage(item.cobertura)}

      <button class="theme-open-button" type="button">
        <span>Ver análisis y noticias</span>
        <span aria-hidden="true">›</span>
      </button>
    </div>
  `;

  card.querySelector(".theme-open-button").addEventListener("click", () => {
    openThemeDrawer(item);
  });

  return card;
}

/* =========================
   PANEL LATERAL
========================= */

function openThemeDrawer(item) {
  lastFocusedElement = document.activeElement;

  drawerTitle.textContent = item.tema || "Tema sin título";
  drawerCategory.textContent = getCategoryLabel(item.tipo || currentCategory);

  drawerContent.innerHTML = renderDrawerDetails(item);

  drawer.classList.add("is-open");
  drawerOverlay.classList.remove("hidden");

  drawer.setAttribute("aria-hidden", "false");
  drawer.inert = false;
  drawerOverlay.setAttribute("aria-hidden", "false");

  document.body.classList.add("drawer-open");

  drawerContent.scrollTop = 0;
  drawerClose.focus();
}

function closeThemeDrawer() {
  if (!drawer.classList.contains("is-open")) return;

  drawer.classList.remove("is-open");
  drawerOverlay.classList.add("hidden");

  drawer.setAttribute("aria-hidden", "true");
  drawer.inert = true;
  drawerOverlay.setAttribute("aria-hidden", "true");

  document.body.classList.remove("drawer-open");

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function renderDrawerDetails(item) {
  const sections = [];

  if (item.por_que_importa) {
    sections.push(`
      <div class="detail-card detail-importance">
        <div class="detail-card-label">Por qué importa</div>
        <p>${escapeHtml(item.por_que_importa)}</p>
      </div>
    `);
  }

  if (item.insight) {
    sections.push(`
      <div class="detail-card detail-insight">
        <div class="detail-card-label">Insight</div>
        <p>${escapeHtml(item.insight)}</p>
      </div>
    `);
  }

  if (item.accion_sugerida) {
    sections.push(`
      <div class="detail-card detail-action">
        <div class="detail-card-label">Acción sugerida</div>
        <p>${escapeHtml(item.accion_sugerida)}</p>
      </div>
    `);
  }

  if (Array.isArray(item.enfoques_sugeridos) && item.enfoques_sugeridos.length) {
    sections.push(`
      <div class="detail-card detail-approaches">
        <div class="detail-card-label">Enfoques sugeridos</div>
        <div class="approach-list">
          ${item.enfoques_sugeridos.map(enfoque => `
            <span class="approach-chip">${escapeHtml(enfoque)}</span>
          `).join("")}
        </div>
      </div>
    `);
  }

  const news = getAllThemeNews(item);

  sections.push(`
    <div class="drawer-news-heading">
      <h3 class="drawer-section-title">Noticias asociadas</h3>
      <span class="drawer-news-count">${news.length} ${news.length === 1 ? "nota" : "notas"}</span>
    </div>

    ${
      news.length
        ? `<div class="drawer-news-list">${news.map(renderDrawerNews).join("")}</div>`
        : `<div class="drawer-empty">No hay noticias asociadas disponibles para este tema en los datos recibidos.</div>`
    }
  `);

  return sections.join("");
}

/* =========================
   NOTICIAS DEL TEMA
========================= */

function getAllThemeNews(item) {
  const news = [];
  const seen = new Set();

  const sources = [
    ...(Array.isArray(item?.noticias) ? item.noticias : []),
    ...(Array.isArray(item?.ejemplos) ? item.ejemplos : [])
  ];

  sources.forEach(note => {
    if (!note || typeof note !== "object") return;

    const title = getNewsTitle(note);
    const link = getNewsLink(note);
    const key = link
      ? `url:${normalizeUrl(link)}`
      : `title:${title.trim().toLowerCase()}`;

    if (seen.has(key)) return;

    seen.add(key);
    news.push(note);
  });

  return news;
}

function renderDrawerNews(note) {
  const title = getNewsTitle(note);
  const link = getNewsLink(note);
  const medium = getNewsMedium(note);
  const date = getNewsDate(note);

  const metadata = [medium, date].filter(Boolean).join(" · ");

  return `
    <article class="drawer-news-item">
      <div class="drawer-news-main">
        ${metadata ? `<div class="drawer-news-meta">${escapeHtml(metadata)}</div>` : ""}
        <h4 class="drawer-news-title">
          ${
            link
              ? `<a href="${escapeAttribute(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a>`
              : escapeHtml(title)
          }
        </h4>
      </div>

      ${
        link
          ? `<a class="drawer-news-link" href="${escapeAttribute(link)}" target="_blank" rel="noopener noreferrer">Abrir nota ↗</a>`
          : ""
      }
    </article>
  `;
}

function getNewsTitle(note) {
  return String(
    note?.titulo ??
    note?.title ??
    note?.titular ??
    note?.tema ??
    "Nota sin título"
  );
}

function getNewsLink(note) {
  const value =
    note?.link ??
    note?.url ??
    note?.enlace ??
    note?.url_nota ??
    "";

  return cleanHttpUrl(value);
}

function getNewsMedium(note) {
  return String(
    note?.medio ??
    note?.fuente ??
    note?.medio_nombre ??
    note?.publisher ??
    note?.site_name ??
    ""
  ).trim();
}

function getNewsDate(note) {
  const value =
    note?.fecha ??
    note?.fecha_publicacion ??
    note?.published_at ??
    note?.publishedAt ??
    note?.date ??
    "";

  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function normalizeUrl(url) {
  return String(url || "")
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();
}

/* =========================
   COBERTURA
========================= */

function renderCoverage(cobertura) {
  if (!cobertura || typeof cobertura !== "object" || Array.isArray(cobertura)) {
    return "";
  }

  const entries = Object.entries(cobertura);

  if (!entries.length) return "";

  const maxValue = Math.max(
    ...entries.map(([, value]) => Number(value) || 0),
    1
  );

  return `
    <div class="coverage-block">
      <div class="coverage-title">Cobertura</div>

      <div class="coverage-list">
        ${entries.map(([medio, value]) => {
          const numericValue = Number(value) || 0;
          const width = Math.max(0, Math.min(100, (numericValue / maxValue) * 100));

          return `
            <div class="coverage-item">
              <span class="coverage-item-name">${escapeHtml(medio)}</span>
              <div class="coverage-bar">
                <div class="coverage-fill" style="width:${width}%"></div>
              </div>
              <strong>${numericValue}</strong>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

/* =========================
   IMAGEN
========================= */

function getImage(item) {
  const possibleFields = [
    "imagen",
    "image",
    "foto",
    "image_url",
    "imagen_url"
  ];

  for (const field of possibleFields) {
    if (item?.[field]) {
      const url = cleanHttpUrl(item[field]);
      if (url) return url;
    }
  }

  if (Array.isArray(item?.ejemplos)) {
    for (const example of item.ejemplos) {
      if (example?.imagen) {
        const url = cleanHttpUrl(example.imagen);
        if (url) return url;
      }
    }
  }

  return "";
}

/* =========================
   CATEGORÍAS
========================= */

function getCategoryLabel(tipo) {
  const labels = {
    hipercompetencia: "Hipercompetencia",
    perfil_pierde: "Perfil pierde",
    sin_cobertura_perfil: "Sin cobertura",
    oportunidades: "Oportunidades",
    mas_temas: "Más temas"
  };

  return labels[tipo] || tipo || "";
}

/* =========================
   URLS
========================= */

function cleanMarkdownUrl(value) {
  if (!value) return "";

  let result = String(value).trim();

  const markdownMatch = result.match(/^\[.*?\]\((.*?)\)$/);

  if (markdownMatch) {
    result = markdownMatch[1];
  }

  return result
    .replace(/\\&/g, "&")
    .replace(/&amp;/g, "&")
    .trim();
}

function cleanHttpUrl(value) {
  const cleaned = cleanMarkdownUrl(value);

  if (!cleaned) return "";

  try {
    const url = new URL(cleaned);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }
  } catch {
    return "";
  }

  return "";
}

/* =========================
   FECHA LOCAL
========================= */

function parseLocalDate(value) {
  if (!value) return null;

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
}

/* =========================
   SEGURIDAD HTML
========================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

/* =========================
   TABS
========================= */

categoryTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    setCategory(tab.dataset.category);
  });
});

/* =========================
   ORDENAMIENTO
========================= */

sortSelect.addEventListener("change", event => {
  currentSort = event.target.value;
  renderCategory();
});

/* =========================
   CIERRE DEL PANEL
========================= */

drawerClose.addEventListener("click", closeThemeDrawer);

drawerOverlay.addEventListener("click", closeThemeDrawer);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeThemeDrawer();
  }

  if (event.key === "Tab" && drawer.classList.contains("is-open")) {
    const focusable = drawer.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
