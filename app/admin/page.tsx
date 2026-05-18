import { getDashboardStats } from "../actions/admin";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="w-full">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">النظرة العامة للموقع</h1>
        <p className="text-slate-400">لوحة التحكم المشفرة والآمنة الخاصة بالمنصة.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <p className="text-sm text-slate-500 font-bold mb-2 uppercase tracking-wider">إجمالي المستخدمين</p>
          <h2 className="text-5xl font-black text-white">{stats.usersC}</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <p className="text-sm text-slate-500 font-bold mb-2 uppercase tracking-wider">الأكواد المصدرة</p>
          <h2 className="text-5xl font-black text-blue-500">{stats.codesC}</h2>
        </div>
      </div>
    </div>
  );
}
