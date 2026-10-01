import climateData from "../mock/climateData.json";
import { ClimateDataResponse } from "../types/climate";

export const useClimateData = () => {
  return {
    data:
      climateData as ClimateDataResponse,

    loading: false,
  };
};