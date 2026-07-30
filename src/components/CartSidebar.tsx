import { X, Trash2, Plus, Minus } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { closeCart, setCart } from '../store/slices/cartSlice';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useEffect, useState } from 'react';
import { Product } from '../types';

export default function CartSidebar() {
  const { isOpen, items } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [productsCache, setProductsCache] = useState<Record<number, Product>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
       api.get('/cart').then(res => {
           dispatch(setCart(res.data.data));
       }).catch(console.error);
    }
  }, [isOpen, isAuthenticated, dispatch]);

  useEffect(() => {
    const fetchProducts = async () => {
      const neededIds = items.map(i => i.product_id).filter(id => !productsCache[id]);
      if (neededIds.length === 0) return;
      
      setLoading(true);
      try {
        const newCache = { ...productsCache };
        for (const id of neededIds) {
          const res = await api.get(`/products/${id}`);
          newCache[id] = res.data.data;
        }
        setProductsCache(newCache);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) {
        fetchProducts();
    }
  }, [items, isOpen]);

  const updateQuantity = async (id: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    try {
        await api.put(`/cart/${id}`, { quantity: newQty });
        api.get('/cart').then(res => dispatch(setCart(res.data.data)));
    } catch(e) { console.error(e); }
  };

  const removeItem = async (id: number) => {
    try {
        await api.delete(`/cart/${id}`);
        api.get('/cart').then(res => dispatch(setCart(res.data.data)));
    } catch(e) { console.error(e); }
  };

  const handleCheckout = () => {
    dispatch(closeCart());
    navigate('/checkout');
  };

  if (!isOpen) return null;

  const total = items.reduce((sum, item) => {
      const p = productsCache[item.product_id];
      return sum + (p ? p.price * item.quantity : 0);
  }, 0);

  return (
    <>
      <div className="fixed inset-0 bg-white/5 backdrop-blur-sm z-50 transition-opacity" onClick={() => dispatch(closeCart())} />
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl z-50 flex flex-col transform transition-transform">
        <div className="flex-1 overflow-y-auto w-full">
            <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold tracking-tight">Your Cart</h2>
                <button onClick={() => dispatch(closeCart())} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-zinc-500" />
                </button>
            </div>
            
            <div className="p-6">
                {!isAuthenticated ? (
                    <div className="text-center py-12">
                        <p className="text-zinc-500 mb-4">Sign in to view your cart</p>
                        <Link to="/login" onClick={() => dispatch(closeCart())} className="btn-primary inline-block">Sign In</Link>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-zinc-500 mb-4">Your cart is empty.</p>
                        <button onClick={() => dispatch(closeCart())} className="text-black font-medium border-b border-black">Continue Shopping</button>
                    </div>
                ) : (
                    <ul className="space-y-6">
                        {items.map((item) => {
                            const product = productsCache[item.product_id];
                            if (!product) return null;
                            return (
                                <li key={item.id} className="flex gap-4">
                                    <div className="w-24 h-24 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between gap-2">
                                                <h3 className="font-medium text-sm leading-tight">{product.name}</h3>
                                                <p className="font-semibold text-sm">${product.price.toFixed(2)}</p>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-1">{product.category}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-4">
                                            <div className="flex items-center border rounded-md">
                                                <button onClick={() => updateQuantity(item.id, item.quantity, -1)} className="p-1 hover:bg-zinc-50 text-zinc-500"><Minus className="w-4 h-4"/></button>
                                                <span className="text-xs font-medium w-8 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity, 1)} className="p-1 hover:bg-zinc-50 text-zinc-500"><Plus className="w-4 h-4"/></button>
                                            </div>
                                            <button onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
        
        {items.length > 0 && isAuthenticated && (
            <div className="border-t p-6 bg-zinc-50">
                <div className="flex justify-between mb-4">
                    <span className="font-medium text-zinc-600">Subtotal</span>
                    <span className="font-bold">${total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-zinc-500 mb-6 font-medium">Shipping and taxes calculated at checkout.</p>
                <button onClick={handleCheckout} className="w-full py-4 bg-black text-white rounded-lg font-semibold tracking-wide hover:bg-zinc-800 transition-colors">
                    Checkout Now
                </button>
            </div>
        )}
      </div>
    </>
  );
}
