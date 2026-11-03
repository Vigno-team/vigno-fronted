import { TriangleAlert } from "lucide-react";

export default function AlertaCritica({ mensaje }) {
  if (!mensaje) return null;
  return <span className="rm-alerta-critica" role="status" title={mensaje}>
    <TriangleAlert size={13} aria-hidden="true" /><span>{mensaje}</span>
  </span>;
}
