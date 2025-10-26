export default function StatsCard({ title, value, icon: Icon, bgColor }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-600">{title}</p>
          <p className="text-3xl font-bold text-secondary-900">{value}</p>
        </div>
        <div
          className={`w-12 h-12 bg-gradient-to-br ${bgColor} rounded-xl flex items-center justify-center`}
        >
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
      </div>
    </div>
  );
}
