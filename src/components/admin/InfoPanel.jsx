export default function InfoPanel({
  title,
  icon: Icon,
  children,
  emptyMessage,
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center space-x-2 mb-4">
        {Icon && <Icon className="w-5 h-5 text-primary-600" />}
        <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
      </div>

      {children || <p className="text-secondary-500 text-sm">{emptyMessage}</p>}
    </div>
  );
}
