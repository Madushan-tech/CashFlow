import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, className }) => {
  const LucideIcon = (LucideIcons as any)[name];

  if (!LucideIcon) {
    return <LucideIcons.HelpCircle size={size} className={className} />;
  }

  return <LucideIcon size={size} className={className} />;
};