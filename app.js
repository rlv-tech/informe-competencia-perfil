// ==========================================
// RADAR DE COMPETENCIA - FRONTEND
// ==========================================

let DATA = null;

let categoriaActual = 'hipercompetencia';


// ==========================================
// CONFIGURACIÓN
// ==========================================

// Ruta al JSON que n8n actualiza en GitHub
const DATA_URL =
  './data/data-competencia.json';


// Actualizar datos automáticamente cada 5 minutos
const INTERVALO_ACTUALIZACION =
  5 * 60 * 1000;


// ==========================================
// CATEGORÍAS
// ==========================================

const CATEGORIAS = {

  hipercompetencia: {
    titulo: 'Hipercompetencia',
    badge: 'badge-hiper',
    etiqueta: 'Hipercompetencia'
  },

  perfil_pierde: {
    titulo: 'Perfil pierde',
    badge: 'badge-pierde',
    etiqueta: 'Perfil pierde'
  },

  sin_cobertura_perfil: {
    titulo: 'Sin cobertura en Perfil',
    badge: 'badge-sin',
    etiqueta: 'Sin cobertura'
  },

  oportunidades: {
    titulo: 'Oportunidades',
    badge: 'badge-oportunidad',
    etiqueta: 'Oportunidad'
  }

};


// ==========================================
// CARGAR DATOS
// ==========================================

async function cargarDashboard() {

  try {

    /*
     * El timestamp evita que el navegador
     * utilice una versión vieja del JSON.
     */

    const response = await fetch(
      DATA_URL + '?t=' + Date.now(),
      {
        cache: 'no-store'
      }
    );


    if (!response.ok) {

      throw new Error(
        'No se pudo cargar data-competencia.json'
      );

    }


    DATA = await response.json();


    console.log(
      'Datos recibidos desde GitHub:',
      DATA
    );


    // Actualizar fecha

    mostrarFecha();


    // Actualizar contadores

    mostrarContadores();


    // Actualizar prioridades

    mostrarPrioridades();


    // Actualizar gráfico de brechas

    mostrarBrecha();


    /*
     * Configuramos los eventos solamente una vez.
     * Los datos pueden actualizarse sin duplicar
     * listeners.
     */

    configurarEventos();


    /*
     * Mantener la categoría que el usuario
     * estaba viendo.
     */

    mostrarCategoria(
      categoriaActual
    );


    console.log(
      'Dashboard actualizado correctamente.'
    );


  } catch (error) {

    console.error(
      'Error cargando dashboard:',
      error
    );


    const contenido =
      document.getElementById(
        'contenido'
      );


    if (contenido) {

      contenido.innerHTML = `

        <div class="tema-card vacio">

          <h3>
            No se pudieron cargar los datos
          </h3>

          <p>
            Verificá que
            <strong>
              data/data-competencia.json
            </strong>
            exista en el repositorio.
          </p>

        </div>

      `;

    }

  }

}


// ==========================================
// ACTUALIZACIÓN AUTOMÁTICA
// ==========================================

/*
 * n8n actualiza el JSON en GitHub.
 *
 * El dashboard consulta nuevamente el archivo
 * cada 5 minutos.
 *
 * Si n8n generó nuevos datos mientras el dashboard
 * estaba abierto, aparecerán automáticamente.
 */

setInterval(
  cargarDashboard,
  INTERVALO_ACTUALIZACION
);


// ==========================================
// ESCAPE HTML
// ==========================================

function escaparHTML(texto) {

  if (
    texto === null ||
    texto === undefined
  ) {

    return '';

  }


  return String(texto)

    .replace(
      /&/g,
      '&amp;'
    )

    .replace(
      /</g,
      '&lt;'
    )

    .replace(
      />/g,
      '&gt;'
    )

    .replace(
      /"/g,
      '&quot;'
    )

    .replace(
      /'/g,
      '&#039;'
    );

}


// ==========================================
// FECHA
// ==========================================

function mostrarFecha() {

  const elemento =
    document.getElementById(
      'fecha'
    );


  if (!elemento) {

    return;

  }


  elemento.textContent =

    DATA.fecha_analisis

      ? 'Análisis: ' +
        DATA.fecha_analisis

      : 'Análisis actualizado';

}


// ==========================================
// CONTADORES DE CATEGORÍAS
// ==========================================

function mostrarContadores() {

  const hiper =
    document.getElementById(
      'count-hiper'
    );


  const pierde =
    document.getElementById(
      'count-pierde'
    );


  const sin =
    document.getElementById(
      'count-sin'
    );


  const oportunidades =
    document.getElementById(
      'count-oportunidades'
    );


  if (hiper) {

    hiper.textContent =
      (
        DATA.hipercompetencia ||
        []
      ).length;

  }


  if (pierde) {

    pierde.textContent =
      (
        DATA.perfil_pierde ||
        []
      ).length;

  }


  if (sin) {

    sin.textContent =
      (
        DATA.sin_cobertura_perfil ||
        []
      ).length;

  }


  if (oportunidades) {

    oportunidades.textContent =
      (
        DATA.oportunidades ||
        []
      ).length;

  }

}


// ==========================================
// PRIORIDADES DEL DÍA
// ==========================================

function mostrarPrioridades() {

  const contenedor =
    document.getElementById(
      'prioridades'
    );


  if (!contenedor) {

    return;

  }


  const prioridades =

    (
      DATA.prioridades_del_dia ||
      []
    )
      .slice(0, 3);


  if (!prioridades.length) {

    contenedor.innerHTML = `

      <div class="tema-card vacio">

        <h3>
          No hay prioridades disponibles
        </h3>

      </div>

    `;

    return;

  }


  contenedor.innerHTML =

    prioridades

      .map(item => {

        const motivo =

          item.motivo ||

          item.insight ||

          item.por_que_importa ||

          '';


        const accion =

          item.accion_sugerida ||

          '';


        return `

          <article class="prioridad-card">

            <div class="prioridad-top">

              <div class="prioridad-numero">

                ${escaparHTML(
                  item.prioridad
                )}

              </div>


              <span class="prioridad-label">

                PRIORIDAD

              </span>

            </div>


            <h3>

              ${escaparHTML(
                item.tema
              )}

            </h3>


            ${
              motivo

                ? `

                  <p class="prioridad-motivo">

                    ${escaparHTML(
                      motivo
                    )}

                  </p>

                `

                : ''

            }


            ${
              accion

                ? `

                  <div class="prioridad-accion">

                    <strong>

                      ACCIÓN SUGERIDA

                    </strong>


                    ${escaparHTML(
                      accion
                    )}

                  </div>

                `

                : ''

            }

          </article>

        `;

      })

      .join('');

}


// ==========================================
// BRECHA DE COBERTURA
// ==========================================

function mostrarBrecha() {

  const contenedor =
    document.getElementById(
      'brecha-chart'
    );


  if (!contenedor) {

    return;

  }


  const todos = [

    ...(DATA.hipercompetencia || []),

    ...(DATA.perfil_pierde || []),

    ...(DATA.sin_cobertura_perfil || []),

    ...(DATA.oportunidades || [])

  ];


  const temas = todos

    .filter(item =>
      Number(item.brecha) > 0
    )

    .sort(
      (a, b) =>
        Number(b.brecha || 0) -
        Number(a.brecha || 0)
    )

    .slice(0, 8);


  if (!temas.length) {

    contenedor.innerHTML = `

      <div class="vacio">

        No hay brechas de cobertura detectadas.

      </div>

    `;

    return;

  }


  const max =

    Math.max(

      ...temas.map(
        item =>
          Number(item.brecha) || 0
      ),

      1

    );


  contenedor.innerHTML =

    temas

      .map(item => {

        const valor =
          Number(item.brecha) || 0;


        const porcentaje =

          Math.max(

            5,

            (
              valor /
              max
            ) * 100

          );


        return `

          <div class="brecha-row">

            <div class="brecha-topic">

              <strong>

                ${escaparHTML(
                  item.tema
                )}

              </strong>


              <span>

                ${
                  escaparHTML(
                    item.medio_lider ||
                    'Competencia'
                  )
                }

                lidera · Perfil:

                ${
                  Number(
                    item.cobertura_perfil
                  ) || 0
                }

              </span>

            </div>


            <div class="brecha-track">

              <div
                class="brecha-fill"
                style="
                  width:${porcentaje}%
                "
              ></div>

            </div>


            <div class="brecha-value">

              -${valor}

            </div>

          </div>

        `;

      })

      .join('');

}


// ==========================================
// EVENTOS
// ==========================================

function configurarEventos() {

  /*
   * IMPORTANTE:
   *
   * Usamos onclick en lugar de addEventListener
   * para no acumular eventos cada vez que el
   * JSON se actualiza.
   */


  // ------------------------------------------
  // Categorías
  // ------------------------------------------

  document
    .querySelectorAll(
      '.category-tab'
    )
    .forEach(button => {

      button.onclick = () => {

        document
          .querySelectorAll(
            '.category-tab'
          )
          .forEach(btn =>
            btn.classList.remove(
              'active'
            )
          );


        button.classList.add(
          'active'
        );


        categoriaActual =
          button.dataset.category;


        mostrarCategoria(
          categoriaActual
        );

      };

    });


  // ------------------------------------------
  // Orden
  // ------------------------------------------

  const orden =
    document.getElementById(
      'orden'
    );


  if (orden) {

    orden.onchange = () => {

      mostrarCategoria(
        categoriaActual
      );

    };

  }


  // ------------------------------------------
  // Modal
  // ------------------------------------------

  const cerrar =
    document.getElementById(
      'cerrar-modal'
    );


  if (cerrar) {

    cerrar.onclick =
      cerrarModal;

  }


  const overlay =
    document.querySelector(
      '.modal-overlay'
    );


  if (overlay) {

    overlay.onclick =
      cerrarModal;

  }

}


// ==========================================
// MOSTRAR CATEGORÍA
// ==========================================

function mostrarCategoria(
  categoria
) {

  if (!DATA) {

    return;

  }


  const contenedor =
    document.getElementById(
      'contenido'
    );


  if (!contenedor) {

    return;

  }


  const config =
    CATEGORIAS[categoria];


  const titulo =
    document.getElementById(
      'titulo-categoria'
    );


  if (titulo) {

    titulo.textContent =

      config
        ? config.titulo
        : categoria;

  }


  let items =

    Array.isArray(
      DATA[categoria]
    )

      ? [
          ...DATA[categoria]
        ]

      : [];


  ordenarTemas(
    items
  );


  if (!items.length) {

    contenedor.innerHTML = `

      <div class="tema-card vacio">

        <h3>

          No hay temas detectados

        </h3>


        <p>

          El análisis de hoy no encontró
          elementos para esta categoría.

        </p>

      </div>

    `;

    return;

  }


  contenedor.innerHTML =

    items

      .map(
        (item, index) =>
          crearTema(
            item,
            categoria,
            index
          )
      )

      .join('');


  configurarExpandibles();

}


// ==========================================
// ORDENAR
// ==========================================

function ordenarTemas(
  items
) {

  const orden =

    document.getElementById(
      'orden'
    )?.value ||

    'brecha';


  if (orden === 'brecha') {

    items.sort(

      (a, b) =>

        Number(
          b.brecha || 0
        ) -

        Number(
          a.brecha || 0
        )

    );

  }


  if (orden === 'notas') {

    items.sort(

      (a, b) =>

        Number(
          b.total_notas || 0
        ) -

        Number(
          a.total_notas || 0
        )

    );

  }


  if (orden === 'medios') {

    items.sort(

      (a, b) =>

        Number(
          b.cantidad_medios || 0
        ) -

        Number(
          a.cantidad_medios || 0
        )

    );

  }


  if (orden === 'alfabetico') {

    items.sort(

      (a, b) =>

        String(
          a.tema || ''
        )

          .localeCompare(

            String(
              b.tema || ''
            ),

            'es'

          )

    );

  }

}


// ==========================================
// CREAR TEMA
// ==========================================

function crearTema(
  item,
  categoria,
  index
) {

  const config =
    CATEGORIAS[categoria];


  const cobertura =
    item.cobertura || {};


  const maxCobertura =

    Math.max(

      ...Object.values(
        cobertura
      )

        .map(Number)

        .filter(
          value =>
            !isNaN(value)
        ),

      1

    );


  const coberturaHTML =
    crearCobertura(
      cobertura,
      maxCobertura
    );


  const insight =

    item.insight ||

    item.motivo ||

    item.motivo_oportunidad ||

    item.por_que_importa ||

    '';


  const ejemplos =
    crearEjemplos(
      item.ejemplos
    );


  const enfoques =
    crearEnfoques(
      item.enfoques_sugeridos
    );


  const id =
    `${categoria}-${index}`;


  return `

    <article
      class="tema-card"
      id="${escaparHTML(id)}"
    >


      <!-- HEADER -->

      <div class="tema-card-header">

        <h3 class="tema-title">

          ${escaparHTML(
            item.tema ||
            'Sin tema'
          )}

        </h3>


        <span
          class="
            category-badge
            ${config.badge}
          "
        >

          ${escaparHTML(
            config.etiqueta
          )}

        </span>

      </div>


      <!-- METRICAS -->

      <div class="mini-metrics">


        <div class="mini-metric">

          <strong>

            ${Number(
              item.total_notas
            ) || 0}

          </strong>


          <span>

            notas

          </span>

        </div>


        <div class="mini-metric">

          <strong>

            ${Number(
              item.cantidad_medios
            ) || 0}

          </strong>


          <span>

            medios

          </span>

        </div>


        <div class="mini-metric">

          <strong>

            ${Number(
              item.cobertura_perfil
            ) || 0}

          </strong>


          <span>

            Perfil

          </span>

        </div>


        <div class="mini-metric">

          <strong>

            ${Number(
              item.brecha
            ) || 0}

          </strong>


          <span>

            brecha

          </span>

        </div>

      </div>


      <!-- COBERTURA -->

      <div class="coverage-box">

        <div class="coverage-header">

          <strong>

            Cobertura por medio

          </strong>


          <span>

            Líder:

            ${
              escaparHTML(
                item.medio_lider ||
                '—'
              )
            }

          </span>

        </div>


        <div class="coverage-bars">

          ${coberturaHTML}

        </div>

      </div>


      <!-- INSIGHT -->

      ${
        insight

          ? `

            <div class="insight-box">

              <div class="insight-label">

                INSIGHT

              </div>


              <p>

                ${escaparHTML(
                  insight
                )}

              </p>

            </div>

          `

          : ''

      }


      <!-- ACCION -->

      ${
        item.accion_sugerida

          ? `

            <div class="action-box">

              <div class="action-label">

                ACCIÓN SUGERIDA

              </div>


              <p>

                ${escaparHTML(
                  item.accion_sugerida
                )}

              </p>

            </div>

          `

          : ''

      }


      <!-- BOTON -->

      <button
        class="expand-button"
        data-target="${escaparHTML(id)}"
        type="button"
      >

        <span>

          Ver análisis completo

        </span>


        <span class="expand-arrow">

          ↓

        </span>

      </button>


      <!-- DETALLE -->

      <div class="detalle">


        ${
          item.por_que_importa

            ? `

              <div class="detalle-section">

                <h4>

                  Por qué importa

                </h4>


                <p>

                  ${escaparHTML(
                    item.por_que_importa
                  )}

                </p>

              </div>

            `

            : ''

        }


        ${
          item.tipo_de_oportunidad

            ? `

              <div class="detalle-section">

                <h4>

                  Tipo de oportunidad

                </h4>


                <p>

                  ${escaparHTML(
                    item.tipo_de_oportunidad
                  )}

                </p>

              </div>

            `

            : ''

        }


        ${
          item.motivo_oportunidad

            ? `

              <div class="detalle-section">

                <h4>

                  Motivo

                </h4>


                <p>

                  ${escaparHTML(
                    item.motivo_oportunidad
                  )}

                </p>

              </div>

            `

            : ''

        }


        ${
          enfoques

            ? `

              <div class="detalle-section">

                <h4>

                  Enfoques sugeridos

                </h4>


                <div class="enfoques">

                  ${enfoques}

                </div>

              </div>

            `

            : ''

        }


        ${
          ejemplos

            ? `

              <div class="detalle-section">

                <h4>

                  Qué está publicando la competencia

                </h4>


                <div class="ejemplos-grid">

                  ${ejemplos}

                </div>

              </div>

            `

            : ''

        }

      </div>

    </article>

  `;

}


// ==========================================
// COBERTURA
// ==========================================

function crearCobertura(
  cobertura,
  max
) {

  const medios = [

    'Perfil',
    'La Nación',
    'Clarín',
    'Infobae',
    'TN',
    'Ámbito',
    'Página 12',
    'El Cronista'

  ];


  return medios

    .map(medio => {

      const valor =

        Number(
          cobertura[medio]
        ) || 0;


      const porcentaje =

        valor === 0

          ? 0

          : Math.max(

              7,

              (
                valor /
                max
              ) * 100

            );


      const clase =

        medio === 'Perfil'

          ? 'perfil'

          : '';


      return `

        <div
          class="
            coverage-line
            ${clase}
          "
        >

          <span class="coverage-name">

            ${escaparHTML(
              medio
            )}

          </span>


          <div class="coverage-track">

            <div
              class="coverage-fill"
              style="
                width:${porcentaje}%
              "
            ></div>

          </div>


          <span class="coverage-value">

            ${valor}

          </span>

        </div>

      `;

    })

    .join('');

}


// ==========================================
// ENFOQUES
// ==========================================

function crearEnfoques(
  enfoques
) {

  if (

    !Array.isArray(enfoques) ||

    !enfoques.length

  ) {

    return '';

  }


  return enfoques

    .slice(0, 2)

    .map(

      enfoque => `

        <div class="enfoque">

          ${escaparHTML(
            enfoque
          )}

        </div>

      `

    )

    .join('');

}


// ==========================================
// EJEMPLOS
// ==========================================

function crearEjemplos(
  ejemplos
) {

  if (

    !Array.isArray(ejemplos) ||

    !ejemplos.length

  ) {

    return '';

  }


  return ejemplos

    .slice(0, 3)

    .map(ejemplo => {

      const imagen =

        ejemplo.imagen ||

        ejemplo.Imagen ||

        '';


      const link =

        ejemplo.link ||

        '#';


      return `

        <a
          class="ejemplo-card"
          href="${escaparHTML(link)}"
          target="_blank"
          rel="noopener noreferrer"
        >

          ${
            imagen

              ? `

                <img
                  class="ejemplo-image"
                  src="${escaparHTML(
                    imagen
                  )}"
                  alt=""
                  loading="lazy"
                  onerror="
                    this.style.display='none'
                  "
                >

              `

              : `

                <div
                  class="ejemplo-image"
                ></div>

              `

          }


          <div class="ejemplo-body">

            <div class="ejemplo-medio">

              ${escaparHTML(
                ejemplo.medio ||
                ''
              )}

            </div>


            <div class="ejemplo-title">

              ${escaparHTML(
                ejemplo.titulo ||
                ''
              )}

            </div>

          </div>

        </a>

      `;

    })

    .join('');

}


// ==========================================
// EXPANDIBLES
// ==========================================

function configurarExpandibles() {

  document

    .querySelectorAll(
      '.expand-button'
    )

    .forEach(button => {

      /*
       * onclick reemplaza el evento anterior
       * y evita duplicaciones.
       */

      button.onclick = () => {

        const card =
          button.closest(
            '.tema-card'
          );


        if (!card) {

          return;

        }


        const detalle =
          card.querySelector(
            '.detalle'
          );


        if (!detalle) {

          return;

        }


        const abierto =

          detalle.classList.contains(
            'abierto'
          );


        if (abierto) {

          detalle.classList.remove(
            'abierto'
          );


          const texto =
            button.querySelector(
              'span:first-child'
            );


          if (texto) {

            texto.textContent =
              'Ver análisis completo';

          }


          const flecha =
            button.querySelector(
              '.expand-arrow'
            );


          if (flecha) {

            flecha.textContent =
              '↓';

          }

        }

        else {

          detalle.classList.add(
            'abierto'
          );


          const texto =
            button.querySelector(
              'span:first-child'
            );


          if (texto) {

            texto.textContent =
              'Ocultar análisis';

          }


          const flecha =
            button.querySelector(
              '.expand-arrow'
            );


          if (flecha) {

            flecha.textContent =
              '↑';

          }

        }

      };

    });

}


// ==========================================
// MODAL
// ==========================================

function cerrarModal() {

  const modal =
    document.getElementById(
      'modal'
    );


  if (!modal) {

    return;

  }


  modal.classList.remove(
    'visible'
  );

}


// ==========================================
// INICIAR
// ==========================================

cargarDashboard();
