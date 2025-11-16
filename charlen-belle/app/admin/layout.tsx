// app/admin/layout.tsx
import UnifiedLayout from '../components/layouts/unified-layout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UnifiedLayout>{children}</UnifiedLayout>;
}