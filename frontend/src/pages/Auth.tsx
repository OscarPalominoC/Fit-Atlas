import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Mail, Lock, User as UserIcon, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { languages } from '../languages';

interface AuthProps {
  onBack: () => void;
  onSuccess: () => void;
  language?: 'en' | 'es';
}

const Auth: React.FC<AuthProps> = ({ onBack, onSuccess, language = 'es' }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore(state => state.setAuth);
  const t = languages[language].auth;
  const ui = languages[language].ui;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const res = await api.post('/auth/register', formData);
        setAuth(res.data.user, res.data.access_token);
      } else {
        const params = new URLSearchParams();
        params.append('username', formData.email);
        params.append('password', formData.password);
        
        const res = await api.post('/auth/login', params);
        setAuth(res.data.user, res.data.access_token);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4 sm:px-6 py-10 sm:py-20 relative overflow-x-hidden">
      <div className="noise-bg" />
      
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-brand-accent/10 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-xl w-full relative z-10">
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-3 text-text-secondary hover:text-white transition-all mb-10 font-bold uppercase tracking-widest text-xs group"
        >
          <div className="p-2 glass-sm rounded-lg group-hover:bg-white/10 transition-colors">
            <ChevronLeft size={18} /> 
          </div>
          {ui.returnBase}
        </motion.button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-card p-6 sm:p-10 md:p-16 rounded-3xl sm:rounded-[48px] lg:rounded-[60px] border border-white/5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary" />
          
          <div className="flex flex-col items-center mb-12">
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="bg-brand-primary p-4 rounded-3xl mb-6 shadow-xl shadow-brand-primary/30"
            >
              <Dumbbell className="text-white" size={40} />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-black heading-premium tracking-normal mb-3 text-center break-words">{mode === 'login' ? t.loginTitle : t.registerTitle}</h2>
            <p className="text-text-secondary text-base sm:text-lg font-medium text-center max-w-sm">
              {mode === 'login' ? t.loginDesc : t.registerDesc}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {mode === 'register' && (
              <div className="space-y-3">
                <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t.fullName}</label>
                <div className="relative group">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-brand-primary transition-colors" size={22} />
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder={t.namePlaceholder}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 sm:py-5 pl-14 pr-5 sm:pr-6 focus:border-brand-primary focus:bg-white/[0.08] transition-all outline-none font-medium text-base sm:text-lg placeholder:text-white/10 shadow-inner"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t.email}</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-brand-primary transition-colors" size={22} />
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder={t.emailPlaceholder}
                  className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 sm:py-5 pl-14 pr-5 sm:pr-6 focus:border-brand-primary focus:bg-white/[0.08] transition-all outline-none font-medium text-base sm:text-lg placeholder:text-white/10 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t.password}</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-brand-primary transition-colors" size={22} />
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 sm:py-5 pl-14 pr-5 sm:pr-6 focus:border-brand-primary focus:bg-white/[0.08] transition-all outline-none font-medium text-base sm:text-lg placeholder:text-white/10 shadow-inner"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-sm font-bold text-center"
              >
                {error}
              </motion.div>
            )}

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 py-4 sm:py-5 rounded-3xl font-black text-lg sm:text-xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-brand-primary/30 disabled:opacity-50 overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out skew-x-12" />
              {loading ? <Loader2 className="animate-spin" size={24} /> : (
                <>
                  {mode === 'login' ? t.initiate : t.finalize} <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-12 text-center">
            <button 
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-text-secondary hover:text-white transition-colors text-sm font-bold uppercase tracking-[0.2em] py-2"
            >
              {mode === 'login' ? t.newOperator : t.existingIntel}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
