import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Zap, ArrowRight, Trophy, Cpu, Globe, ChevronDown } from 'lucide-react';
import { languages } from '../languages';

interface LandingProps {
  onGetStarted: () => void;
  onViewAbout: () => void;
  language?: 'en' | 'es';
  onLanguageChange: (lang: 'en' | 'es') => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted, onViewAbout, language = 'es', onLanguageChange }) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const t = languages[language].landing;
  const [titleLead = '', titleAccent = ''] = t.title.split('.');
  const titleLeadWords = titleLead.trim().split(' ');
  const mobileLeadFirst = titleLeadWords.length > 2 ? titleLeadWords.slice(0, -1).join(' ') : titleLead.trim();
  const mobileLeadSecond = titleLeadWords.length > 2 ? titleLeadWords.slice(-1).join(' ') : '';

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary overflow-x-hidden relative">
      <div className="noise-bg" />
      
      {/* Navbar / Header with Language Switcher */}
      <header className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 py-5 sm:py-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4 min-w-0">
          <div className="flex items-center gap-3">
            <div className="bg-brand-primary p-2.5 rounded-xl shadow-lg shadow-brand-primary/20">
              <Dumbbell className="text-white" size={20} />
            </div>
            <span className="text-xl sm:text-2xl font-black heading-premium tracking-normal gradient-text">FitAtlas</span>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="glass-sm px-3 sm:px-5 py-2.5 rounded-2xl flex items-center gap-2 sm:gap-3 border border-white/5 hover:bg-white/10 transition-all font-bold text-xs sm:text-sm uppercase tracking-widest"
            >
              <Globe size={16} className="text-brand-primary" />
              <span className="hidden sm:inline">{language === 'en' ? 'English' : 'Español'}</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-3 w-48 glass-card rounded-2xl border border-white/5 overflow-hidden shadow-2xl p-1.5"
                >
                  <button 
                    onClick={() => { onLanguageChange('en'); setIsLangOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-xs tracking-widest ${language === 'en' ? 'bg-brand-primary text-white' : 'hover:bg-white/5 text-text-secondary'}`}
                  >
                    ENGLISH {language === 'en' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                  <button 
                    onClick={() => { onLanguageChange('es'); setIsLangOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-xs tracking-widest ${language === 'es' ? 'bg-brand-primary text-white' : 'hover:bg-white/5 text-text-secondary'}`}
                  >
                    ESPAÑOL {language === 'es' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full max-w-full pt-36 sm:pt-48 pb-20 sm:pb-32 px-4 sm:px-6 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.05, 0.15, 0.05],
              x: [-100, 100, -100]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -top-60 -left-60 w-[1000px] h-[1000px] bg-brand-primary/30 rounded-full blur-[160px]"
          />
          <motion.div 
            animate={{ 
              scale: [1.3, 1, 1.3],
              opacity: [0.05, 0.1, 0.05],
              x: [100, -100, 100]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-60 -right-60 w-[800px] h-[800px] bg-brand-accent/20 rounded-full blur-[140px]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.03, 0.08, 0.03],
              y: [-50, 50, -50]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-secondary/20 rounded-full blur-[120px]"
          />
        </div>

        <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-6xl mx-auto text-center overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex max-w-[calc(100vw-2rem)] items-center justify-center gap-2 px-4 sm:px-5 py-2 glass-md rounded-full text-xs sm:text-sm font-semibold mb-10 border border-white/10 shadow-lg"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
            </span>
            <span className="text-white/80 break-words">{t.badge}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-full text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black mb-8 sm:mb-10 leading-[1] sm:leading-[0.92] heading-premium tracking-normal break-words"
          >
            <span className="sm:hidden">
              {mobileLeadFirst}
              {mobileLeadSecond && <><br />{mobileLeadSecond}</>}
              <br />
              <span className="gradient-text">{titleAccent.trim()}</span>
            </span>
            <span className="hidden sm:inline">
              {titleLead.trim()}.<br />
              <span className="gradient-text">{titleAccent.trim()}</span>
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl md:text-2xl text-text-secondary w-full max-w-[calc(100vw-2rem)] sm:max-w-3xl mx-auto mb-10 sm:mb-14 leading-relaxed font-medium break-words"
          >
            {t.subtitle}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex w-full flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6"
          >
            <button 
              onClick={onGetStarted}
              className="group relative w-full sm:w-auto max-w-[calc(100vw-2rem)] justify-center px-5 sm:px-12 py-5 sm:py-6 bg-brand-primary rounded-2xl font-bold text-base sm:text-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-brand-primary/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out skew-x-12" />
              {t.getStarted} <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onViewAbout}
              className="w-full sm:w-auto max-w-[calc(100vw-2rem)] px-5 sm:px-12 py-5 sm:py-6 glass-md hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-base sm:text-xl transition-all hover:scale-105 active:scale-95"
            >
              {t.manifesto}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Cpu className="text-brand-primary" size={32} />} 
            title={t.atlasTitle} 
            desc={t.atlasDesc} 
            delay={0.4}
          />
          <FeatureCard 
            icon={<Zap className="text-yellow-400" size={32} />} 
            title={t.stressTitle} 
            desc={t.stressDesc} 
            delay={0.5}
          />
          <FeatureCard 
            icon={<Trophy className="text-brand-accent" size={32} />} 
            title={t.rpgTitle} 
            desc={t.rpgDesc} 
            delay={0.6}
          />
        </div>
      </section>
      
      {/* Premium Footer */}
      <footer className="py-24 border-t border-white/5 px-6 glass-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="bg-brand-primary p-3 rounded-2xl shadow-lg shadow-brand-primary/20">
              <Dumbbell className="text-white" size={28} />
            </div>
            <span className="text-2xl sm:text-3xl font-black heading-premium tracking-normal gradient-text">FitAtlas</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-12 text-xs sm:text-sm font-bold text-text-secondary uppercase tracking-widest">
            <a href="#" className="hover:text-brand-primary transition-colors">{t.privacy}</a>
            <a href="#" className="hover:text-brand-primary transition-colors">{t.terms}</a>
            <a href="#" className="hover:text-brand-primary transition-colors">{t.support}</a>
          </div>
          <div className="text-text-secondary text-sm font-medium">
            © 2026 FitAtlas Intelligence. {t.footer}
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="glass-card p-6 sm:p-10 lg:p-12 rounded-3xl lg:rounded-[48px] hover:border-brand-primary/50 transition-all group cursor-default min-w-0"
  >
    <div className="bg-white/5 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-brand-primary/10 transition-all duration-500 shadow-inner">
      {icon}
    </div>
    <h3 className="text-2xl sm:text-3xl font-bold mb-5 heading-premium break-words">{title}</h3>
    <p className="text-text-secondary text-base sm:text-lg leading-relaxed font-medium group-hover:text-white/80 transition-colors">{desc}</p>
  </motion.div>
);

export default Landing;
