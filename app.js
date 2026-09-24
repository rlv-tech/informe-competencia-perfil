const DATA_URL = "data.json";

const MEDIA = [
  "Perfil",
  "La Nación",
  "Clarín",
  "Infobae",
  "TN",
  "Ámbito",
  "Página 12",
  "El Cronista"
];

const CATEGORY_INFO = {

  hipercompetencia: {
    title: "Hipercompetencia",
    description:
      "Temas con cobertura acumulada de tres o más medios."
  },

  perfil_pierde: {
    title: "Perfil pierde",
    description:
      "Temas donde un competidor individual supera la cobertura de Perfil."
  },

  sin_cobertura_perfil: {
    title: "Sin cobertura",
    description:
      "Temas cubiertos por al menos dos competidores sin cobertura de Perfil."
  },

  oportunidades: {
    title: "Oportunidades",
    description:
      "Temas cubiertos por un único competidor y todavía sin cobertura de Perfil."
  }

};


let DATA = null;

let currentCategory = "hipercompetencia";

let currentSort = "brecha";


/* =========================================================
   ELEMENTOS
========================================================= */

const loading =
  document.getElementById("loading");

const errorBox =
  document.getElementById("error");

const content =
  document.getElementById("content");

const analysisDate =
  document.getElementById("analysisDate");

const priorities =
  document.getElementById("priorities");

const competitiveMap =
  document.getElementById("competitiveMap");

const themeGrid =
  document.getElementById("themeGrid");

const emptyState =
  document.getElementById("emptyState");

const categoryTitle =
  document.getElementById("categoryTitle");

const categoryDescription =
  document.getElementById("categoryDescription");

const sortSelect =
  document.getElementById("sortSelect");

const refreshBtn =
  document.getElementById("refreshBtn");


/* =========================================================
   UTILIDADES
========================================================= */

function normalizeMedia(media) {

  if (!media) return "";

  const value =
    String(media)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const aliases = {

    "perfil": "Perfil",

    "clarin": "Clarín",
    "clarín": "Clarín",

    "ambito": "Ámbito",
    "ámbito": "Ámbito",

    "pagina 12": "Página 12",
    "pagina12": "Página 12",
    "página 12": "Página 12",

    "cronista": "El Cronista",
    "el cronista": "El Cronista",

    "la nacion": "La Nación",
    "la nación": "La Nación",
    "lanacion": "La Nación",

    "infobae": "Infobae",
    "tn": "TN"
  };

  return aliases[value] || media;
}


function cleanText(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function safeNumber(value) {

  const number = Number(value);

  return Number.isFinite(number)
    ? Math.max(0, number)
    : 0;
}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatDate(value) {

  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return cleanText(value);
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone:
        "America/Argentina/Buenos_Aires"
    }
  ).format(date);
}


function getImage(item) {

  return (
    item?.imagen ||
    item?.Imagen ||
    item?.image ||
    item?.image_url ||
    ""
  );
}


function getTitle(item) {

  return cleanText(
    item?.titulo ||
    item?.Título ||
    item?.title ||
    ""
  );
}


function getLink(item) {

  return (
    item?.link ||
    item?.Link ||
    ""
  );
}


function getMedium(item) {

  return normalizeMedia(
    item?.medio ||
    item?.Medio ||
    ""
  );
}


/* =========================================================
   COBERTURA
========================================================= */

function normalizeCoverage(raw) {

  const coverage = {};

  MEDIA.forEach(media => {
    coverage[media] = 0;
  });

  if (
    !raw ||
    typeof raw !== "object"
  ) {
    return coverage;
  }

  Object.entries(raw)
    .forEach(([key, value]) => {

      const media =
        normalizeMedia(key);

      if (MEDIA.includes(media)) {
        coverage[media] =
          safeNumber(value);
      }

    });

  return coverage;
}


function getTotalCoverage(theme) {

  const coverage =
    normalizeCoverage(
      theme.cobertura
    );

  return MEDIA.reduce(
    (total, media) =>
      total + coverage[media],
    0
  );
}


function getCompetitorCount(theme) {

  const coverage =
    normalizeCoverage(
      theme.cobertura
    );

  return MEDIA.filter(
    media =>
      media !== "Perfil" &&
      coverage[media] > 0
  ).length;
}


function getBestCompetitor(theme) {

  const coverage =
    normalizeCoverage(
      theme.cobertura
    );

  let best = {
    media: "",
    count: 0
  };

  MEDIA
    .filter(media =>
      media !== "Perfil"
    )
    .forEach(media => {

      if (
        coverage[media] >
        best.count
      ) {

        best = {
          media,
          count: coverage[media]
        };

      }

    });

  return best;
}


/*
  La brecha se calcula contra el competidor
  individual con mayor cobertura.
*/

function getGap(theme) {

  const coverage =
    normalizeCoverage(
      theme.cobertura
    );

  const perfil =
    coverage["Perfil"];

  const best =
    getBestCompetitor(theme);

  return Math.max(
    0,
    best.count - perfil
  );
}


function getMaxCoverage(theme) {

  const coverage =
    normalizeCoverage(
      theme.cobertura
    );

  return Math.max(
    1,
    ...MEDIA.map(
      media => coverage[media]
    )
  );
}


/* =========================================================
   IMAGEN
========================================================= */

function getHeroImage(theme) {

  if (theme?.imagen) {
    return theme.imagen;
  }

  const examples =
    Array.isArray(theme?.ejemplos)
      ? theme.ejemplos
      : [];

  for (const example of examples) {

    const image =
      getImage(example);

    if (image) {
      return image;
    }

  }

  return "";
}


/* =========================================================
   NORMALIZAR TEMA
========================================================= */

function normalizeTheme(
  theme,
  category
) {

  const coverage =
    normalizeCoverage(
      theme?.cobertura
    );

  const examples =
    Array.isArray(theme?.ejemplos)

      ? theme.ejemplos
          .map(example => ({
            medio:
              getMedium(example),

            titulo:
              getTitle(example),

            link:
              getLink(example),

            imagen:
              getImage(example)
          }))

      : [];

  const approaches =
    Array.isArray(
      theme?.enfoques_sugeridos
    )

      ? theme.enfoques_sugeridos
          .map(item =>
            cleanText(item)
          )
          .filter(Boolean)
          .slice(0, 2)

      : [];

  const normalized = {

    ...theme,

    tema:
      cleanText(
        theme?.tema ||
        "Sin título"
      ),

    tipo:
      category,

    por_que_importa:
      cleanText(
        theme?.por_que_importa
      ),

    insight:
      cleanText(
        theme?.insight
      ),

    accion_sugerida:
      cleanText(
        theme?.accion_sugerida
      ),

    cobertura:
      coverage,

    ejemplos:
      examples,

    enfoques_sugeridos:
      approaches

  };

  normalized._total =
    getTotalCoverage(normalized);

  normalized._medios =
    getCompetitorCount(normalized);

  normalized._brecha =
    getGap(normalized);

  normalized._perfil =
    coverage["Perfil"];

  normalized._competencia =
    MEDIA
      .filter(media =>
        media !== "Perfil"
      )
      .reduce(
        (total, media) =>
          total + coverage[media],
        0
      );

  normalized._hero =
    getHeroImage(normalized);

  return normalized;
}


/* =========================================================
   CATEGORÍAS
========================================================= */

function getCategoryThemes(
  category
) {

  const list =
    Array.isArray(
      DATA?.[category]
    )
      ? DATA[category]
      : [];

  return list.map(theme =>
    normalizeTheme(
      theme,
      category
    )
  );
}


/* =========================================================
   PRIORIDADES
========================================================= */

function renderPriorities() {

  const list =
    Array.isArray(
      DATA?.prioridades_del_dia
    )
      ? DATA.prioridades_del_dia
      : [];

  const normalized =
    list
      .map(theme =>
        normalizeTheme(
          theme,
          theme?.tipo ||
          "prioridad"
        )
      )
      .slice(0, 3);

  if (!normalized.length) {

    priorities.innerHTML = `
      <div class="empty-state">
        No hay prioridades definidas
        para este análisis.
      </div>
    `;

    return;
  }

  priorities.innerHTML =
    normalized.map(
      (theme, index) => {

        const image =
          theme._hero;

        return `
          <article class="priority-card">

            <div class="priority-image">

              ${
                image
                  ? `
                    <img
                      src="${escapeHtml(image)}"
                      alt="${escapeHtml(theme.tema)}"
                      loading="lazy"
                    >
                  `
                  : ""
              }

            </div>

            <span class="priority-number">
              ${index + 1}
            </span>

            <div class="priority-content">

              <div class="priority-type">

                ${
                  escapeHtml(
                    CATEGORY_INFO[
                      theme.tipo
                    ]?.title ||
                    theme.tipo ||
                    "Prioridad"
                  )
                }

              </div>

              <div class="priority-title">

                ${escapeHtml(
                  theme.tema
                )}

              </div>

            </div>

          </article>
        `;

      }
    ).join("");
}


/* =========================================================
   RADAR DE BRECHAS
========================================================= */

function renderCompetitiveMap() {

  const allThemes = [];

  Object.keys(
    CATEGORY_INFO
  ).forEach(category => {

    getCategoryThemes(
      category
    ).forEach(theme => {

      allThemes.push(theme);

    });

  });


  const unique =
    new Map();


  allThemes.forEach(theme => {

    const key =
      theme.tema
        .toLowerCase()
        .trim();

    if (!unique.has(key)) {

      unique.set(
        key,
        theme
      );

    }

  });


  const themes =
    Array.from(
      unique.values()
    )
    .sort((a, b) =>
      b._brecha - a._brecha ||
      b._total - a._total
    )
    .slice(0, 8);


  if (!themes.length) {

    competitiveMap.innerHTML = `
      <div class="empty-state">
        No hay datos suficientes
        para mostrar las brechas.
      </div>
    `;

    return;
  }


  competitiveMap.innerHTML =
    themes.map(theme => {

      const best =
        getBestCompetitor(
          theme
        );

      const gap =
        getGap(theme);

      const max =
        Math.max(
          1,
          theme._perfil,
          best.count
        );

      const width =
        (best.count / max) *
        100;


      return `
        <div class="gap-row">

          <div class="gap-topic">
            ${escapeHtml(
              theme.tema
            )}
          </div>


          <div class="gap-perfil">

            <span class="gap-media-label">
              Perfil
            </span>

            <span class="gap-perfil-number">
              ${theme._perfil}
            </span>

          </div>


          <div class="gap-competitor">

            <span class="gap-competitor-name">
              ${escapeHtml(
                best.media ||
                "Competencia"
              )}
            </span>

            <div class="gap-mini-track">

              <div
                class="gap-mini-fill"
                style="width:${width}%">
              </div>

            </div>

            <span class="gap-competitor-number">
              ${best.count}
            </span>

          </div>


          <div class="gap-badge">

            ${
              gap > 0
                ? `+${gap} brecha Perfil`
                : `Sin brecha`
            }

          </div>

        </div>
      `;

    }).join("");
}


/* =========================================================
   MONITOREO
========================================================= */

function renderCategory() {

  const themes =
    getCategoryThemes(
      currentCategory
    );


  categoryTitle.textContent =
    CATEGORY_INFO[
      currentCategory
    ]?.title ||
    currentCategory;


  categoryDescription.textContent =
    CATEGORY_INFO[
      currentCategory
    ]?.description ||
    "";


  let sorted =
    [...themes];


  /* MAYOR BRECHA */

  if (
    currentSort ===
    "brecha"
  ) {

    sorted.sort(
      (a, b) =>
        b._brecha -
        a._brecha ||

        b._total -
        a._total
    );

  }


  /* MÁS NOTAS */

  else if (
    currentSort ===
    "notas"
  ) {

    sorted.sort(
      (a, b) =>
        b._total -
        a._total ||

        b._brecha -
        a._brecha
    );

  }


  /* MÁS MEDIOS */

  else if (
    currentSort ===
    "medios"
  ) {

    sorted.sort(
      (a, b) =>
        b._medios -
        a._medios ||

        b._total -
        a._total
    );

  }


  /* A-Z */

  else if (
    currentSort ===
    "az"
  ) {

    sorted.sort(
      (a, b) =>
        a.tema.localeCompare(
          b.tema,
          "es",
          {
            sensitivity:
              "base"
          }
        )
    );

  }


  if (!sorted.length) {

    themeGrid.innerHTML = "";

    emptyState.classList.remove(
      "hidden"
    );

    return;
  }


  emptyState.classList.add(
    "hidden"
  );


  themeGrid.innerHTML =
    sorted.map(
      (theme, index) =>
        renderThemeCard(
          theme,
          index
        )
    ).join("");


  attachDetailEvents();
}


/* =========================================================
   CARD
========================================================= */

function renderThemeCard(
  theme,
  index
) {

  const hero =
    theme._hero;

  const categoryName =
    CATEGORY_INFO[
      theme.tipo
    ]?.title ||
    theme.tipo ||
    "Tema";


  const max =
    getMaxCoverage(
      theme
    );


  const gap =
    getGap(theme);


  const approaches =
    theme.enfoques_sugeridos ||
    [];


  const examples =
    (theme.ejemplos || [])
      .slice(0, 3);


  const opportunityType =
    cleanText(
      theme.tipo_de_oportunidad
    );


  const opportunityReason =
    cleanText(
      theme.motivo_oportunidad
    );


  return `
    <article class="theme-card">


      <!-- IMAGEN + TEMA -->

      <div class="theme-hero">

        ${
          hero
            ? `
              <img
                src="${escapeHtml(hero)}"
                alt="${escapeHtml(theme.tema)}"
                loading="lazy"
              >
            `
            : ""
        }


        <span class="category-badge">

          ${escapeHtml(
            categoryName
          )}

        </span>


        <div class="theme-hero-title">

          ${escapeHtml(
            theme.tema
          )}

        </div>

      </div>


      <div class="theme-body">


        <!-- MÉTRICAS -->

        <div class="metrics">


          <div class="metric">

            <span class="metric-label">
              Notas
            </span>

            <span class="metric-value">
              ${theme._total}
            </span>

          </div>


          <div class="metric">

            <span class="metric-label">
              Medios
            </span>

            <span class="metric-value">
              ${theme._medios}
            </span>

          </div>


          <div class="metric gap-metric">

            <span class="metric-label">
              Brecha Perfil
            </span>

            <span class="metric-value">

              ${
                gap > 0
                  ? `+${gap}`
                  : "0"
              }

            </span>

          </div>


        </div>


        <!-- COBERTURA -->

        <div class="coverage-title">
          Cobertura por medio
        </div>


        <div class="coverage-list">

          ${
            MEDIA.map(
              media => {

                const value =
                  safeNumber(
                    theme.cobertura[
                      media
                    ]
                  );

                const width =
                  (value / max) *
                  100;


                return `
                  <div
                    class="coverage-row ${
                      media === "Perfil"
                        ? "perfil"
                        : ""
                    }">

                    <span class="coverage-name">
                      ${escapeHtml(
                        media
                      )}
                    </span>


                    <div class="coverage-track">

                      <div
                        class="coverage-fill"
                        style="width:${width}%">
                      </div>

                    </div>


                    <span class="coverage-value">
                      ${value}
                    </span>

                  </div>
                `;

              }
            ).join("")
          }

        </div>


        <!-- INSIGHT VISIBLE -->

        ${
          theme.insight
            ? `
              <div class="insight-box">

                <span class="insight-label">
                  Insight
                </span>

                <p class="insight-text">
                  ${escapeHtml(
                    theme.insight
                  )}
                </p>

              </div>
            `
            : ""
        }


        <!-- TODO LO DEMÁS DENTRO DEL DESPLEGABLE -->

        ${
          theme.accion_sugerida ||
          approaches.length ||
          examples.length ||
          opportunityType ||
          opportunityReason

            ? `

              <div class="details">

                <button
                  class="detail-toggle"
                  type="button">

                  <span>
                    Ver análisis y notas usadas
                  </span>

                  <span class="detail-arrow">
                    ↓
                  </span>

                </button>


                <div class="detail-content">


                  <!-- ACCIÓN -->

                  ${
                    theme.accion_sugerida
                      ? `
                        <div class="action-box">

                          <span class="action-label">
                            Acción sugerida
                          </span>

                          <p class="action-text">
                            ${escapeHtml(
                              theme.accion_sugerida
                            )}
                          </p>

                        </div>
                      `
                      : ""
                  }


                  <!-- OPORTUNIDAD -->

                  ${
                    currentCategory ===
                      "oportunidades" &&
                    (
                      opportunityType ||
                      opportunityReason
                    )

                      ? `
                        <div class="insight-box">

                          ${
                            opportunityType
                              ? `
                                <span class="insight-label">
                                  Tipo de oportunidad
                                </span>

                                <p class="insight-text">
                                  ${escapeHtml(
                                    opportunityType
                                  )}
                                </p>
                              `
                              : ""
                          }


                          ${
                            opportunityReason
                              ? `
                                <p class="insight-text">
                                  ${escapeHtml(
                                    opportunityReason
                                  )}
                                </p>
                              `
                              : ""
                          }

                        </div>
                      `
                      : ""
                  }


                  <!-- ENFOQUES -->

                  ${
                    approaches.length
                      ? `

                        <div class="examples">

                          <div class="examples-title">
                            Enfoques sugeridos
                          </div>


                          ${
                            approaches.map(
                              (approach, i) => `

                                <div class="approach">

                                  <span class="approach-number">
                                    ${i + 1}
                                  </span>

                                  <span>
                                    ${escapeHtml(
                                      approach
                                    )}
                                  </span>

                                </div>

                              `
                            ).join("")
                          }

                        </div>

                      `
                      : ""
                  }


                  <!-- NOTAS USADAS -->

                  ${
                    examples.length
                      ? `

                        <div class="examples">

                          <div class="examples-title">
                            Notas usadas
                          </div>


                          <div class="example-list">

                            ${
                              examples.map(
                                example => {

                                  const image =
                                    getImage(
                                      example
                                    );

                                  const title =
                                    getTitle(
                                      example
                                    );

                                  const medium =
                                    getMedium(
                                      example
                                    );

                                  const link =
                                    getLink(
                                      example
                                    );


                                  return `

                                    <a
                                      class="example"
                                      href="${escapeHtml(link)}"
                                      target="_blank"
                                      rel="noopener noreferrer">


                                      ${
                                        image
                                          ? `
                                            <img
                                              class="example-image"
                                              src="${escapeHtml(image)}"
                                              alt="${escapeHtml(title)}"
                                              loading="lazy"
                                            >
                                          `
                                          : `
                                            <div class="example-image"></div>
                                          `
                                      }


                                      <div class="example-content">

                                        <span class="example-media">
                                          ${escapeHtml(
                                            medium
                                          )}
                                        </span>


                                        <span class="example-title">
                                          ${escapeHtml(
                                            title
                                          )}
                                        </span>

                                      </div>


                                    </a>

                                  `;

                                }
                              ).join("")
                            }

                          </div>

                        </div>

                      `
                      : ""
                  }


                </div>

              </div>

            `
            : ""
        }


      </div>

    </article>
  `;
}


/* =========================================================
   DESPLEGABLES
========================================================= */

function attachDetailEvents() {

  document
    .querySelectorAll(
      ".detail-toggle"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const details =
            button.closest(
              ".details"
            );

          if (!details) {
            return;
          }

          details.classList.toggle(
            "open"
          );

        }
      );

    });

}


/* =========================================================
   TABS
========================================================= */

function attachCategoryEvents() {

  document
    .querySelectorAll(
      ".category-tab"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".category-tab"
            )
            .forEach(tab =>
              tab.classList.remove(
                "active"
              )
            );


          button.classList.add(
            "active"
          );


          currentCategory =
            button.dataset.category;


          renderCategory();


          document
            .querySelector(
              ".monitoring-section"
            )
            ?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

        }
      );

    });

}


/* =========================================================
   ORDENAR
========================================================= */

sortSelect.addEventListener(
  "change",
  event => {

    currentSort =
      event.target.value;

    renderCategory();

  }
);


/* =========================================================
   ACTUALIZAR
========================================================= */

refreshBtn.addEventListener(
  "click",
  () => {

    loadData(true);

  }
);


/* =========================================================
   CARGAR JSON
========================================================= */

async function loadData(
  forceReload = false
) {

  loading.classList.remove(
    "hidden"
  );

  errorBox.classList.add(
    "hidden"
  );

  content.classList.add(
    "hidden"
  );


  try {

    const url =
      `${DATA_URL}?t=${Date.now()}`;


    const response =
      await fetch(
        url,
        {
          cache:
            forceReload
              ? "no-store"
              : "default"
        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const json =
      await response.json();


    if (
      !json ||
      typeof json !== "object"
    ) {

      throw new Error(
        "data.json no contiene un objeto válido."
      );

    }


    DATA = json;


    render();


  } catch (error) {

    console.error(
      "Error cargando data.json:",
      error
    );

    errorBox.classList.remove(
      "hidden"
    );


  } finally {

    loading.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   RENDER
========================================================= */

function render() {

  const date =
    DATA?.fecha_analisis ||
    DATA?.fecha ||
    "";


  analysisDate.textContent =
    date
      ? `Análisis: ${formatDate(date)}`
      : "Análisis editorial";


  renderPriorities();

  renderCompetitiveMap();

  renderCategory();


  content.classList.remove(
    "hidden"
  );

}


/* =========================================================
   INIT
========================================================= */

attachCategoryEvents();

loadData();
