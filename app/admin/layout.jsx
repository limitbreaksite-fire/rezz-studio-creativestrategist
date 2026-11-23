import "./admin.css";

export const metadata = {
  title: { default: "Dashboard", template: "%s · Rezz CMS" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }) {
  return <div className="admin-root">{children}</div>;
}
