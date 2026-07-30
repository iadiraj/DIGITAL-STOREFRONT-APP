import { Link } from 'react-router-dom';
import { ArrowRight, Box, Shield, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-24"
    >
      {/* Hero */}
      <section className="text-center pt-16 pb-12">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 max-w-4xl mx-auto leading-tight"
        >
          The Next Generation of <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 to-zinc-900">Digital Commerce</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-10 font-medium"
        >
          Discover a curated collection of premium products. Minimalist design, maximalist quality.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <Link to="/products" className="bg-black text-white px-8 py-4 rounded-xl font-medium tracking-wide hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
            Explore Collection <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/register" className="bg-white text-black border border-zinc-200 px-8 py-4 rounded-xl font-medium tracking-wide hover:bg-zinc-50 transition-all text-center">
            Create an Account
          </Link>
        </motion.div>
      </section>

      {/* Featured Categories */}
      <section>
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Popular Categories</h2>
            <Link to="/products" className="text-sm font-semibold text-zinc-500 hover:text-black transition-colors flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {['Electronics', 'Audio', 'Gaming', 'Productivity'].map((cat, i) => (
             <motion.div key={cat} variants={item}>
                 <Link to={`/products?category=${cat}`} className="group relative h-72 rounded-3xl overflow-hidden bg-zinc-100 p-8 flex flex-col justify-end transition-transform hover:-translate-y-1 block shadow-sm hover:shadow-md">
                    <img src={`https://picsum.photos/seed/${i*20}/600/400`} alt={cat} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" />
                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                      <h3 className="text-white font-semibold text-xl tracking-tight">{cat}</h3>
                    </div>
                 </Link>
             </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="bg-zinc-100 rounded-3xl p-12 lg:p-24 grid md:grid-cols-3 gap-12 text-center md:text-left"
      >
        <div>
           <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6 mx-auto md:mx-0 shadow-lg">
              <Zap className="w-6 h-6" />
           </div>
           <h3 className="text-xl font-bold mb-3 tracking-tight">Lightning Fast</h3>
           <p className="text-zinc-500 font-medium leading-relaxed">Built on modern microservices architecture with Redis caching for instant response times.</p>
        </div>
        <div>
           <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6 mx-auto md:mx-0 shadow-lg">
              <Shield className="w-6 h-6" />
           </div>
           <h3 className="text-xl font-bold mb-3 tracking-tight">Enterprise Security</h3>
           <p className="text-zinc-500 font-medium leading-relaxed">Bank-grade JWT authentication and secure data transmission practices.</p>
        </div>
        <div>
           <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6 mx-auto md:mx-0 shadow-lg">
              <Box className="w-6 h-6" />
           </div>
           <h3 className="text-xl font-bold mb-3 tracking-tight">Global Inventory</h3>
           <p className="text-zinc-500 font-medium leading-relaxed">Real-time inventory tracking across distributed databases for accuracy.</p>
        </div>
      </motion.section>
    </motion.div>
  );
}
