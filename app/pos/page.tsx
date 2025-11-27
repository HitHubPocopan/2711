// src/app/pos/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ShoppingCart, Trash2, Plus, Minus, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
}

interface CartItem extends Product {
  qty: number;
}

export default function POS() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Verificar Sucursal activa
    const stored = localStorage.getItem('sucursal_activa')
    if (!stored || stored === 'admin') router.push('/') // Vuelve al login si no está seteado
    setStoreId(stored)
    
    // 2. Cargar productos
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true })
    if (data) setProducts(data)
    if (error) console.error("Error al cargar productos", error)
    setLoading(false)
  }

  const handleQtyChange = (product: Product, delta: number) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id)
      
      if (!exists && delta > 0) {
        return [...prev, { ...product, qty: 1 }]
      }
      
      if (exists) {
        const newQty = exists.qty + delta
        if (newQty <= 0) {
          return prev.filter(item => item.id !== product.id)
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: newQty } : item)
      }
      return prev
    })
  }

  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0)

  const finalizarVenta = async () => {
    if (cart.length === 0 || !storeId) return alert('El carrito está vacío o la sucursal no está definida.')
    
    // 1. Crear la Orden (Cabecera)
    const { data: order, error } = await supabase
      .from('orders')
      .insert({ store_id: Number(storeId), total: total, status: 'completada' })
      .select()
      .single()

    if (error) return alert(`Error al crear venta: ${error.message}`)

    // 2. Crear los Items de la Orden (Detalle)
    const itemsToInsert = cart.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.qty,
      price_at_sale: item.price,
      product_name: item.name
    }))

    const { error: errorItems } = await supabase.from('order_items').insert(itemsToInsert)

    if (!errorItems) {
      alert(`¡Venta Exitosa! Total: $${total}. Ticket #${order.id}`)
      setCart([]) // Limpiar carrito
    } else {
      alert(`Error al guardar detalles: ${errorItems.message}`)
    }
  }

  // Filtro de búsqueda
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-8 text-black">Cargando catálogo...</div>

  return (
    <div className="flex h-screen bg-gray-100 text-black">
      {/* IZQUIERDA: Catálogo */}
      <div className="w-2/3 p-4 flex flex-col">
        <div className="mb-4 flex gap-2">
            <input 
              type="text" 
              placeholder="Buscar producto por nombre o categoría..." 
              className="w-full p-3 border rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={() => router.push('/')} className="bg-red-500 text-white px-4 rounded-lg hover:bg-red-600 flex items-center gap-1"><LogOut size={16}/> Salir</button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 overflow-y-auto pb-20">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white p-3 rounded-lg shadow-md flex flex-col justify-between cursor-pointer hover:shadow-lg transition duration-150 border border-transparent hover:border-blue-500" onClick={() => handleQtyChange(product, 1)}>
              {product.image_url && <img src={product.image_url} alt={product.name} className="h-32 object-contain mb-2 mx-auto rounded-md"/>}
              <h3 className="font-bold text-sm line-clamp-2">{product.name}</h3>
              <p className="text-gray-500 text-xs">{product.subcategory}</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="font-extrabold text-xl text-blue-600">${product.price}</span>
                <button className="bg-blue-600 text-white p-1 rounded-full"><Plus size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DERECHA: Carrito */}
      <div className="w-1/3 bg-white p-6 border-l flex flex-col shadow-2xl">
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-2 text-gray-800"><ShoppingCart size={24}/> Carrito de Ventas</h2>
        <p className="text-sm text-gray-500 mb-4">Sucursal: {storeId === '1' ? 'Local Centro' : storeId === '2' ? 'Local Shopping' : 'Depósito'}</p>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {cart.length === 0 && <p className="text-gray-500 text-center mt-10">El carrito está vacío. Agrega productos.</p>}
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center border p-2 rounded-lg bg-gray-50">
              <div className="w-1/2">
                <p className="font-bold text-base line-clamp-1">{item.name}</p>
                <p className="text-gray-500 text-sm">${item.price}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={() => handleQtyChange(item, -1)} className="text-red-500 border border-red-300 p-1 rounded-full hover:bg-red-50"><Minus size={16}/></button>
                <span className="font-bold text-lg w-6 text-center">{item.qty}</span>
                <button onClick={() => handleQtyChange(item, 1)} className="text-green-500 border border-green-300 p-1 rounded-full hover:bg-green-50"><Plus size={16}/></button>
              </div>
              
              <div className="font-bold text-lg">${(item.price * item.qty).toFixed(2)}</div>
              
              <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-red-500 hover:bg-red-100 p-1 rounded-full ml-2"><Trash2 size={18}/></button>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t pt-6">
          <div className="flex justify-between text-3xl font-extrabold mb-4 text-gray-900">
            <span>TOTAL A PAGAR:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button 
            onClick={finalizarVenta}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-xl transition duration-200 ${
              cart.length > 0 ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            CONFIRMAR VENTA
          </button>
        </div>
      </div>
    </div>
  )
}
