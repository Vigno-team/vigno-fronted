import { CheckCircle2, TriangleAlert } from "lucide-react";
import "./BadgeCompletitud.css";

function BadgeCompletitud({ completitud , confiable}) {
  const porcentaje = completitud ?? 0;
  return (
    <div className={`badge-completitud ${confiable? "badge-verde" : "badge-rojo"}`}>
      {confiable? (
        <>
          <CheckCircle2 size={13} />
          <span>Confiable ({porcentaje}% completitud)</span>
        </>
      ) : (
        <>
          <TriangleAlert size={13} />
          <span>Datos Incompletos ({porcentaje}% completitud)</span>
        </>
      )}
    </div>
  );
}

export default BadgeCompletitud;