import type { Metadata } from "next";
import { Marco } from "./_componentes/marco";
import "./admin.css";
// Panel de gestión. Todo es cliente: la página estática solo trae la interfaz
// y los datos llegan de /api/admin, que exige sesión en cada petición.
export const metadata: Metadata = {
  title: "Panel · ALARYFES",
  robots: { index: false, follow: false },
};
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="adm">
      <Marco>{children}</Marco>
    </div>
  );
}
