import {
  ArrowLeftRight,
  CalendarDays,
  CalendarRange,
  ChartLine,
  MapPin,
  Snowflake,
  Thermometer,
  ThermometerSun,
} from "lucide-react";

const VISTAS = [
  { valor: "mes", texto: "Mes", Icono: CalendarDays },
  { valor: "anio", texto: "Año", Icono: CalendarRange },
];

const formatoTemperatura = (valor) =>
  Number.isFinite(valor)
    ? `${valor.toFixed(1).replace(".", ",")} °C`
    : "—";

function ControlesHistoricos({
  estaciones,
  estacion,
  estacionId,
  setEstacionId,
  vista,
  setVista,
  comparar,
  setComparar,
  puedeComparar,
  periodosMensuales,
  periodoMes,
  setPeriodoMes,
  periodoMesComparacion,
  setPeriodoMesComparacion,
  anios,
  anio,
  setAnio,
  anioComparacion,
  setAnioComparacion,
  periodoMesLegible,
  resumen,
  series,
}) {
  return (
    <>
      <header className="cabecera-temperatura">
        <div className="titulo-temperatura">
          <div className="icono-principal">
            <ChartLine size={20} />
          </div>

          <div>
            <h2>Evolución térmica</h2>

            {estacion && (
              <span className="ubicacion-temperatura">
                <MapPin size={12} />
                {estacion.localidad ?? estacion.ubicacion ?? ""}
              </span>
            )}
          </div>
        </div>

        <div className="acciones-temperatura">
          <div className="selector-estacion">
            <MapPin size={15} />

            <select
              value={estacionId}
              onChange={(e) => setEstacionId(e.target.value)}
            >
              {estaciones.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.huerto ?? item.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="barra-grafico">
        <nav className="selector-vista">
          {VISTAS.map(({ valor, texto, Icono }) => (
            <button
              key={valor}
              type="button"
              className={`boton-vista ${vista === valor ? "activo" : ""}`}
              onClick={() => setVista(valor)}
            >
              <Icono size={15} />
              <span>{texto}</span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          className={`boton-comparar ${comparar ? "activo" : ""}`}
          disabled={!puedeComparar}
          onClick={() => setComparar(!comparar)}
        >
          <ArrowLeftRight size={15} />
          Comparar
        </button>

        <div className="filtros-periodo">
          {vista === "mes" && (
            <>
              <label className="grupo-periodo">
                <span className="etiqueta-filtro">
                  {comparar && <span className="punto-serie serie-a" />}
                  {comparar ? "Mes A" : "Mes"}
                </span>

                <select
                  value={periodoMes}
                  onChange={(e) => setPeriodoMes(e.target.value)}
                >
                  {periodosMensuales.map((periodo) => (
                    <option key={periodo} value={periodo}>
                      {periodoMesLegible(periodo)}
                    </option>
                  ))}
                </select>
              </label>

              {comparar && (
                <label className="grupo-periodo">
                  <span className="etiqueta-filtro">
                    <span className="punto-serie serie-b" />
                    Mes B
                  </span>

                  <select
                    value={periodoMesComparacion}
                    onChange={(e) => setPeriodoMesComparacion(e.target.value)}
                  >
                    {periodosMensuales.map((periodo) => (
                      <option
                        key={periodo}
                        value={periodo}
                        disabled={periodo === periodoMes}
                      >
                        {periodoMesLegible(periodo)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}

          {vista === "anio" && (
            <>
              <label className="grupo-periodo">
                <span className="etiqueta-filtro">
                  {comparar && <span className="punto-serie serie-a" />}
                  {comparar ? "Año A" : "Año"}
                </span>

                <select
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                >
                  {anios.map((valor) => (
                    <option key={valor} value={valor}>
                      {valor}
                    </option>
                  ))}
                </select>
              </label>

              {comparar && (
                <label className="grupo-periodo">
                  <span className="etiqueta-filtro">
                    <span className="punto-serie serie-b" />
                    Año B
                  </span>

                  <select
                    value={anioComparacion}
                    onChange={(e) => setAnioComparacion(e.target.value)}
                  >
                    {anios.map((valor) => (
                      <option
                        key={valor}
                        value={valor}
                        disabled={valor === anio}
                      >
                        {valor}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
        </div>

        {!comparar ? (
          <div className="resumen-temperatura">
            <div>
              <Snowflake size={13} />
              <span>Mínima</span>
              <strong>{formatoTemperatura(resumen.minima)}</strong>
            </div>

            <div>
              <Thermometer size={13} />
              <span>Media</span>
              <strong>{formatoTemperatura(resumen.media)}</strong>
            </div>

            <div>
              <ThermometerSun size={13} />
              <span>Máxima</span>
              <strong>{formatoTemperatura(resumen.maxima)}</strong>
            </div>
          </div>
        ) : (
          <div className="leyenda-comparacion">
            {series.map((serie, indice) => (
              <div className="item-leyenda" key={serie.nombre}>
                <span
                  className={`linea-leyenda ${
                    indice === 0 ? "serie-a" : "serie-b"
                  }`}
                />
                <span>{serie.nombre}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default ControlesHistoricos;