import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { gifMapping } from '../data/gif_mapping';

interface ExerciseIconProps {
  name: string;
  mediaGif?: string | null;
  className?: string;
}

const resolvePublicAsset = (assetPath?: string | null) => {
  if (!assetPath) return null;
  if (/^https?:\/\//.test(assetPath)) return assetPath;
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${assetPath.replace(/^\//, '')}`;
};

const ExerciseIcon: React.FC<ExerciseIconProps> = ({ name, mediaGif, className }) => {
  const [error, setError] = useState(false);
  
  const gifUrl = resolvePublicAsset(mediaGif || gifMapping[name.toLowerCase()]);

  if (error || !gifUrl) {
    return <div className={`bg-white/5 rounded-2xl flex items-center justify-center ${className}`}><Dumbbell className="text-white/20" size={24} /></div>;
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 group ${className}`}>
      <img 
        src={gifUrl} 
        alt={name}
        className="w-full h-full object-cover mix-blend-lighten scale-110 group-hover:scale-125 transition-transform duration-700"
        onError={() => setError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default ExerciseIcon;
