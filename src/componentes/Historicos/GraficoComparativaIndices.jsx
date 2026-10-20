import{ParentSize}from"@visx/responsive";
import{scaleLinear}from"@visx/scale";
import{Bar}from"@visx/shape";
import{useConfiguracion}from"../../contexto/ConfiguracionContext";

const formatear=v=>
  Number.isFinite(v)?v.toFixed(1).replace(".",","):"Sin dato";

const colorDato=dato=>
  dato.principal
    ?"var(--vigno-accent)"
    :dato.alterna
      ?"var(--vih-comparacion-alterna)"
      :"var(--vih-comparacion-historica)";

function GraficoComparativaIndices({datos=[],unidad=""}){
  const{tamanoTexto,contraste}=useConfiguracion();
  const factor=tamanoTexto/120;
  const altoContraste=contraste==="alto";

  const validos=datos.filter(d=>Number.isFinite(d.valor));
  const maximo=Math.max(...validos.map(d=>d.valor),0);

  if(!datos.length||!validos.length){
    return(
      <div className="vih-grafico-vacio">
        <strong>Sin datos comparables</strong>
        <span>No existen valores oficiales suficientes para esta comparación.</span>
      </div>
    );
  }

  return(
    <div className="vih-grafico-comparacion">
      <ParentSize debounceTime={60}>
        {({width,height})=>{
          if(width<80||height<80)return null;

          const margen={
            top:Math.round(12*factor),
            right:Math.round(80*factor),
            bottom:Math.round(12*factor),
            left:Math.min(
              Math.round(180*factor),
              Math.round(width*.42)
            ),
          };

          const ancho=Math.max(20,width-margen.left-margen.right);
          const alto=Math.max(20,height-margen.top-margen.bottom);

          const xScale=scaleLinear({
            domain:[0,maximo*1.12||1],
            range:[margen.left,margen.left+ancho],
            nice:true,
          });

          const fila=alto/datos.length;
          const barraAlto=Math.min(
            Math.round(24*factor),
            fila*.38
          );

          const fontTitulo=Math.max(7,Math.round(8*factor));
          const fontDetalle=Math.max(6,Math.round(6.5*factor));
          const fontValor=Math.max(7,Math.round(8*factor));

          return(
            <svg
              width={width}
              height={height}
              role="img"
              aria-label={`Comparación de índices en ${unidad}`}
            >
              {[.25,.5,.75,1].map(p=>{
                const x=margen.left+ancho*p;

                return(
                  <line
                    key={p}
                    x1={x}
                    x2={x}
                    y1={margen.top}
                    y2={margen.top+alto}
                    stroke="var(--vih-grilla)"
                    strokeWidth={altoContraste?1.3:1}
                  />
                );
              })}

              {datos.map((dato,i)=>{
                const yCentro=margen.top+fila*i+fila/2;
                const valorValido=Number.isFinite(dato.valor);
                const xFinal=valorValido?xScale(dato.valor):margen.left;
                const color=colorDato(dato);

                const cercaDerecha=
                  valorValido&&
                  xFinal>width-margen.right-55*factor;

                return(
                  <g key={dato.id??i}>
                    <text
                      x={margen.left-10*factor}
                      y={yCentro-3*factor}
                      fill="var(--vih-texto)"
                      textAnchor="end"
                      style={{
                        fontSize:fontTitulo,
                        fontWeight:altoContraste?780:700,
                      }}
                    >
                      {dato.titulo}
                    </text>

                    <text
                      x={margen.left-10*factor}
                      y={yCentro+10*factor}
                      fill="var(--vih-secundario)"
                      textAnchor="end"
                      style={{
                        fontSize:fontDetalle,
                        fontWeight:altoContraste?650:500,
                      }}
                    >
                      {dato.detalle}
                    </text>

                    {valorValido&&(
                      <Bar
                        x={margen.left}
                        y={yCentro-barraAlto/2}
                        width={Math.max(2,xFinal-margen.left)}
                        height={barraAlto}
                        fill={color}
                        rx={4*factor}
                        stroke={altoContraste?"var(--vih-texto)":"none"}
                        strokeWidth={altoContraste?.7:0}
                      />
                    )}

                    <text
                      x={
                        cercaDerecha
                          ?xFinal-7*factor
                          :valorValido
                            ?xFinal+8*factor
                            :margen.left+8*factor
                      }
                      y={yCentro+3*factor}
                      fill={
                        cercaDerecha
                          ?"var(--vih-card)"
                          :valorValido
                            ?color
                            :"var(--vih-secundario)"
                      }
                      textAnchor={cercaDerecha?"end":"start"}
                      style={{
                        fontSize:fontValor,
                        fontWeight:altoContraste?800:750,
                      }}
                    >
                      {valorValido
                        ?`${formatear(dato.valor)} ${unidad}`
                        :"Sin dato"
                      }
                    </text>
                  </g>
                );
              })}
            </svg>
          );
        }}
      </ParentSize>
    </div>
  );
}

export default GraficoComparativaIndices;