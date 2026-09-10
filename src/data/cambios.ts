export const cambios: { cambio: string; alta: number; compromiso: number }[] = [
  { cambio: "Cimiento → Torre", alta: 0, compromiso: 0 },
  { cambio: "Cimiento → Alcazaba", alta: 700, compromiso: 500 },
  { cambio: "Torre → Alcazaba", alta: 600, compromiso: 450 },
  { cambio: "Alcazaba → Medina", alta: 900, compromiso: 650 },
  { cambio: "Torre → Medina", alta: 1300, compromiso: 950 },
  { cambio: "Cimiento → Medina", alta: 1500, compromiso: 1050 },
];
export const politicaCambios = {
  intro:
    "Puedes cambiar de plan cuando quieras. Subir es inmediato y solo pagas la diferencia de lo que hay que construir, nunca la obra entera otra vez. Al terminar tu periodo de permanencia también puedes bajar de plan, con 30 días de aviso. Y si tienes un mes complicado, podemos pausar el servicio al 50% durante dos meses en lugar de que bajes de plan.",
  bajar:
    "Si bajas de plan: todo lo construido sigue ahí. Las páginas, el SEO, las integraciones. Solo se ajusta el trabajo mensual.",
  cancelar:
    "Si cancelas: el dominio es tuyo desde el primer día, siempre. La web, el hosting y la base de datos son nuestros mientras dure el contrato, así que al causar baja la web se despublica. Si quieres llevártela, la migración se presupuesta aparte.",
  compromiso:
    "El precio con compromiso implica 12 meses nuevos contados desde la fecha del cambio.",
};
export const condiciones: string[] = [
  "Permanencia mínima de 3 meses. Después, baja con 30 días de aviso.",
  "Si contratas con compromiso de 12 meses y causas baja antes, se factura la diferencia entre el alta con compromiso y el alta sin él.",
  "Pago del alta: 50% a la firma y 50% a la entrega.",
  "La cuota mensual empieza a contar el mes siguiente a la publicación de la web.",
  "El dominio se registra siempre a nombre del cliente. Es su marca.",
  politicaCambios.cancelar,
  "Tu cuota no sube durante los primeros 24 meses. A partir de ahí, revisión anual según IPC. Excepción: con 3 referidos, el Círculo de Alarifes permite ganar la cuota congelada de por vida.",
  "Todo el contenido se aprueba por adelantado en un calendario mensual.",
  "Precios sin IVA.",
];
