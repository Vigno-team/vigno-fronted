
import{ParentSize}from"@visx/responsive";
import{scaleLinear}from"@visx/scale";
import{Bar}from"@visx/shape";
import{useConfiguracion}from"../../contexto/ConfiguracionContext";

// convierte el numero a un decimal y cambia el punto por coma
const formatear=v=>
  Number.isFinite(v)?v.toFixed(1).replace(".",","):"Sin dato";

// elige el color segun el tipo de dato
const colorDato=dato=>
  dato.principal
    ?"var(--vigno-accent)"
    :dato.alterna
      ?"var(--vih-comparacion-alterna)"
      :"var(--vih-comparacion-historica)";


// componente que recibe los datos y la unidad para crear el grafico
function GraficoComparativaIndices({datos=[],unidad=""}){

  // obtiene el tamaño de texto y contraste de la configuracion
  const{tamanoTexto,contraste}=useConfiguracion();

  // calcula el tamaño de los elementos segun la configuracion
  const factor=tamanoTexto/120;

  // comprueba si el contraste alto esta activado
  const altoContraste=contraste==="alto";

  // filtra los datos que tienen valores numericos validos
  const validos=datos.filter(d=>Number.isFinite(d.valor));

  // obtiene el valor mas alto para definir la escala del grafico
  const maximo=Math.max(...validos.map(d=>d.valor),0);

  // si no hay datos validos muestra un mensaje
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

      {/* obtiene automaticamente el ancho y alto disponible del grafico */}
      <ParentSize debounceTime={60}>
        {({width,height})=>{

          // si el espacio es muy pequeño no muestra el grafico
          if(width<80||height<80)return null;

          // define los espacios que se dejan alrededor del grafico
          const margen={
            top:Math.round(12*factor),
            right:Math.round(80*factor),
            bottom:Math.round(12*factor),
            left:Math.min(
              Math.round(180*factor),
              Math.round(width*.42)
            ),
          };

          // calcula el ancho y alto que tendra el grafico
          const ancho=Math.max(20,width-margen.left-margen.right);
          const alto=Math.max(20,height-margen.top-margen.bottom);

          // convierte los valores de los datos en posiciones del grafico
          const xScale=scaleLinear({
            domain:[0,maximo*1.12||1],
            range:[margen.left,margen.left+ancho],
            nice:true,
          });

          // calcula el espacio disponible para cada dato
          const fila=alto/datos.length;

          // calcula el grosor de las barras
          const barraAlto=Math.min(
            Math.round(24*factor),
            fila*.38
          );

          // define el tamaño de los textos del grafico
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

              {/* crea las lineas de referencia del grafico */}
              {[.25,.5,.75,1].map(p=>{

                // calcula la posicion de cada linea
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

              {/* recorre los datos y crea una barra para cada uno */}
              {datos.map((dato,i)=>{

                // calcula la posicion vertical del dato
                const yCentro=margen.top+fila*i+fila/2;

                // comprueba si el valor es un numero valido
                const valorValido=Number.isFinite(dato.valor);

                // calcula hasta donde llegara la barra segun su valor
                const xFinal=valorValido?xScale(dato.valor):margen.left;

                // obtiene el color correspondiente al dato
                const color=colorDato(dato);

                // comprueba si el valor esta cerca del borde derecho
                const cercaDerecha=
                  valorValido&&
                  xFinal>width-margen.right-55*factor;

                return(
                  <g key={dato.id??i}>

                    {/* muestra el titulo del dato */}
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

                    {/* muestra la descripcion del dato */}
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

                    {/* si el valor es valido dibuja la barra */}
                    {/* el largo de la barra depende del valor del dato */}
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

                    {/* muestra el valor al lado de la barra */}
                    {/* si esta cerca del borde lo coloca dentro de la barra */}
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
                      {/* muestra el numero con su unidad o sin dato */}
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
