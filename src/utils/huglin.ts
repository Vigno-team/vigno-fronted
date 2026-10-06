import { SeriesDiariasTemperaturas } from '../types/climate';

export interface HuglinResultado {
  ihTotal: number;
  clasificacion: string;
  descripcion: string;
  color: string;
  temporada: string;
  diasValidos: number;
  diasEsperados: number;
  esIncompleto: boolean;
}

// Clasificación de Huglin según el valor acumulado (IH)
export const clasificarHuglin = (ih: number): { clasificacion: string; descripcion: string; color: string } => {
  if (ih === 0) {
    return { clasificacion: 'Sin datos', descripcion: 'N/A', color: '#94a3b8' };
  }
  if (ih <= 1500) {
    return { clasificacion: 'Muy fresco', descripcion: 'Maduración límite para variedades tempranas', color: '#38bdf8' }; // Celeste
  }
  if (ih <= 1800) {
    return { clasificacion: 'Fresco', descripcion: 'Apto para Pinot Noir, Chardonnay', color: '#4ade80' }; // Verde
  }
  if (ih <= 2100) {
    return { clasificacion: 'Templado', descripcion: 'Apto para Merlot, Cabernet Franc', color: '#facc15' }; // Amarillo
  }
  if (ih <= 2400) {
    return { clasificacion: 'Templado cálido', descripcion: 'Apto para Cabernet Sauvignon, Carménère', color: '#fb923c' }; // Naranja
  }
  if (ih <= 3000) {
    return { clasificacion: 'Cálido', descripcion: 'Apto para Syrah, Carignan, Garnacha', color: '#f87171' }; // Rojo suave
  }
  return { clasificacion: 'Muy cálido', descripcion: 'Altas temperaturas durante el ciclo', color: '#ef4444' }; // Rojo
};

// Factor de corrección de longitud de día (d) para el Maule / Cauquenes (latitud aprox 35°-36° S)
const COEFICIENTE_DIA_D = 1.02;

export const calcularIndiceHuglin = (
  series: SeriesDiariasTemperaturas[],
  estacionId: string,
  temporadaSeleccionada: string
): HuglinResultado => {
  if (!series.length || !temporadaSeleccionada) {
    return {
      ihTotal: 0,
      clasificacion: 'Sin datos',
      descripcion: 'N/A',
      color: '#94a3b8',
      temporada: '',
      diasValidos: 0,
      diasEsperados: 212, // Días aprox entre 1 Oct y 30 Abr
      esIncompleto: true,
    };
  }

  // Filtrar por estación
  const deEstacion = series.filter((item) => item.estacionId === estacionId);

  // Filtrar ciclo vegetativo en el hemisferio sur: 1 de octubre al 30 de abril
  // Ejemplo temporada "2023-2024": de 2023-10-01 a 2024-04-30
  const anioInicio = temporadaSeleccionada.includes('-')
    ? parseInt(temporadaSeleccionada.split('-')[0], 10)
    : parseInt(temporadaSeleccionada, 10);
  const fechaMin = `${anioInicio}-10-01`;
  const fechaMax = `${anioInicio + 1}-04-30`;

  const datosCiclo = deEstacion.filter(
    (item) => item.fecha >= fechaMin && item.fecha <= fechaMax
  );

  let acumulador = 0;
  let diasValidos = 0;

  datosCiclo.forEach((dia) => {
    // Si la serie tiene máxima y media
    const tmedia = dia.mediaDiaria ?? ((dia.maxima + dia.minima) / 2);
    const tmax = dia.maxima;

    if (tmedia !== null && tmax !== null) {
      const terminoMedia = Math.max(0, tmedia - 10);
      const terminoMax = Math.max(0, tmax - 10);
      const valorDia = ((terminoMedia + terminoMax) / 2) * COEFICIENTE_DIA_D;

      acumulador += valorDia;
      diasValidos += 1;
    }
  });

  const ihTotal = Math.round(acumulador);
  const { clasificacion, descripcion, color } = clasificarHuglin(ihTotal);

  return {
    ihTotal,
    clasificacion,
    descripcion,
    color,
    temporada: temporadaSeleccionada,
    diasValidos,
    diasEsperados: 212,
    esIncompleto: diasValidos < 180, // Menos de ~85% de la temporada
  };
};