const DATA_URL = "./data.json";

let data = {};
let currentCategory = "hipercompetencia";


/* =====================================================
   ELEMENTOS
===================================================== */

const loading =
  document.getElementById("loading");

const errorBox =
  document.getElementById("error");

const content =
  document.getElementById("content");

const analysisDate =
  document.getElementById("analysisDate");

const prioritiesContainer =
  document.getElementById("priorities");

const themeGrid =
  document.getElementById("themeGrid");

const emptyState =
  document.getElementById("emptyState");

const categoryTitle =
  document.getElementById("categoryTitle");

const categoryDescription =
  document.getElementById(
    "categoryDescription"
  );

const sortSelect =
  document.getElementById("sortSelect");

const monitoringSection =
  document.getElementById(
    "monitoringSection"
  );


/* =====================================================
   CATEGORÍAS
===================================================== */

const categoryInfo = {

  hipercompetencia: {
    title: "Hipercompetencia",

    description:
      "Temas donde la competencia concentra más cobertura."
  },

  perfil_pierde: {
    title: "Perfil pierde",

    description:
      "Temas donde otros medios publicaron y Perfil no."
  },

  sin_cobertura_perfil: {
    title: "Sin cobertura",

    description:
      "Temas detectados en la competencia sin cobertura de Perfil."
  },

  oportunidades: {
    title: "Oportunidades",

    description:
      "Temas con posibilidades concretas de cobertura."
  }

};


/* =====================================================
   INICIO
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  loadData
);


async function loadData() {

  try {

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


    data =
      await response.json();


    renderDate();

    renderPriorities();

    setupCategories();

    renderCategory();


    loading.classList.add(
      "hidden"
    );

    content.classList.remove(
      "hidden"
    );


  } catch (error) {

    console.error(
      "Error cargando data.json:",
      error
    );

    loading.classList.add(
      "hidden"
    );

    errorBox.classList.remove(
      "hidden"
    );

  }

}


/* =====================================================
   FECHA
===================================================== */

function renderDate() {

  if (!data.fecha_analisis) {

    analysisDate.textContent = "";

    return;
  }


  const date =
    new Date(
      `${data.fecha_analisis}T12:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    analysisDate.textContent =
      `Análisis: ${data.fecha_analisis}`;

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


/* =====================================================
   PRIORIDADES
===================================================== */

function renderPriorities() {

  prioritiesContainer.innerHTML = "";


  let priorities = [];


  /*
   * Si el JSON tiene prioridades_del_dia,
   * las usamos.
   */

  if (
    Array.isArray(
      data.prioridades_del_dia
    )
  ) {

    priorities =
      [...data.prioridades_del_dia];

  }


  /*
   * Si no existe,
   * buscamos los temas con prioridad.
   */

  if (!priorities.length) {

    priorities =
      getAllThemes()
        .filter(
          item =>
            Number(
              item.prioridad || 0
            ) > 0
        )
        .sort(
          (a, b) =>
            Number(
              a.prioridad || 999
            ) -
            Number(
              b.prioridad || 999
            )
        )
        .slice(0, 3);

  }


  /*
   * Último fallback:
   * primeras tres de hipercompetencia.
   */

  if (!priorities.length) {

    priorities =
      [
        ...(data.hipercompetencia || [])
      ]
        .slice(0, 3)
        .map(item => ({
          ...item,

          __category:
            "hipercompetencia"
        }));

  }


  /*
   * Creamos cada prioridad.
   */

  priorities.forEach(
    (item, index) => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "priority-card";


      const imageUrl =
        getImage(item);


      card.innerHTML = `

        <div class="priority-image-wrap">

          ${
            imageUrl
              ? `

                <img
                  class="priority-image"
                  src="${escapeAttribute(
                    imageUrl
                  )}"
                  alt=""
                  loading="lazy"
                >

              `
              : `

                <div
                  class="priority-image-placeholder"
                >
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

            ${escapeHtml(
              item.tema ||
              "Sin título"
            )}

          </div>

        </div>

      `;


      /*
       * Si la imagen falla,
       * mostramos placeholder.
       */

      const image =
        card.querySelector(
          ".priority-image"
        );


      if (image) {

        image.addEventListener(
          "error",
          () => {

            const wrapper =
              image.closest(
                ".priority-image-wrap"
              );


            if (!wrapper) {
              return;
            }


            wrapper.innerHTML = `

              <div
                class="priority-image-placeholder"
              >
                Sin imagen
              </div>


              <div class="priority-number">
                ${index + 1}
              </div>

            `;

          }
        );

      }


      /*
       * Click:
       * lleva a la temática.
       */

      card.addEventListener(
        "click",
        () => {

          goToPriority(
            item.tema,

            item.__category ||
            item.tipo ||
            "hipercompetencia"
          );

        }
      );


      prioritiesContainer.appendChild(
        card
      );

    }
  );

}


/* =====================================================
   TODOS LOS TEMAS
===================================================== */

function getAllThemes() {

  const categories = [

    "hipercompetencia",

    "perfil_pierde",

    "sin_cobertura_perfil",

    "oportunidades"

  ];


  const themes = [];


  categories.forEach(
    category => {

      if (
        !Array.isArray(
          data[category]
        )
      ) {

        return;
      }


      data[category].forEach(
        item => {

          themes.push({

            ...item,

            __category:
              category

          });

        }
      );

    }
  );


  return themes;
}


/* =====================================================
   IR DESDE PRIORIDAD
===================================================== */

function goToPriority(
  topic,
  category
) {

  setCategory(category);


  monitoringSection.scrollIntoView(
    {
      behavior: "smooth",
      block: "start"
    }
  );


  setTimeout(
    () => {

      const cards =
        document.querySelectorAll(
          ".theme-card"
        );


      cards.forEach(
        card => {

          const cardTopic =
            card.dataset.topic ||
            "";


          if (
            normalizeText(
              cardTopic
            ) ===
            normalizeText(
              topic
            )
          ) {

            card.classList.add(
              "priority-highlight"
            );


            setTimeout(
              () => {

                card.classList.remove(
                  "priority-highlight"
                );

              },
              2200
            );

          }

        }
      );

    },
    500
  );

}


/* =====================================================
   CATEGORÍAS
===================================================== */

function setupCategories() {

  const tabs =
    document.querySelectorAll(
      ".category-tab"
    );


  tabs.forEach(
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


  sortSelect.addEventListener(
    "change",
    renderCategory
  );

}


function setCategory(category) {

  if (
    !categoryInfo[category]
  ) {

    category =
      "hipercompetencia";

  }


  currentCategory =
    category;


  document
    .querySelectorAll(
      ".category-tab"
    )
    .forEach(
      tab => {

        tab.classList.toggle(
          "active",

          tab.dataset.category ===
          currentCategory
        );

      }
    );


  renderCategory();

}


/* =====================================================
   RENDER CATEGORÍA
===================================================== */

function renderCategory() {

  const info =
    categoryInfo[
      currentCategory
    ];


  categoryTitle.textContent =
    info.title;


  categoryDescription.textContent =
    info.description;


  themeGrid.innerHTML = "";


  const themes =
    Array.isArray(
      data[currentCategory]
    )
      ? [
          ...data[currentCategory]
        ]
      : [];


  if (!themes.length) {

    emptyState.classList.remove(
      "hidden"
    );

    return;
  }


  emptyState.classList.add(
    "hidden"
  );


  const sortedThemes =
    sortThemes(themes);


  sortedThemes.forEach(
    item => {

      themeGrid.appendChild(

        createThemeCard({

          ...item,

          __category:
            currentCategory

        })

      );

    }
  );

}


/* =====================================================
   ORDEN
===================================================== */

function sortThemes(themes) {

  const sort =
    sortSelect.value;


  return themes.sort(
    (a, b) => {


      if (
        sort === "brecha"
      ) {

        return (

          Number(
            b.brecha || 0
          ) -

          Number(
            a.brecha || 0
          )

        );

      }


      if (
        sort === "notas"
      ) {

        return (

          Number(
            b.total_notas || 0
          ) -

          Number(
            a.total_notas || 0
          )

        );

      }


      if (
        sort === "medios"
      ) {

        return (

          Number(
            b.cantidad_medios || 0
          ) -

          Number(
            a.cantidad_medios || 0
          )

        );

      }


      if (
        sort === "az"
      ) {

        return normalizeText(
          a.tema || ""
        ).localeCompare(
          normalizeText(
            b.tema || ""
          ),
          "es"
        );

      }


      return 0;

    }
  );

}


/* =====================================================
   TARJETA TEMÁTICA
===================================================== */

function createThemeCard(item) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "theme-card";


  card.dataset.topic =
    item.tema || "";


  const imageUrl =
    getImage(item);


  const totalNotas =
    Number(
      item.total_notas || 0
    );


  const cantidadMedios =
    Number(
      item.cantidad_medios ||

      item.cantidad_medios_competencia ||

      0
    );


  const gap =
    Number(
      item.brecha || 0
    );


  /*
   * Brecha:
   * 4 -> -4
   * 2 -> -2
   * 0 -> 0
   */

  const gapDisplay =
    gap > 0
      ? `-${gap}`
      : "0";


  card.innerHTML = `

    <!-- FOTO -->

    <div class="theme-image-wrap">

      ${
        imageUrl
          ? `

            <img
              class="theme-image"
              src="${escapeAttribute(
                imageUrl
              )}"
              alt=""
              loading="lazy"
            >

          `
          : `

            <div
              class="theme-image-placeholder"
            >
              Sin imagen
            </div>

          `
      }


      <div class="category-badge">

        ${escapeHtml(
          categoryInfo[
            currentCategory
          ].title
        )}

      </div>

    </div>


    <!-- CUERPO -->

    <div class="theme-body">


      <!-- TÍTULO -->

      <h3 class="theme-title">

        ${escapeHtml(
          item.tema ||
          "Sin título"
        )}

      </h3>


      <!-- MÉTRICAS -->

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


        <div
          class="
            theme-stat
            theme-stat-gap
          "
        >

          <span>
            Brecha Perfil
          </span>

          <strong>
            ${gapDisplay}
          </strong>

        </div>


      </div>


      <!-- COBERTURA -->

      ${renderCoverage(
        item.cobertura
      )}


      <!-- POR QUÉ IMPORTA -->

      ${
        item.por_que_importa
          ? `

            <div class="why-box">

              <div class="why-label">
                Por qué importa
              </div>


              <p class="why-text">

                ${escapeHtml(
                  item.por_que_importa
                )}

              </p>

            </div>

          `
          : ""
      }


      <!-- INSIGHT -->

      ${
        item.insight
          ? `

            <div class="insight-box">

              <div class="insight-label">
                Insight
              </div>


              <p class="insight-text">

                ${escapeHtml(
                  item.insight
                )}

              </p>

            </div>

          `
          : ""
      }


      <!-- DETALLES -->

      <details class="theme-details">


        <summary>
          Ver detalles
        </summary>


        <div class="details-content">


          <!-- ACCIÓN -->

          ${
            item.accion_sugerida
              ? `

                <div class="detail-block">

                  <div class="detail-title">
                    Acción sugerida
                  </div>


                  <p class="detail-text">

                    ${escapeHtml(
                      item.accion_sugerida
                    )}

                  </p>

                </div>

              `
              : ""
          }


          <!-- ENFOQUES -->

          ${
            Array.isArray(
              item.enfoques_sugeridos
            ) &&
            item.enfoques_sugeridos.length
              ? `

                <div class="detail-block">

                  <div class="detail-title">
                    Enfoques sugeridos
                  </div>


                  <ul class="detail-list">

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


          <!-- NOTAS USADAS -->

          ${
            Array.isArray(
              item.ejemplos
            ) &&
            item.ejemplos.length
              ? `

                <div class="detail-block">

                  <div class="detail-title">
                    Notas usadas
                  </div>


                  <div class="examples">

                    ${item.ejemplos
                      .slice(0, 3)
                      .map(
                        renderExample
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


  /* ===================================================
     ERROR IMAGEN
  =================================================== */

  const image =
    card.querySelector(
      ".theme-image"
    );


  if (image) {

    image.addEventListener(
      "error",
      () => {

        const wrapper =
          image.closest(
            ".theme-image-wrap"
          );


        if (!wrapper) {
          return;
        }


        wrapper.innerHTML = `

          <div
            class="theme-image-placeholder"
          >
            Sin imagen
          </div>


          <div class="category-badge">

            ${escapeHtml(
              categoryInfo[
                currentCategory
              ].title
            )}

          </div>

        `;

      }
    );

  }


  return card;
}


/* =====================================================
   COBERTURA
===================================================== */

function renderCoverage(
  cobertura
) {

  if (
    !cobertura ||
    typeof cobertura !== "object"
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


  const max =
    Math.max(
      ...entries.map(
        ([, value]) =>
          Number(value || 0)
      ),
      1
    );


  return `

    <div class="coverage">


      <div class="coverage-title">
        Cobertura
      </div>


      <div class="coverage-list">


        ${entries
          .map(
            ([medio, value]) => {

              const count =
                Number(
                  value || 0
                );


              const percentage =
                count > 0
                  ? (
                      count / max
                    ) * 100
                  : 0;


              return `

                <div class="coverage-row">


                  <div class="coverage-medium">

                    ${escapeHtml(
                      medio
                    )}

                  </div>


                  <div class="coverage-bar">

                    <div
                      class="coverage-fill"
                      style="
                        width:${percentage}%;
                      "
                    ></div>

                  </div>


                  <div class="coverage-count">

                    ${count}

                  </div>


                </div>

              `;

            }
          )
          .join("")}


      </div>

    </div>

  `;
}


/* =====================================================
   EJEMPLOS
===================================================== */

function renderExample(
  example
) {

  if (!example) {
    return "";
  }


  const imageUrl =
    cleanMarkdownUrl(
      example.imagen ||
      example.image ||
      example.image_url ||
      example.imagen_url
    );


  const link =
    cleanMarkdownUrl(
      example.link ||
      example.url
    );


  const imageHtml =
    imageUrl
      ? `

        <div
          class="example-image-wrap"
        >

          <img
            class="example-image"
            src="${escapeAttribute(
              imageUrl
            )}"
            alt=""
            loading="lazy"
          >

        </div>

      `
      : `

        <div
          class="example-image-wrap"
        >

          <div
            class="
              example-image-placeholder
            "
          >
            Sin imagen
          </div>

        </div>

      `;


  const titleHtml =
    link
      ? `

        <a
          class="example-title"
          href="${escapeAttribute(
            link
          )}"
          target="_blank"
          rel="noopener noreferrer"
        >

          ${escapeHtml(
            example.titulo ||
            "Sin título"
          )}

        </a>

      `
      : `

        <div
          class="example-title"
        >

          ${escapeHtml(
            example.titulo ||
            "Sin título"
          )}

        </div>

      `;


  return `

    <div class="example">

      ${imageHtml}


      <div class="example-content">


        <div class="example-medium">

          ${escapeHtml(
            example.medio || ""
          )}

        </div>


        ${titleHtml}


      </div>

    </div>

  `;
}


/* =====================================================
   OBTENER IMAGEN
===================================================== */

function getImage(item) {

  if (!item) {
    return "";
  }


  /*
   * Primero buscamos imagen directa.
   */

  const directImages = [

    item.imagen,

    item.image,

    item.image_url,

    item.imagen_url,

    item.foto,

    item.foto_url

  ];


  for (
    const value of directImages
  ) {

    const url =
      cleanMarkdownUrl(
        value
      );


    if (
      url &&
      /^https?:\/\//i.test(
        url
      )
    ) {

      return url;

    }

  }


  /*
   * Si no existe,
   * buscamos en ejemplos.
   */

  if (
    Array.isArray(
      item.ejemplos
    )
  ) {

    for (
      const ejemplo of
      item.ejemplos
    ) {

      if (!ejemplo) {
        continue;
      }


      const url =
        cleanMarkdownUrl(

          ejemplo.imagen ||

          ejemplo.image ||

          ejemplo.image_url ||

          ejemplo.imagen_url ||

          ejemplo.foto ||

          ejemplo.foto_url

        );


      if (
        url &&
        /^https?:\/\//i.test(
          url
        )
      ) {

        return url;

      }

    }

  }


  return "";
}


/* =====================================================
   LIMPIAR URL MARKDOWN
===================================================== */

function cleanMarkdownUrl(
  value
) {

  if (!value) {
    return "";
  }


  let url =
    String(value).trim();


  /*
   * Convierte:
   *
   * [https://foto.jpg](https://foto.jpg)
   *
   * en:
   *
   * https://foto.jpg
   */

  const markdownMatch =
    url.match(
      /^\[.*?\]\((.*?)\)$/
    );


  if (markdownMatch) {

    url =
      markdownMatch[1];

  }


  /*
   * Limpieza de escapes.
   */

  url =
    url
      .replace(
        /\\&/g,
        "&"
      )
      .replace(
        /&amp;/g,
        "&"
      )
      .trim();


  return url;
}


/* =====================================================
   SEGURIDAD
===================================================== */

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


function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


function normalizeText(
  value
) {

  return String(
    value || ""
  )
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim();

}
