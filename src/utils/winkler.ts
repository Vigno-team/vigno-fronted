import { SeriesHorariasTemperaturas } from "../types/climate";

export interface WinklerResult {
  gddTotal: number;
  region: string;
  descripcion: string;
}

export const calcularIndiceWinkler = (
  registros: SeriesHorariasTemperaturas[],
): WinklerResult => {
  // Sumamos el calor efectivo de cada registro
  const gddTotal = registros.reduce((acumulador, item) => {
    const calorEfectivo = Math.max(0, item.mediaDiaria - 10);
    return acumulador + calorEfectivo;
  }, 0);

  // Redondeamos a 1 decimal para que sea legible
  const gddRedondeado = Math.round(gddTotal * 10) / 10;

  // Determinamos la clasificación de Winkler (I a V)
  let region = "Región I";
  let descripcion = "Muy Frío";

  if (gddRedondeado > 2222) {
    region = "Región V";
    descripcion = "Muy Cálido";
  } else if (gddRedondeado >= 1945) {
    region = "Región IV";
    descripcion = "Cálido";
  } else if (gddRedondeado >= 1668) {
    region = "Región III";
    descripcion = "Templado";
  } else if (gddRedondeado >= 1390) {
    region = "Región II";
    descripcion = "Frío";
  }

  return {
    gddTotal: gddRedondeado,
    region,
    descripcion,
  };
};
