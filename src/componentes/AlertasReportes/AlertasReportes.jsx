import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bell,
  MapPin,
} from "lucide-react";

import CalendarioAlertas from "./CalendarioAlertas";
import PanelReportes from "./PanelReportes";

import {
  construirFecha,
  construirReportes,
  crearDiasCalendario,
  estaDentroDelRango,
  generarPeriodosRango,
  nombreEstacion,
  obtenerRangoCobertura,
} from "./alertasConfig";

import "./AlertasReportes.css";

function AlertasReportes({
  estaciones = [],
  datosTemperatura = [],
  temaOscuro = true,
}) {
  const [
    estacionId,
    setEstacionId,
  ] = useState("");

  const [anio, setAnio] =
    useState("");

  const [mes, setMes] =
    useState(0);

  const [
    fechaSeleccionada,
    setFechaSeleccionada,
  ] = useState(null);

  const [
    reporteAbierto,
    setReporteAbierto,
  ] = useState(null);

  useEffect(() => {
    if (!estaciones.length) {
      return;
    }

    const existe =
      estaciones.some(
        (item) =>
          item.id === estacionId
      );

    if (!existe) {
      setEstacionId(
        estaciones[0].id
      );
    }
  }, [
    estaciones,
    estacionId,
  ]);

  const estacion =
    useMemo(
      () =>
        estaciones.find(
          (item) =>
            item.id === estacionId
        ) ?? null,
      [
        estaciones,
        estacionId,
      ]
    );

  const datosEstacion =
    useMemo(
      () =>
        datosTemperatura
          .filter(
            (dato) =>
              dato.estacionId ===
              estacionId
          )
          .sort((a, b) =>
            a.fecha.localeCompare(
              b.fecha
            )
          ),
      [
        datosTemperatura,
        estacionId,
      ]
    );

  const registrosPorFecha =
    useMemo(
      () =>
        new Map(
          datosEstacion.map(
            (dato) => [
              dato.fecha,
              dato,
            ]
          )
        ),
      [datosEstacion]
    );

  const rangoCobertura =
    useMemo(
      () =>
        obtenerRangoCobertura(
          estacion,
          datosEstacion
        ),
      [
        estacion,
        datosEstacion,
      ]
    );

  const periodos =
    useMemo(
      () =>
        generarPeriodosRango(
          rangoCobertura.inicio,
          rangoCobertura.fin
        ),
      [rangoCobertura]
    );

  const aniosDisponibles =
    useMemo(
      () =>
        [
          ...new Set(
            periodos.map(
              (periodo) =>
                periodo.slice(
                  0,
                  4
                )
            )
          ),
        ].sort(
          (a, b) =>
            Number(b) -
            Number(a)
        ),
      [periodos]
    );

  const periodoActual =
    anio
      ? `${anio}-${String(
          mes + 1
        ).padStart(2, "0")}`
      : "";

  useEffect(() => {
    if (!periodos.length) {
      setAnio("");
      setMes(0);
      return;
    }

    if (
      !periodos.includes(
        periodoActual
      )
    ) {
      const ultimo =
        periodos[
          periodos.length - 1
        ];

      const [
        nuevoAnio,
        nuevoMes,
      ] = ultimo.split("-");

      setAnio(nuevoAnio);
      setMes(
        Number(nuevoMes) - 1
      );
    }
  }, [
    periodos,
    periodoActual,
  ]);

  const mesesDisponibles =
    useMemo(
      () =>
        periodos
          .filter(
            (periodo) =>
              periodo.startsWith(
                `${anio}-`
              )
          )
          .map(
            (periodo) =>
              Number(
                periodo.slice(5, 7)
              ) - 1
          ),
      [periodos, anio]
    );

  const indicePeriodo =
    periodos.indexOf(
      periodoActual
    );

  const limpiarSeleccion =
    () => {
      setFechaSeleccionada(
        null
      );

      setReporteAbierto(
        null
      );
    };

  const aplicarPeriodo =
    (periodo) => {
      if (!periodo) {
        return;
      }

      const [
        nuevoAnio,
        nuevoMes,
      ] = periodo.split("-");

      setAnio(nuevoAnio);
      setMes(
        Number(nuevoMes) - 1
      );

      limpiarSeleccion();
    };

  const seleccionarAnio =
    (nuevoAnio) => {
      const disponibles =
        periodos.filter(
          (periodo) =>
            periodo.startsWith(
              `${nuevoAnio}-`
            )
        );

      aplicarPeriodo(
        disponibles[
          disponibles.length - 1
        ]
      );
    };

  const seleccionarMes =
    (nuevoMes) => {
      aplicarPeriodo(
        `${anio}-${String(
          nuevoMes + 1
        ).padStart(2, "0")}`
      );
    };

  const seleccionarDia =
    (dia) => {
      const fecha =
        construirFecha(
          anio,
          mes,
          dia
        );

      if (
        !estaDentroDelRango(
          fecha,
          rangoCobertura.inicio,
          rangoCobertura.fin
        )
      ) {
        return;
      }

      const reportes =
        construirReportes({
          registro:
            registrosPorFecha.get(
              fecha
            ),
          estacion,
          fecha,
          existeRegistro:
            registrosPorFecha.has(
              fecha
            ),
          dentroCobertura: true,
        });

      setFechaSeleccionada(
        fecha
      );

      setReporteAbierto(
        reportes[0]?.id ??
          null
      );
    };

  const reportes =
    useMemo(() => {
      if (!fechaSeleccionada) {
        return [];
      }

      return construirReportes({
        registro:
          registrosPorFecha.get(
            fechaSeleccionada
          ),
        estacion,
        fecha:
          fechaSeleccionada,
        existeRegistro:
          registrosPorFecha.has(
            fechaSeleccionada
          ),
        dentroCobertura:
          estaDentroDelRango(
            fechaSeleccionada,
            rangoCobertura.inicio,
            rangoCobertura.fin
          ),
      });
    }, [
      fechaSeleccionada,
      registrosPorFecha,
      estacion,
      rangoCobertura,
    ]);

  const dias =
    useMemo(
      () =>
        crearDiasCalendario(
          anio,
          mes
        ),
      [anio, mes]
    );

  return (
    <section
      className={`ar-dashboard ${
        temaOscuro
          ? "ar-oscuro"
          : "ar-claro"
      }`}
    >
      <header className="ar-header">
        <div className="ar-header-texto">
          <h1>
            Alertas y reportes
          </h1>

          <p>
            Consulta eventos meteorológicos, disponibilidad de datos y reportes diarios por estación.
          </p>
        </div>

        <label className="ar-estacion">
          <span>
            Estación
          </span>

          <div className="ar-estacion-select">
            <MapPin size={15} />

            <select
              value={estacionId}
              onChange={(evento) => {
                setEstacionId(
                  evento.target.value
                );

                limpiarSeleccion();
              }}
            >
              {estaciones.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {nombreEstacion(
                      item
                    )}
                  </option>
                )
              )}
            </select>
          </div>
        </label>
      </header>

      <div
        className={`ar-contenido ${
          fechaSeleccionada
            ? "con-detalle"
            : "sin-detalle"
        }`}
      >
        <CalendarioAlertas
          anio={anio}
          mes={mes}
          aniosDisponibles={
            aniosDisponibles
          }
          mesesDisponibles={
            mesesDisponibles
          }
          puedeAnterior={
            indicePeriodo > 0
          }
          puedeSiguiente={
            indicePeriodo >= 0 &&
            indicePeriodo <
              periodos.length - 1
          }
          cambiarPeriodo={(
            direccion
          ) =>
            aplicarPeriodo(
              periodos[
                indicePeriodo +
                  direccion
              ]
            )
          }
          seleccionarAnio={
            seleccionarAnio
          }
          seleccionarMes={
            seleccionarMes
          }
          dias={dias}
          registrosPorFecha={
            registrosPorFecha
          }
          rangoCobertura={
            rangoCobertura
          }
          fechaSeleccionada={
            fechaSeleccionada
          }
          seleccionarDia={
            seleccionarDia
          }
        />

        <PanelReportes
          fecha={
            fechaSeleccionada
          }
          estacion={estacion}
          reportes={reportes}
          reporteAbierto={
            reporteAbierto
          }
          cambiarReporte={
            setReporteAbierto
          }
          cerrar={
            limpiarSeleccion
          }
        />
      </div>

    </section>
  );
}

export default AlertasReportes;