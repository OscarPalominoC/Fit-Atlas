import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Zap, Target, Dumbbell } from 'lucide-react';
import { languages } from '../languages';

interface AboutProps {
  onBack: () => void;
  language?: 'en' | 'es';
}

const About: React.FC<AboutProps> = ({ onBack, language = 'es' }) => {
  const t = languages[language].about;
  const ui = languages[language].ui;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary px-4 sm:px-6 py-10 sm:py-20 relative overflow-x-hidden">
      <div className="noise-bg" />
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-secondary/5 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-4xl mx-auto">
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-3 text-text-secondary hover:text-white transition-all mb-10 sm:mb-16 font-bold uppercase tracking-widest text-xs group"
        >
          <div className="p-2 glass-sm rounded-lg group-hover:bg-white/10 transition-colors">
            <ChevronLeft size={18} /> 
          </div>
          {ui.returnCommand}
        </motion.button>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-14 sm:space-y-24"
        >
          {/* Header */}
          <motion.section variants={itemVariants} className="text-center md:text-left">
            <div className="inline-flex items-center gap-3 px-4 py-2 glass-sm rounded-2xl mb-8 border border-white/5">
              <Dumbbell className="text-brand-primary" size={20} />
              <span className="text-sm font-black uppercase tracking-widest text-brand-primary">{languages[language].landing.manifesto}</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black heading-premium tracking-normal mb-6 sm:mb-8 leading-[0.95] sm:leading-[0.9] break-words">
              {t.title.split(' ').slice(0, -2).join(' ')} <span className="gradient-text">{t.title.split(' ').slice(-2).join(' ')}</span>
            </h1>
            <p className="text-lg sm:text-2xl text-text-secondary leading-relaxed font-medium max-w-3xl">
              {t.subtitle}
            </p>
          </motion.section>

          {/* Core Philosophy */}
          <motion.section variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12">
            <div className="glass-card p-6 sm:p-10 lg:p-12 rounded-3xl lg:rounded-[48px] border-white/5 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-black heading-premium mb-6 break-words">{t.dnaTitle}</h2>
              <p className="text-text-secondary text-base sm:text-lg leading-relaxed font-medium">
                {t.dnaDesc}
              </p>
            </div>
            <div className="glass-card p-6 sm:p-10 lg:p-12 rounded-3xl lg:rounded-[48px] border-white/5 bg-brand-primary/5 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-black heading-premium mb-6 break-words">{t.goalTitle}</h2>
              <p className="text-text-secondary text-base sm:text-lg leading-relaxed font-medium">
                {t.goalDesc}
              </p>
            </div>
          </motion.section>

          {/* Pillars */}
          <motion.section variants={itemVariants} className="space-y-12">
            <h2 className="text-3xl sm:text-4xl font-black heading-premium tracking-tight text-center break-words">{t.pillarsTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <PillarCard 
                icon={<Shield className="text-brand-primary" />} 
                title={t.p1Title} 
                desc={t.p1Desc} 
              />
              <PillarCard 
                icon={<Zap className="text-yellow-400" />} 
                title={t.p2Title} 
                desc={t.p2Desc} 
              />
              <PillarCard 
                icon={<Target className="text-brand-secondary" />} 
                title={t.p3Title} 
                desc={t.p3Desc} 
              />
            </div>
          </motion.section>

          {/* Vision */}
          <motion.section variants={itemVariants} className="glass-card p-6 sm:p-10 lg:p-16 rounded-3xl lg:rounded-[64px] border-white/5 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black heading-premium mb-6 sm:mb-8 tracking-tight break-words">{t.visionTitle}</h2>
            <p className="text-base sm:text-xl text-text-secondary max-w-2xl mx-auto mb-8 sm:mb-12 font-medium">
              {t.visionDesc}
            </p>
            <button 
              onClick={onBack}
              className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-white text-bg-dark rounded-2xl font-black text-lg sm:text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10"
            >
              {t.visionBtn}
            </button>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
};

const PillarCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="glass-sm p-6 sm:p-10 rounded-3xl lg:rounded-[40px] border-white/5 hover:bg-white/[0.03] transition-all min-w-0">
    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 shadow-inner">
      {icon}
    </div>
    <h3 className="text-xl sm:text-2xl font-black heading-premium mb-3 tracking-tight break-words">{title}</h3>
    <p className="text-text-secondary font-medium leading-relaxed">{desc}</p>
  </div>
);

export default About;
