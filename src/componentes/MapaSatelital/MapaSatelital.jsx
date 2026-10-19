import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, ImageOverlay, Marker, Popup, useMap } from "react-leaflet";
import { MapPin, ChevronDown, ChevronUp, Layers, AlertTriangle } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapaSatelital.css";

// inicio configuracion iconos leaflet
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
// fin configuracion iconos leaflet

// inicio componente auxiliar centrar mapa
function AjustarVistaMapa({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length === 2) {
      // Asegura que Leaflet recalcule su tamaño real en celulares antes de centrar
      setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [30, 30] });
      }, 100);
    }
  }, [bounds, map]);

  return null;
}
// fin componente auxiliar centrar mapa

function MapaSatelital({ estaciones, mapaCalor, temaOscuro }) {
  // inicio estados del componente
  const [opacidadNdvi, setOpacidadNdvi] = useState(0.75);
  const [mostrarCapaNdvi, setMostrarCapaNdvi] = useState(true);
  const [predioSeleccionado, setPredioSeleccionado] = useState(0);
  const [errorCargaImagen, setErrorCargaImagen] = useState(false);
  const [leyendaExpandida, setLeyendaExpandida] = useState(true);
  // fin estados del componente

  // inicio datos base y procesamiento de predios
  const prediosPorDefecto = [
    {
      id: "predio-el-arenal",
      nombre: "El Arenal",
      limites: {
        norte: -35.5280,
        sur: -35.5390,
        este: -71.4720,
        oeste: -71.4880,
      },
      fecha: null,
      nubosidad: null,
      pixeles_validos: null,
      resolucion: "10 m",
      imagen_url: null,
    },
    {
      id: "predio-san-clemente",
      nombre: "San Clemente",
      limites: {
        norte: -35.5480,
        sur: -35.5590,
        este: -71.4500,
        oeste: -71.4660,
      },
      fecha: null,
      nubosidad: null,
      pixeles_validos: null,
      resolucion: "10 m",
      imagen_url: null,
    },
  ];

  let listaPredios = prediosPorDefecto;
  let sinDatosBackend = true;

  if (mapaCalor) {
    if (Array.isArray(mapaCalor) && mapaCalor.length > 0) {
      listaPredios = mapaCalor;
      sinDatosBackend = false;
    } else if (typeof mapaCalor === "object" && Object.keys(mapaCalor).length > 0) {
      if (mapaCalor.limites || mapaCalor.bounds || mapaCalor.norte) {
        listaPredios = [mapaCalor];
      } else {
        listaPredios = Object.entries(mapaCalor).map(([nombre, datos]) => ({
          nombre,
          ...datos,
        }));
      }
      sinDatosBackend = false;
    }
  }

  const predioActual = listaPredios[predioSeleccionado] || listaPredios[0];

  useEffect(() => {
    setErrorCargaImagen(false);
  }, [predioSeleccionado, mapaCalor]);
  // fin datos base y procesamiento de predios

  // inicio calculo de coordenadas y capa ndvi
  const limites = predioActual?.limites || predioActual?.bounds || predioActual || {};
  const sur = limites.sur ?? limites.south ?? -35.5390;
  const oeste = limites.oeste ?? limites.west ?? -71.4880;
  const norte = limites.norte ?? limites.north ?? -35.5280;
  const este = limites.este ?? limites.east ?? -71.4720;

  // BoundsActuales 
  const boundsActuales = [
    [Number(sur), Number(oeste)],
    [Number(norte), Number(este)],
  ];

  const imagenNdviUrl =
    predioActual?.imagen_url ||
    predioActual?.imagen_png ||
    predioActual?.imagen_base64 ||
    predioActual?.url ||
    null;

  const capaDisponible = Boolean(imagenNdviUrl) && !errorCargaImagen && !sinDatosBackend;
  // fin calculo de coordenadas y capa ndvi

  // inicio procesamiento de estaciones meteorologicas
  const coordenadasBaseEstaciones = [
    { id: "est-arenal", nombre: "El Arenal", lat: -35.5335, lng: -71.4800 },
    { id: "est-san-clemente", nombre: "San Clemente", lat: -35.5535, lng: -71.4580 },
  ];

  let estacionesMapeadas = [];

  if (!estaciones || !Array.isArray(estaciones) || estaciones.length === 0) {
    estacionesMapeadas = coordenadasBaseEstaciones.map((est) => ({
      ...est,
      sinDatos: true,
      temperatura: null,
      humedad: null,
      precipitacion: null,
      viento: null,
      ultima_actualizacion: null,
    }));
  } else {
    estacionesMapeadas = estaciones.map((est, index) => {
      const base = coordenadasBaseEstaciones[index % coordenadasBaseEstaciones.length];
      const lat = est.lat ?? est.latitud ?? est.coordenadas?.lat ?? base.lat;
      const lng = est.lng ?? est.lon ?? est.longitud ?? est.coordenadas?.lng ?? base.lng;
      const ultimo = est.ultimo_dato || est.lectura_actual || est;

      const temp = ultimo.temperatura ?? ultimo.temp ?? null;
      const hum = ultimo.humedad ?? ultimo.hum ?? null;
      const prec = ultimo.precipitacion ?? ultimo.lluvia ?? null;
      const vien = ultimo.viento ?? null;

      return {
        id: est.id || est.codigo || `est-${index}`,
        nombre: est.nombre || est.estacion || base.nombre,
        lat: Number(lat),
        lng: Number(lng),
        sinDatos: temp === null && hum === null && prec === null,
        temperatura: temp,
        humedad: hum,
        precipitacion: prec,
        viento: vien,
        ultima_actualizacion: ultimo.fecha || ultimo.hora || null,
      };
    });
  }
  // fin procesamiento de estaciones meteorologicas

  return (
    <div className={`mapa-satelital-wrapper ${temaOscuro ? "modo-oscuro" : "modo-claro"}`}>
      
      {/* inicio cabezera */}
      <div className="mapa-header-card">
        <div className="mapa-header-fila-principal">
          
          {/* bloque izquierdo */}
          <div className="mapa-header-left">
            <div className="mapa-icono-box">
              <Layers size={20} strokeWidth={2} />
            </div>
            <div className="mapa-titulos">
              <span className="mapa-kicker-sup">monitoreo satelital · sentinel-2</span>
              <h2>Vigor vegetal (NDVI) y estaciones</h2>
              <p className="mapa-subtitulo-texto">
                Resolución {predioActual?.resolucion || "10 m"} · Imagen menos nublada de los últimos 30 días
              </p>
            </div>
          </div>

          {/* bloque derecho */}
          <div className="mapa-controles-derecha">
            
            {/* Selector de predio */}
            <div className="control-columna">
              <span className="control-etiqueta-sup">estación / predio</span>
              <div className="caja-control-vigno select-wrapper">
                <MapPin size={16} className="icono-pin-naranja" />
                <select
                  value={predioSeleccionado}
                  onChange={(e) => setPredioSeleccionado(Number(e.target.value))}
                  aria-label="Seleccionar predio"
                >
                  {listaPredios.map((p, idx) => (
                    <option key={p.id || idx} value={idx}>
                      {p.nombre || `Predio ${idx + 1}`}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="icono-chevron" />
              </div>
            </div>

            {/* Capa nvdi checkbox y barra de opacidad */}
            <div className="control-columna">
              <span className="control-etiqueta-sup">capa satelital y opacidad</span>
              <div className="fila-capa-opacidad">
                
                {/* check capa nvdi  */}
                <label className="caja-control-vigno checkbox-vigno">
                  <span className="checkbox-texto">Capa NVDI</span>
                  <input
                    type="checkbox"
                    checked={mostrarCapaNdvi}
                    onChange={(e) => setMostrarCapaNdvi(e.target.checked)}
                  />
                </label>

                {/* barra de opacidad */}
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
      {/* fin cabezera */}

      {/* inicio mapa */}
      <div className="mapa-visor-container">
             
        {!capaDisponible && (
          <div className="mapa-alerta-flotante">
            <AlertTriangle size={16} className="icono-alerta-mapa" />
            <span>
              <strong>Capa NDVI:</strong> No hay una imagen procesada disponible desde el servidor para este predio y período.
            </span>
          </div>
        )}

        <MapContainer
          bounds={boundsActuales}
          scrollWheelZoom={true}
          className="leaflet-mapa-box"
        >
          {/* Valores de los límites para evitar re-centrados al interactuar */}
          <AjustarVistaMapa bounds={`${sur}-${oeste}-${norte}-${este}`} />

          {/* mapa base satelital */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community | Contains modified Copernicus Sentinel data 2026"
            maxZoom={19}
          />

          {/* superposicion de imagen ndvi */}
          {mostrarCapaNdvi && capaDisponible && (
            <ImageOverlay
              url={imagenNdviUrl}
              bounds={boundsActuales}
              opacity={opacidadNdvi}
              zIndex={400}
              eventHandlers={{
                error: () => setErrorCargaImagen(true),
              }}
            />
          )}

          {/* marcadores de las estaciones */}
          {estacionesMapeadas.map((est) => (
            <Marker key={est.id} position={[est.lat, est.lng]}>
              <Popup className="popup-estacion">
                <div className="popup-contenido">
                  <h4>{est.nombre}</h4>
                  <span className="popup-coords">
                    Lat: {est.lat.toFixed(4)} | Lon: {est.lng.toFixed(4)}
                  </span>

                  {est.sinDatos ? (
                    <div className="popup-sin-datos">
                      Sin datos suficientes
                    </div>
                  ) : (
                    <div className="popup-metricas">
                      <div className="metrica-item">
                        <span className="metrica-label">Temperatura</span>
                        <span className="metrica-valor">
                          {est.temperatura !== null ? `${est.temperatura} °C` : "-- °C"}
                        </span>
                      </div>
                      <div className="metrica-item">
                        <span className="metrica-label">Humedad</span>
                        <span className="metrica-valor">
                          {est.humedad !== null ? `${est.humedad} %` : "-- %"}
                        </span>
                      </div>
                      <div className="metrica-item">
                        <span className="metrica-label">Precipitación</span>
                        <span className="metrica-valor">
                          {est.precipitacion !== null ? `${est.precipitacion} mm` : "-- mm"}
                        </span>
                      </div>
                      <div className="metrica-item">
                        <span className="metrica-label">Viento</span>
                        <span className="metrica-valor">
                          {est.viento !== null ? `${est.viento} km/h` : "-- km/h"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="popup-footer">
                    Última lectura: {est.ultima_actualizacion || "--/--/----"}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* inicio leyenda */}
        <div className="mapa-leyenda-card">
          
          {/* cabecera de leyenda con boton de flecha para bajar/subir */}
          <div className="leyenda-header-row">
            <h4>Escala de Vigor Vegetal (NDVI)</h4>
            <button
              type="button"
              className="btn-toggle-leyenda"
              onClick={(e) => {
                e.stopPropagation();
                setLeyendaExpandida(!leyendaExpandida);
              }}
              aria-label={leyendaExpandida ? "Ocultar detalles de leyenda" : "Mostrar detalles de leyenda"}
              title={leyendaExpandida ? "Minimizar detalles" : "Ver detalles"}
            >
              {leyendaExpandida ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>

          <div className={`barra-gradiente-ndvi ${!capaDisponible ? "barra-atenuada" : ""}`} />
          <div className="etiquetas-gradiente">
            <span>Bajo (-1 / 0)</span>
            <span>Medio (0.5)</span>
            <span>Alto (1.0)</span>
          </div>

          <div className={`nota-transparencia ${!leyendaExpandida ? "sin-borde-inferior" : ""}`}>
            <span className="cuadro-transparente" />
            <span>Transparente: Nube ( Valor nulo)</span>
          </div>

          {/* detalles desplegables que se ocultan al bajar la leyenda */}
          {leyendaExpandida && (
            <div className="leyenda-detalles-colapsables">
              <div className="leyenda-metadatos">
                <div className="meta-fila">
                  <span>Estado de capa:</span>
                  <strong className={!capaDisponible ? "texto-sin-dato" : "texto-ok-meta"}>
                    {capaDisponible ? "Activa" : "Sin datos suficientes"}
                  </strong>
                </div>
                <div className="meta-fila">
                  <span>Fecha captura:</span>
                  <strong>{predioActual?.fecha ? predioActual.fecha : "-- / -- / ----"}</strong>
                </div>
                <div className="meta-fila">
                  <span>Nubosidad:</span>
                  <strong>
                    {predioActual?.nubosidad !== null && predioActual?.nubosidad !== undefined
                      ? `${predioActual.nubosidad} %`
                      : "-- %"}
                  </strong>
                </div>
                <div className="meta-fila">
                  <span>Píxeles válidos:</span>
                  <strong>
                    {predioActual?.pixeles_validos !== null && predioActual?.pixeles_validos !== undefined
                      ? `${predioActual.pixeles_validos} %`
                      : "-- %"}
                  </strong>
                </div>
              </div>

              <div className="leyenda-atribucion-copernicus">
                Tiene informacion modificada de Copernicus Sentinel data 2026
              </div>
            </div>
          )}

        </div>
        {/* fin leyenda */}

      </div>
      {/* fin mapa */}

    </div>
  );
}

export default MapaSatelital;