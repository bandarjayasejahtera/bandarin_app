import React from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  XCircle 
} from 'lucide-react';

// Mock Data - Biasanya ini diambil dari API/Database
const orders = [
  { id: 'ORD001', customer: 'Budi Santoso', date: '2024-03-20', total: 'Rp 150.000', status: 'Selesai' },
  { id: 'ORD002', customer: 'Siti Aminah', date: '2024-03-21', total: 'Rp 275.000', status: 'Proses' },
  { id: 'ORD003', customer: 'Andi Wijaya', date: '2024-03-21', total: 'Rp 50.000', status: 'Batal' },
];

export default function OrdersPage() {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Pesanan</h1>
          <p className="text-gray-500 text-sm">Kelola semua pesanan masuk di sini.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
          <Package size={18} />
          Export Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Pesanan</p>
            <h3 className="text-2xl font-bold">1,234</h3>
          </div>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Package size={24} />
          </div>
        </div>
        {/* Tambah card lain di sini jika perlu */}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari ID pesanan atau pelanggan..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <button className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
          <Filter size={18} />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600 text-sm">ID Order</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Pelanggan</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Tanggal</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Total</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-medium text-blue-600">{order.id}</td>
                  <td className="p-4 text-gray-700">{order.customer}</td>
                  <td className="p-4 text-gray-500">{order.date}</td>
                  <td className="p-4 font-semibold">{order.total}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit
                      ${order.status === 'Selesai' ? 'bg-green-100 text-green-700' : 
                        order.status === 'Proses' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'}`}>
                      {order.status === 'Selesai' && <CheckCircle2 size={12} />}
                      {order.status === 'Proses' && <Clock size={12} />}
                      {order.status === 'Batal' && <XCircle size={12} />}
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}