import { useEffect,useState } from "react";
import { AxisBottom,AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { ParentSize } from "@visx/responsive";
import { scaleLinear,scalePoint } from "@visx/scale";
import { LinePath } from "@visx/shape";

const formatearTemperatura=(valor)=>
  Number.isFinite(valor)
    ?`${valor.toFixed(1).replace(".",",")} °C`
    :"—";

const formatearDiferencia=(items)=>{
  const diferencia=items[0].dato.valor-items[1].dato.valor;

  return `${diferencia>0?"+":""}${diferencia
    .toFixed(1)
    .replace(".",",")} °C`;
};

const obtenerMargen=(width)=>{
  if(width<360)
    return {top:20,right:8,bottom:52,left:44};

  if(width<500)
    return {top:22,right:12,bottom:54,left:50};

  return {top:25,right:22,bottom:56,left:60};
};

function GraficoTemperatura({
  series,
  categorias,
  ticksX,
  minimoY,
  maximoY,
  tema,
  formatoCategoria,
}){
  const [tooltip,setTooltip]=useState(null);

  useEffect(()=>setTooltip(null),[series]);

  return(
    <div className="grafico-visx">
      <ParentSize debounceTime={80}>
        {({width,height})=>{
          if(width<50||height<50) return null;

          const margen=obtenerMargen(width);

          const ancho=Math.max(
            width-margen.left-margen.right,
            10
          );

          const alto=Math.max(
            height-margen.top-margen.bottom,
            10
          );

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

          const buscarCategoria=(x)=>
            categorias.reduce((cercana,etiqueta)=>{
              const posicion=escalaX(etiqueta);
              if(posicion===undefined) return cercana;

              const distancia=Math.abs(posicion-x);

              return !cercana||distancia<cercana.distancia
                ?{etiqueta,distancia}
                :cercana;
            },null)?.etiqueta;

          const mostrarTooltip=(evento)=>{
            const rect=evento.currentTarget.getBoundingClientRect();
            const etiqueta=buscarCategoria(
              evento.clientX-rect.left
            );

            if(!etiqueta) return;

            const items=series
              .map((serie)=>{
                const dato=serie.datos.find(
                  item=>item.etiqueta===etiqueta
                );

                return dato&&Number.isFinite(dato.valor)
                  ?{serie,dato}
                  :null;
              })
              .filter(Boolean);

            if(!items.length){
              setTooltip(null);
              return;
            }

            const posicionX=escalaX(etiqueta);
            const posicionY=Math.min(
              ...items.map(({dato})=>escalaY(dato.valor))
            );

            setTooltip({
              etiqueta,
              items,
              left:Math.min(
                width-100,
                Math.max(100,margen.left+posicionX)
              ),
              top:Math.max(
                20,
                margen.top+posicionY
              ),
            });
          };

          return(
            <>
              <svg
                width={width}
                height={height}
                role="img"
                aria-label="Evolución de temperatura"
              >
                <g transform={`translate(${margen.left}, ${margen.top})`}>
                  <GridRows
                    scale={escalaY}
                    width={ancho}
                    numTicks={5}
                    stroke={tema.grilla}
                  />

                  {series.map((serie)=>(
                    <LinePath
                      key={serie.nombre}
                      data={serie.datos}
                      defined={(dato)=>Number.isFinite(dato.valor)}
                      x={(dato)=>escalaX(dato.etiqueta)??0}
                      y={(dato)=>escalaY(dato.valor)}
                      stroke={serie.color}
                      strokeWidth={width<430?2.3:2.7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}

                  {series.flatMap((serie)=>
                    serie.datos
                      .filter((dato)=>Number.isFinite(dato.valor))
                      .map((dato)=>(
                        <circle
                          key={`${serie.nombre}-${dato.etiqueta}`}
                          cx={escalaX(dato.etiqueta)}
                          cy={escalaY(dato.valor)}
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
                    tickFormat={(valor)=>`${valor}°`}
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
                <div
                  className="tooltip-temperatura"
                  style={{
                    left:tooltip.left,
                    top:tooltip.top,
                  }}
                >
                  <strong className="tooltip-titulo">
                    {formatoCategoria(tooltip.etiqueta)}
                  </strong>

                  {tooltip.items.map(({serie,dato})=>(
                    <div
                      className="tooltip-serie"
                      key={serie.nombre}
                    >
                      <div>
                        <span
                          className="punto-tooltip"
                          style={{background:serie.color}}
                        />
                        <span>{serie.nombre}</span>
                      </div>

                      <strong>
                        {formatearTemperatura(dato.valor)}
                      </strong>
                    </div>
                  ))}

                  {tooltip.items.length===2&&(
                    <div className="tooltip-diferencia">
                      <span>Diferencia A − B</span>
                      <strong>
                        {formatearDiferencia(tooltip.items)}
                      </strong>
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