import React, { useState, useEffect, useMemo } from "react";
import mockData from "./prediccion_ficticia.json";
import "./PrediccionCosechaCard.css";

// DoD 8: Mantener HarvestProgressBar desconectado de la API hasta que el backend exponga datos reales de fenología
// import HarvestProgressBar from "../HarvestProgressBar/HarvestProgressBar";

const ETIQUETAS_VARIABLES = {
  Huglin: "Índice de Huglin (Heliotérmico)",
  Winkler: "Índice de Winkler (GDD / Grados-Día)",
  GST: "Temperatura Media de Temporada (GST)",
  region: "Región Climática (I–V)",
  color: "Color de Uva (Tinta / Blanca)",
};

const ETIQUETAS_METODOS = {
  random_forest: "Random Forest",
  promedio_regional: "Promedio Regional",
  regresion_lineal: "Regresión Lineal",
};

// Convierte el número de día del año (doy) a fecha calendario YYYY-MM-DD
const doyAFechaISO = (doy, anio = 1941) => {
  if (doy === null || doy === undefined || Number.isNaN(Number(doy))) return "—";
  const fecha = new Date(Date.UTC(anio, 0, Math.round(Number(doy))));
  const yyyy = fecha.getUTCFullYear();
  const mm = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatearNombreCultivar = (cultivar) => {
  if (cultivar === "Carigne") return "Carignan (Carigne)";
  if (cultivar === "Chardony") return "Chardonnay (Chardony)";
  if (cultivar === "Greche") return "Grenache (Greche)";
  return cultivar;
};

export default function PrediccionCosechaCard() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [sinDatoAlerta, setSinDatoAlerta] = useState(null);

  // DoD 7: Filtros interactivos por Región, Color y Cultivar
  const [filtroRegion, setFiltroRegion] = useState("TODAS");
  const [filtroColor, setFiltroColor] = useState("TODOS");
  const [filtroCultivar, setFiltroCultivar] = useState("Carigne");
  const [algoritmoActivo, setAlgoritmoActivo] = useState("random_forest");
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  // DoD 1: Conectar a GET /api/v1/prediccion-ficticia (manejando 404 con motivo_nulo y fallback a prediccion_ficticia.json)
  useEffect(() => {
    let cancelado = false;

    const cargarPredicciones = async () => {
      setCargando(true);
      try {
        const respuesta = await fetch("/api/v1/prediccion-ficticia", {
          headers: { Accept: "application/json" },
        });

        const contentType = respuesta.headers.get("content-type") || "";

        if (respuesta.status === 404 && contentType.includes("application/json")) {
          const errorJson = await respuesta.json();
          if (!cancelado && errorJson?.motivo_nulo) {
            setSinDatoAlerta(`Sin dato: ${errorJson.motivo_nulo}`);
            setDatos(null);
            setCargando(false);
            return;
          }
        }

        if (!respuesta.ok || !contentType.includes("application/json")) {
          throw new Error("Usando respaldo local prediccion_ficticia.json");
        }

        const jsonReal = await respuesta.json();
        if (!cancelado) {
          if (jsonReal?.motivo_nulo) {
            setSinDatoAlerta(`Sin dato: ${jsonReal.motivo_nulo}`);
            setDatos(null);
          } else {
            setDatos(jsonReal);
            setSinDatoAlerta(null);
          }
        }
      } catch {
        if (!cancelado) {
          setDatos(mockData);
          setSinDatoAlerta(null);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    cargarPredicciones();
    return () => {
      cancelado = true;
    };
  }, []);

  const predicciones = datos?.predicciones || [];

  const regionesDisponibles = useMemo(() => {
    const ordenRomano = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
    const unicas = [...new Set(predicciones.map((p) => p.region))];
    return unicas.sort((a, b) => (ordenRomano[a] || 99) - (ordenRomano[b] || 99));
  }, [predicciones]);

  const coloresDisponibles = useMemo(() => {
    return [...new Set(predicciones.map((p) => p.color))];
  }, [predicciones]);

  const cultivaresDisponibles = useMemo(() => {
    const base = predicciones.filter((p) => {
      const okRegion = filtroRegion === "TODAS" || p.region === filtroRegion;
      const okColor = filtroColor === "TODOS" || p.color === filtroColor;
      return okRegion && okColor;
    });
    return [...new Set(base.map((p) => p.cultivar))].sort((a, b) =>
      a.localeCompare(b, "es")
    );
  }, [predicciones, filtroRegion, filtroColor]);

  useEffect(() => {
    if (
      filtroCultivar !== "TODOS" &&
      cultivaresDisponibles.length > 0 &&
      !cultivaresDisponibles.includes(filtroCultivar)
    ) {
      setFiltroCultivar("TODOS");
    }
  }, [cultivaresDisponibles, filtroCultivar]);

  const prediccionesFiltradas = useMemo(() => {
    return predicciones.filter((item) => {
      const coincideRegion =
        filtroRegion === "TODAS" || item.region === filtroRegion;
      const coincideColor =
        filtroColor === "TODOS" || item.color === filtroColor;
      const coincideCultivar =
        filtroCultivar === "TODOS" || item.cultivar === filtroCultivar;
      return coincideRegion && coincideColor && coincideCultivar;
    });
  }, [predicciones, filtroRegion, filtroColor, filtroCultivar]);

  useEffect(() => {
    if (prediccionesFiltradas.length > 0) {
      setRegistroSeleccionado(prediccionesFiltradas[0]);
    } else {
      setRegistroSeleccionado(null);
    }
  }, [prediccionesFiltradas]);

  // DoD 6: Importancia relativa de variables
  const importanciasOrdenadas = useMemo(() => {
    const imp = datos?.modelo?.importancias || {};
    return Object.entries(imp)
      .map(([clave, valor]) => ({
        clave,
        etiqueta: ETIQUETAS_VARIABLES[clave] || clave,
        valor: Number(valor),
        porcentaje: (Number(valor) * 100).toFixed(1),
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [datos]);

  // DoD 5: Tabla comparativa de métricas MAE y RMSE para los 3 métodos
  const metricasLista = useMemo(() => {
    const met = datos?.modelo?.metricas || {};
    const entradas = Object.entries(met).map(([clave, obj]) => ({
      clave,
      nombre: ETIQUETAS_METODOS[clave] || clave,
      mae: Number(obj.mae_dias),
      rmse: Number(obj.rmse_dias),
      n: obj.n,
    }));
    const minMae = Math.min(...entradas.map((e) => e.mae));
    const minRmse = Math.min(...entradas.map((e) => e.rmse));
    return entradas.map((e) => ({
      ...e,
      esMejorMae: e.mae === minMae,
      esMejorRmse: e.rmse === minRmse,
    }));
  }, [datos]);

  const obtenerDoySegunAlgoritmo = (item) => {
    if (!item) return 0;
    if (algoritmoActivo === "regresion_lineal") return item.doy_regresion_lineal;
    if (algoritmoActivo === "promedio_regional") return item.doy_promedio_regional;
    return item.doy_estimado;
  };

  const minDoy = 220;
  const maxDoy = 315;
  const anchoSvg = 460;
  const altoSvg = 270;
  const padIzq = 54;
  const padDer = 20;
  const padSup = 18;
  const padInf = 38;

  const escalarX = (doy) =>
    padIzq +
    ((doy - minDoy) / (maxDoy - minDoy)) * (anchoSvg - padIzq - padDer);

  const escalarY = (doy) =>
    altoSvg -
    padInf -
    ((doy - minDoy) / (maxDoy - minDoy)) * (altoSvg - padSup - padInf);

  const ticksDoy = [225, 245, 265, 285, 305];

  return (
    <section className="winkler-card prediccion-cosecha-card">
      {/* DoD 2 y 3: Aviso mandatorio permanente y destacado */}
      <div className="winkler-aviso prediccion-aviso-mandatorio" role="alert">
        <strong>
          «Aviso: Datos predictivos basados en modelo de calibración (California). No corresponden a mediciones reales de viñedos Casas Patronales».
        </strong>
      </div>

      <div className="winkler-card-header">
        <div className="winkler-header-top">
          <div>
            <span className="winkler-badge">
              MODELOS PREDICTIVOS DE VENDIMIA · VIGNO
            </span>
            <h4>Estimación de Fecha Probable de Cosecha</h4>
            <p className="winkler-desc">
              Referencia bibliográfica: {datos?.fuente?.cita || "Amerine & Winkler"} · Temporada evaluada: 1941
            </p>
          </div>

          {/* DoD 7: Filtros interactivos por Región, Color y Cultivar */}
          <div className="winkler-selectores">
            <select
              className="winkler-select"
              value={filtroRegion}
              onChange={(e) => setFiltroRegion(e.target.value)}
              aria-label="Filtrar por Región"
            >
              <option value="TODAS">Región: Todas (I–V)</option>
              {regionesDisponibles.map((reg) => (
                <option key={reg} value={reg}>
                  Región Winkler {reg}
                </option>
              ))}
            </select>

            <select
              className="winkler-select"
              value={filtroColor}
              onChange={(e) => setFiltroColor(e.target.value)}
              aria-label="Filtrar por Color"
            >
              <option value="TODOS">Color: Todos</option>
              {coloresDisponibles.map((col) => (
                <option key={col} value={col}>
                  {col === "Red" ? "Uva Tinta (Red)" : "Uva Blanca (White)"}
                </option>
              ))}
            </select>

            <select
              className="winkler-select"
              value={filtroCultivar}
              onChange={(e) => setFiltroCultivar(e.target.value)}
              aria-label="Filtrar por Cultivar"
            >
              <option value="TODOS">
                Cultivar: Todos ({cultivaresDisponibles.length})
              </option>
              {cultivaresDisponibles.map((cult) => (
                <option key={cult} value={cult}>
                  {formatearNombreCultivar(cult)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {cargando && (
        <div className="lluvia-criterio-box">
          <p className="winkler-desc">Cargando estimaciones de cosecha...</p>
        </div>
      )}

      {!cargando && sinDatoAlerta && (
        <div className="winkler-aviso" role="status">
          <strong>{sinDatoAlerta}</strong>
        </div>
      )}

      {!cargando && !sinDatoAlerta && datos && (
        <>
          {registroSeleccionado ? (
            <>
              <div className="winkler-card-body">
                <div className="winkler-metric">
                  <span className="winkler-value">
                    {registroSeleccionado.prediccion?.centro || "—"}
                  </span>
                  <span className="winkler-unit">
                    Fecha estimada (Random Forest)
                  </span>
                </div>

                <div className="winkler-classification">
                  <span className="winkler-region">
                    {formatearNombreCultivar(registroSeleccionado.cultivar)} · Región {registroSeleccionado.region}
                  </span>
                  <span className="winkler-desc">
                    Fecha real de cosecha: <strong>{registroSeleccionado.fecha_real}</strong> · Desfase del modelo:{" "}
                    <strong>
                      {registroSeleccionado.diferencia_dias > 0 ? "+" : ""}
                      {registroSeleccionado.diferencia_dias.toFixed(1)} días
                    </strong>
                  </span>
                </div>
              </div>

              {/* DoD 4: Rotulación agronómica obligatoria ("Dispersión estadística del modelo") */}
              <div className="winkler-temporada-info">
                <div>
                  <span>Dispersión estadística del modelo (Desde)</span>
                  <strong>{registroSeleccionado.prediccion?.desde || "—"}</strong>
                </div>
                <div>
                  <span>Dispersión estadística del modelo (Hasta)</span>
                  <strong>{registroSeleccionado.prediccion?.hasta || "—"}</strong>
                </div>
                <div>
                  <span>Dispersión estadística (± días)</span>
                  <strong>
                    ±{registroSeleccionado.prediccion?.dispersion_dias} días
                  </strong>
                </div>
                <div>
                  <span>Fecha estimada según algoritmo</span>
                  <strong className="estado-curso">
                    RF: {doyAFechaISO(registroSeleccionado.doy_estimado, registroSeleccionado.anio)} | RL:{" "}
                    {doyAFechaISO(registroSeleccionado.doy_regresion_lineal, registroSeleccionado.anio)} | Prom:{" "}
                    {doyAFechaISO(registroSeleccionado.doy_promedio_regional, registroSeleccionado.anio)}
                  </strong>
                </div>
              </div>
            </>
          ) : (
            <div className="winkler-aviso">
              Sin dato para la combinación de filtros seleccionada.
            </div>
          )}

          <div className="prediccion-grid-dos-columnas">
            {/* DoD 7: Gráfico de dispersión Fecha Real vs. Fecha Estimada */}
            <div className="lluvia-criterio-box prediccion-panel">
              <div className="prediccion-panel-header">
                <div>
                  <span className="winkler-badge">
                    FECHA REAL VS. FECHA ESTIMADA
                  </span>
                  <p className="winkler-desc">
                    Selecciona un punto para ver su detalle ({prediccionesFiltradas.length} muestras visibles).
                  </p>
                </div>
                <select
                  className="winkler-select prediccion-select-compacto"
                  value={algoritmoActivo}
                  onChange={(e) => setAlgoritmoActivo(e.target.value)}
                  aria-label="Seleccionar algoritmo a comparar"
                >
                  <option value="random_forest">Modelo: Random Forest</option>
                  <option value="regresion_lineal">Modelo: Regresión Lineal</option>
                  <option value="promedio_regional">Modelo: Promedio Regional</option>
                </select>
              </div>

              <div className="prediccion-scatter-wrapper">
                <svg
                  viewBox={`0 0 ${anchoSvg} ${altoSvg}`}
                  className="prediccion-scatter-svg"
                  role="img"
                  aria-label="Gráfico de dispersión Fecha Real versus Fecha Estimada"
                >
                  {ticksDoy.map((t) => (
                    <g key={t}>
                      <line
                        x1={escalarX(t)}
                        y1={padSup}
                        x2={escalarX(t)}
                        y2={altoSvg - padInf}
                        className="scatter-grid-line"
                      />
                      <line
                        x1={padIzq}
                        y1={escalarY(t)}
                        x2={anchoSvg - padDer}
                        y2={escalarY(t)}
                        className="scatter-grid-line"
                      />
                      <text
                        x={escalarX(t)}
                        y={altoSvg - padInf + 14}
                        textAnchor="middle"
                        className="scatter-axis-text"
                      >
                        {doyAFechaISO(t).slice(5)}
                      </text>
                      <text
                        x={padIzq - 6}
                        y={escalarY(t) + 3}
                        textAnchor="end"
                        className="scatter-axis-text"
                      >
                        {doyAFechaISO(t).slice(5)}
                      </text>
                    </g>
                  ))}

                  <line
                    x1={escalarX(minDoy)}
                    y1={escalarY(minDoy)}
                    x2={escalarX(maxDoy)}
                    y2={escalarY(maxDoy)}
                    className="scatter-diagonal-ideal"
                  />

                  {prediccionesFiltradas.map((item, idx) => {
                    const x = escalarX(item.doy_real);
                    const doyY = obtenerDoySegunAlgoritmo(item);
                    const y = escalarY(doyY);
                    const esSeleccionado =
                      registroSeleccionado &&
                      registroSeleccionado.cultivar === item.cultivar &&
                      registroSeleccionado.region === item.region;
                    const esCarignan = item.cultivar === "Carigne";

                    return (
                      <circle
                        key={`${item.cultivar}-${item.region}-${idx}`}
                        cx={x}
                        cy={y}
                        r={esSeleccionado ? 6 : esCarignan ? 5 : 4}
                        className={`scatter-point ${
                          item.color === "Red" ? "point-red" : "point-white"
                        } ${esSeleccionado ? "point-selected" : ""}`}
                        onClick={() => setRegistroSeleccionado(item)}
                      >
                        <title>
                          {`${formatearNombreCultivar(item.cultivar)} (Región ${item.region})\nFecha Real: ${item.fecha_real}\nFecha Estimada: ${doyAFechaISO(doyY, item.anio)}`}
                        </title>
                      </circle>
                    );
                  })}

                  <text
                    x={(padIzq + anchoSvg - padDer) / 2}
                    y={altoSvg - 6}
                    textAnchor="middle"
                    className="scatter-axis-title"
                  >
                    Fecha Real de Cosecha (Mes-Día)
                  </text>
                  <text
                    x={12}
                    y={(padSup + altoSvg - padInf) / 2}
                    textAnchor="middle"
                    transform={`rotate(-90 12 ${(padSup + altoSvg - padInf) / 2})`}
                    className="scatter-axis-title"
                  >
                    Fecha Estimada (Mes-Día)
                  </text>
                </svg>
              </div>

              <div className="lluvia-ejes">
                <span className="winkler-desc">
                  Línea diagonal: <strong>Predicción exacta (Real = Estimada)</strong>
                </span>
                <span className="winkler-desc">
                  Naranjo: <strong>Cepas Tintas</strong>
                </span>
                <span className="winkler-desc">
                  Amarillo: <strong>Cepas Blancas</strong>
                </span>
              </div>
            </div>

            {/* DoD 6: Gráfico de barras horizontales con importancia relativa de variables */}
            <div className="lluvia-criterio-box prediccion-panel">
              <div>
                <span className="winkler-badge">
                  IMPORTANCIA RELATIVA DE VARIABLES
                </span>
                <p className="winkler-desc">
                  Peso porcentual de cada índice climático y variable en la predicción de cosecha.
                </p>
              </div>

              <div className="importancia-barras-lista">
                {importanciasOrdenadas.map((item) => (
                  <div key={item.clave} className="importancia-item">
                    <div className="importancia-item-top">
                      <span className="importancia-nombre">{item.etiqueta}</span>
                      <strong className="importancia-valor">{item.porcentaje}%</strong>
                    </div>
                    <div className="importancia-barra-fondo">
                      <div
                        className="importancia-barra-relleno"
                        style={{ width: `${Math.max(item.valor * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="lluvia-criterio-lista">
                <p className="winkler-desc">
                  <strong>Interpretación agronómica:</strong> La acumulación térmica (Índices de Huglin y Winkler) junto a la temperatura media (GST) concentran el <strong>88.9%</strong> del peso predictivo sobre la fecha de vendimia.
                </p>
              </div>
            </div>
          </div>

          {/* DoD 5: Tabla comparativa de métricas de desempeño (MAE y RMSE para los 3 métodos) */}
          <div className="lluvia-criterio-box">
            <span className="winkler-badge">
              DESEMPEÑO COMPARATIVO DE ALGORITMOS (MAE Y RMSE)
            </span>
            <div className="prediccion-tabla-contenedor">
              <table className="prediccion-tabla">
                <thead>
                  <tr>
                    <th>Método / Algoritmo</th>
                    <th>MAE (Error Absoluto Medio)</th>
                    <th>RMSE (Raíz del Error Cuadrático Medio)</th>
                    <th>Muestras Evaluadas</th>
                    <th>Resultado de Desempeño</th>
                  </tr>
                </thead>
                <tbody>
                  {metricasLista.map((m) => (
                    <tr key={m.clave}>
                      <td>
                        <strong>{m.nombre}</strong>
                      </td>
                      <td>
                        <span className={m.esMejorMae ? "metrica-destacada" : ""}>
                          {m.mae.toFixed(2)} días
                        </span>
                      </td>
                      <td>
                        <span className={m.esMejorRmse ? "metrica-destacada" : ""}>
                          {m.rmse.toFixed(2)} días
                        </span>
                      </td>
                      <td>{m.n} vendimias</td>
                      <td className="winkler-desc">
                        {m.esMejorRmse && "Menor error cuadrático ante desvíos extremos (Mejor RMSE)"}
                        {m.esMejorMae && !m.esMejorRmse && "Menor error promedio en días (Mejor MAE)"}
                        {!m.esMejorMae && !m.esMejorRmse && "Modelo lineal base de referencia"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/*
            ==========================================================================
            DoD 8: Mantener el componente HarvestProgressBar desconectado de la API
            hasta que el backend exponga datos reales de fenología.
            ==========================================================================
          */}
          {/*
          <div className="lluvia-criterio-box harvest-progress-wrapper">
            <HarvestProgressBar
              etapaActual="Envero a Madurez"
              porcentaje={0}
              desconectado={true}
            />
          </div>
          */}
        </>
      )}
    </section>
  );
}