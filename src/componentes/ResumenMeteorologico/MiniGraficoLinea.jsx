import { AxisBottom, AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { ParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { Bar, LinePath } from "@visx/shape";

const esNumero=(valor)=>Number.isFinite(valor);

const formatearFecha=(fecha)=>{
  if(!fecha) return "";
  return new Intl.DateTimeFormat("es-CL",{
    day:"2-digit",
    month:"short",
  })
    .format(new Date(`${fecha}T12:00:00`))
    .replace(".","");
};

const obtenerTicks=(cantidad)=>{
  if(cantidad<=1) return [0];

  return [
    0,
    Math.floor((cantidad-1)/2),
    cantidad-1,
  ].filter((valor,indice,arreglo)=>arreglo.indexOf(valor)===indice);
};

const obtenerMargen=(width)=>{
  if(width<340)
    return {top:12,right:10,bottom:40,left:40};

  return {top:12,right:16,bottom:42,left:46};
};

function MiniGraficoLinea({
  datos=[],
  series=[],
  tipo="linea",
  lineasReferencia=[],
  destacarRiesgo=false,
  campoRiesgo="minima",
}){
  const valores=[];

  datos.forEach((dato)=>{
    series.forEach((serie)=>{
      const valor=dato[serie.campo];
      if(esNumero(valor)) valores.push(valor);
    });
  });

  lineasReferencia.forEach((linea)=>{
    if(esNumero(linea.valor)) valores.push(linea.valor);
  });

  if(!datos.length||!valores.length)
    return <div className="rm-grafico-vacio">Sin datos disponibles</div>;

  return(
    <ParentSize debounceTime={80}>
      {({width,height})=>{
        if(width<=60||height<=60) return null;

        const margen=obtenerMargen(width);
        const anchoInterno=Math.max(
          width-margen.left-margen.right,
          20
        );

        const altoInterno=Math.max(
          height-margen.top-margen.bottom,
          20
        );

        const xScale=scaleLinear({
          domain:[0,Math.max(datos.length-1,1)],
          range:[
            margen.left,
            margen.left+anchoInterno,
          ],
        });

        let minimo=tipo==="barras"?0:Math.min(...valores);
        let maximo=Math.max(...valores);

        if(minimo===maximo){
          minimo-=1;
          maximo+=1;
        }

        if(tipo==="linea"){
          const margenVertical=Math.max(
            (maximo-minimo)*.12,
            1
          );

          minimo-=margenVertical;
          maximo+=margenVertical;
        }else{
          maximo=Math.max(maximo*1.15,1);
        }

        const yScale=scaleLinear({
          domain:[minimo,maximo],
          range:[
            margen.top+altoInterno,
            margen.top,
          ],
          nice:true,
        });

        const ticksX=obtenerTicks(datos.length);
        const paso=anchoInterno/Math.max(datos.length,1);
        const anchoBarra=Math.max(2,Math.min(12,paso*.62));

        return(
          <svg
            width={width}
            height={height}
            role="img"
            aria-label="Gráfico meteorológico"
          >
            <GridRows
              scale={yScale}
              width={anchoInterno}
              left={margen.left}
              stroke="var(--rm-grilla)"
              numTicks={4}
            />

            <AxisLeft
              scale={yScale}
              left={margen.left}
              hideAxisLine
              hideTicks
              numTicks={4}
              tickFormat={(valor)=>Number(valor).toFixed(0)}
              tickLabelProps={()=>({
                fill:"var(--rm-texto-secundario)",
                fontSize:10,
                fontWeight:600,
                textAnchor:"end",
                dx:-8,
                dy:3,
              })}
            />

            <AxisBottom
              scale={xScale}
              top={margen.top+altoInterno}
              tickValues={ticksX}
              tickFormat={(indice)=>
                formatearFecha(
                  datos[Math.round(indice)]?.fecha
                )
              }
              hideAxisLine
              hideTicks
              tickLabelProps={()=>({
                fill:"var(--rm-texto-secundario)",
                fontSize:10,
                fontWeight:600,
                textAnchor:"middle",
                dy:12,
              })}
            />

            {lineasReferencia.map((linea)=>(
              <line
                key={`${linea.valor}-${linea.color}`}
                x1={margen.left}
                x2={margen.left+anchoInterno}
                y1={yScale(linea.valor)}
                y2={yScale(linea.valor)}
                stroke={linea.color}
                strokeWidth={1.2}
                strokeDasharray="5 4"
              />
            ))}

            {tipo==="linea"&&
              series.map((serie)=>(
                <LinePath
                  key={serie.campo}
                  data={datos}
                  defined={(dato)=>esNumero(dato[serie.campo])}
                  x={(_,indice)=>xScale(indice)}
                  y={(dato)=>yScale(dato[serie.campo])}
                  stroke={serie.color}
                  strokeWidth={serie.grosor??2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))
            }

            {tipo==="barras"&&
              datos.map((dato,indice)=>{
                const serie=series[0];
                if(!serie) return null;

                const valor=dato[serie.campo];
                if(!esNumero(valor)) return null;

                const x=xScale(indice)-anchoBarra/2;
                const y=yScale(valor);
                const base=yScale(0);

                return(
                  <Bar
                    key={dato.fecha}
                    x={x}
                    y={y}
                    width={anchoBarra}
                    height={Math.max(base-y,valor===0?0:1)}
                    fill={serie.color}
                    rx={2}
                  >
                    <title>
                      {formatearFecha(dato.fecha)} · {valor}
                      {serie.unidad??""}
                    </title>
                  </Bar>
                );
              })
            }

            {tipo==="linea"&&
              series.map((serie)=>
                datos.map((dato,indice)=>{
                  const valor=dato[serie.campo];
                  if(!esNumero(valor)) return null;

                  const esCampoRiesgo=
                    destacarRiesgo&&serie.campo===campoRiesgo;

                  const esRiesgo=esCampoRiesgo&&valor<=2;
                  const esCritico=esCampoRiesgo&&valor<=0;
                  const mostrar=
                    esRiesgo||esCritico||datos.length===1;

                  return(
                    <circle
                      key={`${serie.campo}-${dato.fecha}`}
                      cx={xScale(indice)}
                      cy={yScale(valor)}
                      r={mostrar?(esCritico?4:3.5):6}
                      fill={
                        mostrar
                          ?esCritico
                            ?"#ef4444"
                            :esRiesgo
                              ?"#f59e0b"
                              :serie.color
                          :"transparent"
                      }
                    >
                      <title>
                        {serie.nombre} · {formatearFecha(dato.fecha)} · {valor}
                        {serie.unidad??""}
                      </title>
                    </circle>
                  );
                })
              )
            }
          </svg>
        );
      }}
    </ParentSize>
  );
}

export default MiniGraficoLinea;