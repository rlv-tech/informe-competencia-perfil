"use strict";

const DATA_URL = "./data.json";

let dashboardData = null;
let currentCategory = "hipercompetencia";
let currentSort = "notas";
let previousFocus = null;

const $ = (selector) => document.querySelector(selector);

const dom = {
  loading: $("#loading"),
  error: $("#error"),
  errorMessage: $("#errorMessage"),
  retryButton: $("#retryButton"),
  content: $("#content"),
  analysisDate: $("#analysisDate"),
  priorities: $("#priorities"),
  themeGrid: $("#themeGrid"),
  emptyState: $("#emptyState"),
  categoryTitle: $("#categoryTitle"),
  categoryDescription: $("#categoryDescription"),
  sortSelect: $("#sortSelect"),
  categoryTabs: [...document.querySelectorAll(".category-tab")],
  monitoringSection: $("#monitoringSection"),
  drawerOverlay: $("#drawerOverlay"),
  drawer: $("#themeDrawer"),
  drawerTitle: $("#drawerTitle"),
  drawerCategory: $("#drawerCategory"),
  drawerClose: $("#drawerClose"),
  drawerContent: $("#drawerContent")
};

const categoryConfig = {
  hipercompetencia: {
    title: "Hipercompetencia",
    description: "Temáticas con una presencia competitiva relevante."
  },
  perfil_pierde: {
    title: "Perfil pierde",
    description: "Temáticas donde otros medios registran mayor cobertura."
  },
  sin_cobertura_perfil: {
    title: "Sin cobertura Perfil",
    description: "Temas cubiertos por la competencia que no registran cobertura de Perfil."
  },
  oportunidades: {
    title: "Oportunidades",
    description: "Temas con potencial para ampliar o diversificar la cobertura editorial."
  },
  mas_temas: {
    title: "Más temas",
    description: "Otras temáticas detectadas en el monitoreo de competencia."
  }
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function cleanMarkdownUrl(value) {
  let url = String(value ?? "").trim();
  url = url.replace(/^\[|\]$/g, "");
  url = url.replace(/^<|>$/g, "");

  if (!url) return "";

  try {
    const parsed = new URL(url, window.location.href);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.href;
  } catch {
    return "";
  }
}

function safeLink(value) {
  return cleanMarkdownUrl(value);
}

function firstValue(object, keys, fallback = "") {
  if (!object || typeof object !== "object") return fallback;

  for (const key of keys) {
    const value = object[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

function getThemeName(item) {
  return firstValue(item, [
    "tema",
    "tema_provisorio",
    "tematica",
    "nombre",
    "titulo",
    "title"
  ], "Temática sin título");
}

function getCategoryLabel(type) {
  return categoryConfig[type]?.title || type || "Temática";
}

function getItemCategory(item, fallback = currentCategory) {
  return firstValue(item, ["tipo", "categoria", "category"], fallback);
}

function getImage(item) {
  const directImage = firstValue(item, [
    "imagen",
    "Imagen",
    "image",
    "image_url",
    "imagen_url",
    "foto"
  ]);

  const directUrl = cleanMarkdownUrl(directImage);
  if (directUrl) return directUrl;

  const examples = Array.isArray(item?.ejemplos) ? item.ejemplos : [];

  for (const example of examples) {
    const url = cleanMarkdownUrl(firstValue(example, [
      "imagen",
      "Imagen",
      "image",
      "image_url",
      "imagen_url",
      "foto"
    ]));

    if (url) return url;
  }

  return "";
}

function getExamples(item) {
  return Array.isArray(item?.ejemplos) ? item.ejemplos : [];
}

function getTotalNotes(item) {
  const value = Number(firstValue(item, [
    "total_notas",
    "cantidad_notas",
    "notas",
    "total"
  ], 0));

  return Number.isFinite(value) ? value : 0;
}

function getMediaCount(item) {
  const value = Number(firstValue(item, [
    "cantidad_medios",
    "total_medios",
    "medios_count"
  ], 0));

  if (Number.isFinite(value) && value > 0) return value;

  const coverage = item?.cobertura;
  if (Array.isArray(coverage)) return coverage.length;

  if (coverage && typeof coverage === "object") {
    return Object.keys(coverage).length;
  }

  return 0;
}

function getGap(item) {
  const value = Number(firstValue(item, [
    "brecha",
    "brecha_formateada"
  ], 0));

  return Number.isFinite(value) ? value : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-AR").format(Number(value) || 0);
}

function parseLocalDate(value) {
  if (!value) return null;

  const raw = String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function renderDate() {
  const rawDate = firstValue(dashboardData, [
    "fecha_analisis",
    "fecha",
    "updated_at"
  ]);

  const date = parseLocalDate(rawDate);

  dom.analysisDate.textContent = date
    ? new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }).format(date)
    : "Sin fecha disponible";
}

function getAllItems() {
  if (!dashboardData) return [];

  const categories = Object.keys(categoryConfig);
  const result = [];
  const seen = new Set();

  for (const category of categories) {
    const items = dashboardData[category];

    if (!Array.isArray(items)) continue;

    for (const item of items) {
      if (!item || typeof item !== "object") continue;

      const key = `${category}|${getThemeName(item)}`;

      if (seen.has(key)) continue;
      seen.add(key);

      result.push({
        ...item,
        tipo: item.tipo || category
      });
    }
  }

  return result;
}

function getPriorities() {
  const priorities = dashboardData?.prioridades_del_dia;

  if (!Array.isArray(priorities)) return [];

  return priorities;
}

function getPriorityCategory(item) {
  const type = getItemCategory(item, "");

  if (categoryConfig[type]) return type;

  const name = getThemeName(item).toLowerCase();

  if (name.includes("oportunidad")) return "oportunidades";
  if (name.includes("sin cobertura")) return "sin_cobertura_perfil";
  if (name.includes("pierde")) return "perfil_pierde";

  return "hipercompetencia";
}

function renderPriorities() {
  dom.priorities.innerHTML = "";

  const priorities = getPriorities();

  if (!priorities.length) {
    dom.priorities.innerHTML = `
      <div class="priority-empty">
        No hay prioridades editoriales disponibles para este análisis.
      </div>
    `;
    return;
  }

  priorities.slice(0, 3).forEach((item, index) => {
    const category = getPriorityCategory(item);
    const image = getImage(item);
    const title = getThemeName(item);
    const description = firstValue(item, [
      "por_que_importa",
      "insight",
      "descripcion",
      "resumen"
    ], "Abrí la temática para consultar su análisis editorial.");

    const card = document.createElement("article");
    card.className = "priority-card";

    card.innerHTML = `
      <button class="priority-card-button" type="button"
        aria-label="Ver detalle de ${escapeAttribute(title)}">
        ${image ? `
          <div class="priority-image">
            <img src="${escapeAttribute(image)}" alt="" loading="lazy">
          </div>
        ` : ""}
        <div class="priority-content">
          <span class="priority-number">${String(index + 1).padStart(2, "0")}</span>
          <span class="priority-category">${escapeHtml(getCategoryLabel(category))}</span>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(description)}</p>
          <span class="priority-link">Ver análisis <span aria-hidden="true">→</span></span>
        </div>
      </button>
    `;

    card.querySelector("button").addEventListener("click", () => {
      openDrawer(item, category);
    });

    dom.priorities.appendChild(card);
  });
}

function sortItems(items) {
  const sorted = [...items];

  sorted.sort((a, b) => {
    if (currentSort === "brecha") {
      return getGap(b) - getGap(a);
    }

    if (currentSort === "medios") {
      return getMediaCount(b) - getMediaCount(a);
    }

    if (currentSort === "alfabetico") {
      return getThemeName(a).localeCompare(getThemeName(b), "es");
    }

    return getTotalNotes(b) - getTotalNotes(a);
  });

  return sorted;
}

function renderCategory() {
  const config = categoryConfig[currentCategory];

  dom.categoryTitle.textContent = config?.title || "Temáticas";
  dom.categoryDescription.textContent = config?.description || "";

  dom.categoryTabs.forEach((tab) => {
    const active = tab.dataset.category === currentCategory;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", String(active));
  });

  const items = Array.isArray(dashboardData?.[currentCategory])
    ? dashboardData[currentCategory]
    : [];

  const sortedItems = sortItems(items);

  dom.themeGrid.innerHTML = "";
  dom.emptyState.classList.toggle("hidden", sortedItems.length > 0);

  sortedItems.forEach((item) => {
    dom.themeGrid.appendChild(createThemeCard(item));
  });
}

function createThemeCard(item) {
  const card = document.createElement("article");
  card.className = "theme-card";

  const image = getImage(item);
  const title = getThemeName(item);
  const totalNotes = getTotalNotes(item);
  const mediaCount = getMediaCount(item);
  const leader = firstValue(item, [
    "medio_lider",
    "medio",
    "competidor_lider"
  ], "—");

  const category = getItemCategory(item);
  const imageMarkup = image
    ? `<img class="theme-image" src="${escapeAttribute(image)}" alt="" loading="lazy">`
    : `<div class="theme-image theme-image-placeholder"><span>PERFIL</span></div>`;

  card.innerHTML = `
    <div class="theme-hero">${imageMarkup}</div>

    <div class="theme-body">
      <span class="theme-category">${escapeHtml(getCategoryLabel(category))}</span>

      <h3 class="theme-title">${escapeHtml(title)}</h3>

      <div class="theme-stats">
        <div class="theme-stat">
          <span class="theme-stat-value">${formatNumber(totalNotes)}</span>
          <span class="theme-stat-label">Notas</span>
        </div>
        <div class="theme-stat">
          <span class="theme-stat-value">${formatNumber(mediaCount)}</span>
          <span class="theme-stat-label">Medios</span>
        </div>
        <div class="theme-stat">
          <span class="theme-stat-value theme-stat-text">${escapeHtml(leader)}</span>
          <span class="theme-stat-label">Medio líder</span>
        </div>
      </div>

      ${renderCoverage(item.cobertura)}

      <button class="theme-open-button" type="button">
        Ver análisis y noticias <span aria-hidden="true">→</span>
      </button>
    </div>
  `;

  card.querySelector(".theme-open-button").addEventListener("click", () => {
    openDrawer(item, category);
  });

  return card;
}

function renderCoverage(coverage) {
  if (!coverage) return "";

  let entries = [];

  if (Array.isArray(coverage)) {
    entries = coverage.map((item) => ({
      medio: firstValue(item, ["medio", "nombre", "name", "competidor"], "Medio"),
      notas: Number(firstValue(item, ["total_notas", "notas", "cantidad"], 0))
    }));
  } else if (typeof coverage === "object") {
    if (
      coverage.medios &&
      Array.isArray(coverage.medios)
    ) {
      entries = coverage.medios.map((item) => ({
        medio: firstValue(item, ["medio", "nombre", "name"], "Medio"),
        notas: Number(firstValue(item, ["total_notas", "notas", "cantidad"], 0))
      }));
    } else {
      const reservedKeys = new Set([
        "total_notas",
        "cantidad_medios",
        "cantidad_competidores",
        "cobertura_perfil",
        "medio_lider",
        "cobertura_medio_lider",
        "brecha",
        "brecha_formateada"
      ]);

      entries = Object.entries(coverage)
        .filter(([key, value]) => !reservedKeys.has(key) && Number.isFinite(Number(value)))
        .map(([medio, notas]) => ({ medio, notas: Number(notas) }));
    }
  }

  if (!entries.length) return "";

  entries = entries
    .filter((item) => item.medio)
    .sort((a, b) => b.notas - a.notas)
    .slice(0, 4);

  if (!entries.length) return "";

  const max = Math.max(1, ...entries.map((item) => item.notas));

  return `
    <div class="coverage-block">
      <p class="coverage-title">Distribución de cobertura</p>
      <div class="coverage-list">
        ${entries.map((item) => {
          const width = Math.max(0, Math.min(100, item.notas / max * 100));

          return `
            <div class="coverage-item">
              <div class="coverage-item-heading">
                <span>${escapeHtml(item.medio)}</span>
                <span>${formatNumber(item.notas)}</span>
              </div>
              <div class="coverage-bar">
                <span class="coverage-fill" style="width:${width}%"></span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderExample(example) {
  const title = firstValue(example, [
    "titulo",
    "Titulo",
    "title",
    "headline"
  ], "Noticia sin título");

  const medium = firstValue(example, [
    "medio",
    "Medio",
    "media",
    "fuente"
  ], "Medio no identificado");

  const link = safeLink(firstValue(example, [
    "link",
    "Link",
    "url",
    "URL"
  ]));

  const image = cleanMarkdownUrl(firstValue(example, [
    "imagen",
    "Imagen",
    "image",
    "image_url",
    "foto"
  ]));

  return `
    <article class="drawer-news-item">
      ${image ? `
        <div class="drawer-news-image">
          <img src="${escapeAttribute(image)}" alt="" loading="lazy">
        </div>
      ` : ""}
      <div class="drawer-news-copy">
        <p class="drawer-news-medium">${escapeHtml(medium)}</p>
        <h4 class="drawer-news-title">
          ${link
            ? `<a href="${escapeAttribute(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a>`
            : escapeHtml(title)}
        </h4>
        ${link ? `
          <a class="drawer-news-link" href="${escapeAttribute(link)}"
            target="_blank" rel="noopener noreferrer">Leer noticia →</a>
        ` : ""}
      </div>
    </article>
  `;
}

function renderDetailSection(label, value, className = "") {
  if (value === undefined || value === null) return "";

  let content = "";

  if (Array.isArray(value)) {
    const filtered = value.filter((item) => item !== undefined && item !== null && String(item).trim());

    if (!filtered.length) return "";

    content = `
      <ul class="approach-list">
        ${filtered.map((item) => `<li>${escapeHtml(typeof item === "object" ? JSON.stringify(item) : item)}</li>`).join("")}
      </ul>
    `;
  } else if (typeof value === "object") {
    const entries = Object.entries(value);

    if (!entries.length) return "";

    content = `
      <ul class="approach-list">
        ${entries.map(([key, item]) => `
          <li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(item)}</li>
        `).join("")}
      </ul>
    `;
  } else {
    const text = String(value).trim();
    if (!text) return "";

    content = `<p>${escapeHtml(text)}</p>`;
  }

  return `
    <section class="drawer-section ${escapeAttribute(className)}">
      <p class="drawer-section-label">${escapeHtml(label)}</p>
      <div class="drawer-section-content">${content}</div>
    </section>
  `;
}

function getEditorialDetails(item) {
  return {
    importance: firstValue(item, [
      "por_que_importa",
      "por_que_es_importante",
      "importancia"
    ]),
    insight: firstValue(item, [
      "insight",
      "hallazgo",
      "lectura_editorial"
    ]),
    action: firstValue(item, [
      "accion_sugerida",
      "acción_sugerida",
      "accion",
      "recomendacion"
    ]),
    approaches: firstValue(item, [
      "enfoques_sugeridos",
      "enfoques",
      "ideas_editoriales"
    ]),
    description: firstValue(item, [
      "descripcion",
      "descripción",
      "resumen"
    ])
  };
}

function openDrawer(item, category = currentCategory) {
  if (!item) return;

  previousFocus = document.activeElement;

  const title = getThemeName(item);
  const details = getEditorialDetails(item);
  const examples = getExamples(item);

  dom.drawerTitle.textContent = title;
  dom.drawerCategory.textContent = getCategoryLabel(category);

  const sections = [
    renderDetailSection("POR QUÉ IMPORTA", details.importance, "detail-importance"),
    renderDetailSection("INSIGHT EDITORIAL", details.insight, "detail-insight"),
    renderDetailSection("ACCIÓN SUGERIDA", details.action, "detail-action"),
    renderDetailSection("ENFOQUES SUGERIDOS", details.approaches, "detail-approaches"),
    renderDetailSection("CONTEXTO", details.description, "detail-context")
  ].filter(Boolean).join("");

  const newsMarkup = examples.length
    ? examples.map(renderExample).join("")
    : `<p class="drawer-empty-news">No hay noticias asociadas a esta temática en los datos recibidos.</p>`;

  dom.drawerContent.innerHTML = `
    <div class="drawer-intro">
      <p class="drawer-intro-label">ANÁLISIS EDITORIAL</p>
      <div class="drawer-metrics">
        <div class="drawer-metric">
          <span class="drawer-metric-value">${formatNumber(getTotalNotes(item))}</span>
          <span class="drawer-metric-label">Notas</span>
        </div>
        <div class="drawer-metric">
          <span class="drawer-metric-value">${formatNumber(getMediaCount(item))}</span>
          <span class="drawer-metric-label">Medios</span>
        </div>
      </div>
    </div>

    ${sections || `<p class="drawer-no-analysis">No hay información editorial adicional para esta temática.</p>`}

    <section class="drawer-section drawer-news-section">
      <p class="drawer-section-label">NOTICIAS RELACIONADAS</p>
      <div class="drawer-news-list">${newsMarkup}</div>
    </section>
  `;

  dom.drawer.classList.add("is-open");
  dom.drawerOverlay.classList.add("is-open");
  dom.drawer.setAttribute("aria-hidden", "false");
  dom.drawerOverlay.setAttribute("aria-hidden", "false");
  dom.drawer.inert = false;
  document.body.classList.add("drawer-is-open");

  dom.drawerClose.focus();
}

function closeDrawer() {
  dom.drawer.classList.remove("is-open");
  dom.drawerOverlay.classList.remove("is-open");
  dom.drawer.setAttribute("aria-hidden", "true");
  dom.drawerOverlay.setAttribute("aria-hidden", "true");
  dom.drawer.inert = true;
  document.body.classList.remove("drawer-is-open");

  if (previousFocus && typeof previousFocus.focus === "function") {
    previousFocus.focus();
  }
}

function renderDashboard() {
  renderDate();
  renderPriorities();
  renderCategory();

  dom.loading.classList.add("hidden");
  dom.error.classList.add("hidden");
  dom.content.classList.remove("hidden");
}

async function loadData() {
  dom.loading.classList.remove("hidden");
  dom.error.classList.add("hidden");
  dom.content.classList.add("hidden");

  try {
    const response = await fetch(`${DATA_URL}?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`No se pudo cargar data.json (HTTP ${response.status}).`);
    }

    const data = await response.json();

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("data.json no contiene un objeto JSON válido.");
    }

    dashboardData = data;
    renderDashboard();
  } catch (error) {
    console.error("Error al cargar el dashboard:", error);
    dom.loading.classList.add("hidden");
    dom.content.classList.add("hidden");
    dom.error.classList.remove("hidden");
    dom.errorMessage.textContent = error.message || "Ocurrió un error al cargar los datos.";
  }
}

dom.categoryTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentCategory = tab.dataset.category;
    renderCategory();
  });
});

dom.sortSelect.addEventListener("change", () => {
  currentSort = dom.sortSelect.value;
  renderCategory();
});

dom.drawerClose.addEventListener("click", closeDrawer);
dom.drawerOverlay.addEventListener("click", closeDrawer);
dom.retryButton.addEventListener("click", loadData);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && dom.drawer.classList.contains("is-open")) {
    closeDrawer();
  }
});

loadData();

