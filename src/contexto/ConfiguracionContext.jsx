import{createContext,useCallback,useContext,useEffect,useMemo,useState}from"react";

const CLAVE_CONFIGURACION="vigno-configuracion";

export const CONFIGURACION_INICIAL={
  tamanoTexto:120,
  tema:"claro",
  densidad:"normal",
  tamanoGrafico:"normal",
  contraste:"normal",
  tipoGrafico:"ambos",
  animaciones:true,
  movimientoReducido:false,
};

const ConfiguracionContext=createContext(null);
const limitar=(valor,min,max)=>Math.min(max,Math.max(min,valor));

const normalizarConfiguracion=(datos={})=>{
  const tamano=Number(datos.tamanoTexto);

  return{
    tamanoTexto:Number.isFinite(tamano)
      ?limitar(tamano,90,180)
      :CONFIGURACION_INICIAL.tamanoTexto,

    tema:["claro","oscuro"].includes(datos.tema)
      ?datos.tema
      :CONFIGURACION_INICIAL.tema,

    densidad:["compacta","normal","amplia"].includes(datos.densidad)
      ?datos.densidad
      :CONFIGURACION_INICIAL.densidad,

    tamanoGrafico:["normal","grande"].includes(datos.tamanoGrafico)
      ?datos.tamanoGrafico
      :CONFIGURACION_INICIAL.tamanoGrafico,

    contraste:["normal","alto"].includes(datos.contraste)
      ?datos.contraste
      :CONFIGURACION_INICIAL.contraste,

    tipoGrafico:["lineas","puntos","ambos"].includes(datos.tipoGrafico)
      ?datos.tipoGrafico
      :CONFIGURACION_INICIAL.tipoGrafico,

    animaciones:typeof datos.animaciones==="boolean"
      ?datos.animaciones
      :CONFIGURACION_INICIAL.animaciones,

    movimientoReducido:typeof datos.movimientoReducido==="boolean"
      ?datos.movimientoReducido
      :CONFIGURACION_INICIAL.movimientoReducido,
  };
};

const cargarConfiguracion=()=>{
  if(typeof window==="undefined")return{...CONFIGURACION_INICIAL};

  try{
    const guardado=localStorage.getItem(CLAVE_CONFIGURACION);

    return guardado
      ?normalizarConfiguracion(JSON.parse(guardado))
      :{...CONFIGURACION_INICIAL};
  }catch{
    return{...CONFIGURACION_INICIAL};
  }
};

export function ConfiguracionProvider({children}){
  const[configuracion,setConfiguracion]=useState(cargarConfiguracion);

  const actualizar=useCallback((clave,valor)=>{
    setConfiguracion(actual=>
      normalizarConfiguracion({...actual,[clave]:valor})
    );
  },[]);

  const restablecer=useCallback(()=>{
    setConfiguracion({...CONFIGURACION_INICIAL});
  },[]);

  useEffect(()=>{
    localStorage.setItem(
      CLAVE_CONFIGURACION,
      JSON.stringify(configuracion)
    );
  },[configuracion]);

  useEffect(()=>{
    const html=document.documentElement;

    html.style.setProperty(
      "--escala-texto",
      String(configuracion.tamanoTexto/100)
    );

    html.style.setProperty(
      "--factor-texto",
      String(configuracion.tamanoTexto/120)
    );

    html.dataset.tema=configuracion.tema;
    html.dataset.densidad=configuracion.densidad;
    html.dataset.tamanoGrafico=configuracion.tamanoGrafico;
    html.dataset.contraste=configuracion.contraste;
    html.dataset.tipoGrafico=configuracion.tipoGrafico;
    html.dataset.animaciones=configuracion.animaciones?"activadas":"desactivadas";
    html.dataset.movimiento=configuracion.movimientoReducido?"reducido":"normal";
    html.style.colorScheme=configuracion.tema==="oscuro"?"dark":"light";
  },[configuracion]);

  const valor=useMemo(()=>({
    ...configuracion,
    temaOscuro:configuracion.tema==="oscuro",
    actualizar,
    restablecer,
  }),[configuracion,actualizar,restablecer]);

  return(
    <ConfiguracionContext.Provider value={valor}>
      {children}
    </ConfiguracionContext.Provider>
  );
}

export function useConfiguracion(){
  const contexto=useContext(ConfiguracionContext);

  if(!contexto){
    throw new Error(
      "useConfiguracion debe utilizarse dentro de ConfiguracionProvider"
    );
  }

  return contexto;
}