import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data.success) {
          navigate('/login');
      } else {
          setError(res.data.message);
      }
    } catch (err: any) {
        setError(err.response?.data?.message || 'Registration failed');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-16">
       <div className="text-center mb-10">
           <h1 className="text-3xl font-bold tracking-tight mb-2">Create Account</h1>
           <p className="text-zinc-500 font-medium">Join us to shop the best products.</p>
       </div>
       
       <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border shadow-sm">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
          
          <div>
              <label className="block text-sm font-semibold mb-2">Full Name</label>
              <input 
                 type="text" 
                 value={name}
                 onChange={e => setName(e.target.value)}
                 className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-black focus:ring-1 focus:ring-black outline-none font-medium" 
                 required 
              />
          </div>
          <div>
              <label className="block text-sm font-semibold mb-2">Email Address</label>
              <input 
                 type="email" 
                 value={email}
                 onChange={e => setEmail(e.target.value)}
                 className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-black focus:ring-1 focus:ring-black outline-none font-medium" 
                 required 
              />
          </div>
          <div>
              <label className="block text-sm font-semibold mb-2">Password</label>
              <input 
                 type="password" 
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-black focus:ring-1 focus:ring-black outline-none font-medium" 
                 required 
                 minLength={6}
              />
          </div>
          <button 
             type="submit" 
             disabled={loading}
             className="w-full bg-black text-white py-4 rounded-xl font-bold tracking-wide hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
             {loading ? 'Creating...' : 'Create Account'}
          </button>
       </form>
       
       <p className="text-center mt-8 text-zinc-500 font-medium">
          Already have an account? <Link to="/login" className="text-black font-semibold hover:underline">Sign In</Link>
       </p>
    </div>
  );
}
