/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const DATA_URL = "./data.json";


let data = {};

let currentCategory =
  "hipercompetencia";


/* =========================================================
   ELEMENTOS
   ========================================================= */

const loading =
  document.getElementById("loading");

const error =
  document.getElementById("error");

const content =
  document.getElementById("content");

const analysisDate =
  document.getElementById("analysisDate");

const priorities =
  document.getElementById("priorities");

const monitoringSection =
  document.getElementById("monitoringSection");

const themeGrid =
  document.getElementById("themeGrid");

const emptyState =
  document.getElementById("emptyState");

const sortSelect =
  document.getElementById("sortSelect");

const categoryTitle =
  document.getElementById("categoryTitle");

const categoryDescription =
  document.getElementById("categoryDescription");

const categoryTabs =
  document.querySelectorAll(".category-tab");


/* =========================================================
   CATEGORÍAS
   ========================================================= */

const categoryInfo = {

  hipercompetencia: {

    title:
      "Hipercompetencia",

    description:
      "Temas donde la competencia concentra cobertura y Perfil también tiene presencia."

  },


  perfil_pierde: {

    title:
      "Perfil pierde",

    description:
      "Temas donde la competencia tiene mayor volumen de cobertura que Perfil."

  },


  sin_cobertura_perfil: {

    title:
      "Sin cobertura",

    description:
      "Temas con cobertura de la competencia y sin notas de Perfil."

  },


  oportunidades: {

    title:
      "Oportunidades",

    description:
      "Temas donde existe una oportunidad editorial a partir de la cobertura observada."

  }

};


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  loadData
);


/* =========================================================
   CARGAR JSON
   ========================================================= */

async function loadData() {

  try {

    showLoading();


    const response =
      await fetch(
        `${DATA_URL}?v=${Date.now()}`,
        {
          cache: "no-store"
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


    data =
      json;


    renderDate();

    renderPriorities();

    setupCategories();

    renderCategory(
      currentCategory
    );


    loading.classList.add(
      "hidden"
    );


    error.classList.add(
      "hidden"
    );


    content.classList.remove(
      "hidden"
    );

  }

  catch (err) {

    console.error(
      "Error cargando data.json:",
      err
    );


    loading.classList.add(
      "hidden"
    );


    content.classList.add(
      "hidden"
    );


    error.classList.remove(
      "hidden"
    );

  }

}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading() {

  loading.classList.remove(
    "hidden"
  );


  error.classList.add(
    "hidden"
  );


  content.classList.add(
    "hidden"
  );

}


/* =========================================================
   FECHA
   ========================================================= */

function renderDate() {

  const dateValue =
    data.fecha_analisis ||
    data.fecha ||
    data.date ||
    "";


  if (!dateValue) {

    analysisDate.textContent =
      "";

    return;

  }


  const date =
    new Date(
      `${dateValue}T12:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    analysisDate.textContent =
      `Análisis: ${dateValue}`;

    return;

  }


  const formatted =
    new Intl.DateTimeFormat(
      "es-AR",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    ).format(date);


  analysisDate.textContent =
    `Análisis: ${formatted}`;

}


/* =========================================================
   PRIORIDADES
   ========================================================= */

function renderPriorities() {

  priorities.innerHTML =
    "";


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


      const topic =
        cleanText(
          item.tema ||
          item.titulo ||
          item.title ||
          item.prioridad ||
          ""
        );


      const rawCategory =
        item.categoria ||
        item["categoría"] ||
        item.tipo ||
        item.category ||
        "";


      const category =
        resolveCategory(
          rawCategory
        );


      const image =
        getImage(item);


      card.dataset.topic =
        normalize(topic);


      card.dataset.category =
        category || "";


      card.innerHTML = `

        ${
          image
            ? `

              <img
                class="priority-image"
                src="${escapeAttribute(image)}"
                alt=""
                loading="lazy"
                onerror="this.style.display='none'"
              >

            `
            : ""
        }


        <div class="priority-content">

          <div class="priority-number">

            ${index + 1}

          </div>


          <h3 class="priority-title">

            ${escapeHtml(topic)}

          </h3>

        </div>

      `;


      card.setAttribute(
        "tabindex",
        "0"
      );


      card.setAttribute(
        "role",
        "button"
      );


      card.addEventListener(
        "click",
        () => {

          goToPriority(
            card.dataset.category,
            card.dataset.topic
          );

        }
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
   NAVEGAR DESDE PRIORIDAD
   ========================================================= */

function goToPriority(
  priorityCategory,
  priorityTopic
) {

  /*
   * Si el JSON tiene categoría,
   * activamos directamente esa pestaña.
   */

  if (priorityCategory) {

    setCategory(
      priorityCategory,
      false
    );

  }


  /*
   * Ir hasta Monitoreo.
   */

  monitoringSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });


  /*
   * Buscar el tema correspondiente.
   */

  setTimeout(
    () => {

      const cards =
        themeGrid.querySelectorAll(
          ".theme-card"
        );


      let target = null;


      /*
       * Coincidencia exacta.
       */

      cards.forEach(
        card => {

          if (target) {
            return;
          }


          const title =
            normalize(
              card.dataset.topic ||
              ""
            );


          if (
            title ===
            priorityTopic
          ) {

            target =
              card;

          }

        }
      );


      /*
       * Coincidencia parcial.
       */

      if (!target) {

        cards.forEach(
          card => {

            if (target) {
              return;
            }


            const title =
              normalize(
                card.dataset.topic ||
                ""
              );


            if (
              title.includes(
                priorityTopic
              ) ||
              priorityTopic.includes(
                title
              )
            ) {

              target =
                card;

            }

          }
        );

      }


      /*
       * Scroll y resaltado.
       */

      if (target) {

        target.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });


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
    450
  );

}


/* =========================================================
   CONFIGURAR CATEGORÍAS
   ========================================================= */

function setupCategories() {

  categoryTabs.forEach(
    tab => {

      tab.addEventListener(
        "click",
        () => {

          setCategory(
            tab.dataset.category,
            true
          );

        }
      );

    }
  );


  sortSelect.addEventListener(
    "change",
    () => {

      renderCategory(
        currentCategory
      );

    }
  );

}


/* =========================================================
   CAMBIAR CATEGORÍA
   ========================================================= */

function setCategory(
  category,
  shouldScroll
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
        tab.dataset.category ===
        category
      );

    }
  );


  renderCategory(
    category
  );


  if (shouldScroll) {

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

  const info =
    categoryInfo[category];


  categoryTitle.textContent =
    info
      ? info.title
      : category;


  categoryDescription.textContent =
    info
      ? info.description
      : "";


  let items =
    Array.isArray(
      data[category]
    )
      ? [...data[category]]
      : [];


  /*
   * ORDENAMIENTO
   */

  const sort =
    sortSelect.value;


  if (
    sort === "brecha"
  ) {

    /*
     * Más negativa primero.
     *
     * Ejemplo:
     *
     * -6
     * -4
     * -2
     *  0
     *  3
     */

    items.sort(
      (a, b) =>
        getGap(a) -
        getGap(b)
    );

  }


  else if (
    sort === "notas"
  ) {

    items.sort(
      (a, b) =>
        getTotalNotes(b) -
        getTotalNotes(a)
    );

  }


  else if (
    sort === "medios"
  ) {

    items.sort(
      (a, b) =>
        getMediaCount(b) -
        getMediaCount(a)
    );

  }


  else if (
    sort === "az"
  ) {

    items.sort(
      (a, b) =>
        getTopic(a).localeCompare(
          getTopic(b),
          "es"
        )
    );

  }


  themeGrid.innerHTML =
    "";


  if (!items.length) {

    emptyState.classList.remove(
      "hidden"
    );

    return;

  }


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
   CREAR TARJETA
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
    getTopic(item);


  card.dataset.topic =
    normalize(topic);


  const image =
    getImage(item);


  const perfil =
    getPerfilNotes(item);


  const competitor =
    getBestCompetitor(item);


  const bestCompetitorNotes =
    competitor.count;


  /*
   * BRECHA:
   *
   * Perfil - mejor competidor
   */

  const gap =
    perfil -
    bestCompetitorNotes;


  const mediaCount =
    getMediaCount(item);


  const insight =
    cleanText(
      item.insight ||
      item.por_que_importa ||
      item["por qué importa"] ||
      ""
    );


  const action =
    cleanText(
      item.accion_sugerida ||
      item["acción sugerida"] ||
      item.accion ||
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
      ? item.notas_usadas.slice(
          0,
          3
        )
      : Array.isArray(
          item.ejemplos
        )
        ? item.ejemplos.slice(
            0,
            3
          )
        : [];


  const coverage =
    getCoverage(item);


  card.innerHTML = `

    <!-- HERO -->

    <div class="theme-hero">

      ${
        image
          ? `

            <img
              src="${escapeAttribute(image)}"
              alt=""
              loading="lazy"
              onerror="this.style.display='none'"
            >

          `
          : ""
      }


      <span class="category-badge">

        ${escapeHtml(
          categoryInfo[category]?.title ||
          category
        )}

      </span>

    </div>


    <!-- CUERPO -->

    <div class="theme-body">


      <h3 class="theme-title">

        ${escapeHtml(topic)}

      </h3>


      <!-- MÉTRICAS -->

      <div class="metrics">


        <div class="metric perfil">

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
            ${bestCompetitorNotes}
          </span>

        </div>


        <div class="metric brecha">

          <span class="metric-label">
            Brecha Perfil
          </span>

          <span class="metric-value">
            ${gap}
          </span>

        </div>


        <div class="metric">

          <span class="metric-label">
            Medios
          </span>

          <span class="metric-value">
            ${mediaCount}
          </span>

        </div>

      </div>


      <!-- COBERTURA -->

      <div class="coverage">

        <div class="coverage-title">

          Cobertura por medio

        </div>


        ${renderCoverage(
          coverage
        )}

      </div>


      <!-- INSIGHT -->

      ${
        insight
          ? `

            <div class="insight">

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


      <!-- DETALLE -->

      <button
        class="detail-toggle"
        type="button">

        Ver detalle

      </button>


      <div class="detail-content">


        <!-- ACCIÓN -->

        ${
          action
            ? `

              <div class="detail-block">

                <div class="detail-label">

                  Acción sugerida

                </div>


                <p class="detail-text">

                  ${escapeHtml(action)}

                </p>

              </div>

            `
            : ""
        }


        <!-- ENFOQUES -->

        ${
          approaches.length
            ? `

              <div class="detail-block">

                <div class="detail-label">

                  Enfoques sugeridos

                </div>


                <ul class="enfoques">

                  ${approaches
                    .slice(0, 2)
                    .map(
                      approach =>
                        `<li>${escapeHtml(
                          cleanText(
                            approach
                          )
                        )}</li>`
                    )
                    .join("")}

                </ul>

              </div>

            `
            : ""
        }


        <!-- NOTAS -->

        ${
          examples.length
            ? `

              <div class="detail-block">

                <div class="detail-label">

                  Notas usadas

                </div>


                <div class="examples">

                  ${examples
                    .map(
                      createExample
                    )
                    .join("")}

                </div>

              </div>

            `
            : ""
        }


      </div>

    </div>

  `;


  /*
   * Botón detalle.
   */

  const toggle =
    card.querySelector(
      ".detail-toggle"
    );


  toggle.addEventListener(
    "click",
    event => {

      event.stopPropagation();


      card.classList.toggle(
        "open"
      );


      toggle.textContent =
        card.classList.contains(
          "open"
        )
          ? "Ocultar detalle"
          : "Ver detalle";

    }
  );


  return card;

}


/* =========================================================
   EJEMPLO / NOTA
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


  const media =
    cleanText(
      example.medio ||
      example.media ||
      ""
    );


  const link =
    example.link ||
    example.url ||
    "#";


  const image =
    example.imagen ||
    example.image ||
    "";


  return `

    <article class="example">


      ${
        image
          ? `

            <img
              class="example-image"
              src="${escapeAttribute(image)}"
              alt=""
              loading="lazy"
              onerror="this.style.display='none'"
            >

          `
          : `

            <div class="example-image"></div>

          `
      }


      <div>

        <div class="example-media">

          ${escapeHtml(media)}

        </div>


        <p class="example-title">

          <a
            href="${escapeAttribute(link)}"
            target="_blank"
            rel="noopener noreferrer">

            ${escapeHtml(title)}

          </a>

        </p>

      </div>


    </article>

  `;

}


/* =========================================================
   COBERTURA
   ========================================================= */

function getCoverage(
  item
) {

  if (
    Array.isArray(
      item.cobertura
    )
  ) {

    return item.cobertura;

  }


  if (
    Array.isArray(
      item.medios
    )
  ) {

    return item.medios;

  }


  const result = [];


  if (
    typeof item.perfil ===
    "number"
  ) {

    result.push({

      medio:
        "Perfil",

      cantidad:
        item.perfil

    });

  }


  return result;

}


/* =========================================================
   RENDER COBERTURA
   ========================================================= */

function renderCoverage(
  coverage
) {

  if (
    !Array.isArray(coverage) ||
    !coverage.length
  ) {

    return "";

  }


  const max =
    Math.max(
      ...coverage.map(
        item =>
          Number(
            item.cantidad ??
            item.notas ??
            item.total ??
            item.count ??
            0
          )
      ),
      1
    );


  return coverage
    .map(
      item => {

        const name =
          cleanText(
            item.medio ||
            item.media ||
            ""
          );


        const value =
          Number(
            item.cantidad ??
            item.notas ??
            item.total ??
            item.count ??
            0
          );


        const width =
          Math.max(
            4,
            Math.round(
              value /
              max *
              100
            )
          );


        const isPerfil =
          normalize(name) ===
          "perfil";


        return `

          <div class="coverage-row">


            <span class="coverage-name">

              ${escapeHtml(name)}

            </span>


            <div class="coverage-bar">

              <div
                class="coverage-fill ${
                  isPerfil
                    ? "perfil"
                    : ""
                }"
                style="width:${width}%">
              </div>

            </div>


            <span class="coverage-number">

              ${value}

            </span>


          </div>

        `;

      }
    )
    .join("");

}


/* =========================================================
   TEMA
   ========================================================= */

function getTopic(
  item
) {

  return cleanText(
    item.tema ||
    item.topic ||
    item.titulo ||
    item.title ||
    ""
  );

}


/* =========================================================
   NOTAS DE PERFIL
   ========================================================= */

function getPerfilNotes(
  item
) {

  if (
    typeof item.perfil ===
    "number"
  ) {

    return item.perfil;

  }


  if (
    typeof item.perfil_notas ===
    "number"
  ) {

    return item.perfil_notas;

  }


  if (
    typeof item.notas_perfil ===
    "number"
  ) {

    return item.notas_perfil;

  }


  if (
    Array.isArray(
      item.cobertura
    )
  ) {

    const perfil =
      item.cobertura.find(
        media =>
          normalize(
            media.medio ||
            media.media ||
            ""
          ) === "perfil"
      );


    if (perfil) {

      return Number(
        perfil.cantidad ??
        perfil.notas ??
        perfil.total ??
        0
      );

    }

  }


  return 0;

}


/* =========================================================
   MEJOR COMPETIDOR
   ========================================================= */

function getBestCompetitor(
  item
) {

  const coverage =
    getCoverage(item);


  let best = {

    medio: "",

    count: 0

  };


  coverage.forEach(
    media => {

      const name =
        cleanText(
          media.medio ||
          media.media ||
          ""
        );


      if (
        normalize(name) ===
        "perfil"
      ) {

        return;

      }


      const count =
        Number(
          media.cantidad ??
          media.notas ??
          media.total ??
          media.count ??
          0
        );


      if (
        count >
        best.count
      ) {

        best = {

          medio:
            name,

          count:
            count

        };

      }

    }
  );


  return best;

}


/* =========================================================
   TOTAL NOTAS
   ========================================================= */

function getTotalNotes(
  item
) {

  if (
    typeof item.total_notas ===
    "number"
  ) {

    return item.total_notas;

  }


  if (
    typeof item.total ===
    "number"
  ) {

    return item.total;

  }


  const coverage =
    getCoverage(item);


  return coverage.reduce(
    (
      sum,
      media
    ) =>
      sum +
      Number(
        media.cantidad ??
        media.notas ??
        media.total ??
        media.count ??
        0
      ),
    0
  );

}


/* =========================================================
   CANTIDAD DE MEDIOS
   ========================================================= */

function getMediaCount(
  item
) {

  if (
    typeof item.total_medios ===
    "number"
  ) {

    return item.total_medios;

  }


  const coverage =
    getCoverage(item);


  return coverage.filter(
    media =>
      Number(
        media.cantidad ??
        media.notas ??
        media.total ??
        media.count ??
        0
      ) > 0
  ).length;

}


/* =========================================================
   BRECHA
   ========================================================= */

function getGap(
  item
) {

  return (
    getPerfilNotes(item) -
    getBestCompetitor(item).count
  );

}


/* =========================================================
   IMAGEN
   ========================================================= */

function getImage(
  item
) {

  return (

    item.imagen ||
    item.image ||
    item.imagen_url ||
    item.image_url ||
    item.foto ||
    item.foto_url ||
    ""

  );

}


/* =========================================================
   RESOLVER CATEGORÍA
   ========================================================= */

function resolveCategory(
  value
) {

  const normalized =
    normalize(value);


  if (
    normalized ===
      "hipercompetencia" ||
    normalized.includes(
      "hipercompetencia"
    )
  ) {

    return "hipercompetencia";

  }


  if (
    normalized ===
      "perfil_pierde" ||
    normalized ===
      "perfil pierde" ||
    normalized.includes(
      "perfil pierde"
    ) ||
    normalized ===
      "pierde"
  ) {

    return "perfil_pierde";

  }


  if (
    normalized ===
      "sin_cobertura_perfil" ||
    normalized ===
      "sin cobertura" ||
    normalized.includes(
      "sin cobertura"
    )
  ) {

    return "sin_cobertura_perfil";

  }


  if (
    normalized ===
      "oportunidades" ||
    normalized ===
      "oportunidad" ||
    normalized.includes(
      "oportunidad"
    )
  ) {

    return "oportunidades";

  }


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
   NORMALIZAR TEXTO
   ========================================================= */

function normalize(
  value
) {

  return String(
    value ?? ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim()
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    );

}


/* =========================================================
   LIMPIAR TEXTO
   ========================================================= */

function cleanText(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)
    .trim();

}


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   ESCAPAR ATRIBUTOS
   ========================================================= */

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}
