import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { api } from '../lib/api';
import { useDispatch, useSelector } from 'react-redux';
import { toggleCart, setCart } from '../store/slices/cartSlice';
import { RootState } from '../store';
import { ArrowLeft, Check, ShoppingBag } from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`).then(res => {
        setProduct(res.data.data);
        setLoading(false);
    }).catch(e => {
        console.error(e);
        navigate('/products');
    });
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
        navigate('/login');
        return;
    }
    if (!product) return;
    
    setAdding(true);
    try {
        await api.post('/cart', { product_id: product.id, quantity: 1 });
        const res = await api.get('/cart');
        dispatch(setCart(res.data.data));
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
        dispatch(toggleCart());
    } catch (e) {
        console.error(e);
    } finally {
        setAdding(false);
    }
  };

  if (loading) {
     return <div className="animate-pulse h-[60vh] bg-zinc-100 rounded-3xl" />;
  }

  if (!product) return null;

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pt-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to collection
      </button>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
        <div className="relative aspect-[4/5] bg-zinc-100 rounded-3xl overflow-hidden">
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        </div>
        
        <div className="flex flex-col pt-8">
           <p className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">{product.category}</p>
           <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter leading-tight mb-4">{product.name}</h1>
           <p className="text-2xl font-semibold mb-8">${product.price.toFixed(2)}</p>
           
           <p className="text-zinc-500 font-medium leading-relaxed mb-10">{product.description}</p>
           
           <div className="space-y-4 mb-10">
               <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <span className="font-medium text-sm">In Stock. Ready to ship.</span>
               </div>
           </div>

           <div className="mt-auto">
               <button 
                 onClick={handleAddToCart}
                 disabled={adding}
                 className="w-full bg-black text-white py-4 px-8 rounded-xl font-bold tracking-wide hover:bg-zinc-800 transition-all disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                 {added ? <><Check className="w-5 h-5"/> Added to Cart</> : <><ShoppingBag className="w-5 h-5"/> Add to Cart</>}
               </button>
           </div>
        </div>
      </div>
    </div>
  );
}
