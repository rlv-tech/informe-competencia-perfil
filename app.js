const DATA_URL = "./data.json";

const categoryNames = {
  hipercompetencia: "Hipercompetencia",
  perfil_pierde: "Perfil pierde",
  sin_cobertura_perfil: "Sin cobertura",
  oportunidades: "Oportunidades"
};

const categoryDescriptions = {
  hipercompetencia:
    "Temas donde la competencia concentra más cobertura que Perfil.",
  perfil_pierde:
    "Temas donde Perfil tiene menor cobertura que la competencia.",
  sin_cobertura_perfil:
    "Temas cubiertos por la competencia sin cobertura de Perfil.",
  oportunidades:
    "Temas que presentan una oportunidad editorial."
};

let dashboardData = {};
let currentCategory = "hipercompetencia";
let currentSort = "brecha";


document.addEventListener("DOMContentLoaded", () => {

  loadData();


  document.querySelectorAll(".category-tab").forEach(button => {

    button.addEventListener("click", () => {

      currentCategory = button.dataset.category;


      document.querySelectorAll(".category-tab").forEach(tab => {
        tab.classList.remove("active");
      });


      button.classList.add("active");


      renderMonitoring();

    });

  });


  const sortSelect =
    document.getElementById("sortSelect");


  if (sortSelect) {

    sortSelect.addEventListener("change", event => {

      currentSort = event.target.value;

      renderMonitoring();

    });

  }

});


async function loadData() {

  try {

    const response = await fetch(
      `${DATA_URL}?t=${Date.now()}`,
      {
        cache: "no-store"
      }
    );


    if (!response.ok) {
      throw new Error("No se pudo cargar data.json");
    }


    dashboardData =
      await response.json();


    renderDate();
    renderPriorities();
    renderMonitoring();


    document
      .getElementById("loading")
      .classList.add("hidden");


    document
      .getElementById("content")
      .classList.remove("hidden");


  } catch (error) {

    console.error(error);


    document
      .getElementById("loading")
      .classList.add("hidden");


    document
      .getElementById("error")
      .classList.remove("hidden");

  }

}


function renderDate() {

  const dateElement =
    document.getElementById("analysisDate");


  if (!dashboardData.fecha_analisis) {
    return;
  }


  const date =
    new Date(
      `${dashboardData.fecha_analisis}T12:00:00`
    );


  const formatted =
    new Intl.DateTimeFormat(
      "es-AR",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    ).format(date);


  dateElement.textContent =
    `Análisis: ${formatted}`;

}


function getCategoryLabel(type) {

  const labels = {
    hipercompetencia: "HIPERCOMPETENCIA",
    perfil_pierde: "PERFIL PIERDE",
    sin_cobertura_perfil: "SIN COBERTURA",
    oportunidades: "OPORTUNIDAD"
  };


  return labels[type] || "PRIORIDAD";

}


function cleanMarkdownUrl(value) {

  if (!value) {
    return "";
  }


  let result =
    String(value).trim();


  const markdownMatch =
    result.match(
      /^\[.*?\]\((.*?)\)$/
    );


  if (markdownMatch) {
    result = markdownMatch[1];
  }


  result =
    result.replace(
      /\\&/g,
      "&"
    );


  return result;

}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function getImage(item) {

  if (
    item.ejemplos &&
    Array.isArray(item.ejemplos)
  ) {

    const example =
      item.ejemplos.find(
        example => example.imagen
      );


    if (example) {

      return cleanMarkdownUrl(
        example.imagen
      );

    }

  }


  return "";

}


function renderPriorities() {

  const container =
    document.getElementById("priorities");


  let priorities = [];


  Object.keys(categoryNames).forEach(category => {

    const items =
      Array.isArray(
        dashboardData[category]
      )
        ? dashboardData[category]
        : [];


    items.forEach(item => {

      if (
        typeof item.prioridad === "number" &&
        item.prioridad > 0
      ) {

        priorities.push({
          ...item,
          categoria: category
        });

      }

    });

  });


  priorities.sort(
    (a, b) =>
      (b.prioridad || 0) -
      (a.prioridad || 0)
  );


  if (priorities.length < 3) {

    let allItems = [];


    Object.keys(categoryNames).forEach(category => {

      const items =
        Array.isArray(
          dashboardData[category]
        )
          ? dashboardData[category]
          : [];


      items.forEach(item => {

        allItems.push({
          ...item,
          categoria: category
        });

      });

    });


    allItems.sort(
      (a, b) =>
        (b.brecha || 0) -
        (a.brecha || 0)
    );


    allItems.forEach(item => {

      const exists =
        priorities.some(
          priority =>
            priority.tema === item.tema
        );


      if (
        !exists &&
        priorities.length < 3
      ) {

        priorities.push(item);

      }

    });

  }


  priorities =
    priorities.slice(0, 3);


  container.innerHTML = "";


  priorities.forEach((item, index) => {

    const card =
      document.createElement("article");


    card.className =
      "priority-card";


    const image =
      getImage(item);


    const category =
      item.categoria ||
      item.tipo ||
      "";


    card.innerHTML = `

      ${
        image
          ? `
            <img
              class="priority-image"
              src="${escapeHtml(image)}"
              alt=""
              loading="lazy"
            >
          `
          : `
            <div
              class="priority-image priority-image-empty"
            ></div>
          `
      }


      <div class="priority-content">


        <div class="priority-number">
          ${String(index + 1).padStart(2, "0")}
        </div>


        <div class="priority-category">
          ${getCategoryLabel(category)}
        </div>


        <h3>
          ${escapeHtml(
            item.tema ||
            "Sin título"
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


    card.addEventListener("click", () => {

      currentCategory =
        category ||
        "hipercompetencia";


      document
        .querySelectorAll(".category-tab")
        .forEach(tab => {

          tab.classList.toggle(
            "active",
            tab.dataset.category ===
              currentCategory
          );

        });


      renderMonitoring();


      const section =
        document.getElementById(
          "monitoringSection"
        );


      if (section) {

        setTimeout(() => {

          section.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        }, 50);

      }

    });


    container.appendChild(card);

  });

}


function renderMonitoring() {

  const items =
    Array.isArray(
      dashboardData[currentCategory]
    )
      ? [
          ...dashboardData[
            currentCategory
          ]
        ]
      : [];


  document
    .getElementById("categoryTitle")
    .textContent =
      categoryNames[
        currentCategory
      ] ||
      currentCategory;


  document
    .getElementById("categoryDescription")
    .textContent =
      categoryDescriptions[
        currentCategory
      ] ||
      "";


  renderThemeCards(
    sortItems(items)
  );

}


function sortItems(items) {

  return items.sort((a, b) => {

    if (currentSort === "notas") {

      return (
        (b.total_notas || 0) -
        (a.total_notas || 0)
      );

    }


    if (currentSort === "medios") {

      return (
        (b.cantidad_medios || 0) -
        (a.cantidad_medios || 0)
      );

    }


    if (currentSort === "az") {

      return (
        a.tema || ""
      ).localeCompare(
        b.tema || "",
        "es"
      );

    }


    return (
      (b.brecha || 0) -
      (a.brecha || 0)
    );

  });

}


function renderThemeCards(items) {

  const grid =
    document.getElementById(
      "themeGrid"
    );


  const empty =
    document.getElementById(
      "emptyState"
    );


  grid.innerHTML = "";


  if (!items.length) {

    empty.classList.remove(
      "hidden"
    );

    return;

  }


  empty.classList.add(
    "hidden"
  );


  items.forEach(item => {

    grid.appendChild(
      createThemeCard(item)
    );

  });

}


function createThemeCard(item) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "theme-card";


  const image =
    getImage(item);


  const brecha =
    Number(
      item.brecha || 0
    );


  let brechaDisplay = "0";


  if (brecha > 0) {
    brechaDisplay =
      `-${brecha}`;
  }


  if (brecha < 0) {
    brechaDisplay =
      `${brecha}`;
  }


  card.innerHTML = `

    <div class="theme-hero">


      ${
        image
          ? `
            <img
              class="theme-image"
              src="${escapeHtml(image)}"
              alt=""
              loading="lazy"
            >
          `
          : `
            <div
              class="theme-image theme-image-empty"
            ></div>
          `
      }


    </div>


    <div class="theme-body">


      <div class="theme-category">

        ${getCategoryLabel(
          item.tipo ||
          currentCategory
        )}

      </div>


      <h3 class="theme-title">

        ${escapeHtml(
          item.tema ||
          "Sin título"
        )}

      </h3>


      <div class="theme-stats">


        <div class="theme-stat">

          <span>
            Notas
          </span>

          <strong>
            ${Number(
              item.total_notas || 0
            )}
          </strong>

        </div>


        <div class="theme-stat">

          <span>
            Medios
          </span>

          <strong>
            ${Number(
              item.cantidad_medios || 0
            )}
          </strong>

        </div>


        <div
          class="theme-stat theme-stat-gap"
        >

          <span>
            Brecha Perfil
          </span>

          <strong>
            ${brechaDisplay}
          </strong>

        </div>


      </div>


      ${renderCoverage(item)}


      <details class="theme-details">


        <summary>
          Ver detalles
        </summary>


        <div class="details-content">


          ${
            item.por_que_importa
              ? `
                <div class="detail-card detail-importance">

                  <div class="detail-card-label">
                    Por qué importa
                  </div>

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
                <div class="detail-card">

                  <div class="detail-card-label">
                    Insight
                  </div>

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
                <div class="detail-card detail-action">

                  <div class="detail-card-label">
                    Acción sugerida
                  </div>

                  <p>
                    ${escapeHtml(
                      item.accion_sugerida
                    )}
                  </p>

                </div>
              `
              : ""
          }


          ${renderApproaches(
            item.enfoques_sugeridos
          )}


          ${renderExamples(
            item.ejemplos
          )}


        </div>


      </details>


    </div>

  `;


  return card;

}


function renderApproaches(items) {

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {

    return "";

  }


  return `

    <div class="detail-card">

      <div class="detail-card-label">
        Enfoques sugeridos
      </div>


      <div class="approach-list">

        ${items
          .map(item => `

            <span class="approach-chip">
              ${escapeHtml(item)}
            </span>

          `)
          .join("")}

      </div>

    </div>

  `;

}


function renderExamples(examples) {

  if (
    !Array.isArray(examples) ||
    examples.length === 0
  ) {

    return "";

  }


  return `

    <div class="detail-card notes-card">

      <div class="detail-card-label">
        Notas usadas
      </div>


      <div class="examples-list">


        ${examples
          .slice(0, 3)
          .map(example => {

            const image =
              cleanMarkdownUrl(
                example.imagen ||
                ""
              );


            const link =
              cleanMarkdownUrl(
                example.link ||
                ""
              );


            return `

              <article class="example-card">


                ${
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
                    `
                }


                <div class="example-content">


                  <div class="example-medium">

                    ${escapeHtml(
                      example.medio ||
                      ""
                    )}

                  </div>


                  <div class="example-title">


                    ${
                      link
                        ? `
                          <a
                            href="${escapeHtml(link)}"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            ${escapeHtml(
                              example.titulo ||
                              "Ver nota"
                            )}
                          </a>
                        `
                        : escapeHtml(
                            example.titulo ||
                            "Ver nota"
                          )
                    }


                  </div>


                </div>


              </article>

            `;

          })
          .join("")}


      </div>


    </div>

  `;

}


function renderCoverage(item) {

  const coverage =
    item.cobertura;


  if (
    !coverage ||
    typeof coverage !== "object" ||
    Array.isArray(coverage)
  ) {

    return "";

  }


  const entries =
    Object.entries(
      coverage
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
        Cobertura por medio
      </div>


      <div class="coverage-list">


        ${entries
          .map(([medium, value]) => {

            const count =
              Number(value) || 0;


            const width =
              count > 0
                ? Math.max(
                    7,
                    (count / maxValue) *
                      100
                  )
                : 0;


            return `

              <div class="coverage-item">


                <div class="coverage-item-name">
                  ${escapeHtml(medium)}
                </div>


                <div class="coverage-bar">

                  <div
                    class="coverage-fill"
                    style="width:${width}%"
                  ></div>

                </div>


                <strong>
                  ${count}
                </strong>


              </div>

            `;

          })
          .join("")}


      </div>


    </div>

  `;

}
