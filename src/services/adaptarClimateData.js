const numero=valor=>{
  if(valor===null||valor===undefined||valor==="")return null;

  const n=Number(valor);

  return Number.isFinite(n)
    ?n
    :null;
};

/* =====================================================
   COMPLETITUD POR TEMPORADA
===================================================== */

const temporadasEstacion=(
  estacionId,
  completitud=[]
)=>
  Object.fromEntries(
    completitud
      .filter(
        item=>
          item.estacion_id===
          estacionId
      )
      .map(
        item=>[
          item.temporada,
          {
            completitud:
              item.variables
                ?.tmedia??
              null,

            completitudVariables:{
              maxima:
                item.variables
                  ?.tmax??
                null,

              minima:
                item.variables
                  ?.tmin??
                null,

              media:
                item.variables
                  ?.tmedia??
                null,

              precipitacion:
                item.variables
                  ?.precipitacion??
                null,
            },

            confiable:
              item.confiable??
              false,

            observacion:
              item.observacion??
              null,
          }
        ]
      )
  );

/* =====================================================
   ESTACIONES
===================================================== */

const adaptarEstaciones=(
  estaciones=[],
  completitud=[]
)=>
  estaciones.map(
    estacion=>({

      ...estacion,

      fechaInicio:
        estacion.fecha_inicio??
        null,

      fechaFin:
        estacion.fecha_fin??
        null,

      temporadasDisponibles:
        estacion.temporadas_disponibles??
        0,

      calidadDato:
        estacion.calidad_dato??
        null,

      temporadas:
        temporadasEstacion(
          estacion.id,
          completitud
        ),

    })
  );

/* =====================================================
   RESUMEN DIARIO

   JSON:
   tmax
   tmin
   tmedia
   amplitud
   precipitacion

   FRONT:
   maxima
   minima
   mediaDiaria
   amplitudTermica
   precipitacionMm
===================================================== */

const adaptarResumenDiario=(
  resumenDiario=[]
)=>
  Array.isArray(
    resumenDiario
  )
    ?resumenDiario.flatMap(
        resumen=>
          (
            resumen.dias??
            []
          ).map(
            dia=>({

              estacionId:
                resumen.estacion_id,

              fecha:
                dia.fecha,

              maxima:
                numero(
                  dia.tmax
                ),

              minima:
                numero(
                  dia.tmin
                ),

              mediaDiaria:
                numero(
                  dia.tmedia
                ),

              amplitudTermica:
                numero(
                  dia.amplitud
                ),

              precipitacionMm:
                numero(
                  dia.precipitacion
                ),

              motivoNulo:
                dia.motivo_nulo??
                null,

            })
          )
      )
    :[];

/* =====================================================
   RACHAS
===================================================== */

const adaptarEventoRacha=
  evento=>({

    ...evento,

    /*
      El JSON utiliza:
      inicio / fin

      CalorExtremo utiliza:
      fecha_inicio / fecha_fin
    */
    fecha_inicio:
      evento.fecha_inicio??
      evento.inicio??
      null,

    fecha_fin:
      evento.fecha_fin??
      evento.fin??
      null,

    dias:
      evento.dias??
      0,

    tmax_maxima:
      numero(
        evento.tmax_maxima
      ),

    con_incidencia:
      evento.con_incidencia??
      false,

    interrumpida_por_dato_faltante:
      evento.interrumpida_por_dato_faltante??
      false,

  });

const adaptarRachas=(
  rachas=[]
)=>
  Array.isArray(
    rachas
  )
    ?rachas.map(
        item=>({

          ...item,

          estacionId:
            item.estacion_id,

          umbral:
            numero(
              item.umbral_c
            ),

          minimoDiasIncidencia:
            item.minimo_dias_incidencia??
            null,

          eventos:
            (
              item.rachas??
              []
            ).map(
              adaptarEventoRacha
            ),

          calidadDato:
            item.calidad_dato??
            null,

        })
      )
    :[];

/* =====================================================
   FICHAS DE TEMPORADA
===================================================== */

const adaptarFichasTemporada=(
  fichas=[],
  temporadaEnCurso=null,
  rachas=[]
)=>
  Array.isArray(
    fichas
  )
    ?fichas.map(
        ficha=>{

          const registroRachas=
            rachas.find(
              item=>
                item.estacion_id===
                  ficha.estacion_id&&
                item.temporada===
                  ficha.temporada
            );

          const lluviaFueraInvierno=
            ficha.lluvia_fuera_invierno??
            null;

          return{

            /*
              Conservamos también todos
              los nombres originales.
            */
            ...ficha,

            estacionId:
              ficha.estacion_id,

            enCurso:
              ficha.temporada===
              temporadaEnCurso,

            winkler:
              ficha.indices
                ?.winkler??
              null,

            huglin:
              ficha.indices
                ?.huglin??
              null,

            lluviaInvernal:
              ficha.lluvia_invernal??
              null,

            lluviaFueraInvierno,

            /*
              Compatibilidad con el componente
              actual LluviaFueraInvernalCard.

              crecimiento_mm corresponde al
              período de crecimiento fuera
              del invierno.
            */
            lluvia_fuera_invierno_mm:
              numero(
                lluviaFueraInvierno
                  ?.crecimiento_mm
              ),

            calor:
              ficha.calor??
              null,

            clasificacion:
              ficha.clasificacion??
              null,

            diasCriticos:
              ficha.dias_criticos??
              [],

            /*
              CalorExtremoCard busca
              ficha.rachas.
            */
            rachas:
              (
                registroRachas
                  ?.rachas??
                []
              ).map(
                adaptarEventoRacha
              ),

            calidadRachas:
              registroRachas
                ?.calidad_dato??
              null,

          };
        }
      )
    :[];

/* =====================================================
   ADAPTADOR PRINCIPAL
===================================================== */

export const adaptarClimateData=data=>{

  if(!data){
    return null;
  }

  const temporadaEnCurso=
    data.temporada_en_curso??
    null;

  const completitudPorTemporada=
    Array.isArray(
      data.completitud_por_temporada
    )
      ?data.completitud_por_temporada
      :[];

  const rachasAdaptadas=
    adaptarRachas(
      data.rachas
    );

  const fichasTemporada=
    adaptarFichasTemporada(
      data.ficha_temporada,
      temporadaEnCurso,
      data.rachas??
      []
    );

  return{

    generado:
      data.generado??
      null,

    temporadaEnCurso,

    temporadas:
      Array.isArray(
        data.temporadas
      )
        ?data.temporadas
        :[],

    estaciones:
      adaptarEstaciones(
        data.estaciones??
        [],
        completitudPorTemporada
      ),

    completitudPorTemporada,

    /*
      Se mantiene también este nombre
      por compatibilidad.
    */
    completitud_por_temporada:
      completitudPorTemporada,

    seriesTemperaturas:
      adaptarResumenDiario(
        data.resumen_diario
      ),

    fichasTemporada,

    rachas:
      rachasAdaptadas,

    /*
      Si en el futuro el backend agrega
      mapa_calor, la app ya estará preparada.
    */
    mapaCalor:
      data.mapa_calor??
      null,

    mapa_calor:
      data.mapa_calor??
      null,

  };
};

/* =====================================================
   HELPERS
===================================================== */

export const obtenerFichaTemporada=(
  datos,
  estacionId,
  temporada
)=>
  datos
    ?.fichasTemporada
    ?.find(
      ficha=>
        ficha.estacionId===
          estacionId&&
        ficha.temporada===
          temporada
    )??
  null;

export const obtenerRachasTemporada=(
  datos,
  estacionId,
  temporada
)=>
  datos
    ?.rachas
    ?.find(
      item=>
        item.estacionId===
          estacionId&&
        item.temporada===
          temporada
    )??
  null;

export const formatearDato=(
  valor,
  decimales=1
)=>{

  if(
    valor===null||
    valor===undefined||
    !Number.isFinite(
      Number(valor)
    )
  ){
    return"Sin dato";
  }

  return Number(valor)
    .toFixed(
      decimales
    )
    .replace(
      ".",
      ","
    );
};