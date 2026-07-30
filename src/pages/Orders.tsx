import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Order } from '../types';
import { Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
        navigate('/login');
        return;
    }
    api.get('/orders').then(res => {
        setOrders(res.data.data);
        setLoading(false);
    }).catch(e => {
        console.error(e);
        setLoading(false);
    });
  }, [isAuthenticated, navigate]);

  return (
    <div className="max-w-4xl mx-auto pt-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Order History</h1>
        
        {loading ? (
           <div className="space-y-4">
               {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-zinc-100 animate-pulse rounded-2xl"></div>)}
           </div>
        ) : orders.length === 0 ? (
           <div className="text-center py-24 bg-zinc-50 rounded-3xl">
              <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 font-medium text-lg">You haven't placed any orders yet.</p>
           </div>
        ) : (
           <div className="space-y-6">
              {orders.map(order => (
                  <div key={order.id} className="border border-zinc-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                          <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold">Order #{order.id}</span>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700">{order.status}</span>
                          </div>
                          <p className="text-sm font-medium text-zinc-500">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-sm font-medium text-zinc-500 mb-1">Total Amount</p>
                          <p className="font-bold text-lg">${order.total_amount.toFixed(2)}</p>
                      </div>
                  </div>
              ))}
           </div>
        )}
    </div>
  );
}
