import AdminShell from "@/components/admin/Shell";

export const dynamic = "force-dynamic";

export default function PanelLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
