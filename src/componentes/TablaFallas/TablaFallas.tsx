import { useRef, useState } from "react";
import type { RegistroFalla, TipoFalla } from "../../types/fallas";
import "./TablaFallas.css";

interface Props {
  fallas: RegistroFalla[];
  estacionId: string;
  temporada: string;
}

const tipos: Record<TipoFalla, string> = {
  rechazado: "Rechazado",
  nulo: "Nulo",
  sin_registro: "Sin registro",
  fuera_de_rango: "Fuera de rango",
};

function fechaChilena(fecha: string) {
  if (!fecha) return "Sin fecha";
  const partes = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : fecha;
}

// Django puede devolver la ruta completa; para comparar basta el nombre.
function nombreArchivo(ruta: string) {
  return ruta.replace(/\\/g, "/").split("/").pop()?.trim().toLowerCase() ?? "";
}

export function TablaFallas({ fallas, estacionId, temporada }: Props) {
  const pendientes = fallas.filter((f) => f.estadoCorreccion === "pendiente");
  const inputArchivo = useRef<HTMLInputElement>(null);
  const [preparando, setPreparando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Usa una COPIA del Excel original: el reporte de Django no trae todas sus columnas.
  const prepararExcel = async (archivo: File) => {
    setMensaje("");
    if (!archivo.name.toLowerCase().endsWith(".xlsx")) {
      setMensaje("Selecciona el Excel original en formato .xlsx. Los .xls antiguos deben guardarse primero como .xlsx.");
      return;
    }

    const coincidencias = pendientes.filter(
      (f) => nombreArchivo(f.archivoOrigen) === nombreArchivo(archivo.name)
    );
    if (!coincidencias.length) {
      setMensaje("El archivo seleccionado no coincide con los nombres de origen de las fallas pendientes. Revisa la columna «Archivo original».");
      return;
    }

    setPreparando(true);
    try {
      // Se carga solo al descargar, para no aumentar el tamaño inicial de Vigno.
      const { default: ExcelJS } = await import("exceljs");
      const libro = new ExcelJS.Workbook();
      await libro.xlsx.load(await archivo.arrayBuffer());
      const hojaOriginal = libro.worksheets[0];
      if (!hojaOriginal) throw new Error("El archivo no contiene hojas de cálculo.");

      // Si vuelven a preparar una copia, evitamos duplicar la hoja de revisión.
      const anterior = libro.getWorksheet("Fallas por corregir");
      if (anterior) libro.removeWorksheet(anterior.id);
      const hoja = libro.addWorksheet("Fallas por corregir");
      hoja.columns = [
        { header: "Fila del Excel", key: "fila", width: 18 },
        { header: "Fecha", key: "fecha", width: 17 },
        { header: "Variable", key: "variable", width: 27 },
        { header: "Valor original", key: "valor", width: 23 },
        { header: "Tipo de falla", key: "tipo", width: 21 },
        { header: "Motivo", key: "motivo", width: 50 },
        { header: "Qué hacer", key: "accion", width: 38 },
      ];
      hoja.insertRow(1, ["EDITA LAS CELDAS EN LA HOJA ORIGINAL. Esta hoja es solo una guía; escribir aquí no corrige las mediciones."]);
      hoja.mergeCells("A1:G1");
      hoja.getRow(1).height = 35;
      hoja.getCell("A1").font = { bold: true, color: { argb: "FF8D3E1D" } };
      hoja.getCell("A1").alignment = { wrapText: true, vertical: "middle" };
      hoja.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE8D9" } };
      hoja.getRow(2).height = 22;
      hoja.getRow(2).eachCell((celda) => {
        celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC86D3B" } };
      });

      coincidencias.forEach((f) => {
        const fila = typeof f.fila === "number" ? f.fila : null;
        hoja.addRow({
          fila: fila ?? "Sin fila identificada",
          fecha: fechaChilena(f.fecha),
          variable: f.variable || "Sin variable",
          valor: f.valorOriginal ?? "",
          tipo: tipos[f.tipoFalla] ?? f.tipoFalla,
          motivo: f.motivo || "Revisar medición",
          accion: fila ? `Corregir fila ${fila} en la hoja original` : "Buscar por fecha/variable en la hoja original",
        });

        // Las filas rechazadas sí traen su ubicación exacta en el Excel.
        if (fila && fila > 0 && fila <= hojaOriginal.rowCount) {
          hojaOriginal.getRow(fila).eachCell((celda) => {
            celda.fill = {
              type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE6D5" },
            };
          });
        }
      });

      hoja.autoFilter = { from: "A2", to: "G2" };
      hoja.views = [{ state: "frozen", ySplit: 2 }];
      hoja.eachRow((fila, indice) => {
        if (indice > 2) {
          fila.alignment = { vertical: "middle", wrapText: true };
          fila.height = 30;
        }
      });

      const contenido = await libro.xlsx.writeBuffer();
      const blob = new Blob([contenido as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = archivo.name.replace(/\.xlsx$/i, "_para_corregir.xlsx");
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMensaje(`Excel preparado con ${coincidencias.length} observaciones. Corrige las celdas en la hoja original y súbelo desde Gestión de datos.`);
    } catch (error) {
      setMensaje(`No se pudo preparar el Excel: ${error instanceof Error ? error.message : "archivo inválido"}`);
    } finally {
      setPreparando(false);
    }
  };

  return (
    <div className="tabla-fallas-contenedor">
      <div className="tabla-fallas-header">
        <span className="calor-subtitulo">Registros pendientes de revisión ({pendientes.length})</span>
        <button type="button" className="btn-exportar-csv"
          disabled={!pendientes.length || preparando}
          onClick={() => inputArchivo.current?.click()}>
          {preparando ? "Preparando Excel..." : "Preparar Excel editable"}
        </button>
        <input
          ref={inputArchivo}
          type="file"
          accept=".xlsx"
          style={{ display: "none" }}
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (archivo) void prepararExcel(archivo);
            e.target.value = "";
          }}
        />
      </div>

      {mensaje && <p className="huglin-aviso" role="status">{mensaje}</p>}

      {pendientes.length === 0 ? (
        <p className="huglin-aviso">No hay fallas pendientes para la estación y temporada seleccionadas.</p>
      ) : (
        <div className="tabla-responsive">
          <table className="tabla-vigno">
            <thead>
              <tr>
                <th>Archivo original</th><th>Fila</th><th>Fecha</th>
                <th>Variable</th><th>Valor original</th><th>Tipo de falla</th><th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.map((falla, indice) => (
                <tr key={`${falla.id}-${indice}`}>
                  <td className="col-archivo">{falla.archivoOrigen || "—"}</td>
                  <td>{falla.fila ?? "—"}</td>
                  <td>{fechaChilena(falla.fecha)}</td>
                  <td className="col-variable">{falla.variable || "—"}</td>
                  <td>{falla.valorOriginal ?? "—"}</td>
                  <td><span className={`chip-falla chip-${falla.tipoFalla}`}>
                    {tipos[falla.tipoFalla] ?? falla.tipoFalla}
                  </span></td>
                  <td className="col-motivo">{falla.motivo || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="calor-subtitulo">
        Elige el Excel original para descargar una copia editable con los errores señalados.
        Corrige los datos en la hoja original y vuelve a subirlo desde Gestión de datos.
        Las fallas sin archivo de origen no pueden vincularse automáticamente a un Excel.
      </p>
    </div>
  );
}

export default TablaFallas;
