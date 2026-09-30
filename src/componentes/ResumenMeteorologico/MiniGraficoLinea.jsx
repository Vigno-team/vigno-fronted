import { AxisBottom, AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { ParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { Bar, LinePath } from "@visx/shape";

// Configuración general del gráfico.
const MARGEN = { top: 10, right: 14, bottom: 25, left: 36 };
const esNumero = (valor) => Number.isFinite(valor);

const formatearFecha = (fecha) => {
  if (!fecha) return "";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" })
    .format(new Date(`${fecha}T12:00:00`))
    .replace(".", "");
};

const obtenerTicks = (cantidad) => {
  if (cantidad <= 1) return [0];
  return [0, Math.floor((cantidad - 1) / 2), cantidad - 1]
    .filter((valor, indice, arreglo) => arreglo.indexOf(valor) === indice);
};

// Mini gráfico reutilizable para líneas, barras y alertas térmicas.
function MiniGraficoLinea({
  datos = [],
  series = [],
  tipo = "linea",
  lineasReferencia = [],
  destacarRiesgo = false,
  campoRiesgo = "minima",
}) {
  // Reúne los valores visibles para calcular automáticamente la escala Y.
  const valores = [];

  datos.forEach((dato) => {
    series.forEach((serie) => {
      const valor = dato[serie.campo];
      if (esNumero(valor)) valores.push(valor);
    });
  });

  lineasReferencia.forEach((linea) => {
    if (esNumero(linea.valor)) valores.push(linea.valor);
  });

  if (!datos.length || !valores.length) {
    return <div className="rm-grafico-vacio">Sin datos disponibles</div>;
  }

  return (
    <ParentSize>
      {({ width, height }) => {
        if (width <= 20 || height <= 20) return null;

        const anchoInterno = width - MARGEN.left - MARGEN.right;
        const altoInterno = height - MARGEN.top - MARGEN.bottom;

        // Escalas horizontal y vertical.
        const xScale = scaleLinear({
          domain: [0, Math.max(datos.length - 1, 1)],
          range: [MARGEN.left, MARGEN.left + anchoInterno],
        });

        let minimo = tipo === "barras" ? 0 : Math.min(...valores);
        let maximo = Math.max(...valores);

        if (minimo === maximo) {
          minimo -= 1;
          maximo += 1;
        }

        if (tipo === "linea") {
          const margenVertical = Math.max((maximo - minimo) * 0.12, 1);
          minimo -= margenVertical;
          maximo += margenVertical;
        } else {
          maximo = Math.max(maximo * 1.15, 1);
        }

        const yScale = scaleLinear({
          domain: [minimo, maximo],
          range: [MARGEN.top + altoInterno, MARGEN.top],
          nice: true,
        });

        // Reduce las etiquetas del eje X para mantener el gráfico limpio.
        const ticksX = obtenerTicks(datos.length);
        const paso = anchoInterno / Math.max(datos.length, 1);
        const anchoBarra = Math.max(2, Math.min(12, paso * 0.62));

        return (
          <svg width={width} height={height} role="img">
            <GridRows
              scale={yScale}
              width={anchoInterno}
              left={MARGEN.left}
              stroke="var(--rm-grilla)"
              numTicks={4}
            />

            <AxisLeft
              scale={yScale}
              left={MARGEN.left}
              hideAxisLine
              hideTicks
              numTicks={4}
              tickFormat={(valor) => Number(valor).toFixed(0)}
              tickLabelProps={() => ({
                fill: "var(--rm-texto-secundario)",
                fontSize: 8,
                textAnchor: "end",
                dx: -7,
                dy: 3,
              })}
            />

            <AxisBottom
              scale={xScale}
              top={MARGEN.top + altoInterno}
              tickValues={ticksX}
              tickFormat={(indice) =>
                formatearFecha(datos[Math.round(indice)]?.fecha)
              }
              hideAxisLine
              hideTicks
              tickLabelProps={() => ({
                fill: "var(--rm-texto-secundario)",
                fontSize: 8,
                textAnchor: "middle",
                dy: 8,
              })}
            />

            {/* Líneas horizontales para umbrales o referencias. */}
            {lineasReferencia.map((linea) => (
              <line
                key={`${linea.valor}-${linea.color}`}
                x1={MARGEN.left}
                x2={MARGEN.left + anchoInterno}
                y1={yScale(linea.valor)}
                y2={yScale(linea.valor)}
                stroke={linea.color}
                strokeWidth={1.2}
                strokeDasharray="5 4"
              />
            ))}

            {/* Series de línea. */}
            {tipo === "linea" &&
              series.map((serie) => (
                <LinePath
                  key={serie.campo}
                  data={datos}
                  defined={(dato) => esNumero(dato[serie.campo])}
                  x={(_, indice) => xScale(indice)}
                  y={(dato) => yScale(dato[serie.campo])}
                  stroke={serie.color}
                  strokeWidth={serie.grosor ?? 2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

            {/* Barras, utilizadas principalmente para precipitación. */}
            {tipo === "barras" &&
              datos.map((dato, indice) => {
                const serie = series[0];
                if (!serie) return null;

                const valor = dato[serie.campo];
                if (!esNumero(valor)) return null;

                const x = xScale(indice) - anchoBarra / 2;
                const y = yScale(valor);
                const base = yScale(0);

                return (
                  <Bar
                    key={dato.fecha}
                    x={x}
                    y={y}
                    width={anchoBarra}
                    height={Math.max(base - y, valor === 0 ? 0 : 1)}
                    fill={serie.color}
                    rx={2}
                  >
                    <title>
                      {formatearFecha(dato.fecha)} · {valor}
                      {serie.unidad ?? ""}
                    </title>
                  </Bar>
                );
              })}

            {/* Puntos destacados para riesgo térmico y registros individuales. */}
            {tipo === "linea" &&
              series.map((serie) =>
                datos.map((dato, indice) => {
                  const valor = dato[serie.campo];
                  if (!esNumero(valor)) return null;

                  const esCampoRiesgo =
                    destacarRiesgo && serie.campo === campoRiesgo;
                  const esRiesgo = esCampoRiesgo && valor <= 2;
                  const esCritico = esCampoRiesgo && valor <= 0;
                  const mostrar = esRiesgo || esCritico || datos.length === 1;

                  return (
                    <circle
                      key={`${serie.campo}-${dato.fecha}`}
                      cx={xScale(indice)}
                      cy={yScale(valor)}
                      r={mostrar ? (esCritico ? 4 : 3.5) : 6}
                      fill={
                        mostrar
                          ? esCritico
                            ? "#ef4444"
                            : esRiesgo
                              ? "#f59e0b"
                              : serie.color
                          : "transparent"
                      }
                    >
                      <title>
                        {serie.nombre} · {formatearFecha(dato.fecha)} · {valor}
                        {serie.unidad ?? ""}
                      </title>
                    </circle>
                  );
                })
              )}
          </svg>
        );
      }}
    </ParentSize>
  );
}

export default MiniGraficoLinea;
