import DashboardLayout from '../DashboardLayout';
import AdminNotificationsPage from '../../admin/AdminNotificationsPage';

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc] p-4 md:p-6 lg:p-10">
        <AdminNotificationsPage />
      </main>
    </DashboardLayout>
  );
}
