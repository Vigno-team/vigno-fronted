import { useFallasData } from "../../hooks/useFallasData";
import TablaFallas from "../TablaFallas/TablaFallas";
import "./DatosConFallaCard.css";

interface Props {
  estacionId: string;
  temporada: string;
  onDatosActualizados?: () => void; // Se conserva para no alterar el componente padre
}

// La estación y la temporada vienen de los selectores superiores.
export function DatosConFallaCard({ estacionId, temporada, onDatosActualizados }: Props) {
  // Cuando cambian los filtros, el hook vuelve a consultar a Django.
  const { data, loading, error } = useFallasData(estacionId, temporada);
  const resumen = data?.resumen;
  const fallas = data?.fallas ?? [];

  return (
    <article className="huglin-card fallas-card">
      <header className="huglin-card-header">
        <div className="huglin-header-top">
          <div>
            <span className="huglin-badge">AUDITORÍA Y CALIDAD DE DATOS</span>
            <h4>Datos con Falla e Inconsistencias</h4>
          </div>
        </div>
      </header>

      {!estacionId || !temporada ? (
        <p className="huglin-aviso">Selecciona una estación y una temporada en los filtros superiores.</p>
      ) : (
        <>
          {error && <p className="huglin-aviso" role="alert">No se pudo consultar el reporte real de fallas: {error}</p>}

          {!error && (
            <>
              {/* Resumen de fallas para la estación y temporada seleccionadas */}
              <div className="huglin-temporada-info fallas-metricas">
                <div>
                  <span>Total Fallas</span>
                  <strong>{loading ? "..." : (resumen?.totalFallas ?? 0)}</strong>
                </div>
                <div>
                  <span>Por Tipo (Rech/Nulo/Fuera)</span>
                  <strong>
                    {loading ? "..." : `${resumen?.porTipo?.rechazado ?? 0} / ${resumen?.porTipo?.nulo ?? 0} / ${resumen?.porTipo?.fuera_de_rango ?? 0}`}
                  </strong>
                </div>
                <div>
                  <span>Por Var (Tmax/Tmin/Pcp)</span>
                  <strong>
                    {loading ? "..." : `${resumen?.porVariable?.tmax ?? 0} / ${resumen?.porVariable?.tmin ?? 0} / ${resumen?.porVariable?.precipitacion ?? 0}`}
                  </strong>
                </div>
              </div>

              {!loading && (
                <TablaFallas
                  fallas={fallas}
                  estacionId={estacionId}
                  temporada={temporada}
                />
              )}
            </>
          )}
        </>
      )}

    </article>
  );
}

export default DatosConFallaCard;
