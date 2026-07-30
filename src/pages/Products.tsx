import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Product } from '../types';
import { api } from '../lib/api';
import { Search } from 'lucide-react';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data.data)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = '/products';
    if (categoryParam) url += `?category=${encodeURIComponent(categoryParam)}`;
    api.get(url).then(res => {
      setProducts(res.data.data.items);
      setLoading(false);
    }).catch(e => {
        console.error(e);
        setLoading(false);
    });
  }, [categoryParam]);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
        <div>
           <h1 className="text-4xl font-bold tracking-tight mb-2">Our Collection</h1>
           <p className="text-zinc-500 font-medium">Browse our premium selection of quality goods.</p>
        </div>
        <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="w-full lg:w-48 flex-shrink-0">
          <h3 className="font-semibold text-sm tracking-wider uppercase text-zinc-400 mb-4">Categories</h3>
          <ul className="space-y-2">
            <li>
              <button 
                onClick={() => setSearchParams({})} 
                className={`text-sm font-medium transition-colors ${!categoryParam ? 'text-black font-semibold' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                All Products
              </button>
            </li>
            {categories.map(c => (
              <li key={c}>
                <button 
                  onClick={() => setSearchParams({ category: c })} 
                  className={`text-sm font-medium transition-colors ${categoryParam === c ? 'text-black font-semibold' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex-1">
          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
               {[...Array(6)].map((_,i) => (
                  <div key={i} className="animate-pulse bg-zinc-100 rounded-2xl h-80"></div>
               ))}
             </div>
          ) : filteredProducts.length === 0 ? (
             <div className="text-center py-24 bg-zinc-50 rounded-3xl">
                <p className="text-zinc-500 font-medium text-lg">No products found matching your criteria.</p>
                <button onClick={() => {setSearch(''); setSearchParams({});}} className="mt-4 text-black font-medium border-b border-black">Clear filters</button>
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
               {filteredProducts.map(product => (
                 <Link to={`/products/${product.id}`} key={product.id} className="group flex flex-col">
                    <div className="relative aspect-square mb-4 overflow-hidden rounded-2xl bg-zinc-100">
                        <img src={product.image_url} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="flex justify-between items-start gap-4">
                       <div>
                          <h3 className="font-semibold text-lg leading-tight tracking-tight text-zinc-900 group-hover:text-zinc-600 transition-colors">{product.name}</h3>
                          <p className="text-sm font-medium text-zinc-500 mt-1">{product.category}</p>
                       </div>
                       <span className="font-bold whitespace-nowrap">${product.price.toFixed(2)}</span>
                    </div>
                 </Link>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
