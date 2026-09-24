const DATA_URL = "./data.json";

let data = {};
let currentCategory = "hipercompetencia";

const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const content = document.getElementById("content");

const analysisDate = document.getElementById("analysisDate");
const prioritiesContainer = document.getElementById("priorities");
const themeGrid = document.getElementById("themeGrid");
const emptyState = document.getElementById("emptyState");
const categoryTitle = document.getElementById("categoryTitle");
const categoryDescription = document.getElementById("categoryDescription");
const sortSelect = document.getElementById("sortSelect");
const monitoringSection = document.getElementById("monitoringSection");

const categoryInfo = {
  hipercompetencia: {
    title: "Hipercompetencia",
    description: "Temas donde la competencia concentra más cobertura."
  },
  perfil_pierde: {
    title: "Perfil pierde",
    description: "Temas donde otros medios publicaron y Perfil no."
  },
  sin_cobertura_perfil: {
    title: "Sin cobertura",
    description: "Temas detectados en la competencia sin cobertura de Perfil."
  },
  oportunidades: {
    title: "Oportunidades",
    description: "Temas con posibilidades concretas de cobertura."
  }
};

document.addEventListener("DOMContentLoaded", loadData);

async function loadData() {
  try {
    const response = await fetch(
      `${DATA_URL}?v=${Date.now()}`,
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    data = await response.json();

    renderDate();
    renderPriorities();
    setupCategories();
    renderCategory();

    loading.classList.add("hidden");
    content.classList.remove("hidden");

  } catch (error) {
    console.error("Error cargando data.json:", error);

    loading.classList.add("hidden");
    errorBox.classList.remove("hidden");
  }
}


/* =========================
   FECHA
========================= */

function renderDate() {
  const rawDate = data.fecha_analisis;

  if (!rawDate) {
    analysisDate.textContent = "Análisis editorial";
    return;
  }

  const parts = rawDate.split("-");

  if (parts.length !== 3) {
    analysisDate.textContent = `Análisis: ${rawDate}`;
    return;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre"
  ];

  analysisDate.textContent =
    `Análisis: ${day} de ${months[month - 1]} de ${year}`;
}


/* =========================
   PRIORIDADES
========================= */

function renderPriorities() {
  prioritiesContainer.innerHTML = "";

  let priorities = [];

  if (Array.isArray(data.prioridades_del_dia)) {
    priorities = data.prioridades_del_dia;
  }

  if (priorities.length === 0) {
    priorities = getAllThemes()
      .filter(item => Number(item.prioridad) > 0)
      .sort((a, b) => {
        return Number(a.prioridad) - Number(b.prioridad);
      })
      .slice(0, 3);
  }

  if (priorities.length === 0) {
    priorities = Array.isArray(data.hipercompetencia)
      ? data.hipercompetencia.slice(0, 3)
      : [];
  }

  priorities.slice(0, 3).forEach((item, index) => {

    const topic = getTopic(item);

    const category = resolveCategory(
      item.categoria ||
      item.tipo ||
      "hipercompetencia"
    );

    const image = getImage(item);

    const card = document.createElement("article");

    card.className = "priority-card";

    card.dataset.topic = topic;
    card.dataset.category = category;

    card.innerHTML = `
      <div class="priority-image-wrap">
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
            : `
              <div class="priority-image-placeholder">
                Sin imagen
              </div>
            `
        }

        <div class="priority-number">
          ${index + 1}
        </div>
      </div>

      <div class="priority-content">
        <div class="priority-title">
          ${escapeHtml(topic)}
        </div>
      </div>
    `;

    const imageElement =
      card.querySelector(".priority-image");

    if (imageElement) {
      imageElement.addEventListener("error", () => {
        imageElement.parentElement.innerHTML = `
          <div class="priority-image-placeholder">
            Sin imagen
          </div>
        `;
      });
    }

    card.addEventListener("click", () => {
      goToPriority(topic, category);
    });

    prioritiesContainer.appendChild(card);
  });
}


/* =========================
   TODOS LOS TEMAS
========================= */

function getAllThemes() {

  const categories = [
    "hipercompetencia",
    "perfil_pierde",
    "sin_cobertura_perfil",
    "oportunidades"
  ];

  const result = [];

  categories.forEach(category => {

    if (Array.isArray(data[category])) {

      data[category].forEach(item => {

        result.push({
          ...item,
          __category: category
        });

      });
    }
  });

  return result;
}


/* =========================
   CLICK PRIORIDAD
========================= */

function goToPriority(topic, category) {

  setCategory(category);

  setTimeout(() => {

    const cards =
      document.querySelectorAll(".theme-card");

    const target =
      normalizeText(topic);

    let targetCard = null;

    cards.forEach(card => {

      const cardTopic =
        normalizeText(
          card.dataset.topic || ""
        );

      if (cardTopic === target) {
        targetCard = card;
      }
    });

    if (!targetCard) {

      cards.forEach(card => {

        const cardTopic =
          normalizeText(
            card.dataset.topic || ""
          );

        if (
          !targetCard &&
          (
            cardTopic.includes(target) ||
            target.includes(cardTopic)
          )
        ) {
          targetCard = card;
        }
      });
    }

    monitoringSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    if (targetCard) {

      setTimeout(() => {

        targetCard.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        targetCard.classList.add(
          "priority-highlight"
        );

        setTimeout(() => {
          targetCard.classList.remove(
            "priority-highlight"
          );
        }, 2200);

      }, 350);
    }

  }, 100);
}


/* =========================
   CATEGORÍAS
========================= */

function setupCategories() {

  document
    .querySelectorAll(".category-tab")
    .forEach(tab => {

      tab.addEventListener("click", () => {

        setCategory(
          tab.dataset.category
        );

      });

    });

  sortSelect.addEventListener(
    "change",
    renderCategory
  );
}


function setCategory(category) {

  if (!categoryInfo[category]) {
    category = "hipercompetencia";
  }

  currentCategory = category;

  document
    .querySelectorAll(".category-tab")
    .forEach(tab => {

      tab.classList.toggle(
        "active",
        tab.dataset.category === category
      );

    });

  renderCategory();
}


/* =========================
   RENDER CATEGORÍA
========================= */

function renderCategory() {

  const info =
    categoryInfo[currentCategory];

  categoryTitle.textContent =
    info.title;

  categoryDescription.textContent =
    info.description;

  let items =
    Array.isArray(data[currentCategory])
      ? [...data[currentCategory]]
      : [];

  items = sortThemes(
    items,
    sortSelect.value
  );

  themeGrid.innerHTML = "";

  if (items.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  items.forEach(item => {

    themeGrid.appendChild(
      createThemeCard(
        item,
        currentCategory
      )
    );

  });
}


/* =========================
   ORDEN
========================= */

function sortThemes(items, sort) {

  return items.sort((a, b) => {

    if (sort === "notas") {
      return (
        Number(b.total_notas || 0) -
        Number(a.total_notas || 0)
      );
    }

    if (sort === "medios") {
      return (
        Number(b.cantidad_medios || 0) -
        Number(a.cantidad_medios || 0)
      );
    }

    if (sort === "az") {
      return getTopic(a).localeCompare(
        getTopic(b),
        "es",
        {
          sensitivity: "base"
        }
      );
    }

    return (
      Number(b.brecha || 0) -
      Number(a.brecha || 0)
    );
  });
}


/* =========================
   CARD TEMA
========================= */

function createThemeCard(item, category) {

  const card =
    document.createElement("article");

  card.className = "theme-card";

  const topic =
    getTopic(item);

  card.dataset.topic =
    topic;

  const image =
    getImage(item);

  const totalNotas =
    Number(item.total_notas || 0);

  const cantidadMedios =
    Number(
      item.cantidad_medios ??
      item.cantidad_medios_competencia ??
      0
    );

  const gap =
    Number(item.brecha || 0);

  const cobertura =
    item.cobertura &&
    typeof item.cobertura === "object"
      ? item.cobertura
      : {};

  const insight =
    item.insight ||
    item.por_que_importa ||
    "";

  const action =
    item.accion_sugerida ||
    "";

  const approaches =
    Array.isArray(item.enfoques_sugeridos)
      ? item.enfoques_sugeridos
      : [];

  const examples =
    Array.isArray(item.ejemplos)
      ? item.ejemplos
      : [];

  card.innerHTML = `

    <div class="theme-image-wrap">

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
          : `
            <div class="theme-image-placeholder">
              Sin imagen
            </div>
          `
      }

      <div class="category-badge">
        ${escapeHtml(
          categoryLabel(category)
        )}
      </div>

    </div>

    <div class="theme-body">

      <h3 class="theme-title">
        ${escapeHtml(topic)}
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

        <div class="theme-stat">
          <span>Brecha Perfil</span>
          <strong>${gap}</strong>
        </div>

      </div>

      ${renderCoverage(cobertura)}

      ${
        insight
          ? `
            <div class="insight-box">

              <div class="insight-label">
                Insight
              </div>

              <p class="insight-text">
                ${escapeHtml(insight)}
              </p>

            </div>
          `
          : ""
      }

      <details class="theme-details">

        <summary>
          Ver análisis y notas
        </summary>

        <div class="details-content">

          ${
            item.por_que_importa
              ? `
                <div class="detail-block">

                  <div class="detail-title">
                    Por qué importa
                  </div>

                  <p class="detail-text">
                    ${escapeHtml(
                      item.por_que_importa
                    )}
                  </p>

                </div>
              `
              : ""
          }

          ${
            action
              ? `
                <div class="detail-block">

                  <div class="detail-title">
                    Acción sugerida
                  </div>

                  <p class="detail-text">
                    ${escapeHtml(action)}
                  </p>

                </div>
              `
              : ""
          }

          ${
            approaches.length
              ? `
                <div class="detail-block">

                  <div class="detail-title">
                    Enfoques sugeridos
                  </div>

                  <ul class="detail-list">

                    ${approaches
                      .slice(0, 2)
                      .map(
                        approach => `
                          <li>
                            ${escapeHtml(approach)}
                          </li>
                        `
                      )
                      .join("")}

                  </ul>

                </div>
              `
              : ""
          }

          ${
            examples.length
              ? `
                <div class="detail-block">

                  <div class="detail-title">
                    Notas usadas
                  </div>

                  <div class="examples">

                    ${examples
                      .slice(0, 3)
                      .map(
                        example =>
                          renderExample(example)
                      )
                      .join("")}

                  </div>

                </div>
              `
              : ""
          }

        </div>

      </details>

    </div>
  `;

  const mainImage =
    card.querySelector(".theme-image");

  if (mainImage) {

    mainImage.addEventListener(
      "error",
      () => {

        mainImage.parentElement.innerHTML = `
          <div class="theme-image-placeholder">
            Sin imagen
          </div>

          <div class="category-badge">
            ${escapeHtml(
              categoryLabel(category)
            )}
          </div>
        `;

      }
    );

  }

  return card;
}


/* =========================
   COBERTURA
========================= */

function renderCoverage(cobertura) {

  const entries =
    Object.entries(cobertura);

  if (entries.length === 0) {
    return "";
  }

  const max =
    Math.max(
      ...entries.map(
        ([, count]) =>
          Number(count || 0)
      ),
      1
    );

  return `

    <div class="coverage">

      <div class="coverage-title">
        Cobertura por medio
      </div>

      <div class="coverage-list">

        ${entries
          .map(([medio, count]) => {

            const value =
              Number(count || 0);

            const width =
              value === 0
                ? 0
                : Math.max(
                    5,
                    (value / max) * 100
                  );

            return `

              <div class="coverage-row">

                <div class="coverage-medium">
                  ${escapeHtml(medio)}
                </div>

                <div class="coverage-bar">

                  <div
                    class="coverage-fill"
                    style="width:${width}%"
                  ></div>

                </div>

                <div class="coverage-count">
                  ${value}
                </div>

              </div>

            `;

          })
          .join("")}

      </div>

    </div>

  `;
}


/* =========================
   EJEMPLOS
========================= */

function renderExample(example) {

  const medium =
    example.medio || "";

  const title =
    example.titulo || "";

  const link =
    cleanMarkdownUrl(
      example.link || ""
    );

  const image =
    cleanMarkdownUrl(
      example.imagen ||
      example.image ||
      ""
    );

  return `

    <div class="example">

      ${
        image
          ? `
            <div class="example-image-wrap">

              <img
                class="example-image"
                src="${escapeAttribute(image)}"
                alt=""
                loading="lazy"
              >

            </div>
          `
          : ""
      }

      <div class="example-content">

        <div class="example-medium">
          ${escapeHtml(medium)}
        </div>

        ${
          link
            ? `
              <a
                class="example-title"
                href="${escapeAttribute(link)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                ${escapeHtml(title)}
              </a>
            `
            : `
              <div class="example-title">
                ${escapeHtml(title)}
              </div>
            `
        }

      </div>

    </div>

  `;
}


/* =========================
   IMAGEN
========================= */

function getImage(item) {

  const directImage =
    item.imagen ||
    item.image ||
    item.imagen_url ||
    item.image_url ||
    item.foto ||
    item.foto_url;

  if (directImage) {
    return cleanMarkdownUrl(
      directImage
    );
  }

  if (Array.isArray(item.ejemplos)) {

    for (const example of item.ejemplos) {

      const image =
        example.imagen ||
        example.image ||
        "";

      if (image) {
        return cleanMarkdownUrl(
          image
        );
      }
    }
  }

  return "";
}


/* =========================
   TEMA
========================= */

function getTopic(item) {

  return String(
    item.tema ||
    item.topic ||
    item.titulo ||
    item.title ||
    "Tema sin título"
  );
}


/* =========================
   CATEGORÍA
========================= */

function categoryLabel(category) {

  const labels = {
    hipercompetencia: "Hipercompetencia",
    perfil_pierde: "Perfil pierde",
    sin_cobertura_perfil: "Sin cobertura",
    oportunidades: "Oportunidad"
  };

  return labels[category] || category;
}


function resolveCategory(value) {

  const normalized =
    normalizeText(value);

  if (
    normalized.includes(
      "hipercompetencia"
    )
  ) {
    return "hipercompetencia";
  }

  if (
    normalized.includes(
      "perfil pierde"
    ) ||
    normalized.includes(
      "perfil_pierde"
    )
  ) {
    return "perfil_pierde";
  }

  if (
    normalized.includes(
      "sin cobertura"
    ) ||
    normalized.includes(
      "sin_cobertura"
    )
  ) {
    return "sin_cobertura_perfil";
  }

  if (
    normalized.includes(
      "oportunidad"
    )
  ) {
    return "oportunidades";
  }

  return "hipercompetencia";
}


/* =========================
   LIMPIAR URL
========================= */

function cleanMarkdownUrl(value) {

  if (!value) {
    return "";
  }

  let url =
    String(value).trim();

  const markdownMatch =
    url.match(
      /^\[.*?\]\((.*?)\)$/
    );

  if (markdownMatch) {
    url = markdownMatch[1];
  }

  url =
    url.replace(
      /\\&/g,
      "&"
    );

  return url.trim();
}


/* =========================
   NORMALIZAR
========================= */

function normalizeText(value) {

  return String(value || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}


/* =========================
   ESCAPAR HTML
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
