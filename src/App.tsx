import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CartSidebar from './components/CartSidebar';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import AuthLoader from './components/AuthLoader';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthLoader>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <CartSidebar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
              </Routes>
            </main>
            <footer className="border-t py-8 mt-12 text-center text-sm text-zinc-500">
              <p>© {new Date().getFullYear()} Digital Storefront. All rights reserved.</p>
            </footer>
          </div>
        </AuthLoader>
      </BrowserRouter>
    </Provider>
  );
}
