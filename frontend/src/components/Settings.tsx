import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Languages, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { languages } from '../languages';
import { updateProfile } from '../api/client';
import { useAuthStore } from '../store/authStore';

interface SettingsProps {
  language: 'en' | 'es';
  onLanguageChange: (lang: 'en' | 'es') => void;
}

const Settings: React.FC<SettingsProps> = ({ language, onLanguageChange }) => {
  const t = languages[language];
  const { user, setUser } = useAuthStore();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setStatus('loading');
    try {
      const data: any = { name, email };
      if (newPassword) {
        data.password = newPassword;
        data.current_password = currentPassword;
      }
      
      const updatedUser = await updateProfile(user.id, data);
      setUser({ ...user, ...updatedUser });
      setStatus('success');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.response?.data?.detail || t.settings.error);
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-12">
        <h3 className="text-3xl font-black heading-premium tracking-tight mb-2">{t.settings.title}</h3>
        <p className="text-text-secondary font-medium">{t.settings.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Settings */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSave} className="glass-card p-6 sm:p-10 rounded-[40px] border border-white/5 space-y-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <User size={24} />
              </div>
              <h4 className="text-xl font-bold">{t.settings.profile}</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">{t.settings.name}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">{t.settings.email}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">{t.settings.currentPassword}</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">{t.settings.password}</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex-1 mr-4">
                {status === 'success' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-brand-secondary font-bold text-sm">
                    <CheckCircle2 size={18} /> {t.settings.success}
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-red-500 font-bold text-sm">
                    <AlertCircle size={18} /> {errorMessage}
                  </motion.div>
                )}
              </div>
              
              <button 
                type="submit"
                disabled={status === 'loading'}
                className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-lg shadow-brand-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {t.settings.save}
              </button>
            </div>
          </form>
        </div>

        {/* Preferences */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-[40px] border border-white/5 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
                <Languages size={24} />
              </div>
              <h4 className="text-xl font-bold">{t.settings.language}</h4>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => onLanguageChange('en')}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${language === 'en' ? 'bg-brand-primary/10 border-brand-primary text-white font-bold' : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10'}`}
              >
                <span>English</span>
                {language === 'en' && <CheckCircle2 size={18} className="text-brand-primary" />}
              </button>
              <button 
                onClick={() => onLanguageChange('es')}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${language === 'es' ? 'bg-brand-primary/10 border-brand-primary text-white font-bold' : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10'}`}
              >
                <span>Español</span>
                {language === 'es' && <CheckCircle2 size={18} className="text-brand-primary" />}
              </button>
            </div>
          </div>

          <div className="glass-card p-8 rounded-[40px] border border-white/5 bg-gradient-to-br from-brand-primary/10 to-transparent">
            <h5 className="font-black text-xs uppercase tracking-[0.2em] mb-4 text-brand-primary">Operator Status</h5>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-text-secondary">Level</span>
                <span className="text-white font-bold">{user?.level}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-text-secondary">XP</span>
                <span className="text-white font-bold">{user?.xp}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-text-secondary">Joined</span>
                <span className="text-white font-bold">{new Date(user?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
