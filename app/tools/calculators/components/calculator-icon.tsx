'use client';

import React from 'react';
import {
  GraduationCap,
  TrendingUp,
  Award,
  BarChart3,
  BookOpen,
  ArrowLeftRight,
  Target,
  UserCheck,
  Layers,
  Wallet,
  Receipt,
  Tag,
  Calculator,
  LineChart,
  PiggyBank,
  Briefcase,
  Compass,
  Coins,
  CalendarHeart,
  CalendarDays,
  Fuel,
  Zap,
  Users,
  HeartPulse,
  Crop,
  HelpCircle,
} from 'lucide-react';

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export default function CalculatorIcon({ name, size = 20, className = '' }: Props) {
  const iconMap: Record<string, React.ElementType> = {
    GraduationCap,
    TrendingUp,
    Award,
    BarChart3,
    BookOpen,
    ArrowLeftRight,
    Target,
    UserCheck,
    Layers,
    Wallet,
    Receipt,
    Tag,
    Calculator,
    LineChart,
    PiggyBank,
    Briefcase,
    Compass,
    Coins,
    CalendarHeart,
    CalendarDays,
    Fuel,
    Zap,
    Users,
    HeartPulse,
    Crop,
  };

  const Component = iconMap[name] || HelpCircle;
  return <Component size={size} className={className} />;
}
