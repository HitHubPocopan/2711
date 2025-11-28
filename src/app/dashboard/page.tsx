// src/app/dashboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useRouter } from 'next/navigation';
import { ShoppingCart, DollarSign, List, LogOut } from 'lucide-react';

interface Order {
    id: number;
    created_at: string;
    total: number;
    status: string;
    store_id: number;
    stores: { name: string };
}

interface OrderItem {
    product_name: string;
    quantity: number;
}

export default function Dashboard() {
  const router = useRouter()
  const [sales, setSales] = useState<Order[]>([])
  const [items, setItems] = useState<OrderItem[]>([])
  const [filterStore, setFilterStore] = useState('all') // 'all', '1', '2', '3'

  useEffect(() => {
    // Si no es "admin" o no ha iniciado sesión como tal, redirige.
    if (localStorage.getItem('sucursal_activa') !== 'admin') {
        alert('Acceso denegado. Solo administradores.')
        router.push('/')
    }
    fetchData()
  }, [])

  const fetchData = async () => {
    // Traer todas las órdenes completadas
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, stores(name)')
      .eq('status', 'completada')
      .order('created_at', { ascending: false })
    
    // Traer todos los items vendidos para calcular productos más vendidos
    const { data: itemsData } = await supabase
        .from('order_items')
        .select('product_name, quantity, orders!inner(store_id, status)')
        .eq('orders.status', 'completada')
    
    if (ordersData) setSales(ordersData as Order[])
    if (itemsData) setItems(itemsData as unknown as OrderItem[])
  }

  // Lógica para filtrar datos
  const displayedSales = filterStore === 'all' 
    ? sales 
    : sales.filter(s => s.store_id.toString() === filterStore)

  const totalRevenue = displayedSales.reduce((acc, curr) => acc + curr.total, 0)
  
  // Lógica para Productos Más Vendidos
  const calculateTopProducts = () => {
    const counts: { [key: string]: number } = {};
    const filteredItems = filterStore === 'all' 
        ? items 
        : items.filter((item: any) => item.orders.store_id.toString() === filterStore);

    filteredItems.forEach((item) => {
      counts[item.product_name] = (counts[item.product_name] || 0) + item.quantity;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Los Top 5
  }

  const topProductsData = calculateTopProducts();
  
  // Preparar datos para gráfico de Ventas por Sucursal (sólo para vista 'all')
  const chartSalesByStore = [
    { name: 'Centro', total: sales.filter(s => s.store_id === 1).reduce((a,b)=>a+b.total,0) },
    { name: 'Shopping', total: sales.filter(s => s.store_id === 2).reduce((a,b)=>a+b.total,0) },
    { name: 'Depósito', total: sales.filter(s => s.store_id === 3).reduce((a,b)=>a+b.total,0) },
  ]
  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19E8'];

  const cancelarVenta = async (id: number) => {
      if(!confirm('¿Estás seguro de que quieres ANULAR (cancelar) esta venta?')) return;
      const { error } = await supabase.from('orders').update({ status: 'cancelada' }).eq('id', id)
      if (!error) fetchData() // Recargar datos
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow">
        <h1 className="text-3xl font-extrabold text-blue-800">Panel de Administración {filterStore === 'all' ? 'Global' : `- Sucursal ${filterStore}`}</h1>
        <div className="flex gap-4 items-center">
             <select 
                className="p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
                onChange={(e) => setFilterStore(e.target.value)}
             >
                 <option value="all">TODAS las Sucursales</option>
                 <option value="1">Local Centro</option>
                 <option value="2">Local Shopping</option>
                 <option value="3">Depósito</option>
             </select>
             <button onClick={() => router.push('/')} className="bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 flex items-center gap-1"><LogOut size={16}/> Salir</button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg flex items-center border-l-4 border-blue-600">
            <DollarSign size={40} className="text-blue-600 mr-4"/>
            <div>
                <h3 className="text-gray-500 font-semibold">Ventas Totales {filterStore === 'all' ? 'Globales' : ''}</h3>
                <p className="text-4xl font-extrabold">${totalRevenue.toFixed(2)}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg flex items-center border-l-4 border-green-600">
            <ShoppingCart size={40} className="text-green-600 mr-4"/>
            <div>
                <h3 className="text-gray-500 font-semibold">Tickets Completados</h3>
                <p className="text-4xl font-extrabold">{displayedSales.length}</p>
            </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg h-96">
            <h3 className="font-bold text-xl mb-4 text-gray-800">Productos Más Vendidos (Cantidad)</h3>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={topProductsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} style={{ fontSize: '12px' }}/>
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#FFBB28" />
                </BarChart>
            </ResponsiveContainer>
        </div>
        
        {filterStore === 'all' && (
             <div className="bg-white p-6 rounded-lg shadow-lg h-96">
                <h3 className="font-bold text-xl mb-4 text-gray-800">Distribución de Ventas por Sucursal</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                        <Pie
                            data={chartSalesByStore}
                            dataKey="total"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            label
                        >
                            {chartSalesByStore.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        )}
      </div>

      {/* Tabla de Últimas Ventas (Permite Anular) */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-800"><List size={20}/> Historial de Ventas</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b bg-gray-100 text-sm">
                        <th className="p-3">ID</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Sucursal</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {displayedSales.map(sale => (
                        <tr key={sale.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-semibold text-gray-700">#{sale.id}</td>
                            <td className="p-3">{new Date(sale.created_at).toLocaleDateString()}</td>
                            <td className="p-3">{sale.stores?.name}</td>
                            <td className="p-3 font-bold text-lg text-green-600">${sale.total.toFixed(2)}</td>
                            <td className="p-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${sale.status === 'completada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {sale.status}
                                </span>
                            </td>
                            <td className="p-3">
                                {sale.status === 'completada' && (
                                    <button 
                                        onClick={() => cancelarVenta(sale.id)}
                                        className="text-red-500 text-sm hover:underline font-semibold"
                                    >
                                        Anular Venta
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  )
}
