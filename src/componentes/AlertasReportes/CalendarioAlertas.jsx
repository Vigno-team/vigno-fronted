import{CalendarDays,CalendarRange,ChevronLeft,ChevronRight}from"lucide-react";
import{
  construirFecha,DIAS_SEMANA,estaDentroDelRango,MESES,MESES_CORTOS,
  obtenerTiposRegistro,PRIORIDAD,
}from"./alertasConfig";

const LEYENDA=[
  {clase:"critica",titulo:"Alerta crítica",descripcion:"Mínima ≤ 0 °C"},
  {clase:"advertencia",titulo:"Precaución",descripcion:"0 °C < mínima ≤ 2 °C"},
  {clase:"reporte",titulo:"Reporte disponible",descripcion:"Existe información observada"},
  {clase:"sinDatos",titulo:"Sin datos",descripcion:"Registro no disponible"},
];

function CalendarioAlertas({
  anio,mes,aniosDisponibles,mesesDisponibles,puedeAnterior,puedeSiguiente,
  cambiarPeriodo,seleccionarAnio,seleccionarMes,dias,registrosPorFecha,
  rangoCobertura,fechaSeleccionada,seleccionarDia,
}){
  return(
    <div className="ar-calendario">

      <div className="ar-calendario-header">
        <button type="button" className="ar-boton-mes" disabled={!puedeAnterior} onClick={()=>cambiarPeriodo(-1)}>
          <ChevronLeft size={20}/>
        </button>

        <div className="ar-periodo-principal">
          <div className="ar-mes-titulo">
            <CalendarDays size={19}/>
            <strong>{MESES[mes]}</strong>
          </div>

          <label className="ar-selector-anio">
            <CalendarRange size={15}/>
            <select value={anio} onChange={e=>seleccionarAnio(e.target.value)}>
              {aniosDisponibles.map(valor=><option key={valor} value={valor}>{valor}</option>)}
            </select>
          </label>
        </div>

        <button type="button" className="ar-boton-mes" disabled={!puedeSiguiente} onClick={()=>cambiarPeriodo(1)}>
          <ChevronRight size={20}/>
        </button>
      </div>

      <div className="ar-selector-meses">
        {MESES_CORTOS.map((nombre,indice)=>{
          const disponible=mesesDisponibles.includes(indice);
          return(
            <button
              key={nombre}
              type="button"
              disabled={!disponible}
              className={mes===indice?"activo":""}
              onClick={()=>seleccionarMes(indice)}
            >
              {nombre}
            </button>
          );
        })}
      </div>

      <div className="ar-resumen-estados">
        <div className="ar-resumen-estados-head">
          <strong>Interpretación del calendario</strong>
          <span>Colores y marcas utilizados en cada día</span>
        </div>

        <div className="ar-resumen-estados-grid">
          {LEYENDA.map(item=>(
            <div key={item.clase} className="ar-estado-item">
              <i className={`ar-estado-swatch ${item.clase}`}/>
              <div>
                <strong>{item.titulo}</strong>
                <small>{item.descripcion}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ar-semana">
        {DIAS_SEMANA.map(dia=><span key={dia}>{dia}</span>)}
      </div>

      <div className="ar-dias">
        {dias.map((celda,indice)=>{
          if(!celda.actual){
            return(
              <div key={`${celda.tipo}-${indice}`} className="ar-dia fuera-mes">
                <span>{celda.dia}</span>
              </div>
            );
          }

          const fecha=construirFecha(anio,mes,celda.dia);
          const dentroCobertura=estaDentroDelRango(fecha,rangoCobertura.inicio,rangoCobertura.fin);
          const existeRegistro=registrosPorFecha.has(fecha);
          const registro=registrosPorFecha.get(fecha);
          const tipos=obtenerTiposRegistro({registro,existeRegistro,dentroCobertura});
          const tipoPrincipal=[...tipos].sort((a,b)=>PRIORIDAD[b]-PRIORIDAD[a])[0];

          return(
            <button
              key={fecha}
              type="button"
              disabled={!dentroCobertura}
              className={`ar-dia ar-dia-activo ${tipoPrincipal?`evento-${tipoPrincipal}`:""} ${fechaSeleccionada===fecha?"seleccionado":""} ${!dentroCobertura?"fuera-cobertura":""}`}
              onClick={()=>seleccionarDia(celda.dia)}
            >
              <span className="ar-numero-dia">{celda.dia}</span>

              {!!tipos.length&&(
                <div className="ar-puntos-dia">
                  {tipos.map(tipo=><i key={tipo} className={`ar-punto ${tipo}`}/>)}
                </div>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}

export default CalendarioAlertas;