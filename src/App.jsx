import{
  useEffect,
  useMemo,
  useState,
}from"react";

import"./App.css";

import BarraLateral from"./componentes/BarraLateral/BarraLateral";

import ResumenMeteorologico from"./componentes/ResumenMeteorologico/ResumenMeteorologico";

import TemperatureChart from"./componentes/Historicos/TemperatureChart";

import AlertasReportes from"./componentes/AlertasReportes/AlertasReportes";

import WinklerCard from"./componentes/WinklerCard/WinklerCard";

import HuglinCard from"./componentes/HuglinCard/HuglinCard";

import Configuracion from"./componentes/Configuracion/Configuracion";

import{
  useClimateData
}from"./hooks/useClimateData";

import{
  adaptarClimateData
}from"./services/adaptarClimateData";

import{
  useConfiguracion
}from"./contexto/ConfiguracionContext";

function App(){

  /* ===================================================
     DATOS
  =================================================== */

  const{
    data,
    loading
  }=useClimateData();

  const datos=useMemo(
    ()=>adaptarClimateData(data),
    [data]
  );

  /* ===================================================
     CONFIGURACIÓN GLOBAL
  =================================================== */

  const{
    temaOscuro
  }=useConfiguracion();

  /* ===================================================
     BARRA LATERAL
  =================================================== */

  const[
    barraExpandida,
    setBarraExpandida
  ]=useState(()=>{

    const guardado=
      localStorage.getItem(
        "barra-expandida"
      );

    if(guardado===null){
      return true;
    }

    return guardado==="true";
  });

  const[
    opcionActiva,
    setOpcionActiva
  ]=useState("Resumen");

  useEffect(()=>{

    localStorage.setItem(
      "barra-expandida",
      String(barraExpandida)
    );

  },[
    barraExpandida
  ]);

  /* ===================================================
     CARGANDO
  =================================================== */

  if(loading||!datos){

    return(
      <div
        className={
          temaOscuro
            ?"tema-pagina-oscuro"
            :"tema-pagina-claro"
        }
      >
        <div className="app-cargando">
          Cargando datos meteorológicos...
        </div>
      </div>
    );
  }

  /* ===================================================
     CONTENIDO
  =================================================== */

  const renderizarContenido=()=>{

    switch(opcionActiva){

      case"Resumen":
        return(
          <ResumenMeteorologico
            estaciones={
              datos.estaciones
            }
            datosTemperatura={
              datos.seriesTemperaturas
            }
            temaOscuro={
              temaOscuro
            }
          />
        );

      case"Alertas y reportes":
        return(
          <AlertasReportes
            estaciones={
              datos.estaciones
            }
            datosTemperatura={
              datos.seriesTemperaturas
            }
            temaOscuro={
              temaOscuro
            }
          />
        );

      case"Índices vitivinícolas":
        return(
          <div className="indices-grid">

            <WinklerCard
              estaciones={
                datos.estaciones
              }
              fichasTemporada={
                datos.fichasTemporada
              }
              temporadaEnCurso={
                datos.temporadaEnCurso
              }
            />

            <HuglinCard
              estaciones={
                datos.estaciones
              }
              fichasTemporada={
                datos.fichasTemporada
              }
              temporadaEnCurso={
                datos.temporadaEnCurso
              }
            />

          </div>
        );

      case"Históricos":
        return(
          <TemperatureChart
            estaciones={
              datos.estaciones
            }
            datosTemperatura={
              datos.seriesTemperaturas
            }
            temaOscuro={
              temaOscuro
            }
          />
        );

      case"Configuración":
        return(
          <Configuracion/>
        );

      default:
        return(
          <ResumenMeteorologico
            estaciones={
              datos.estaciones
            }
            datosTemperatura={
              datos.seriesTemperaturas
            }
            temaOscuro={
              temaOscuro
            }
          />
        );
    }
  };

  /* ===================================================
     INTERFAZ
  =================================================== */

  return(
    <div
      className={
        `app ${
          temaOscuro
            ?"tema-pagina-oscuro"
            :"tema-pagina-claro"
        }`
      }
    >

      <BarraLateral
        expandida={
          barraExpandida
        }
        setExpandida={
          setBarraExpandida
        }
        opcionActiva={
          opcionActiva
        }
        setOpcionActiva={
          setOpcionActiva
        }
      />

      <main
        className={
          `contenido ${
            barraExpandida
              ?"contenido-expandido"
              :"contenido-contraido"
          }`
        }
      >

        <div className="contenido-vista">
          {renderizarContenido()}
        </div>

        <footer className="footer-vigno">
          Este proyecto fue potenciado por la{" "}
          <strong>
            Universidad Autónoma de Chile
          </strong>
        </footer>

      </main>

    </div>
  );
}

export default App;