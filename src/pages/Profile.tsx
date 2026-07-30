import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useState } from 'react';
import { api } from '../lib/api';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
      navigate('/login');
      return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setSuccess(false);
      try {
          const res = await api.put('/users/profile', { name });
          dispatch(setUser(res.data.data.user));
          setSuccess(true);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  return (
      <div className="max-w-md mx-auto pt-16">
         <h1 className="text-3xl font-bold tracking-tight mb-8">Your Profile</h1>
         
         <form onSubmit={handleSubmit} className="space-y-6">
            {success && <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium">Profile updated successfully!</div>}
            <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <input 
                   type="text" 
                   value={name}
                   onChange={e => setName(e.target.value)}
                   className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black font-medium" 
                   required 
                />
            </div>
            <div>
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <input 
                   type="email" 
                   value={user.email}
                   disabled
                   className="w-full px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl outline-none font-medium text-zinc-500 cursor-not-allowed" 
                />
            </div>
            <button 
               type="submit" 
               disabled={loading || name === user.name}
               className="w-full bg-black text-white py-4 rounded-xl font-bold tracking-wide hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
               {loading ? 'Saving...' : 'Save Changes'}
            </button>
         </form>
      </div>
  );
}
