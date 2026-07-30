import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User as UserIcon, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { toggleCart } from '../store/slices/cartSlice';
import { logout } from '../store/slices/authSlice';

export default function Navbar() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                S
              </div>
              <span className="hidden sm:inline">Storefront</span>
            </Link>
            <div className="hidden md:block ml-10 space-x-8">
              <Link to="/products" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                Shop All
              </Link>
              <Link to="/products?category=Electronics" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                Electronics
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-2">
                   <UserIcon className="w-4 h-4" />
                   <span className="hidden sm:inline">{user?.name}</span>
                </Link>
                <Link to="/orders" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                   Orders
                </Link>
                <button onClick={handleLogout} className="text-zinc-400 hover:text-zinc-900">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Sign In
              </Link>
            )}
            
            <button 
              onClick={() => dispatch(toggleCart())}
              className="relative p-2 text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-black rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
