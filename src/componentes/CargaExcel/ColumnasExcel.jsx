// Lista de columnas reutilizable en la prevalidación y en el historial.
// Las dependencias se consultan a Django; no se inventan en el frontend.
const etiqueta = (nombre) => nombre?.replaceAll("_", " ") ?? "";

export function indicadoresAfectados(dependencias, elegidas) {
  const disponibles = new Set(elegidas);
  const estado = {};
  // Cada indicador puede tener varias combinaciones alternativas de requisitos.
  function seCalcula(indicador) {
    if (disponibles.has(indicador)) return true;
    if (Object.hasOwn(estado, indicador)) return estado[indicador];
    const alternativas = dependencias[indicador] ?? [];
    estado[indicador] = alternativas.some((grupo) => grupo.every((variable) =>
      disponibles.has(variable) || (dependencias[variable] && seCalcula(variable))
    ));
    return estado[indicador];
  }
  return Object.keys(dependencias).filter((nombre) => !seCalcula(nombre));
}

export default function ColumnasExcel({ columnas, seleccionadas, onChange, catalogo, editable = false, permitirVacio = false }) {
  const dependencias = catalogo?.indicadores ?? {};
  const nombres = catalogo?.variables ?? [];
  const afectadas = indicadoresAfectados(dependencias, seleccionadas);
  if (!columnas.length) return null;

  return (
    <div className="ce-columnas">
      <p className="ce-ayuda">{editable
        ? "Selecciona las variables que deseas conservar."
        : ""}</p>
      <div className="ce-tabla-contenedor ce-columnas-scroll" tabIndex={0} role="region" aria-label="Calidad de las columnas">
        <table className="ce-historial">
          <thead><tr><th>Incluir</th><th>Variable</th><th>Válidas</th><th>Vacías</th><th>Fuera de rango</th><th>% válido</th></tr></thead>
          <tbody>{columnas.map((col) => {
            const variable = col.variable;
            const info = nombres.find((v) => v.variable === variable);
            return (
              <tr key={variable}>
                <td><input type="checkbox" checked={seleccionadas.includes(variable)}
                  disabled={!editable || (!permitirVacio && seleccionadas.length === 1 && seleccionadas.includes(variable))}
                  aria-label={`Incluir ${info?.nombre ?? variable}`}
                  onChange={() => onChange?.(variable)} /></td>
                <td>{info?.nombre ?? etiqueta(variable)}{col.columna ? <small className="ce-subtexto">{col.columna}</small> : null}</td>
                <td>{col.filas_validas ?? "—"}</td><td>{col.filas_vacias ?? "—"}</td>
                <td>{col.filas_fuera_de_rango ?? "—"}</td>
                <td>{col.porcentaje_valido == null ? "—" : `${col.porcentaje_valido}%`}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>

    </div>
  );
}
