import{useMemo,useState}from"react";
import{AxisBottom,AxisLeft}from"@visx/axis";
import{GridRows}from"@visx/grid";
import{ParentSize}from"@visx/responsive";
import{scaleLinear,scaleTime}from"@visx/scale";
import{LinePath}from"@visx/shape";
import{useConfiguracion}from"../../contexto/ConfiguracionContext";
import{UMBRALES_WINKLER}from"./seriesIndicesReales";

const MESES=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const fechaNormalizada=fecha=>{
  if(!fecha)return null;
  const[,m,d]=fecha.split("-"),mes=Number(m);
  return new Date(mes>=10?1999:2000,mes-1,Number(d),12);
};

const mesDia=fecha=>fecha?.slice(5)??"";
const formatearValor=v=>Number.isFinite(v)?v.toFixed(1).replace(".",","):"Sin dato";

const formatearFecha=fecha=>fecha
  ?new Intl.DateTimeFormat("es-CL",{day:"2-digit",month:"short",year:"numeric"})
    .format(new Date(`${fecha}T12:00:00`)).replace(".","")
  :"Sin dato";

const puntoMasCercano=(puntos,fechaObjetivo)=>{
  if(!puntos.length)return null;

  let mejor=puntos[0];
  let diferencia=Math.abs(fechaNormalizada(mejor.fecha)-fechaObjetivo);

  for(let i=1;i<puntos.length;i++){
    const nueva=Math.abs(fechaNormalizada(puntos[i].fecha)-fechaObjetivo);

    if(nueva<diferencia){
      mejor=puntos[i];
      diferencia=nueva;
    }
  }

  return mejor;
};

function GraficoInterno({
  width,height,serie,serieComparacion,tipo,
  enCurso,enCursoComparacion,
  etiquetaPrincipal,etiquetaComparacion,
}){
  const{tipoGrafico,tamanoTexto,contraste}=useConfiguracion();
  const[hover,setHover]=useState(null);

  const factor=tamanoTexto/120;
  const mostrarLineas=tipoGrafico!=="puntos";
  const mostrarPuntos=tipoGrafico!=="lineas";
  const altoContraste=contraste==="alto";

  const puntosA=useMemo(
    ()=>serie.puntos.filter(p=>Number.isFinite(p.acumulado)),
    [serie.puntos]
  );

  const puntosB=useMemo(
    ()=>serieComparacion?.puntos?.filter(p=>Number.isFinite(p.acumulado))??[],
    [serieComparacion?.puntos]
  );

  const hayComparacion=puntosB.length>0;

  const margen={
    top:Math.round(18*factor),
    right:Math.round((tipo==="winkler"?105:20)*factor),
    bottom:Math.round(38*factor),
    left:Math.round(54*factor),
  };

  const ancho=Math.max(0,width-margen.left-margen.right);
  const alto=Math.max(0,height-margen.top-margen.bottom);

  const inicio=new Date(1999,9,1,12);
  const fin=tipo==="huglin"
    ?new Date(2000,2,31,12)
    :new Date(2000,3,30,12);

  const xScale=scaleTime({
    domain:[inicio,fin],
    range:[margen.left,margen.left+ancho],
  });

  const valores=[
    ...puntosA.map(p=>p.acumulado),
    ...puntosB.map(p=>p.acumulado),
  ];

  const maximoDatos=Math.max(...valores,0);

  const maximoY=tipo==="winkler"
    ?Math.max(2400,maximoDatos*1.08)
    :Math.max(2800,maximoDatos*1.08);

  const yScale=scaleLinear({
    domain:[0,maximoY],
    range:[margen.top+alto,margen.top],
    nice:true,
  });

  const mesesTicks=useMemo(()=>{
    const cantidad=tipo==="huglin"?6:7;

    return Array.from({length:cantidad},(_,i)=>{
      const mes=9+i;
      return new Date(mes<=11?1999:2000,mes%12,1,12);
    });
  },[tipo]);

  const manejarPointer=evento=>{
    if(!puntosA.length)return;

    const svg=evento.currentTarget.ownerSVGElement;
    if(!svg)return;

    const rect=svg.getBoundingClientRect();
    const mouseX=evento.clientX-rect.left;

    const xLimitado=Math.max(
      margen.left,
      Math.min(margen.left+ancho,mouseX)
    );

    const puntoA=puntoMasCercano(
      puntosA,
      xScale.invert(xLimitado)
    );

    if(!puntoA)return;

    const puntoB=puntosB.find(
      p=>mesDia(p.fecha)===mesDia(puntoA.fecha)
    )??null;

    setHover({puntoA,puntoB});
  };

  const xHover=hover?.puntoA
    ?xScale(fechaNormalizada(hover.puntoA.fecha))
    :null;

  const yHoverA=hover?.puntoA
    ?yScale(hover.puntoA.acumulado)
    :null;

  const yHoverB=hover?.puntoB
    ?yScale(hover.puntoB.acumulado)
    :null;

  const diferencia=hover?.puntoA&&hover?.puntoB
    ?hover.puntoA.acumulado-hover.puntoB.acumulado
    :null;

  const unidad=tipo==="winkler"?"GDD":"IH";
  const tooltipAncho=Math.round((hayComparacion?235:175)*factor);
  const tooltipAlto=Math.round((hayComparacion?104:60)*factor);

  const tooltipX=xHover!==null
    ?xHover+tooltipAncho+15<width
      ?xHover+12
      :xHover-tooltipAncho-12
    :0;

  const tooltipY=yHoverA!==null
    ?Math.max(
        margen.top+3,
        Math.min(
          height-margen.bottom-tooltipAlto-3,
          yHoverA-tooltipAlto/2
        )
      )
    :0;

  const fs=n=>Math.max(6,Math.round(n*factor));
  const lineaA=altoContraste?3.1:2.5;
  const lineaB=altoContraste?2.8:2.2;
  const radio=Math.max(2.2,2.5*factor);

  if(!width||!height)return null;

  return(
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={
        tipo==="winkler"
          ?"Curva acumulada de Winkler"
          :"Curva acumulada de Huglin"
      }
    >
      <GridRows
        scale={yScale}
        width={ancho}
        left={margen.left}
        stroke="var(--vih-grilla)"
        strokeWidth={altoContraste?1.4:1}
        numTicks={5}
      />

      {tipo==="winkler"&&UMBRALES_WINKLER.map(limite=>{
        if(limite.valor>maximoY)return null;

        const y=yScale(limite.valor);

        return(
          <g key={limite.valor}>
            <line
              x1={margen.left}
              x2={margen.left+ancho}
              y1={y}
              y2={y}
              stroke="var(--vih-region)"
              strokeWidth={altoContraste?1.5:1}
              strokeDasharray="5 5"
              opacity={altoContraste?1:.7}
            />

            <text
              x={margen.left+ancho+8*factor}
              y={y+3*factor}
              fill="var(--vih-secundario)"
              style={{
                fontSize:fs(7),
                fontWeight:altoContraste?750:650,
              }}
            >
              {limite.etiqueta}
            </text>
          </g>
        );
      })}

      <AxisLeft
        scale={yScale}
        left={margen.left}
        hideAxisLine
        hideTicks
        numTicks={5}
        tickFormat={v=>String(Math.round(Number(v)))}
        tickLabelProps={()=>({
          fill:"var(--vih-secundario)",
          fontSize:fs(8),
          fontWeight:altoContraste?750:650,
          textAnchor:"end",
          dx:-8*factor,
          dy:3*factor,
        })}
      />

      <AxisBottom
        scale={xScale}
        top={margen.top+alto}
        tickValues={mesesTicks}
        hideAxisLine
        hideTicks
        tickFormat={v=>MESES[new Date(v).getMonth()]}
        tickLabelProps={()=>({
          fill:"var(--vih-secundario)",
          fontSize:fs(8),
          fontWeight:altoContraste?750:650,
          textAnchor:"middle",
          dy:10*factor,
        })}
      />

      {hayComparacion&&mostrarLineas&&(
        <LinePath
          data={puntosB}
          x={p=>xScale(fechaNormalizada(p.fecha))}
          y={p=>yScale(p.acumulado)}
          stroke="var(--vih-curva-comparacion)"
          strokeWidth={lineaB}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {mostrarLineas&&(
        <LinePath
          data={puntosA}
          x={p=>xScale(fechaNormalizada(p.fecha))}
          y={p=>yScale(p.acumulado)}
          stroke="var(--vigno-accent)"
          strokeWidth={lineaA}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {mostrarPuntos&&puntosA.map(p=>(
        <circle
          key={`a-${p.fecha}`}
          cx={xScale(fechaNormalizada(p.fecha))}
          cy={yScale(p.acumulado)}
          r={radio}
          fill="var(--vigno-accent)"
          stroke={altoContraste?"var(--vih-card)":"none"}
          strokeWidth={altoContraste?1.2:0}
        />
      ))}

      {hayComparacion&&mostrarPuntos&&puntosB.map(p=>(
        <circle
          key={`b-${p.fecha}`}
          cx={xScale(fechaNormalizada(p.fecha))}
          cy={yScale(p.acumulado)}
          r={radio}
          fill="var(--vih-curva-comparacion)"
          stroke={altoContraste?"var(--vih-card)":"none"}
          strokeWidth={altoContraste?1.2:0}
        />
      ))}

      {enCurso&&puntosA.length>0&&(
        <line
          x1={xScale(fechaNormalizada(puntosA.at(-1).fecha))}
          x2={xScale(fechaNormalizada(puntosA.at(-1).fecha))}
          y1={margen.top}
          y2={margen.top+alto}
          stroke="var(--vigno-accent)"
          strokeWidth={altoContraste?1.5:1}
          strokeDasharray="5 5"
          opacity=".65"
        />
      )}

      {hayComparacion&&enCursoComparacion&&puntosB.length>0&&(
        <line
          x1={xScale(fechaNormalizada(puntosB.at(-1).fecha))}
          x2={xScale(fechaNormalizada(puntosB.at(-1).fecha))}
          y1={margen.top}
          y2={margen.top+alto}
          stroke="var(--vih-curva-comparacion)"
          strokeWidth={altoContraste?1.5:1}
          strokeDasharray="5 5"
          opacity=".65"
        />
      )}

      <rect
        x={margen.left}
        y={margen.top}
        width={ancho}
        height={alto}
        fill="transparent"
        style={{cursor:"crosshair"}}
        onPointerMove={manejarPointer}
        onPointerDown={manejarPointer}
        onPointerLeave={()=>setHover(null)}
      />

      {hover&&xHover!==null&&yHoverA!==null&&(
        <g pointerEvents="none">
          <line
            x1={xHover}
            x2={xHover}
            y1={margen.top}
            y2={margen.top+alto}
            stroke="var(--vih-secundario)"
            strokeWidth={altoContraste?1.5:1}
            strokeDasharray="4 4"
            opacity=".65"
          />

          <circle
            cx={xHover}
            cy={yHoverA}
            r={7*factor}
            fill="rgba(200,109,59,.16)"
          />

          <circle
            cx={xHover}
            cy={yHoverA}
            r={4*factor}
            fill="var(--vigno-accent)"
            stroke="var(--vih-card)"
            strokeWidth={2}
          />

          {hover.puntoB&&yHoverB!==null&&(
            <>
              <circle
                cx={xHover}
                cy={yHoverB}
                r={7*factor}
                fill="var(--vih-curva-comparacion-suave)"
              />

              <circle
                cx={xHover}
                cy={yHoverB}
                r={4*factor}
                fill="var(--vih-curva-comparacion)"
                stroke="var(--vih-card)"
                strokeWidth={2}
              />
            </>
          )}

          <g transform={`translate(${tooltipX},${tooltipY})`}>
            <rect
              width={tooltipAncho}
              height={tooltipAlto}
              rx={8*factor}
              fill="var(--vih-tooltip)"
              stroke="var(--vih-borde)"
              strokeWidth={altoContraste?1.5:1}
            />

            <circle
              cx={11*factor}
              cy={17*factor}
              r={3*factor}
              fill="var(--vigno-accent)"
            />

            <text
              x={20*factor}
              y={19*factor}
              fill="var(--vih-texto)"
              style={{fontSize:fs(7),fontWeight:700}}
            >
              {etiquetaPrincipal}
            </text>

            <text
              x={11*factor}
              y={36*factor}
              fill="var(--vih-secundario)"
              style={{fontSize:fs(6.5)}}
            >
              {formatearFecha(hover.puntoA.fecha)}
            </text>

            <text
              x={tooltipAncho-11*factor}
              y={36*factor}
              fill="var(--vigno-accent)"
              textAnchor="end"
              style={{fontSize:fs(8),fontWeight:750}}
            >
              {`${formatearValor(hover.puntoA.acumulado)} ${unidad}`}
            </text>

            {hayComparacion&&(
              <>
                <line
                  x1={10*factor}
                  x2={tooltipAncho-10*factor}
                  y1={48*factor}
                  y2={48*factor}
                  stroke="var(--vih-borde)"
                />

                <circle
                  cx={11*factor}
                  cy={62*factor}
                  r={3*factor}
                  fill="var(--vih-curva-comparacion)"
                />

                <text
                  x={20*factor}
                  y={64*factor}
                  fill="var(--vih-texto)"
                  style={{fontSize:fs(7),fontWeight:700}}
                >
                  {etiquetaComparacion}
                </text>

                <text
                  x={11*factor}
                  y={80*factor}
                  fill="var(--vih-secundario)"
                  style={{fontSize:fs(6.5)}}
                >
                  {hover.puntoB
                    ?formatearFecha(hover.puntoB.fecha)
                    :"Sin dato"
                  }
                </text>

                <text
                  x={tooltipAncho-11*factor}
                  y={80*factor}
                  fill="var(--vih-curva-comparacion)"
                  textAnchor="end"
                  style={{fontSize:fs(8),fontWeight:750}}
                >
                  {hover.puntoB
                    ?`${formatearValor(hover.puntoB.acumulado)} ${unidad}`
                    :"Sin dato"
                  }
                </text>

                <text
                  x={11*factor}
                  y={97*factor}
                  fill="var(--vih-secundario)"
                  style={{fontSize:fs(6.5),fontWeight:650}}
                >
                  Diferencia A − B
                </text>

                <text
                  x={tooltipAncho-11*factor}
                  y={97*factor}
                  fill="var(--vih-texto)"
                  textAnchor="end"
                  style={{fontSize:fs(7),fontWeight:750}}
                >
                  {Number.isFinite(diferencia)
                    ?`${diferencia>0?"+":""}${formatearValor(diferencia)} ${unidad}`
                    :"—"
                  }
                </text>
              </>
            )}
          </g>
        </g>
      )}
    </svg>
  );
}

function GraficoEvolucionIndice({
  serie,
  serieComparacion=null,
  tipo="winkler",
  enCurso=false,
  enCursoComparacion=false,
  etiquetaPrincipal="Temporada A",
  etiquetaComparacion="Temporada B",
}){
  const hayDatos=serie?.puntos?.some(p=>Number.isFinite(p.acumulado));

  if(!hayDatos){
    return(
      <div className="vih-grafico-vacio">
        <strong>Sin datos para construir la curva</strong>
        <span>
          No existen registros diarios suficientes para la temporada seleccionada.
        </span>
      </div>
    );
  }

  return(
    <div className="vih-grafico-evolucion">
      <ParentSize debounceTime={60}>
        {({width,height})=>(
          <GraficoInterno
            width={width}
            height={height}
            serie={serie}
            serieComparacion={serieComparacion}
            tipo={tipo}
            enCurso={enCurso}
            enCursoComparacion={enCursoComparacion}
            etiquetaPrincipal={etiquetaPrincipal}
            etiquetaComparacion={etiquetaComparacion}
          />
        )}
      </ParentSize>
    </div>
  );
}

export default GraficoEvolucionIndice;