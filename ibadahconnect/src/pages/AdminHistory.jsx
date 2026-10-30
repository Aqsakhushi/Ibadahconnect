const AdminHistory = () => {
  const history = [
    { id: 1, action: "Package Added", detail: "VIP Umrah Badal", date: "2024-06-12" },
    { id: 2, action: "User Deleted", detail: "test@example.com", date: "2024-06-11" },
    { id: 3, action: "Booking Updated", detail: "Order #1234 marked as Completed", date: "2024-06-10" }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Activity History</h1>
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <ul className="space-y-6">
          {history.map(item => (
            <li key={item.id} className="flex items-start gap-4 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                {item.action.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{item.action}</p>
                <p className="text-sm text-gray-500">{item.detail}</p>
                <p className="text-xs text-gray-400 mt-1">{item.date}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminHistory;