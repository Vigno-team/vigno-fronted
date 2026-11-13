import{useEffect,useState}from"react";
import{AxisBottom,AxisLeft}from"@visx/axis";
import{GridRows}from"@visx/grid";
import{ParentSize}from"@visx/responsive";
import{scaleLinear,scalePoint}from"@visx/scale";
import{LinePath}from"@visx/shape";

const temperatura=v=>Number.isFinite(v)?`${v.toFixed(1).replace(".",",")} °C`:"—";

const diferencia=items=>{
  const d=items[0].dato.valor-items[1].dato.valor;
  return`${d>0?"+":""}${d.toFixed(1).replace(".",",")} °C`;
};

const obtenerMargen=width=>
  width<360
    ?{top:20,right:8,bottom:52,left:44}
    :width<500
      ?{top:22,right:12,bottom:54,left:50}
      :{top:25,right:22,bottom:56,left:60};

function GraficoTemperatura({series,categorias,ticksX,minimoY,maximoY,tema,formatoCategoria}){
  const[tooltip,setTooltip]=useState(null);
  useEffect(()=>setTooltip(null),[series]);

  return(
    <div className="grafico-visx">
      <ParentSize debounceTime={80}>
        {({width,height})=>{
          if(width<50||height<50)return null;

          const margen=obtenerMargen(width);
          const ancho=Math.max(width-margen.left-margen.right,10);
          const alto=Math.max(height-margen.top-margen.bottom,10);

          const escalaX=scalePoint({
            domain:categorias,
            range:[0,ancho],
            padding:width<430?.25:.35,
          });

          const escalaY=scaleLinear({
            domain:[minimoY,maximoY],
            range:[alto,0],
            nice:true,
          });

          const buscarCategoria=x=>
            categorias.reduce((cercana,etiqueta)=>{
              const posicion=escalaX(etiqueta);
              if(posicion===undefined)return cercana;

              const distancia=Math.abs(posicion-x);
              return!cercana||distancia<cercana.distancia
                ?{etiqueta,distancia}
                :cercana;
            },null)?.etiqueta;

          const mostrarTooltip=e=>{
            const rect=e.currentTarget.getBoundingClientRect();
            const etiqueta=buscarCategoria(e.clientX-rect.left);
            if(!etiqueta)return;

            const items=series
              .map(serie=>{
                const dato=serie.datos.find(d=>d.etiqueta===etiqueta);
                return dato&&Number.isFinite(dato.valor)?{serie,dato}:null;
              })
              .filter(Boolean);

            if(!items.length)return setTooltip(null);

            const x=escalaX(etiqueta);
            const y=Math.min(...items.map(({dato})=>escalaY(dato.valor)));

            setTooltip({
              etiqueta,
              items,
              left:Math.min(width-100,Math.max(100,margen.left+x)),
              top:Math.max(20,margen.top+y),
            });
          };

          return(
            <>
              <svg width={width} height={height} role="img" aria-label="Evolución de temperatura">
                <g transform={`translate(${margen.left},${margen.top})`}>
                  <GridRows scale={escalaY} width={ancho} numTicks={5} stroke={tema.grilla}/>

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

              {tooltip&&(
                <div className="tooltip-temperatura" style={{left:tooltip.left,top:tooltip.top}}>
                  <strong className="tooltip-titulo">
                    {formatoCategoria(tooltip.etiqueta)}
                  </strong>

                  {tooltip.items.map(({serie,dato})=>(
                    <div className="tooltip-serie" key={serie.nombre}>
                      <div>
                        <span className="punto-tooltip" style={{background:serie.color}}/>
                        <span>{serie.nombre}</span>
                      </div>
                      <strong>{temperatura(dato.valor)}</strong>
                    </div>
                  ))}

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

export default GraficoTemperatura;