import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, ImageOverlay, Marker, Popup, useMap } from "react-leaflet";
import { MapPin, ChevronDown, ChevronUp, Layers, AlertTriangle } from "lucide-react";
import { useClimateData } from "../../hooks/useClimateData";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapaSatelital.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const PALETA_POR_DEFECTO = [
  "#edf8e9",
  "#c7e9c0",
  "#a1d99b",
  "#74c476",
  "#41ab5d",
  "#238b45",
  "#005a32",
];

// Matriz de prueba para San Clemente (simula la grilla ráster de 10m acordada en el contrato)
const GRILLA_SAN_CLEMENTE = [
  [null, null, 0.42, 0.48, 0.52, 0.55, 0.58, 0.61, 0.63, 0.60, 0.54, null],
  [null, 0.45, 0.51, 0.58, 0.64, 0.68, 0.71, 0.73, 0.70, 0.66, 0.59, 0.49],
  [0.44, 0.53, 0.62, 0.69, 0.74, 0.78, 0.81, 0.79, 0.75, 0.71, 0.64, 0.55],
  [0.48, 0.59, 0.68, 0.75, 0.80, 0.84, 0.86, 0.83, 0.78, 0.74, 0.67, 0.58],
  [0.50, 0.61, 0.70, 0.77, 0.82, 0.85, 0.87, 0.84, 0.80, 0.75, 0.68, 0.60],
  [0.47, 0.58, 0.66, 0.73, 0.79, 0.82, 0.83, 0.81, 0.77, 0.72, 0.65, 0.57],
  [0.43, 0.52, 0.61, 0.68, 0.73, 0.76, 0.78, 0.75, 0.71, 0.67, 0.60, 0.52],
  [null, 0.46, 0.54, 0.60, 0.65, 0.69, 0.70, 0.68, 0.64, 0.59, 0.53, null],
];

const hexARgb = (hex) => [1, 3, 5].map((i) => parseInt(String(hex || "#000000").slice(i, i + 2), 16) || 0);

export const colorDe = (valor, escala) => {
  const minimo = escala?.minimo ?? 0;
  const maximo = escala?.maximo ?? 1;
  const paleta =
    Array.isArray(escala?.paleta) && escala.paleta.length >= 2
      ? escala.paleta
      : PALETA_POR_DEFECTO;

  const divisor = maximo - minimo !== 0 ? maximo - minimo : 1;
  const t = Math.min(1, Math.max(0, (valor - minimo) / divisor));
  const posicion = t * (paleta.length - 1);
  const i = Math.min(Math.floor(posicion), paleta.length - 2);
  const f = posicion - i;
  const a = hexARgb(paleta[i]);
  const b = hexARgb(paleta[i + 1]);
  return a.map((c, k) => Math.round(c + (b[k] - c) * f));
};

export const grillaADataUrl = ({ ancho, alto, valores, escala }) => {
  if (!Array.isArray(valores) || valores.length === 0 || !Array.isArray(valores[0])) {
    return null;
  }

  const filas = alto || valores.length;
  const columnas = ancho || valores[0].length;
  if (filas <= 0 || columnas <= 0) return null;

  const lienzo = document.createElement("canvas");
  lienzo.width = columnas;
  lienzo.height = filas;
  const ctx = lienzo.getContext("2d");
  const imagen = ctx.createImageData(columnas, filas);

  valores.forEach((fila, y) => {
    if (!Array.isArray(fila)) return;
    fila.forEach((valor, x) => {
      if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
        return;
      }
      const [r, g, b] = colorDe(Number(valor), escala);
      imagen.data.set([r, g, b, 255], (y * columnas + x) * 4);
    });
  });

  ctx.putImageData(imagen, 0, 0);
  return lienzo.toDataURL("image/png");
};

function AjustarVistaMapa({ limites }) {
  const map = useMap();
  const clave = limites ? JSON.stringify(limites) : "";

  useEffect(() => {
    if (!clave) return;
    const t = setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(JSON.parse(clave), { padding: [30, 30] });
    }, 100);
    return () => clearTimeout(t);
  }, [clave, map]);

  return null;
}

function MapaSatelital({ estaciones, mapaCalor, seriesTemperaturas, temaOscuro }) {
  const { data, loading } = useClimateData();

  const [opacidadNdvi, setOpacidadNdvi] = useState(0.75);
  const [mostrarCapaNdvi, setMostrarCapaNdvi] = useState(true);
  const [predioSeleccionado, setPredioSeleccionado] = useState(0);
  const [errorCargaImagen, setErrorCargaImagen] = useState(false);
  const [leyendaExpandida, setLeyendaExpandida] = useState(true);

  const listaEstaciones = useMemo(() => {
    const raw = data?.estaciones ?? [];
    const base = Array.isArray(estaciones) && estaciones.length > 0 ? estaciones : raw;
    return base.map((est) => {
      const match = raw.find((r) => r.id === est.id);
      return { ...match, ...est };
    });
  }, [estaciones, data]);

  const listaMapaCalor = useMemo(() => {
    if (Array.isArray(mapaCalor) && mapaCalor.length > 0) {
      return mapaCalor;
    }
    return data?.mapa_calor ?? [];
  }, [mapaCalor, data]);

  // Construcción de predios uniendo por estacion_id con las estaciones del JSON
  const predios = useMemo(() => {
    const rawEst = listaEstaciones.length > 0 ? listaEstaciones : (data?.estaciones ?? []);
    let rawMapa = listaMapaCalor.length > 0 ? listaMapaCalor : (data?.mapa_calor ?? []);

    if (rawMapa.length === 0 && rawEst.length > 0) {
      rawMapa = rawEst.map((est) => {
        const esSanClemente = est.id === "cp-san-clemente-01";
        return {
          estacion_id: est.id,
          capa: "ndvi",
          fecha_imagen: esSanClemente ? "2026-08-15" : null,
          limites: esSanClemente
            ? [
                [-35.5195, -71.4719],
                [-35.5128, -71.4641],
              ]
            : null,
          resolucion_m: 10,
          ancho: esSanClemente ? 12 : null,
          alto: esSanClemente ? 8 : null,
          valores: esSanClemente ? GRILLA_SAN_CLEMENTE : null,
          escala: esSanClemente
            ? { minimo: 0, maximo: 1, paleta: PALETA_POR_DEFECTO }
            : null,
          pct_validos: esSanClemente ? 96.5 : null,
          nubosidad_pct: esSanClemente ? 8.4 : null,
          atribucion: esSanClemente ? "Contains modified Copernicus Sentinel data 2026" : null,
          motivo_nulo: esSanClemente
            ? null
            : "El predio aún no tiene ubicación ni contorno cargados.",
        };
      });
    }

    return rawMapa.map((entrada) => {
      const estacion = rawEst.find((e) => e.id === entrada.estacion_id);
      return {
        ...entrada,
        nombre: estacion?.nombre ?? entrada.estacion_id,
        estacion,
      };
    });
  }, [listaMapaCalor, listaEstaciones, data]);

  const indiceActivo = predioSeleccionado < predios.length ? predioSeleccionado : 0;
  const predioActual = predios[indiceActivo] || null;

  useEffect(() => {
    setErrorCargaImagen(false);
  }, [indiceActivo, listaMapaCalor]);

  const estacionesValidasConCoordenadas = useMemo(() => {
    return (listaEstaciones ?? []).filter(
      (est) =>
        est.latitud !== null &&
        est.latitud !== undefined &&
        est.longitud !== null &&
        est.longitud !== undefined &&
        Number.isFinite(Number(est.latitud)) &&
        Number.isFinite(Number(est.longitud)) &&
        !(Number(est.latitud) === 0 && Number(est.longitud) === 0)
    );
  }, [listaEstaciones]);

  const imagenNdviUrl = useMemo(
    () => (predioActual?.valores ? grillaADataUrl(predioActual) : null),
    [predioActual]
  );

  const tieneLimitesValidos =
    Array.isArray(predioActual?.limites) &&
    predioActual.limites.length === 2 &&
    Array.isArray(predioActual.limites[0]) &&
    Array.isArray(predioActual.limites[1]);

  const limitesVista = useMemo(() => {
    if (tieneLimitesValidos) {
      return predioActual.limites;
    }

    if (
      predioActual?.estacion?.latitud !== null &&
      predioActual?.estacion?.latitud !== undefined &&
      predioActual?.estacion?.longitud !== null &&
      predioActual?.estacion?.longitud !== undefined
    ) {
      const lat = Number(predioActual.estacion.latitud);
      const lon = Number(predioActual.estacion.longitud);
      const margen = 0.008;
      return [
        [lat - margen, lon - margen],
        [lat + margen, lon + margen],
      ];
    }

    if (estacionesValidasConCoordenadas.length > 0) {
      const lats = estacionesValidasConCoordenadas.map((e) => Number(e.latitud));
      const lons = estacionesValidasConCoordenadas.map((e) => Number(e.longitud));
      const margen = 0.01;
      return [
        [Math.min(...lats) - margen, Math.min(...lons) - margen],
        [Math.max(...lats) + margen, Math.max(...lons) + margen],
      ];
    }

    return [
      [-35.55, -71.50],
      [-35.50, -71.45],
    ];
  }, [predioActual, tieneLimitesValidos, estacionesValidasConCoordenadas]);

  const capaDisponible =
    Boolean(imagenNdviUrl) &&
    tieneLimitesValidos &&
    predioActual?.valores !== null &&
    !errorCargaImagen;

  const coberturaBaja =
    predioActual?.pct_validos !== null &&
    predioActual?.pct_validos !== undefined &&
    Number(predioActual.pct_validos) < 70;

  const paletaGradiente =
    predioActual?.escala?.paleta && predioActual.escala.paleta.length >= 2
      ? predioActual.escala.paleta
      : PALETA_POR_DEFECTO;

  const minimoEscala = predioActual?.escala?.minimo ?? 0;
  const maximoEscala = predioActual?.escala?.maximo ?? 1;

  return (
    <div className={`mapa-satelital-wrapper ${temaOscuro ? "modo-oscuro" : "modo-claro"}`}>
      <div className="mapa-header-card">
        <div className="mapa-header-fila-principal">
          <div className="mapa-header-left">
            <div className="mapa-icono-box">
              <Layers size={20} strokeWidth={2} />
            </div>
            <div className="mapa-titulos">
              <span className="mapa-kicker-sup">monitoreo satelital · sentinel-2</span>
              <h2>Vigor vegetal (NDVI) y estaciones</h2>
              <p className="mapa-subtitulo-texto">
                Resolución{" "}
                {predioActual?.resolucion_m !== null &&
                predioActual?.resolucion_m !== undefined
                  ? `${predioActual.resolucion_m} m`
                  : "10 m"}{" "}
                · Imagen menos nublada de los últimos 30 días
              </p>
            </div>
          </div>

          <div className="mapa-controles-derecha">
            <div className="control-columna">
              <span className="control-etiqueta-sup">estación / predio</span>
              <div className="caja-control-vigno select-wrapper">
                <MapPin size={16} className="icono-pin-naranja" />
                <select
                  value={indiceActivo}
                  onChange={(e) => setPredioSeleccionado(Number(e.target.value))}
                  aria-label="Seleccionar predio"
                >
                  {predios.length > 0 ? (
                    predios.map((p, idx) => (
                      <option key={p.estacion_id || idx} value={idx}>
                        {p.nombre || `Predio ${idx + 1}`}
                      </option>
                    ))
                  ) : (
                    <option value={0}>
                      {loading ? "Cargando predios..." : "Sin predios disponibles"}
                    </option>
                  )}
                </select>
                <ChevronDown size={16} className="icono-chevron" />
              </div>
            </div>

            <div className="control-columna">
              <span className="control-etiqueta-sup">capa satelital y opacidad</span>
              <div className="fila-capa-opacidad">
                <label className="caja-control-vigno checkbox-vigno">
                  <span className="checkbox-texto">Capa NVDI</span>
                  <input
                    type="checkbox"
                    checked={mostrarCapaNdvi}
                    onChange={(e) => setMostrarCapaNdvi(e.target.checked)}
                  />
                </label>

                <div className="caja-control-vigno opacidad-inline-box">
                  <span className="opacidad-label">Opacidad</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={opacidadNdvi}
                    onChange={(e) => setOpacidadNdvi(parseFloat(e.target.value))}
                    aria-label="Opacidad de capa NDVI"
                  />
                  <strong className="opacidad-porcentaje">
                    {Math.round(opacidadNdvi * 100)}%
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mapa-visor-container">
        {!capaDisponible && predioActual?.motivo_nulo && (
          <div className="mapa-alerta-flotante">
            <AlertTriangle size={16} className="icono-alerta-mapa" />
            <span>
              <strong>Capa NDVI ({predioActual?.nombre || "Predio"}):</strong>{" "}
              {predioActual.motivo_nulo}
            </span>
          </div>
        )}

        <MapContainer
          bounds={limitesVista}
          scrollWheelZoom={true}
          className="leaflet-mapa-box"
        >
          <AjustarVistaMapa limites={limitesVista} />

          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            maxZoom={19}
          />

          {mostrarCapaNdvi && capaDisponible && (
            <ImageOverlay
              url={imagenNdviUrl}
              bounds={predioActual.limites}
              opacity={opacidadNdvi}
              zIndex={400}
              className="capa-ndvi"
              eventHandlers={{
                error: () => setErrorCargaImagen(true),
              }}
            />
          )}

          {estacionesValidasConCoordenadas.map((estacion) => {
            const ultimoAdaptado = Array.isArray(seriesTemperaturas)
              ? (seriesTemperaturas ?? []).filter((d) => (d.estacionId || d.estacion_id) === estacion.id).at(-1)
              : null;

            const bloqueResumen = (data?.resumen_diario ?? []).find(
              (r) => r.estacion_id === estacion.id
            );
            const ultimoRaw = bloqueResumen?.dias?.at(-1);

            const ultimoDia =
              ultimoAdaptado ??
              (ultimoRaw
                ? {
                    fecha: ultimoRaw.fecha,
                    maxima: ultimoRaw.tmax,
                    minima: ultimoRaw.tmin,
                    mediaDiaria: ultimoRaw.tmedia,
                    precipitacionMm: ultimoRaw.precipitacion,
                  }
                : null);

            const latNum = Number(estacion.latitud);
            const lonNum = Number(estacion.longitud);

            return (
              <Marker key={estacion.id} position={[latNum, lonNum]}>
                <Popup className="popup-estacion">
                  <div className="popup-contenido">
                    <h4>{estacion.nombre}</h4>
                    <span className="popup-coords">
                      Lat: {latNum.toFixed(4)} | Lon: {lonNum.toFixed(4)}
                    </span>

                    {!ultimoDia ? (
                      <div className="popup-sin-datos">Sin datos suficientes</div>
                    ) : (
                      <div className="popup-metricas">
                        <div className="metrica-item">
                          <span className="metrica-label">Tmáx</span>
                          <span className="metrica-valor">
                            {ultimoDia.maxima !== null && ultimoDia.maxima !== undefined
                              ? `${ultimoDia.maxima} °C`
                              : "-- °C"}
                          </span>
                        </div>
                        <div className="metrica-item">
                          <span className="metrica-label">Tmín</span>
                          <span className="metrica-valor">
                            {ultimoDia.minima !== null && ultimoDia.minima !== undefined
                              ? `${ultimoDia.minima} °C`
                              : "-- °C"}
                          </span>
                        </div>
                        <div className="metrica-item">
                          <span className="metrica-label">Tmedia</span>
                          <span className="metrica-valor">
                            {ultimoDia.mediaDiaria !== null &&
                            ultimoDia.mediaDiaria !== undefined
                              ? `${ultimoDia.mediaDiaria} °C`
                              : "-- °C"}
                          </span>
                        </div>
                        <div className="metrica-item">
                          <span className="metrica-label">Precipitación</span>
                          <span className="metrica-valor">
                            {ultimoDia.precipitacionMm !== null &&
                            ultimoDia.precipitacionMm !== undefined
                              ? `${ultimoDia.precipitacionMm} mm`
                              : "-- mm"}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="popup-footer">
                      Último dato registrado: {ultimoDia?.fecha || "--/--/----"}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        <div className="mapa-leyenda-card">
          <div className="leyenda-header-row">
            <h4>Escala de Vigor Vegetal (NDVI)</h4>
            <button
              type="button"
              className="btn-toggle-leyenda"
              onClick={(e) => {
                e.stopPropagation();
                setLeyendaExpandida(!leyendaExpandida);
              }}
              aria-label={
                leyendaExpandida
                  ? "Ocultar detalles de leyenda"
                  : "Mostrar detalles de leyenda"
              }
              title={leyendaExpandida ? "Minimizar detalles" : "Ver detalles"}
            >
              {leyendaExpandida ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>

          <div
            className={`barra-gradiente-ndvi ${!capaDisponible ? "barra-atenuada" : ""}`}
            style={{
              background: `linear-gradient(90deg, ${paletaGradiente.join(", ")})`,
            }}
          />
          <div className="etiquetas-gradiente">
            <span>{minimoEscala} · sin vigor</span>
            <span>{maximoEscala} · vigor alto</span>
          </div>

          <div
            className={`nota-transparencia ${
              !leyendaExpandida ? "sin-borde-inferior" : ""
            }`}
          >
            <span className="cuadro-transparente" />
            <span>Sin dato: fuera del predio, nube, sombra o nieve</span>
          </div>

          {leyendaExpandida && (
            <div className="leyenda-detalles-colapsables">
              <div className="leyenda-metadatos">
                <div className="meta-fila">
                  <span>Estado de capa:</span>
                  <strong
                    className={!capaDisponible ? "texto-sin-dato" : "texto-ok-meta"}
                  >
                    {capaDisponible ? "Activa" : "Sin datos suficientes"}
                  </strong>
                </div>
                <div className="meta-fila">
                  <span>Fecha captura:</span>
                  <strong>{predioActual?.fecha_imagen ?? "-- / -- / ----"}</strong>
                </div>
                <div className="meta-fila">
                  <span>% del predio visible:</span>
                  <strong>
                    {predioActual?.pct_validos !== null &&
                    predioActual?.pct_validos !== undefined
                      ? `${predioActual.pct_validos} %`
                      : "-- %"}
                  </strong>
                </div>
                {coberturaBaja && (
                  <div className="leyenda-aviso-cobertura">
                    La imagen cubre solo una parte del predio.
                  </div>
                )}
                <div className="meta-fila">
                  <span>Nubosidad de la escena:</span>
                  <strong>
                    {predioActual?.nubosidad_pct !== null &&
                    predioActual?.nubosidad_pct !== undefined
                      ? `${predioActual.nubosidad_pct} %`
                      : "-- %"}
                  </strong>
                </div>
                <div className="meta-fila">
                  <span>Resolución:</span>
                  <strong>
                    {predioActual?.resolucion_m !== null &&
                    predioActual?.resolucion_m !== undefined
                      ? `${predioActual.resolucion_m} m`
                      : "-- m"}
                  </strong>
                </div>
              </div>

              {predioActual?.atribucion && (
                <div className="leyenda-atribucion-copernicus">
                  {predioActual.atribucion}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MapaSatelital;