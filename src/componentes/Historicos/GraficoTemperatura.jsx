
import{useEffect,useState}from"react";
import{AxisBottom,AxisLeft}from"@visx/axis";
import{GridRows}from"@visx/grid";
import{ParentSize}from"@visx/responsive";
import{scaleLinear,scalePoint}from"@visx/scale";
import{LinePath}from"@visx/shape";

// formatea la temperatura a un decimal y agrega °c
const temperatura=v=>Number.isFinite(v)?`${v.toFixed(1).replace(".",",")} °C`:"—";

// calcula la diferencia de temperatura entre las dos series
const diferencia=items=>{
  const d=items[0].dato.valor-items[1].dato.valor;
  return`${d>0?"+":""}${d.toFixed(1).replace(".",",")} °C`;
};

// ajusta los margenes del grafico segun el ancho disponible
const obtenerMargen=width=>
  width<360
    ?{top:20,right:8,bottom:52,left:44}
    :width<500
      ?{top:22,right:12,bottom:54,left:50}
      :{top:25,right:22,bottom:56,left:60};


// componente que recibe las series, categorias y configuraciones del grafico
function GraficoTemperatura({series,categorias,ticksX,minimoY,maximoY,tema,formatoCategoria}){

  // guarda la informacion que se muestra al pasar el mouse por el grafico
  const[tooltip,setTooltip]=useState(null);

  // limpia el tooltip cuando cambian las series
  useEffect(()=>setTooltip(null),[series]);

  return(
    <div className="grafico-visx">

      {/* obtiene el ancho y alto disponible del grafico */}
      <ParentSize debounceTime={80}>
        {({width,height})=>{

          // si el espacio es muy pequeño no muestra el grafico
          if(width<50||height<50)return null;

          // obtiene los margenes y calcula el espacio del grafico
          const margen=obtenerMargen(width);
          const ancho=Math.max(width-margen.left-margen.right,10);
          const alto=Math.max(height-margen.top-margen.bottom,10);

          // distribuye las categorias en el eje x
          const escalaX=scalePoint({
            domain:categorias,
            range:[0,ancho],
            padding:width<430?.25:.35,
          });

          // convierte las temperaturas en posiciones del eje y
          const escalaY=scaleLinear({
            domain:[minimoY,maximoY],
            range:[alto,0],
            nice:true,
          });

          // busca la categoria mas cercana a la posicion del mouse
          const buscarCategoria=x=>
            categorias.reduce((cercana,etiqueta)=>{
              const posicion=escalaX(etiqueta);
              if(posicion===undefined)return cercana;

              // calcula la distancia entre el mouse y la categoria
              const distancia=Math.abs(posicion-x);

              // guarda la categoria que tenga la menor distancia
              return!cercana||distancia<cercana.distancia
                ?{etiqueta,distancia}
                :cercana;
            },null)?.etiqueta;


          // funcion que muestra los datos cuando movemos el mouse
          const mostrarTooltip=e=>{

            // obtiene la posicion del mouse dentro del grafico
            const rect=e.currentTarget.getBoundingClientRect();

            // busca la categoria mas cercana al mouse
            const etiqueta=buscarCategoria(e.clientX-rect.left);
            if(!etiqueta)return;

            // recorre las series y busca los datos de esa categoria
            const items=series
              .map(serie=>{
                const dato=serie.datos.find(d=>d.etiqueta===etiqueta);

                // solo devuelve los datos que tengan valores validos
                return dato&&Number.isFinite(dato.valor)?{serie,dato}:null;
              })
              .filter(Boolean);

            // si no encuentra datos limpia el tooltip
            if(!items.length)return setTooltip(null);

            // calcula la posicion donde se encuentra el dato
            const x=escalaX(etiqueta);
            const y=Math.min(...items.map(({dato})=>escalaY(dato.valor)));

            // guarda los datos y la posicion del tooltip
            setTooltip({
              etiqueta,
              items,
              left:Math.min(width-100,Math.max(100,margen.left+x)),
              top:Math.max(20,margen.top+y),
            });
          };

          return(
            <>
              {/* crea el grafico utilizando svg */}
              <svg width={width} height={height} role="img" aria-label="Evolución de temperatura">

                {/* mueve el contenido del grafico segun los margenes */}
                <g transform={`translate(${margen.left},${margen.top})`}>

                  {/* crea las lineas horizontales de referencia */}
                  <GridRows scale={escalaY} width={ancho} numTicks={5} stroke={tema.grilla}/>

                  {/* recorre las series y dibuja una linea por cada una */}
                  {series.map(serie=>(
                    <LinePath
                      key={serie.nombre}
                      data={serie.datos}
                      defined={d=>Number.isFinite(d.valor)}
                      x={d=>escalaX(d.etiqueta)??0}
                      y={d=>escalaY(d.valor)}
                      stroke={serie.color}
                      strokeWidth={width<430?2.3:2.7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}

                  {/* recorre todos los datos validos y dibuja los puntos */}
                  {series.flatMap(serie=>
                    serie.datos
                      .filter(d=>Number.isFinite(d.valor))
                      .map(d=>(
                        <circle
                          key={`${serie.nombre}-${d.etiqueta}`}
                          cx={escalaX(d.etiqueta)}
                          cy={escalaY(d.valor)}
                          r={width<430?3:3.5}
                          fill={serie.color}
                          stroke={tema.punto}
                          strokeWidth={2}
                        />
                      ))
                  )}

                  {/* crea el eje y donde se muestran las temperaturas */}
                  <AxisLeft
                    scale={escalaY}
                    numTicks={width<360?4:5}
                    hideAxisLine
                    hideTicks
                    tickFormat={v=>`${v}°`}
                    tickLabelProps={()=>({
                      fill:tema.secundario,
                      fontSize:11,
                      fontWeight:600,
                      textAnchor:"end",
                      dx:-7,
                      dy:"0.33em",
                    })}
                  />

                  {/* crea el eje x donde se muestran las categorias */}
                  <AxisBottom
                    top={alto}
                    scale={escalaX}
                    tickValues={ticksX}
                    hideAxisLine
                    hideTicks
                    tickLabelProps={()=>({
                      fill:tema.secundario,
                      fontSize:11,
                      fontWeight:600,
                      textAnchor:"middle",
                      dy:12,
                    })}
                  />

                  {/* detecta cuando el mouse se mueve o toca el grafico */}
                  <rect
                    width={ancho}
                    height={alto}
                    fill="transparent"
                    onPointerMove={mostrarTooltip}
                    onPointerDown={mostrarTooltip}
                    onPointerLeave={()=>setTooltip(null)}
                  />
                </g>
              </svg>

              {/* si hay un dato seleccionado muestra el tooltip */}
              {tooltip&&(
                <div className="tooltip-temperatura" style={{left:tooltip.left,top:tooltip.top}}>

                  {/* muestra la fecha o categoria seleccionada */}
                  <strong className="tooltip-titulo">
                    {formatoCategoria(tooltip.etiqueta)}
                  </strong>

                  {/* recorre los datos encontrados y muestra su temperatura */}
                  {tooltip.items.map(({serie,dato})=>(
                    <div className="tooltip-serie" key={serie.nombre}>
                      <div>
                        <span className="punto-tooltip" style={{background:serie.color}}/>
                        <span>{serie.nombre}</span>
                      </div>
                      <strong>{temperatura(dato.valor)}</strong>
                    </div>
                  ))}

                  {/* si hay dos series muestra la diferencia entre sus temperaturas */}
                  {tooltip.items.length===2&&(
                    <div className="tooltip-diferencia">
                      <span>Diferencia A − B</span>
                      <strong>{diferencia(tooltip.items)}</strong>
                    </div>
                  )}
                </div>
              )}
            </>
          );
        }}
      </ParentSize>
    </div>
  );
}

// permite utilizar el componente en otros archivos
export default GraficoTemperatura;
