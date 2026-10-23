
const DATA_URL = "./data.json";

let dashboardData = null;
let currentCategory = "hipercompetencia";
let currentSort = "notas";

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

const newsDrawer = document.getElementById("newsDrawer");
const newsDrawerOverlay = document.getElementById("newsDrawerOverlay");
const newsDrawerClose = document.getElementById("newsDrawerClose");
const newsDrawerTitle = document.getElementById("newsDrawerTitle");
const newsDrawerCount = document.getElementById("newsDrawerCount");
const newsDrawerContent = document.getElementById("newsDrawerContent");

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
    description: "Otros temas detectados en el monitoreo de la competencia."
  }
};

document.addEventListener("DOMContentLoaded", loadData);

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

function renderDashboard() {
  renderDate();
  renderPriorities();
  renderCategory();
}

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

function renderPriorities() {
  priorities.innerHTML = "";

  // Se conservan las prioridades seleccionadas por la IA.
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

    const image = getImage(item);

    card.innerHTML = `
      ${
        image
          ? `
            <img
              class="priority-image"
              src="${escapeAttribute(image)}"
              alt=""
              loading="lazy"
            >
          `
          : `<div class="priority-image"></div>`
      }

      <div class="priority-content">
        <div class="priority-number">
          ${String(index + 1).padStart(2, "0")}
        </div>

        <div class="priority-category">
          ${escapeHtml(getCategoryLabel(item.tipo))}
        </div>

        <h3>${escapeHtml(item.tema || "Tema sin título")}</h3>

        ${
          item.por_que_importa
            ? `
              <p class="priority-description">
                ${escapeHtml(item.por_que_importa)}
              </p>
            `
            : ""
        }
      </div>
    `;

    card.addEventListener("click", () => {
      currentCategory =
        item.tipo && categoryConfig[item.tipo]
          ? item.tipo
          : "hipercompetencia";

      categoryTabs.forEach(tab => {
        tab.classList.toggle(
          "active",
          tab.dataset.category === currentCategory
        );
      });

      renderCategory();

      document.getElementById("monitoringSection")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

    priorities.appendChild(card);
  });
}

function renderCategory() {
  const config =
    categoryConfig[currentCategory] || categoryConfig.hipercompetencia;

  categoryTitle.textContent = config.label;
  categoryDescription.textContent = config.description;

  let items = Array.isArray(dashboardData?.[currentCategory])
    ? [...dashboardData[currentCategory]]
    : [];

  items = sortItems(items);
  themeGrid.innerHTML = "";

  if (!items.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  items.forEach(item => {
    themeGrid.appendChild(createThemeCard(item));
  });
}

function sortItems(items) {
  return items.sort((a, b) => {
    if (currentSort === "brecha") {
      return Number(b.brecha || 0) - Number(a.brecha || 0);
    }

    if (currentSort === "notas") {
      return Number(b.total_notas || 0) - Number(a.total_notas || 0);
    }

    if (currentSort === "medios") {
      return (
        Number(b.cantidad_medios ?? b.cantidad_medios_competencia ?? 0) -
        Number(a.cantidad_medios ?? a.cantidad_medios_competencia ?? 0)
      );
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

function createThemeCard(item) {
  const card = document.createElement("article");
  card.className = "theme-card";

  const image = getImage(item);
  const totalNotas = Number(item.total_notas || 0);

  const cantidadMedios = Number(
    item.cantidad_medios ?? item.cantidad_medios_competencia ?? 0
  );

  const rawGap = Number(item.brecha || 0);
  const displayGap = rawGap > 0 ? `-${rawGap}` : `${rawGap}`;
  const gapClass = rawGap !== 0
    ? "theme-stat theme-stat-gap"
    : "theme-stat";

  const ejemplos = Array.isArray(item.ejemplos)
    ? item.ejemplos.slice(0, 3)
    : [];

  const noticias = Array.isArray(item.noticias)
    ? item.noticias
    : [];

  card.innerHTML = `
    <div class="theme-hero">
      ${
        image
          ? `
            <img
              class="theme-image"
              src="${escapeAttribute(image)}"
              alt=""
              loading="lazy"
            >
          `
          : `<div class="theme-image"></div>`
      }
    </div>

    <div class="theme-body">
      <div class="theme-category">
        ${escapeHtml(getCategoryLabel(item.tipo))}
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

      ${

      <details class="theme-details">
        <summary>
          <span>Ver detalles</span>
        </summary>

        <div class="details-content">
          ${
            item.por_que_importa
              ? `
                <div class="detail-card detail-importance">
                  <div class="detail-card-label">Por qué importa</div>
                  <p>${escapeHtml(item.por_que_importa)}</p>
                </div>
              `
              : ""
          }

          ${
            item.insight
              ? `
                <div class="detail-card detail-insight">
                  <div class="detail-card-label">Insight</div>
                  <p>${escapeHtml(item.insight)}</p>
                </div>
              `
              : ""
          }

          ${
            item.accion_sugerida
              ? `
                <div class="detail-card detail-action">
                  <div class="detail-card-label">Acción sugerida</div>
                  <p>${escapeHtml(item.accion_sugerida)}</p>
                </div>
              `
              : ""
          }

          ${
            Array.isArray(item.enfoques_sugeridos) &&
            item.enfoques_sugeridos.length
              ? `
                <div class="detail-card detail-approaches">
                  <div class="detail-card-label">Enfoques sugeridos</div>

                  <div class="approach-list">
                    ${item.enfoques_sugeridos
                      .map(enfoque => `
                        <span class="approach-chip">
                          ${escapeHtml(enfoque)}
                        </span>
                      `)
                      .join("")}
                  </div>
                </div>
              `
              : ""
          }

          ${
            ejemplos.length
              ? `
                <div class="card-examples">
                  <div class="examples-title">Ejemplos</div>
                  <div class="examples-list">
                    ${ejemplos.map(example => renderExample(example)).join("")}
                  </div>
          
                  ${
                    noticias.length > 3
                      ? `
                        <button
                          class="show-all-news"
                          type="button"
                          data-show-all-news
                        >
                          Ver todas las notas (${noticias.length})
                        </button>
                      `
                      : ""
                  }
                </div>
              `
              : ""
          }
        </div>
      </details>
    </div>
  `;

  const showAllNewsButton = card.querySelector("[data-show-all-news]");

  if (showAllNewsButton) {
    showAllNewsButton.addEventListener("click", () => {
      openNewsDrawer(item);
    });
  }

  return card;
}

function openNewsDrawer(item) {
  const noticias = Array.isArray(item?.noticias) ? item.noticias : [];

  if (
    noticias.length <= 3 ||
    !newsDrawer ||
    !newsDrawerOverlay ||
    !newsDrawerTitle ||
    !newsDrawerCount ||
    !newsDrawerContent
  ) {
    return;
  }

  newsDrawerTitle.textContent = item.tema || "Todas las notas";
  newsDrawerCount.textContent = `${noticias.length} notas de esta temática`;

  newsDrawerContent.innerHTML = noticias
    .map(noticia => renderExample(noticia))
    .join("");

  newsDrawerOverlay.classList.remove("hidden");
  newsDrawer.classList.add("open");
  newsDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  newsDrawerClose?.focus();
}

function closeNewsDrawer() {
  if (!newsDrawer || !newsDrawerOverlay) {
    return;
  }

  newsDrawer.classList.remove("open");
  newsDrawerOverlay.classList.add("hidden");
  newsDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

newsDrawerClose?.addEventListener("click", closeNewsDrawer);
newsDrawerOverlay?.addEventListener("click", closeNewsDrawer);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && newsDrawer?.classList.contains("open")) {
    closeNewsDrawer();
  }
});

function renderCoverage(cobertura) {
  if (
    !cobertura ||
    typeof cobertura !== "object" ||
    Array.isArray(cobertura)
  ) {
    return "";
  }

  const entries = Object.entries(cobertura);

  if (!entries.length) {
    return "";
  }

  const maxValue = Math.max(
    ...entries.map(([, value]) => Number(value) || 0),
    1
  );

  return `
    <div class="coverage-block">
      <div class="coverage-title">Cobertura</div>

      <div class="coverage-list">
        ${
          entries
            .map(([medio, value]) => {
              const numericValue = Number(value) || 0;
              const width = Math.max(
                0,
                Math.min(100, (numericValue / maxValue) * 100)
              );

              return `
                <div class="coverage-item">
                  <span class="coverage-item-name">
                    ${escapeHtml(medio)}
                  </span>

                  <div class="coverage-bar">
                    <div
                      class="coverage-fill"
                      style="width:${width}%"
                    ></div>
                  </div>

                  <strong>${numericValue}</strong>
                </div>
              `;
            })
            .join("")
        }
      </div>
    </div>
  `;
}

function renderExample(example) {
  if (!example) {
    return "";
  }

  const image = cleanMarkdownUrl(example.imagen || "");
  const link = cleanMarkdownUrl(example.link || "");
  const title = example.titulo || "Nota sin título";

  return `
    <article class="example-card">
      ${
        image
          ? `
            <img
              class="example-image"
              src="${escapeAttribute(image)}"
              alt=""
              loading="lazy"
            >
          `
          : `<div class="example-image"></div>`
      }

      <div>
        ${
          example.medio
            ? `
              <div class="example-medium">
                ${escapeHtml(example.medio)}
              </div>
            `
            : ""
        }

        <div class="example-title">
          ${
            link
              ? `
                <a
                  href="${escapeAttribute(link)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ${escapeHtml(title)}
                </a>
              `
              : escapeHtml(title)
          }
        </div>
      </div>
    </article>
  `;
}

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
      const url = cleanMarkdownUrl(item[field]);

      if (url) {
        return url;
      }
    }
  }

  if (Array.isArray(item?.ejemplos)) {
    for (const example of item.ejemplos) {
      if (example?.imagen) {
        const url = cleanMarkdownUrl(example.imagen);

        if (url) {
          return url;
        }
      }
    }
  }

  return "";
}

function getCategoryLabel(tipo) {
  const labels = {
    hipercompetencia: "Hipercompetencia",
    perfil_pierde: "Perfil pierde",
    sin_cobertura_perfil: "Sin cobertura",
    oportunidades: "Oportunidad",
    mas_temas: "Más temas"
  };

  return labels[tipo] || tipo || "";
}

function getAllItems() {
  if (!dashboardData) {
    return [];
  }

  const categories = [
    "hipercompetencia",
    "perfil_pierde",
    "sin_cobertura_perfil",
    "oportunidades",
    "mas_temas"
  ];

  return categories.flatMap(category =>
    Array.isArray(dashboardData[category])
      ? dashboardData[category]
      : []
  );
}

function cleanMarkdownUrl(value) {
  if (!value) {
    return "";
  }

  let stringValue = String(value).trim();

  const markdownMatch = stringValue.match(
    /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/
  );

  if (markdownMatch) {
    stringValue = markdownMatch[2];
  }

  return stringValue
    .replace(/\\\\\&/g, "&")
    .replace(/&amp;/g, "&");
}

function parseLocalDate(value) {
  if (!value) {
    return null;
  }

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);

  return new Date(year, month, day);
}

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

categoryTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    currentCategory = tab.dataset.category;

    categoryTabs.forEach(otherTab => {
      otherTab.classList.toggle("active", otherTab === tab);
    });

    renderCategory();
  });
});

sortSelect.addEventListener("change", event => {
  currentSort = event.target.value;
  renderCategory();
});


