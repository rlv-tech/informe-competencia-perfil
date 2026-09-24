const DATA_URL = "./data.json";

let dashboardData = null;

let currentCategory = "hipercompetencia";
let currentSort = "brecha";


/* =========================
   ELEMENTOS
========================= */

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

const categoryTabs =
  document.querySelectorAll(".category-tab");


/* =========================
   CONFIGURACIÓN
========================= */

const categoryConfig = {

  hipercompetencia: {
    label: "Hipercompetencia",

    description:
      "Temas donde la competencia tiene mayor cobertura."
  },

  perfil_pierde: {
    label: "Perfil pierde",

    description:
      "Temas donde otros medios publicaron y Perfil no tuvo cobertura."
  },

  sin_cobertura_perfil: {
    label: "Sin cobertura",

    description:
      "Temas relevantes cubiertos por la competencia sin presencia de Perfil."
  },

  oportunidades: {
    label: "Oportunidades",

    description:
      "Temas con posibilidades de desarrollo editorial."
  }

};


/* =========================
   INICIO
========================= */

document.addEventListener(
  "DOMContentLoaded",
  loadData
);


/* =========================
   CARGA DE DATOS
========================= */

async function loadData() {

  try {

    const separator =
      DATA_URL.includes("?")
        ? "&"
        : "?";

    const response =
      await fetch(
        `${DATA_URL}${separator}t=${Date.now()}`,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    dashboardData =
      await response.json();

    renderDashboard();

    loading.classList.add(
      "hidden"
    );

    error.classList.add(
      "hidden"
    );

    content.classList.remove(
      "hidden"
    );

  } catch (err) {

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

    analysisDate.textContent =
      "Análisis editorial";

    return;
  }

  const date =
    parseLocalDate(
      dashboardData.fecha_analisis
    );

  if (!date) {

    analysisDate.textContent =
      `Análisis: ${dashboardData.fecha_analisis}`;

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


/* =========================
   PRIORIDADES DEL DÍA
========================= */

function renderPriorities() {

  priorities.innerHTML = "";

  const allItems =
    getAllItems();


  /*
    Las prioridades reales son aquellas
    que tienen prioridad mayor a 0.
  */

  const priorityItems =
    allItems
      .filter(item => {

        const priority =
          Number(item.prioridad);

        return (
          Number.isFinite(priority) &&
          priority > 0
        );

      })
      .sort((a, b) => {

        return (
          Number(a.prioridad) -
          Number(b.prioridad)
        );

      })
      .slice(0, 3);


  /*
    Si no hay prioridades marcadas,
    usamos los temas con mayor brecha.
  */

  const fallbackItems =
    allItems
      .filter(
        item =>
          !priorityItems.includes(item)
      )
      .sort((a, b) => {

        return (
          Number(b.brecha || 0) -
          Number(a.brecha || 0)
        );

      })
      .slice(
        0,
        3 - priorityItems.length
      );


  const items = [
    ...priorityItems,
    ...fallbackItems
  ];


  if (!items.length) {

    priorities.innerHTML = `
      <div class="empty-state">
        No hay prioridades disponibles.
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


      const image =
        getImage(item);


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
            : `
              <div class="priority-image"></div>
            `
        }


        <div class="priority-content">

          <div class="priority-number">
            ${String(index + 1).padStart(2, "0")}
          </div>


          <div class="priority-category">
            PRIORIDAD
          </div>


          <h3>
            ${escapeHtml(
              item.tema ||
              "Tema sin título"
            )}
          </h3>


          ${
            item.por_que_importa
              ? `
                <p class="priority-description">
                  ${escapeHtml(
                    item.por_que_importa
                  )}
                </p>
              `
              : ""
          }

        </div>

      `;


      /*
        Al hacer click en una prioridad,
        lleva al tema correspondiente
        dentro del monitoreo.
      */

      card.addEventListener(
        "click",
        () => {

          currentCategory =
            item.tipo &&
            categoryConfig[item.tipo]
              ? item.tipo
              : "hipercompetencia";


          categoryTabs.forEach(
            tab => {

              tab.classList.toggle(
                "active",
                tab.dataset.category ===
                currentCategory
              );

            }
          );


          renderCategory();


          document
            .getElementById(
              "monitoringSection"
            )
            ?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

        }
      );


      priorities.appendChild(
        card
      );

    }
  );

}


/* =========================
   CATEGORÍA
========================= */

function renderCategory() {

  const config =
    categoryConfig[currentCategory] ||
    categoryConfig.hipercompetencia;


  categoryTitle.textContent =
    config.label;

  categoryDescription.textContent =
    config.description;


  let items =
    Array.isArray(
      dashboardData?.[currentCategory]
    )
      ? [
          ...dashboardData[
            currentCategory
          ]
        ]
      : [];


  items =
    sortItems(items);


  themeGrid.innerHTML = "";


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
        createThemeCard(item)
      );

    }
  );

}


/* =========================
   ORDENAMIENTO
========================= */

function sortItems(items) {

  return items.sort(
    (a, b) => {

      if (
        currentSort ===
        "brecha"
      ) {

        return (
          Number(b.brecha || 0) -
          Number(a.brecha || 0)
        );

      }


      if (
        currentSort ===
        "notas"
      ) {

        return (
          Number(b.total_notas || 0) -
          Number(a.total_notas || 0)
        );

      }


      if (
        currentSort ===
        "medios"
      ) {

        return (
          Number(
            b.cantidad_medios ??
            b.cantidad_medios_competencia ??
            0
          ) -
          Number(
            a.cantidad_medios ??
            a.cantidad_medios_competencia ??
            0
          )
        );

      }


      if (
        currentSort ===
        "az"
      ) {

        return String(
          a.tema || ""
        ).localeCompare(
          String(
            b.tema || ""
          ),
          "es",
          {
            sensitivity: "base"
          }
        );

      }


      return 0;

    }
  );

}


/* =========================
   TARJETA DE TEMA
========================= */

function createThemeCard(item) {

  const card =
    document.createElement(
      "article"
    );

  card.className =
    "theme-card";


  const image =
    getImage(item);


  const totalNotas =
    Number(
      item.total_notas || 0
    );


  const cantidadMedios =
    Number(
      item.cantidad_medios ??
      item.cantidad_medios_competencia ??
      0
    );


  const rawGap =
    Number(
      item.brecha || 0
    );


  /*
    La brecha se interpreta
    como diferencia frente a Perfil.

    0      -> 0
    +1     -> -1
    +2     -> -2
    etc.
  */

  const displayGap =
    rawGap > 0
      ? `-${rawGap}`
      : `${rawGap}`;


  const gapClass =
    rawGap !== 0
      ? "theme-stat theme-stat-gap"
      : "theme-stat";


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
          : `
            <div class="theme-image"></div>
          `
      }

    </div>


    <div class="theme-body">

      <div class="theme-category">
        ${escapeHtml(
          getCategoryLabel(
            item.tipo
          )
        )}
      </div>


      <h3 class="theme-title">
        ${escapeHtml(
          item.tema ||
          "Tema sin título"
        )}
      </h3>


      <div class="theme-stats">


        <div class="theme-stat">

          <span>
            Notas
          </span>

          <strong>
            ${totalNotas}
          </strong>

        </div>


        <div class="theme-stat">

          <span>
            Medios
          </span>

          <strong>
            ${cantidadMedios}
          </strong>

        </div>


        <div class="${gapClass}">

          <span>
            Brecha Perfil
          </span>

          <strong>
            ${displayGap}
          </strong>

        </div>


      </div>


      ${renderCoverage(
        item.cobertura
      )}


      <details class="theme-details">

        <summary>
          Ver detalles
        </summary>


        <div class="details-content">


          ${
            item.por_que_importa
              ? `
                <div class="detail-section">

                  <h4>
                    Por qué importa
                  </h4>

                  <p>
                    ${escapeHtml(
                      item.por_que_importa
                    )}
                  </p>

                </div>
              `
              : ""
          }


          ${
            item.insight
              ? `
                <div class="detail-section">

                  <h4>
                    Insight
                  </h4>

                  <p>
                    ${escapeHtml(
                      item.insight
                    )}
                  </p>

                </div>
              `
              : ""
          }


          ${
            item.accion_sugerida
              ? `
                <div class="detail-section">

                  <h4>
                    Acción sugerida
                  </h4>

                  <p>
                    ${escapeHtml(
                      item.accion_sugerida
                    )}
                  </p>

                </div>
              `
              : ""
          }


          ${
            Array.isArray(
              item.enfoques_sugeridos
            ) &&
            item.enfoques_sugeridos.length
              ? `
                <div class="detail-section">

                  <h4>
                    Enfoques sugeridos
                  </h4>

                  <ul>

                    ${item.enfoques_sugeridos
                      .map(
                        enfoque => `
                          <li>
                            ${escapeHtml(
                              enfoque
                            )}
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
            Array.isArray(
              item.ejemplos
            ) &&
            item.ejemplos.length
              ? `
                <div class="detail-section">

                  <h4>
                    Notas usadas
                  </h4>

                  <div class="examples-list">

                    ${item.ejemplos
                      .slice(0, 3)
                      .map(
                        example =>
                          renderExample(
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

      </details>


    </div>

  `;


  return card;

}


/* =========================
   COBERTURA
========================= */

function renderCoverage(cobertura) {

  if (
    !cobertura ||
    typeof cobertura !== "object" ||
    Array.isArray(cobertura)
  ) {

    return "";

  }


  const entries =
    Object.entries(
      cobertura
    );


  if (!entries.length) {

    return "";

  }


  const maxValue =
    Math.max(
      ...entries.map(
        ([, value]) =>
          Number(value) || 0
      ),
      1
    );


  return `

    <div class="coverage-block">

      <div class="coverage-title">
        Cobertura
      </div>


      <div class="coverage-list">

        ${
          entries
            .map(
              ([medio, value]) => {

                const numericValue =
                  Number(value) || 0;


                const width =
                  Math.max(
                    0,
                    Math.min(
                      100,
                      (
                        numericValue /
                        maxValue
                      ) * 100
                    )
                  );


                return `

                  <div class="coverage-item">

                    <span class="coverage-item-name">
                      ${escapeHtml(
                        medio
                      )}
                    </span>


                    <div class="coverage-bar">

                      <div
                        class="coverage-fill"
                        style="width:${width}%"
                      ></div>

                    </div>


                    <strong>
                      ${numericValue}
                    </strong>

                  </div>

                `;

              }
            )
            .join("")
        }

      </div>

    </div>

  `;

}


/* =========================
   EJEMPLOS
========================= */

function renderExample(example) {

  if (!example) {

    return "";

  }


  const image =
    cleanMarkdownUrl(
      example.imagen || ""
    );


  const link =
    cleanMarkdownUrl(
      example.link || ""
    );


  const title =
    example.titulo ||
    "Nota sin título";


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
          : `
            <div class="example-image"></div>
          `
      }


      <div>


        ${
          example.medio
            ? `
              <div class="example-medium">
                ${escapeHtml(
                  example.medio
                )}
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
                  ${escapeHtml(
                    title
                  )}
                </a>
              `
              : `
                ${escapeHtml(
                  title
                )}
              `
          }


        </div>


      </div>


    </article>

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


  for (
    const field of possibleFields
  ) {

    if (item?.[field]) {

      const url =
        cleanMarkdownUrl(
          item[field]
        );


      if (url) {

        return url;

      }

    }

  }


  if (
    Array.isArray(
      item?.ejemplos
    )
  ) {

    for (
      const example of item.ejemplos
    ) {

      if (example?.imagen) {

        const url =
          cleanMarkdownUrl(
            example.imagen
          );


        if (url) {

          return url;

        }

      }

    }

  }


  return "";

}


/* =========================
   NOMBRE DE CATEGORÍA
========================= */

function getCategoryLabel(tipo) {

  const labels = {

    hipercompetencia:
      "Hipercompetencia",

    perfil_pierde:
      "Perfil pierde",

    sin_cobertura_perfil:
      "Sin cobertura",

    oportunidades:
      "Oportunidad"

  };


  return (
    labels[tipo] ||
    tipo ||
    ""
  );

}


/* =========================
   TODOS LOS TEMAS
========================= */

function getAllItems() {

  if (!dashboardData) {

    return [];

  }


  const categories = [

    "hipercompetencia",

    "perfil_pierde",

    "sin_cobertura_perfil",

    "oportunidades"

  ];


  return categories.flatMap(
    category =>
      Array.isArray(
        dashboardData[category]
      )
        ? dashboardData[category]
        : []
  );

}


/* =========================
   LIMPIAR URL MARKDOWN
========================= */

function cleanMarkdownUrl(value) {

  if (!value) {

    return "";

  }


  let stringValue =
    String(value).trim();


  const markdownMatch =
    stringValue.match(
      /^\[.*?\]\((.*?)\)$/
    );


  if (markdownMatch) {

    stringValue =
      markdownMatch[1];

  }


  stringValue =
    stringValue
      .replace(
        /\\&/g,
        "&"
      )
      .replace(
        /&amp;/g,
        "&"
      );


  return stringValue;

}


/* =========================
   FECHA LOCAL
========================= */

function parseLocalDate(value) {

  if (!value) {

    return null;

  }


  const match =
    String(value).match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );


  if (!match) {

    return null;

  }


  const year =
    Number(match[1]);


  const month =
    Number(match[2]) - 1;


  const day =
    Number(match[3]);


  return new Date(
    year,
    month,
    day
  );

}


/* =========================
   SEGURIDAD HTML
========================= */

function escapeHtml(value) {

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


function escapeAttribute(value) {

  return escapeHtml(
    value
  );

}


/* =========================
   TABS
========================= */

categoryTabs.forEach(
  tab => {

    tab.addEventListener(
      "click",
      () => {

        currentCategory =
          tab.dataset.category;


        categoryTabs.forEach(
          otherTab => {

            otherTab.classList.toggle(
              "active",
              otherTab === tab
            );

          }
        );


        renderCategory();

      }
    );

  }
);


/* =========================
   ORDENAMIENTO
========================= */

sortSelect.addEventListener(
  "change",
  event => {

    currentSort =
      event.target.value;


    renderCategory();

  }
);
