import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { updateProfile, getMe } from '../api/client';
import { languages } from '../languages';
import { motion } from 'framer-motion';
import { User, Shield, Save, LogOut, Scale, Ruler, Activity, Calendar, Lock, Key } from 'lucide-react';

interface SettingsProps {
  language: 'en' | 'es';
  onLanguageChange: (lang: 'en' | 'es') => void;
}

const Settings: React.FC<SettingsProps> = ({ language, onLanguageChange }) => {
  const { user, setUser, logout } = useAuthStore();
  const t = languages[language];
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
  });

  const [biometricsData, setBiometricsData] = useState({
    weight: user?.weight || '',
    height: user?.height || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);

  // Refresh user data on mount
  useEffect(() => {
    const refreshData = async () => {
      if (user?.id) {
        try {
          const freshUser = await getMe(user.id);
          setUser(freshUser);
          setProfileData(prev => ({ ...prev, name: freshUser.name, email: freshUser.email }));
          setBiometricsData({ weight: freshUser.weight || '', height: freshUser.height || '' });
        } catch (e) {
          console.error("Failed to refresh user data", e);
        }
      }
    };
    refreshData();
  }, [user?.id, setUser]);

  // Calculate BMI
  useEffect(() => {
    if (biometricsData.weight && biometricsData.height) {
      const weightNum = parseFloat(biometricsData.weight.toString());
      const heightNum = parseFloat(biometricsData.height.toString()) / 100;
      if (weightNum > 0 && heightNum > 0) {
        setBmi(weightNum / (heightNum * heightNum));
      }
    } else {
      setBmi(null);
    }
  }, [biometricsData.weight, biometricsData.height]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const data: any = { name: profileData.name, email: profileData.email };
      if (profileData.email !== user?.email) {
        data.current_password = profileData.currentPassword;
      }
      const updatedUser = await updateProfile(user?.id || '', data);
      setUser(updatedUser);
      setStatus('success');
      setProfileData(prev => ({ ...prev, currentPassword: '' }));
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.response?.data?.detail || 'Error updating profile');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const handleUpdateBiometrics = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const data = {
        weight: biometricsData.weight ? parseFloat(biometricsData.weight.toString()) : null,
        height: biometricsData.height ? parseFloat(biometricsData.height.toString()) : null
      };
      const updatedUser = await updateProfile(user?.id || '', data);
      setUser(updatedUser);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMsg(language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const data = {
        password: passwordData.newPassword,
        current_password: passwordData.currentPassword
      };
      const updatedUser = await updateProfile(user?.id || '', data);
      setUser(updatedUser);
      setStatus('success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.response?.data?.detail || 'Error updating password');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '---';
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: language === 'es' ? 'Bajo peso' : 'Underweight', color: 'text-blue-400' };
    if (val < 25) return { label: language === 'es' ? 'Normal' : 'Normal', color: 'text-brand-primary' };
    if (val < 30) return { label: language === 'es' ? 'Sobrepeso' : 'Overweight', color: 'text-yellow-500' };
    return { label: language === 'es' ? 'Obesidad' : 'Obesity', color: 'text-red-500' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
        <div>
          <h3 className="text-3xl sm:text-5xl font-black heading-premium tracking-tight mb-3">
            {language === 'es' ? 'OPERACIONES' : 'OPERATIONS'}
          </h3>
          <p className="text-text-secondary font-bold uppercase tracking-[0.2em] text-xs">
            {language === 'es' ? 'Protocolos del Sistema FitAtlas' : 'FitAtlas System Protocols'}
          </p>
        </div>
        
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
          {['en', 'es'].map((lang) => (
            <button 
              key={lang}
              onClick={() => onLanguageChange(lang as any)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${language === lang ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'text-text-secondary hover:text-white'}`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Operator Status & BMI */}
        <div className="lg:col-span-5 space-y-8">
          <div className="glass-card p-8 rounded-[40px] border border-white/5 bg-gradient-to-br from-brand-primary/10 to-transparent relative overflow-hidden group">
            <h5 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-brand-primary flex items-center gap-3">
              <Shield size={14} />
              {language === 'es' ? 'ESTADO OPERATIVO' : 'OPERATOR STATUS'}
            </h5>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary font-bold uppercase tracking-widest text-[10px]">Level</span>
                <span className="text-2xl font-black heading-premium text-brand-primary">{user?.level || 1}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  <span>Progress</span>
                  <span className="text-white">{user?.xp || 0} XP</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(user?.xp % 1000) / 10}%` }}
                    className="h-full bg-brand-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                </div>
              </div>
              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                  <span className="text-text-secondary flex items-center gap-2"><Calendar size={12} className="text-brand-secondary" /> {language === 'es' ? 'Ingreso' : 'Joined'}</span>
                  <span className="text-white">{formatDate(user?.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-[40px] border border-white/5">
            <h5 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-brand-accent flex items-center gap-3">
              <Activity size={14} />
              {language === 'es' ? 'MÉTRICAS IMC' : 'BMI METRICS'}
            </h5>
            
            {bmi ? (
              <div className="space-y-6 text-center">
                <div className="inline-block p-6 rounded-full bg-white/5 border border-white/10">
                  <span className={`text-4xl font-black heading-premium ${getBmiCategory(bmi).color}`}>{bmi.toFixed(1)}</span>
                </div>
                <div>
                  <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1">Body Mass Index</p>
                  <p className={`text-sm font-black uppercase tracking-widest ${getBmiCategory(bmi).color}`}>{getBmiCategory(bmi).label}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">{language === 'es' ? 'Sin datos biométricos' : 'No biometric data'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Multiple Forms */}
        <div className="lg:col-span-7 space-y-8">
          {/* Form 1: Identity */}
          <form onSubmit={handleUpdateProfile} className="glass-card p-8 sm:p-10 rounded-[40px] border border-white/5 space-y-6">
            <h4 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
              <User size={20} className="text-brand-primary" />
              {language === 'es' ? 'Identidad del Operador' : 'Operator Identity'}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary px-2">Name</label>
                <input 
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm font-bold focus:border-brand-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary px-2">Email</label>
                <input 
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm font-bold focus:border-brand-primary outline-none transition-all"
                />
              </div>
            </div>

            {profileData.email !== user?.email && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5 bg-red-500/5 p-4 rounded-2xl border border-red-500/20">
                <label className="text-[10px] font-black uppercase tracking-widest text-red-500 px-2">{language === 'es' ? 'Contraseña Actual Requerida' : 'Current Password Required'}</label>
                <input 
                  type="password"
                  value={profileData.currentPassword}
                  onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
                  className="w-full bg-white/5 border border-red-500/30 rounded-xl py-3 px-4 text-sm font-bold focus:border-red-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </motion.div>
            )}

            <button type="submit" className="w-full bg-brand-primary py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:brightness-110 transition-all">
              <Save size={14} /> {language === 'es' ? 'Guardar Identidad' : 'Save Identity'}
            </button>
          </form>

          {/* Form 2: Biometrics */}
          <form onSubmit={handleUpdateBiometrics} className="glass-card p-8 sm:p-10 rounded-[40px] border border-white/5 space-y-6">
            <h4 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
              <Scale size={20} className="text-brand-accent" />
              {language === 'es' ? 'Métricas Físicas' : 'Physical Metrics'}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary px-2">Weight (KG)</label>
                <div className="relative">
                  <Scale size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input 
                    type="number" step="0.1"
                    value={biometricsData.weight}
                    onChange={(e) => setBiometricsData({...biometricsData, weight: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold focus:border-brand-accent outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary px-2">Height (CM)</label>
                <div className="relative">
                  <Ruler size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input 
                    type="number" step="0.5"
                    value={biometricsData.height}
                    onChange={(e) => setBiometricsData({...biometricsData, height: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold focus:border-brand-accent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-brand-accent/20 border border-brand-accent/30 text-brand-accent py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-brand-accent/30 transition-all">
              <Save size={14} /> {language === 'es' ? 'Actualizar Métricas' : 'Update Metrics'}
            </button>
          </form>

          {/* Form 3: Password */}
          <form onSubmit={handleUpdatePassword} className="glass-card p-8 sm:p-10 rounded-[40px] border border-white/5 space-y-6">
            <h4 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
              <Lock size={20} className="text-brand-secondary" />
              {language === 'es' ? 'Protocolo de Seguridad' : 'Security Protocol'}
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary px-2">{language === 'es' ? 'Contraseña Actual' : 'Current Password'}</label>
                <div className="relative">
                  <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input 
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 px-4 text-sm font-bold focus:border-brand-secondary outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary px-2">{language === 'es' ? 'Nueva Contraseña' : 'New Password'}</label>
                  <input 
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm font-bold focus:border-brand-secondary outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary px-2">{language === 'es' ? 'Confirmar Nueva' : 'Confirm New'}</label>
                  <input 
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm font-bold focus:border-brand-secondary outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-brand-secondary py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:brightness-110 transition-all">
              <Shield size={14} /> {language === 'es' ? 'Actualizar Contraseña' : 'Update Password'}
            </button>
          </form>

          {status !== 'idle' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-4 rounded-2xl border text-center font-black uppercase tracking-widest text-[10px] ${status === 'success' ? 'bg-brand-secondary/10 border-brand-secondary text-brand-secondary' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
              {status === 'success' ? (language === 'es' ? 'Operación Exitosa' : 'Operation Successful') : errorMsg}
            </motion.div>
          )}

          <button onClick={logout} className="w-full py-5 rounded-[32px] border border-white/5 text-text-secondary hover:text-red-500 hover:bg-red-500/5 transition-all font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3">
            <LogOut size={18} /> {t.nav.signOut}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
