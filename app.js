const DATA_URL =
  "https://raw.githubusercontent.com/rominalv/informe-competencia-perfil/main/data.json";

const loading = document.getElementById("loading");
const error = document.getElementById("error");
const content = document.getElementById("content");

const analysisDate = document.getElementById("analysisDate");
const priorities = document.getElementById("priorities");

const themeGrid = document.getElementById("themeGrid");
const emptyState = document.getElementById("emptyState");

const categoryTitle =
  document.getElementById("categoryTitle");

const categoryDescription =
  document.getElementById("categoryDescription");

const sortSelect =
  document.getElementById("sortSelect");

const monitoringSection =
  document.getElementById("monitoringSection");

const categoryTabs =
  document.querySelectorAll(".category-tab");


/* =========================================================
   ESTADO
========================================================= */

let data = null;

let currentCategory =
  "hipercompetencia";


/* =========================================================
   CATEGORÍAS
========================================================= */

const categoryInfo = {

  hipercompetencia: {

    title:
      "Hipercompetencia",

    description:
      "Temas donde Perfil y varios competidores concentran cobertura."

  },

  perfil_pierde: {

    title:
      "Perfil pierde",

    description:
      "Temas donde los competidores tienen más cobertura que Perfil."

  },

  sin_cobertura_perfil: {

    title:
      "Sin cobertura",

    description:
      "Temas cubiertos por la competencia sin presencia de Perfil."

  },

  oportunidades: {

    title:
      "Oportunidades",

    description:
      "Temas donde existe una oportunidad editorial para Perfil."

  }

};


/* =========================================================
   HELPERS
========================================================= */

function cleanText(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/<[^>]*>/g, "")
    .trim();

}


function escapeHtml(value) {

  return cleanText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function normalize(value) {

  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

}


function safeNumber(value) {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;

}


/* =========================================================
   FECHA
========================================================= */

function formatAnalysisDate(dateValue) {

  if (!dateValue) {
    return "";
  }

  const parts =
    String(dateValue).split("-");

  if (parts.length !== 3) {
    return `Análisis: ${dateValue}`;
  }

  const year =
    Number(parts[0]);

  const month =
    Number(parts[1]);

  const day =
    Number(parts[2]);

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

  if (
    !year ||
    !month ||
    !day ||
    !months[month - 1]
  ) {

    return `Análisis: ${dateValue}`;

  }

  return `Análisis: ${day} de ${months[month - 1]} de ${year}`;

}


/* =========================================================
   IMAGEN
========================================================= */

function getImage(item) {

  return (
    item?.imagen ||
    item?.image ||
    item?.image_url ||
    item?.imagen_url ||
    item?.thumbnail ||
    ""
  );

}


/* =========================================================
   CARGA
========================================================= */

async function loadData() {

  loading.classList.remove("hidden");
  error.classList.add("hidden");
  content.classList.add("hidden");

  try {

    const url =
      `${DATA_URL}?t=${Date.now()}`;

    const response =
      await fetch(
        url,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }

    data =
      await response.json();

    renderDashboard();

    loading.classList.add("hidden");
    content.classList.remove("hidden");

  } catch (err) {

    console.error(
      "Error cargando data.json:",
      err
    );

    loading.classList.add("hidden");
    error.classList.remove("hidden");

  }

}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

  analysisDate.textContent =
    formatAnalysisDate(
      data.fecha_analisis
    );

  renderPriorities();

  renderCategory(
    currentCategory
  );

}


/* =========================================================
   PRIORIDADES
========================================================= */

function renderPriorities() {

  priorities.innerHTML = "";

  const items =
    Array.isArray(
      data.prioridades_del_dia
    )
      ? data.prioridades_del_dia
      : [];

  if (!items.length) {

    priorities.innerHTML = `
      <div class="empty-state">
        No hay prioridades para este día.
      </div>
    `;

    return;

  }


  items.forEach(
    (item, index) => {

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "priority-card";

      /*
       * Guardamos toda la información
       * necesaria para encontrar el tema.
       */

      const category =
        item.categoria ||
        item.tipo ||
        item.category ||
        "";

      const topic =
        item.tema ||
        item.titulo ||
        item.title ||
        item.prioridad ||
        "";

      card.dataset.category =
        normalize(category);

      card.dataset.topic =
        normalize(topic);


      const image =
        getImage(item);

      const imageHtml =
        image
          ? `
            <div class="priority-image">
              <img
                src="${escapeHtml(image)}"
                alt=""
                loading="lazy"
              >
            </div>
          `
          : `
            <div class="priority-image"></div>
          `;


      const title =
        escapeHtml(
          item.tema ||
          item.titulo ||
          item.title ||
          item.prioridad ||
          "Prioridad editorial"
        );


      const type =
        escapeHtml(
          item.categoria ||
          item.tipo ||
          "Prioridad editorial"
        );


      card.innerHTML = `

        ${imageHtml}

        <div class="priority-number">
          ${index + 1}
        </div>

        <div class="priority-content">

          <div class="priority-type">
            ${type}
          </div>

          <div class="priority-title">
            ${title}
          </div>

        </div>

      `;


      /*
       * CLICK:
       * activa la categoría correspondiente
       * y lleva al tema.
       */

      card.addEventListener(
        "click",
        () => {

          goToPriority(
            card.dataset.category,
            card.dataset.topic
          );

        }
      );


      /*
       * También permite ENTER/SPACE
       * para accesibilidad.
       */

      card.setAttribute(
        "tabindex",
        "0"
      );

      card.setAttribute(
        "role",
        "button"
      );


      card.addEventListener(
        "keydown",
        event => {

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {

            event.preventDefault();

            goToPriority(
              card.dataset.category,
              card.dataset.topic
            );

          }

        }
      );


      priorities.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   NAVEGAR DESDE PRIORIDADES
========================================================= */

function goToPriority(
  priorityCategory,
  priorityTopic
) {

  const category =
    resolveCategory(
      priorityCategory
    );


  /*
   * Primero cambiamos la pestaña.
   */

  if (category) {

    setCategory(
      category,
      false
    );

  }


  /*
   * Bajamos hasta Monitoreo.
   */

  monitoringSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });


  /*
   * Esperamos un poco para que
   * el contenido se haya renderizado.
   */

  setTimeout(
    () => {

      const cards =
        themeGrid.querySelectorAll(
          ".theme-card"
        );


      let target = null;


      /*
       * Buscamos coincidencia exacta.
       */

      cards.forEach(
        card => {

          if (target) {
            return;
          }

          const title =
            normalize(
              card.dataset.topic || ""
            );

          if (
            title === priorityTopic
          ) {

            target = card;

          }

        }
      );


      /*
       * Si no encuentra coincidencia exacta,
       * busca si uno contiene al otro.
       */

      if (!target) {

        cards.forEach(
          card => {

            if (target) {
              return;
            }

            const title =
              normalize(
                card.dataset.topic || ""
              );

            if (
              title.includes(priorityTopic) ||
              priorityTopic.includes(title)
            ) {

              target = card;

            }

          }
        );

      }


      if (target) {

        target.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });


        /*
         * Lo resaltamos brevemente.
         */

        target.classList.add(
          "priority-target"
        );


        setTimeout(
          () => {

            target.classList.remove(
              "priority-target"
            );

          },
          1800
        );

      }

    },
    350
  );

}


/* =========================================================
   RESOLVER CATEGORÍA
========================================================= */

function resolveCategory(value) {

  const normalized =
    normalize(value);


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
      "pierde"
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


  /*
   * Si el JSON ya usa exactamente
   * el nombre técnico.
   */

  if (
    Object.prototype.hasOwnProperty.call(
      categoryInfo,
      normalized
    )
  ) {

    return normalized;

  }


  return null;

}


/* =========================================================
   CAMBIO DE CATEGORÍA
========================================================= */

function setCategory(
  category,
  scroll = true
) {

  if (
    !categoryInfo[category]
  ) {

    category =
      "hipercompetencia";

  }


  currentCategory =
    category;


  categoryTabs.forEach(
    tab => {

      tab.classList.toggle(
        "active",
        tab.dataset.category === category
      );

    }
  );


  const info =
    categoryInfo[category];


  categoryTitle.textContent =
    info.title;


  categoryDescription.textContent =
    info.description;


  renderCategory(
    category
  );


  if (scroll) {

    monitoringSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

}


/* =========================================================
   RENDER CATEGORÍA
========================================================= */

function renderCategory(
  category
) {

  const items =
    Array.isArray(
      data?.[category]
    )
      ? [
          ...data[category]
        ]
      : [];


  /*
   * Orden
   */

  sortItems(
    items,
    sortSelect.value
  );


  themeGrid.innerHTML = "";


  if (!items.length) {

    themeGrid.classList.add(
      "hidden"
    );

    emptyState.classList.remove(
      "hidden"
    );

    return;

  }


  themeGrid.classList.remove(
    "hidden"
  );

  emptyState.classList.add(
    "hidden"
  );


  items.forEach(
    item => {

      themeGrid.appendChild(
        createThemeCard(
          item,
          category
        )
      );

    }
  );

}


/* =========================================================
   ORDENAMIENTO
========================================================= */

function sortItems(
  items,
  sort
) {

  if (sort === "brecha") {

    items.sort(
      (
        a,
        b
      ) => {

        const gapA =
          getGap(a);

        const gapB =
          getGap(b);

        return gapA - gapB;

      }
    );

    return;

  }


  if (sort === "notas") {

    items.sort(
      (
        a,
        b
      ) => {

        return (
          getTotalNotes(b) -
          getTotalNotes(a)
        );

      }
    );

    return;

  }


  if (sort === "medios") {

    items.sort(
      (
        a,
        b
      ) => {

        return (
          getMediaCount(b) -
          getMediaCount(a)
        );

      }
    );

    return;

  }


  if (sort === "az") {

    items.sort(
      (
        a,
        b
      ) => {

        return normalize(
          a.tema
        ).localeCompare(
          normalize(b.tema)
        );

      }
    );

  }

}


/* =========================================================
   MÉTRICAS
========================================================= */

function getPerfilNotes(
  item
) {

  return safeNumber(
    item.perfil ??
    item.perfil_notas ??
    item.notas_perfil ??
    0
  );

}


function getBestCompetitor(
  item
) {

  const competitors =
    item.competidores ||
    item.competencia ||
    item.medios ||
    {};


  let best =
    0;


  if (
    Array.isArray(
      competitors
    )
  ) {

    competitors.forEach(
      competitor => {

        const value =
          safeNumber(
            competitor.notas ??
            competitor.cantidad ??
            competitor.total ??
            competitor.count ??
            0
          );

        best =
          Math.max(
            best,
            value
          );

      }
    );

  } else {

    Object.values(
      competitors
    ).forEach(
      value => {

        best =
          Math.max(
            best,
            safeNumber(value)
          );

      }
    );

  }


  return best;

}


function getGap(
  item
) {

  if (
    item.brecha !== undefined
  ) {

    return safeNumber(
      item.brecha
    );

  }


  return (
    getPerfilNotes(item) -
    getBestCompetitor(item)
  );

}


function getTotalNotes(
  item
) {

  if (
    item.total_notas !== undefined
  ) {

    return safeNumber(
      item.total_notas
    );

  }


  if (
    item.total_competidores !== undefined
  ) {

    return (
      getPerfilNotes(item) +
      safeNumber(
        item.total_competidores
      )
    );

  }


  return getPerfilNotes(item);

}


function getMediaCount(
  item
) {

  if (
    item.total_medios !== undefined
  ) {

    return safeNumber(
      item.total_medios
    );

  }


  const competitors =
    item.competidores ||
    item.competencia ||
    item.medios ||
    {};


  if (
    Array.isArray(
      competitors
    )
  ) {

    return competitors.length;

  }


  return Object.keys(
    competitors
  ).length;

}


/* =========================================================
   CARD TEMÁTICA
========================================================= */

function createThemeCard(
  item,
  category
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "theme-card";


  const topic =
    cleanText(
      item.tema ||
      item.titulo ||
      "Sin título"
    );


  card.dataset.topic =
    normalize(topic);


  const image =
    getImage(item);


  const imageHtml =
    image
      ? `
        <img
          src="${escapeHtml(image)}"
          alt=""
          loading="lazy"
        >
      `
      : "";


  const perfil =
    getPerfilNotes(item);


  const bestCompetitor =
    getBestCompetitor(item);


  const gap =
    getGap(item);


  const totalNotes =
    getTotalNotes(item);


  const mediaCount =
    getMediaCount(item);


  const insight =
    cleanText(
      item.insight ||
      item.por_que_importa ||
      ""
    );


  const action =
    cleanText(
      item.accion_sugerida ||
      ""
    );


  const approaches =
    Array.isArray(
      item.enfoques_sugeridos
    )
      ? item.enfoques_sugeridos
      : [];


  const examples =
    Array.isArray(
      item.notas_usadas
    )
      ? item.notas_usadas
      : Array.isArray(
          item.ejemplos
        )
        ? item.ejemplos
        : [];


  const competitorRows =
    buildCoverage(
      item
    );


  card.innerHTML = `

    <div class="theme-hero">

      ${imageHtml}

      <div class="category-badge">
        ${escapeHtml(
          categoryInfo[category]?.title ||
          category
        )}
      </div>

      <div class="theme-hero-title">
        ${escapeHtml(topic)}
      </div>

    </div>


    <div class="theme-body">

      <div class="metrics">

        <div class="metric">

          <span class="metric-label">
            Perfil
          </span>

          <span class="metric-value">
            ${perfil}
          </span>

        </div>


        <div class="metric">

          <span class="metric-label">
            Competencia
          </span>

          <span class="metric-value">
            ${bestCompetitor}
          </span>

        </div>


        <div class="metric gap-metric">

          <span class="metric-label">
            Brecha Perfil
          </span>

          <span class="metric-value">
            ${gap > 0 ? "+" : ""}${gap}
          </span>

        </div>

      </div>


      <div class="coverage-title">
        Cobertura por medio
      </div>

      <div class="coverage-list">

        ${competitorRows}

      </div>


      ${
        insight
          ? `
            <div class="insight-box">

              <span class="insight-label">
                Insight
              </span>

              <p class="insight-text">
                ${escapeHtml(insight)}
              </p>

            </div>
          `
          : ""
      }


      <div class="details">

        <button
          class="detail-toggle"
          type="button">

          <span>
            Ver detalle
          </span>

          <span class="detail-arrow">
            ↓
          </span>

        </button>


        <div class="detail-content">

          ${
            action
              ? `
                <div class="action-box">

                  <span class="action-label">
                    Acción sugerida
                  </span>

                  <p class="action-text">
                    ${escapeHtml(action)}
                  </p>

                </div>
              `
              : ""
          }


          ${
            approaches.length
              ? `
                <div class="examples">

                  <div class="examples-title">
                    Enfoques sugeridos
                  </div>

                  ${approaches
                    .slice(0, 2)
                    .map(
                      (
                        approach,
                        index
                      ) => `
                        <div class="approach">

                          <span class="approach-number">
                            ${index + 1}
                          </span>

                          <span>
                            ${escapeHtml(
                              approach
                            )}
                          </span>

                        </div>
                      `
                    )
                    .join("")}

                </div>
              `
              : ""
          }


          ${
            examples.length
              ? `
                <div class="examples">

                  <div class="examples-title">
                    Notas usadas
                  </div>

                  <div class="example-list">

                    ${examples
                      .slice(0, 3)
                      .map(
                        example =>
                          createExample(
                            example
                          )
                      )
                      .join("")}

                  </div>

                </div>
              `
              : ""
          }

        </div>

      </div>

    </div>

  `;


  /*
   * Abrir/cerrar detalle
   */

  const detailToggle =
    card.querySelector(
      ".detail-toggle"
    );


  const details =
    card.querySelector(
      ".details"
    );


  if (
    detailToggle &&
    details
  ) {

    detailToggle.addEventListener(
      "click",
      () => {

        details.classList.toggle(
          "open"
        );

      }
    );

  }


  return card;

}


/* =========================================================
   COBERTURA
========================================================= */

function buildCoverage(
  item
) {

  const competitors =
    item.competidores ||
    item.competencia ||
    item.medios ||
    {};


  const rows = [];


  rows.push({
    name: "Perfil",
    value: getPerfilNotes(item),
    perfil: true
  });


  if (
    Array.isArray(
      competitors
    )
  ) {

    competitors.forEach(
      competitor => {

        rows.push({

          name:
            competitor.medio ||
            competitor.nombre ||
            competitor.name ||
            "",

          value:
            safeNumber(
              competitor.notas ??
              competitor.cantidad ??
              competitor.total ??
              competitor.count ??
              0
            ),

          perfil:
            false

        });

      }
    );

  } else {

    Object.entries(
      competitors
    ).forEach(
      (
        [
          name,
          value
        ]
      ) => {

        rows.push({

          name,

          value:
            safeNumber(value),

          perfil:
            false

        });

      }
    );

  }


  const max =
    Math.max(
      ...rows.map(
        row => row.value
      ),
      1
    );


  return rows
    .slice(0, 8)
    .map(
      row => {

        const width =
          Math.max(
            2,
            (
              row.value /
              max
            ) * 100
          );


        return `

          <div
            class="coverage-row ${
              row.perfil
                ? "perfil"
                : ""
            }">

            <span class="coverage-name">
              ${escapeHtml(
                row.name
              )}
            </span>

            <div class="coverage-track">

              <div
                class="coverage-fill"
                style="width:${width}%">
              </div>

            </div>

            <span class="coverage-value">
              ${row.value}
            </span>

          </div>

        `;

      }
    )
    .join("");

}


/* =========================================================
   EJEMPLOS
========================================================= */

function createExample(
  example
) {

  const title =
    cleanText(
      example.titulo ||
      example.title ||
      ""
    );


  const link =
    cleanText(
      example.link ||
      example.url ||
      "#"
    );


  const media =
    cleanText(
      example.medio ||
      example.media ||
      ""
    );


  const image =
    getImage(example);


  const imageHtml =
    image
      ? `
        <img
          class="example-image"
          src="${escapeHtml(image)}"
          alt=""
          loading="lazy"
        >
      `
      : `
        <div class="example-image"></div>
      `;


  return `

    <a
      class="example"
      href="${escapeHtml(link)}"
      target="_blank"
      rel="noopener noreferrer">

      ${imageHtml}

      <div class="example-content">

        <span class="example-media">
          ${escapeHtml(media)}
        </span>

        <span class="example-title">
          ${escapeHtml(title)}
        </span>

      </div>

    </a>

  `;

}


/* =========================================================
   EVENTOS TABS
========================================================= */

categoryTabs.forEach(
  tab => {

    tab.addEventListener(
      "click",
      () => {

        setCategory(
          tab.dataset.category
        );

      }
    );

  }
);


/* =========================================================
   ORDEN
========================================================= */

sortSelect.addEventListener(
  "change",
  () => {

    renderCategory(
      currentCategory
    );

  }
);


/* =========================================================
   CARGAR
========================================================= */

loadData();
