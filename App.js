// ============================================
// RADAR DE COMPETENCIA - PROCESAMIENTO FINAL
// ============================================

// ============================================
// 1. DATOS DE ENTRADA
// ============================================

let data = items[0].json;


// ============================================
// 2. PARSEAR OUTPUT DE IA
// ============================================

if (typeof data.output === 'string') {

  let texto = data.output.trim();

  // Eliminar bloques Markdown
  texto = texto
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // Buscar inicio del JSON
  const inicio = texto.indexOf('{');

  if (inicio === -1) {
    throw new Error(
      'La IA no devolvió ningún objeto JSON.'
    );
  }

  texto = texto.substring(inicio);

  // Encontrar cierre real del JSON
  let profundidad = 0;
  let dentroString = false;
  let escapado = false;
  let fin = -1;

  for (let i = 0; i < texto.length; i++) {

    const caracter = texto[i];

    if (escapado) {
      escapado = false;
      continue;
    }

    if (caracter === '\\') {
      escapado = true;
      continue;
    }

    if (caracter === '"') {
      dentroString = !dentroString;
      continue;
    }

    if (dentroString) {
      continue;
    }

    if (caracter === '{') {
      profundidad++;
    }

    if (caracter === '}') {

      profundidad--;

      if (profundidad === 0) {
        fin = i;
        break;
      }
    }
  }

  if (fin === -1) {
    throw new Error(
      'El JSON de la IA está incompleto.'
    );
  }

  texto = texto.substring(0, fin + 1);

  // Eliminar comas finales
  texto = texto.replace(
    /,\s*([}\]])/g,
    '$1'
  );

  try {

    data = JSON.parse(texto);

  } catch (e) {

    throw new Error(
      'No se pudo convertir el JSON de la IA: ' +
      e.message
    );
  }
}


// ============================================
// 3. MEDIOS VÁLIDOS
// ============================================

const MEDIOS = [
  'Perfil',
  'La Nación',
  'Clarín',
  'Infobae',
  'TN',
  'Ámbito',
  'Página 12',
  'El Cronista'
];


// ============================================
// 4. NORMALIZAR NOMBRE DE MEDIO
// ============================================

function normalizarMedio(nombre) {

  if (!nombre) {
    return '';
  }

  const limpio = String(nombre)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const mapa = {

    'perfil':
      'Perfil',

    'la nacion':
      'La Nación',

    'lanacion':
      'La Nación',

    'la-nacion':
      'La Nación',

    'clarin':
      'Clarín',

    'infobae':
      'Infobae',

    'tn':
      'TN',

    'ambito':
      'Ámbito',

    'pagina 12':
      'Página 12',

    'pagina12':
      'Página 12',

    'pagina-12':
      'Página 12',

    'pagina/12':
      'Página 12',

    'cronista':
      'El Cronista',

    'el cronista':
      'El Cronista',

    'elcronista':
      'El Cronista'
  };

  return mapa[limpio] || '';
}


// ============================================
// 5. LIMPIAR TEXTO
// ============================================

function limpiarTexto(valor) {

  if (
    valor === null ||
    valor === undefined
  ) {
    return '';
  }

  return String(valor)
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/^´´´/g, '')
    .replace(/´´´$/g, '')
    .trim();
}


// ============================================
// 6. LIMPIAR LINKS
// ============================================

function limpiarLink(valor) {

  if (!valor) {
    return '';
  }

  let link = String(valor).trim();

  // Markdown:
  // [texto](https://sitio.com)
  const markdown = link.match(
    /^\[.*?\]\((https?:\/\/.*?)\)$/
  );

  if (markdown) {
    link = markdown[1];
  }

  link = link
    .replace(/```/g, '')
    .replace(/^\[|\]$/g, '')
    .replace(/\\:/g, ':')
    .replace(/\\\//g, '/')
    .replace(/\\_/g, '_')
    .trim();

  return link;
}


// ============================================
// 7. NÚMEROS
// ============================================

function numero(valor) {

  const n = Number(valor);

  return Number.isFinite(n)
    ? n
    : 0;
}


// ============================================
// 8. COBERTURA
// ============================================

function procesarCobertura(cobertura) {

  const resultado = {};

  // Inicializar todos los medios
  MEDIOS.forEach(medio => {
    resultado[medio] = 0;
  });

  if (
    !cobertura ||
    typeof cobertura !== 'object'
  ) {
    return resultado;
  }

  Object.entries(cobertura).forEach(
    ([medio, cantidad]) => {

      const medioNormalizado =
        normalizarMedio(medio);

      if (
        !medioNormalizado ||
        !MEDIOS.includes(medioNormalizado)
      ) {
        return;
      }

      resultado[medioNormalizado] +=
        numero(cantidad);
    }
  );

  return resultado;
}


// ============================================
// 9. EJEMPLOS
// ============================================

function procesarEjemplos(ejemplos) {

  if (!Array.isArray(ejemplos)) {
    return [];
  }

  return ejemplos
    .map(e => {

      const medio =
        normalizarMedio(e?.medio);

      return {

        medio:
          medio ||
          limpiarTexto(e?.medio),

        titulo:
          limpiarTexto(e?.titulo),

        link:
          limpiarLink(e?.link),

        imagen:
          limpiarLink(
            e?.imagen ||
            e?.Imagen ||
            ''
          )
      };
    })

    .filter(e =>
      e.titulo ||
      e.link
    )

    .slice(0, 3);
}


// ============================================
// 10. ENFOQUES
// ============================================

function procesarEnfoques(enfoques) {

  if (!Array.isArray(enfoques)) {
    return [];
  }

  return enfoques
    .map(e =>
      limpiarTexto(e)
    )
    .filter(Boolean)
    .slice(0, 2);
}


// ============================================
// 11. PROCESAR UN TEMA
// ============================================

function procesarTema(t) {

  if (
    !t ||
    typeof t !== 'object'
  ) {
    return null;
  }


  // ------------------------------------------
  // COBERTURA
  // ------------------------------------------

  const cobertura =
    procesarCobertura(
      t.cobertura
    );

  const coberturaPerfil =
    cobertura['Perfil'];


  // ------------------------------------------
  // COMPETIDORES
  // ------------------------------------------

  const competidores =
    MEDIOS
      .filter(
        medio =>
          medio !== 'Perfil'
      )
      .map(
        medio => ({
          medio,
          notas:
            cobertura[medio] || 0
        })
      );


  // ------------------------------------------
  // MEDIO LÍDER
  // ------------------------------------------

  const coberturaMedioLider =
    Math.max(
      ...competidores.map(
        item =>
          item.notas
      ),
      0
    );

  const lider =
    competidores.find(
      item =>
        item.notas ===
        coberturaMedioLider
    );

  const medioLider =
    lider
      ? lider.medio
      : '';


  // ------------------------------------------
  // BRECHA
  // ------------------------------------------

  const brecha =
    Math.max(
      0,
      coberturaMedioLider -
      coberturaPerfil
    );


  // ------------------------------------------
  // CANTIDAD DE MEDIOS
  // ------------------------------------------

  const cantidadMedios =
    MEDIOS.filter(
      medio =>
        cobertura[medio] > 0
    ).length;


  // ------------------------------------------
  // CANTIDAD DE COMPETIDORES
  // ------------------------------------------

  const cantidadMediosCompetencia =
    MEDIOS
      .filter(
        medio =>
          medio !== 'Perfil'
      )
      .filter(
        medio =>
          cobertura[medio] > 0
      )
      .length;


  // ------------------------------------------
  // COMPETENCIA TOTAL
  // ------------------------------------------

  const competenciaTotal =
    MEDIOS
      .filter(
        medio =>
          medio !== 'Perfil'
      )
      .reduce(
        (total, medio) =>
          total +
          cobertura[medio],
        0
      );


  // ------------------------------------------
  // TOTAL NOTAS
  // ------------------------------------------

  const totalNotas =
    MEDIOS.reduce(
      (total, medio) =>
        total +
        cobertura[medio],
      0
    );


  // ------------------------------------------
  // RESULTADO
  // ------------------------------------------

  return {

    tema:
      limpiarTexto(
        t.tema
      ),

    prioridad:
      numero(
        t.prioridad
      ),

    tipo:
      limpiarTexto(
        t.tipo
      ),

    tipo_de_oportunidad:
      limpiarTexto(
        t.tipo_de_oportunidad
      ),

    total_notas:
      totalNotas,

    cantidad_medios:
      cantidadMedios,

    cobertura_perfil:
      coberturaPerfil,

    perfil:
      coberturaPerfil,

    competencia_total:
      competenciaTotal,

    medio_lider:
      medioLider,

    cobertura_medio_lider:
      coberturaMedioLider,

    brecha:
      brecha,

    cobertura:
      cobertura,

    por_que_importa:
      limpiarTexto(
        t.por_que_importa
      ),

    insight:
      limpiarTexto(
        t.insight
      ),

    motivo:
      limpiarTexto(
        t.motivo
      ),

    motivo_oportunidad:
      limpiarTexto(
        t.motivo_oportunidad
      ),

    accion_sugerida:
      limpiarTexto(
        t.accion_sugerida
      ),

    enfoques_sugeridos:
      procesarEnfoques(
        t.enfoques_sugeridos
      ),

    ejemplos:
      procesarEjemplos(
        t.ejemplos
      ),

    medios_que_mas_publicaron:
      Array.isArray(
        t.medios_que_mas_publicaron
      )
        ? t.medios_que_mas_publicaron
        : [],

    medios_que_cubrieron:
      Array.isArray(
        t.medios_que_cubrieron
      )
        ? t.medios_que_cubrieron
        : [],

    cantidad_medios_competencia:
      cantidadMediosCompetencia
  };
}


// ============================================
// 12. PROCESAR CATEGORÍAS
// ============================================

function procesarCategoria(
  temas,
  tipo
) {

  if (!Array.isArray(temas)) {
    return [];
  }

  return temas
    .map(tema => {

      const procesado =
        procesarTema(tema);

      if (!procesado) {
        return null;
      }

      // La categoría real viene dada
      // por el bloque donde está el tema.
      procesado.tipo = tipo;

      return procesado;
    })
    .filter(Boolean);
}


// ============================================
// 13. PROCESAR LAS CUATRO CATEGORÍAS
// ============================================

const hipercompetencia =
  procesarCategoria(
    data.hipercompetencia,
    'hipercompetencia'
  );

const perfilPierde =
  procesarCategoria(
    data.perfil_pierde,
    'perfil_pierde'
  );

const sinCobertura =
  procesarCategoria(
    data.sin_cobertura_perfil,
    'sin_cobertura_perfil'
  );

const oportunidades =
  procesarCategoria(
    data.oportunidades,
    'oportunidades'
  );


// ============================================
// 14. CONTROL DE DUPLICADOS
// ============================================

// IMPORTANTE:
// El orden de procesamiento define la prioridad.
// Si un mismo tema aparece en varias categorías,
// queda solamente en la primera categoría procesada.
//
// PRIORIDAD:
// 1. hipercompetencia
// 2. perfil_pierde
// 3. sin_cobertura_perfil
// 4. oportunidades

const temasVistos =
  new Set();

function eliminarDuplicadosTemas(
  temas
) {

  return temas.filter(
    tema => {

      const clave =
        limpiarTexto(
          tema.tema
        )
          .normalize('NFD')
          .replace(
            /[\u0300-\u036f]/g,
            ''
          )
          .toLowerCase()
          .trim();

      if (!clave) {
        return false;
      }

      if (
        temasVistos.has(clave)
      ) {
        return false;
      }

      temasVistos.add(clave);

      return true;
    }
  );
}


// ============================================
// 15. APLICAR PRIORIDAD DE CATEGORÍAS
// ============================================

const hipercompetenciaFinal =
  eliminarDuplicadosTemas(
    hipercompetencia
  );

const perfilPierdeFinal =
  eliminarDuplicadosTemas(
    perfilPierde
  );

const sinCoberturaFinal =
  eliminarDuplicadosTemas(
    sinCobertura
  );

const oportunidadesFinal =
  eliminarDuplicadosTemas(
    oportunidades
  );


// ============================================
// 16. PRIORIDADES
// ============================================

let prioridadesRaw =
  Array.isArray(
    data.prioridades_del_dia
  )
    ? data.prioridades_del_dia
    : [];

const prioridades =
  prioridadesRaw
    .slice(0, 3)
    .map(
      (tema, index) => {

        const procesado =
          procesarTema(
            tema
          );

        if (!procesado) {
          return null;
        }

        procesado.prioridad =
          numero(
            tema?.prioridad
          ) ||
          index + 1;

        return procesado;
      }
    )
    .filter(Boolean);


// ============================================
// 17. FECHA
// ============================================

function formatearFecha(
  fecha
) {

  if (!fecha) {
    return '';
  }

  const texto =
    String(fecha)
      .trim();

  // DD/MM/YYYY
  let match =
    texto.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

  // DD-MM-YYYY
  if (!match) {
    match =
      texto.match(
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/
      );
  }

  if (!match) {
    return limpiarTexto(
      fecha
    );
  }

  const dia =
    Number(
      match[1]
    );

  const mes =
    Number(
      match[2]
    );

  const año =
    match[3];

  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre'
  ];

  if (
    mes < 1 ||
    mes > 12
  ) {
    return limpiarTexto(
      fecha
    );
  }

  return `${dia} de ${meses[mes - 1]} de ${año}`;
}


// ============================================
// 18. ANÁLISIS COMPLETO
// ============================================

const analisisCompleto = {

  hipercompetencia:
    hipercompetenciaFinal,

  perfil_pierde:
    perfilPierdeFinal,

  sin_cobertura_perfil:
    sinCoberturaFinal,

  oportunidades:
    oportunidadesFinal
};


// ============================================
// 19. TOTAL DE TEMAS
// ============================================

const totalTemas =

  hipercompetenciaFinal.length +

  perfilPierdeFinal.length +

  sinCoberturaFinal.length +

  oportunidadesFinal.length;


// ============================================
// 20. SALIDA FINAL
// ============================================

return [
  {
    json: {

      fecha_analisis:
        formatearFecha(
          data.fecha_analisis
        ),

      // --------------------------------------
      // CATEGORÍAS
      // --------------------------------------

      hipercompetencia:
        hipercompetenciaFinal,

      perfil_pierde:
        perfilPierdeFinal,

      sin_cobertura_perfil:
        sinCoberturaFinal,

      oportunidades:
        oportunidadesFinal,

      // --------------------------------------
      // PRIORIDADES
      // --------------------------------------

      prioridades_del_dia:
        prioridades,

      // --------------------------------------
      // ANÁLISIS COMPLETO
      // --------------------------------------

      analisis_completo:
        analisisCompleto,

      // --------------------------------------
      // CONTROL
      // --------------------------------------

      total_temas:
        totalTemas
    }
  }
];
