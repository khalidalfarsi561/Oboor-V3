import { getDashboardStats } from "../actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="w-full">
      <header className="mb-10">
        <h1 className="mb-2 text-4xl font-bold text-white">النظرة العامة للموقع</h1>
        <p className="text-slate-400">لوحة التحكم المشفرة والآمنة الخاصة بالمنصة.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="mb-2 text-sm font-bold tracking-wider text-slate-500 uppercase">
            إجمالي المستخدمين
          </p>
          <h2 className="text-5xl font-black text-white">{stats.usersC}</h2>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="mb-2 text-sm font-bold tracking-wider text-slate-500 uppercase">
            الأكواد المصدرة
          </p>
          <h2 className="text-5xl font-black text-blue-500">{stats.codesC}</h2>
        </div>
      </div>
    </div>
  );
}
