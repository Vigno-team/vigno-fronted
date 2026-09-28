import { SeriesDiariasTemperaturas } from '../types/climate';

export interface WinklerResult {
  gddTotal: number;
  region: string;
  descripcion: string;
  temporada?: string;
}

export const obtenerTemporadaAgricola = (fechaStr: string): string | null => {
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return null;

  const anio = fecha.getUTCFullYear();
  const mes = fecha.getUTCMonth() + 1;

  if (mes >= 10) {
    return `${anio}-${anio + 1}`;
  } else if (mes <= 4) {
    return `${anio - 1}-${anio}`;
  }

  return null;
};

/**
 * Obtiene todas las temporadas únicas presentes en el dataset ordenadas cronológicamente.
 */
export const obtenerTemporadasDisponibles = (
  registros: SeriesDiariasTemperaturas[] = []
): string[] => {
  const temporadasSet = new Set<string>();

  registros.forEach((item) => {
    const temp = obtenerTemporadaAgricola(item.fecha);
    if (temp) {
      temporadasSet.add(temp);
    }
  });

  return Array.from(temporadasSet).sort();
};

export const calcularIndiceWinkler = (
  registros: SeriesDiariasTemperaturas[] = [],
  estacionId?: string,
  temporadaObjetivo?: string
): WinklerResult => {
  if (!registros.length) {
    return { gddTotal: 0, region: 'Sin datos', descripcion: 'N/A' };
  }

  const estacion = estacionId || registros[0].estacionId;
  const registrosEstacion = registros.filter((item) => item.estacionId === estacion);

  const registrosConTemporada = registrosEstacion
    .map((item) => ({
      ...item,
      temporada: obtenerTemporadaAgricola(item.fecha),
    }))
    .filter((item) => item.temporada !== null);

  if (!registrosConTemporada.length) {
    return { gddTotal: 0, region: 'Sin datos', descripcion: 'N/A' };
  }

  const temporada =
    temporadaObjetivo ||
    registrosConTemporada[registrosConTemporada.length - 1].temporada!;

  const registrosFinales = registrosConTemporada.filter(
    (item) => item.temporada === temporada
  );

  const gddTotal = registrosFinales.reduce((acumulado, item) => {
    const calorEfectivo = Math.max(0, item.mediaDiaria - 10);
    return acumulado + calorEfectivo;
  }, 0);

  const gddRedondeado = Math.round(gddTotal * 10) / 10;

  let region = 'Región I';
  let descripcion = 'Muy Frío';

  if (gddRedondeado > 2222) {
    region = 'Región V';
    descripcion = 'Muy Cálido';
  } else if (gddRedondeado >= 1945) {
    region = 'Región IV';
    descripcion = 'Cálido';
  } else if (gddRedondeado >= 1668) {
    region = 'Región III';
    descripcion = 'Templado';
  } else if (gddRedondeado >= 1390) {
    region = 'Región II';
    descripcion = 'Frío';
  }

  return {
    gddTotal: gddRedondeado,
    region,
    descripcion,
    temporada,
  };
};