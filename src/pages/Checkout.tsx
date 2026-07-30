import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { api } from '../lib/api';
import { Product } from '../types';
import { setCart } from '../store/slices/cartSlice';

export default function Checkout() {
  const { items } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [products, setProducts] = useState<Record<number, Product>>({});
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  
  // Shipping form state mockup
  const [address, setAddress] = useState('');

  useEffect(() => {
     if (!isAuthenticated) navigate('/login');
     if (items.length === 0) navigate('/products');
  }, [items, isAuthenticated, navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      const ids = items.map(i => i.product_id).filter(id => !products[id]);
      if (ids.length === 0) return;
      setLoading(true);
      try {
        const newProducts = {...products};
        for (const id of ids) {
             const res = await api.get(`/products/${id}`);
             newProducts[id] = res.data.data;
        }
        setProducts(newProducts);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchProducts();
  }, [items, products]);

  const total = items.reduce((sum, item) => sum + ((products[item.product_id]?.price || 0) * item.quantity), 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
      e.preventDefault();
      setPlacing(true);
      try {
          const res = await api.post('/orders', { total_amount: total, address });
          dispatch(setCart([]));
          navigate('/orders');
      } catch (e) {
          console.error(e);
      } finally {
          setPlacing(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 pt-8">
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-6">Shipping Details</h2>
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">Full Name</label>
                    <input type="text" required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-black" />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2">Address</label>
                    <input type="text" required value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-black" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">City</label>
                        <input type="text" required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Postal Code</label>
                        <input type="text" required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-black" />
                    </div>
                </div>
            </form>
        </div>
        
        <div className="bg-zinc-50 p-8 rounded-3xl h-fit">
            <h3 className="text-xl font-bold tracking-tight mb-6">Order Summary</h3>
            {loading ? <div className="animate-pulse h-32 bg-zinc-200 rounded-xl"></div> : (
                <ul className="space-y-4 mb-6">
                    {items.map(item => {
                        const product = products[item.product_id];
                        if (!product) return null;
                        return (
                            <li key={item.id} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-white rounded-md overflow-hidden relative border">
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white text-xs flex items-center justify-center rounded-full font-bold">{item.quantity}</span>
                                     </div>
                                     <span className="font-medium">{product.name}</span>
                                </div>
                                <span className="font-semibold">${(product.price * item.quantity).toFixed(2)}</span>
                            </li>
                        )
                    })}
                </ul>
            )}
            
            <div className="border-t pt-4 space-y-2 text-sm font-medium">
                <div className="flex justify-between text-zinc-500">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                    <span>Shipping</span>
                    <span>Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-4">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            </div>
            
            <button 
               type="submit" 
               form="checkout-form"
               disabled={placing}
               className="w-full mt-8 py-4 bg-black text-white font-bold tracking-wide rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
               {placing ? 'Processing...' : 'Place Order'}
            </button>
        </div>
    </div>
  );
}
