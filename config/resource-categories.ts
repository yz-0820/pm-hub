import { MessageSquare, Zap, Users, Crown } from 'lucide-react';

export interface ResourceCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  iconBg: string;
}

export const resourceCategories: ResourceCategory[] = [
  {
    id: 'communication',
    name: '职场沟通',
    description: '',
    icon: MessageSquare,
    color: 'text-blue-600',
    gradient: 'from-blue-500/10 to-cyan-500/5',
    iconBg: 'bg-blue-500/10',
  },
  {
    id: 'productivity',
    name: '高效工作',
    description: '',
    icon: Zap,
    color: 'text-amber-600',
    gradient: 'from-amber-500/10 to-orange-500/5',
    iconBg: 'bg-amber-500/10',
  },
  {
    id: 'teamwork',
    name: '团队协作',
    description: '',
    icon: Users,
    color: 'text-emerald-600',
    gradient: 'from-emerald-500/10 to-teal-500/5',
    iconBg: 'bg-emerald-500/10',
  },
  {
    id: 'leadership',
    name: '领导力',
    description: '',
    icon: Crown,
    color: 'text-purple-600',
    gradient: 'from-purple-500/10 to-pink-500/5',
    iconBg: 'bg-purple-500/10',
  },
];

export const resourceCategoryLabels: Record<string, { name: string; description: string }> = {
  communication: {
    name: '职场沟通',
    description: '',
  },
  productivity: {
    name: '高效工作',
    description: '',
  },
  teamwork: {
    name: '团队协作',
    description: '',
  },
  leadership: {
    name: '领导力',
    description: '',
  },
};

export const resourceTypes = [
  { id: 'article', name: '专业文章', color: 'bg-blue-500' },
  { id: 'video', name: '教学视频', color: 'bg-red-500' },
  { id: 'blog', name: '行业博客', color: 'bg-green-500' },
  { id: 'case', name: '案例分析', color: 'bg-purple-500' },
] as const;

export type ResourceType = typeof resourceTypes[number]['id'];

export const difficultyLevels = [
  { id: 'all', name: '全部' },
  { id: 'beginner', name: '入门' },
  { id: 'intermediate', name: '进阶' },
  { id: 'advanced', name: '高级' },
] as const;

export type DifficultyLevel = typeof difficultyLevels[number]['id'];
