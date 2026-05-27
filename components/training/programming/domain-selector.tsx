'use client';

import { motion } from 'framer-motion';
import { Code, Server, Database, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DomainType = 'frontend' | 'backend' | 'database';

interface Domain {
  id: DomainType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const domains: Domain[] = [
  {
    id: 'frontend',
    label: '前端开发',
    description: 'Web 页面构建与交互开发',
    icon: <Code className="h-5 w-5" />,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'backend',
    label: '后端开发',
    description: '服务端逻辑与 API 设计',
    icon: <Server className="h-5 w-5" />,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'database',
    label: '数据库',
    description: '数据存储、查询与优化',
    icon: <Database className="h-5 w-5" />,
    color: 'from-purple-500 to-violet-500',
  },
];

interface DomainSelectorProps {
  selected: DomainType[];
  onChange: (selected: DomainType[]) => void;
}

export function DomainSelector({ selected, onChange }: DomainSelectorProps) {
  const handleToggle = (domainId: DomainType) => {
    if (selected.includes(domainId)) {
      onChange(selected.filter(id => id !== domainId));
    } else {
      onChange([...selected, domainId]);
    }
  };

  const isSelected = (domainId: DomainType) => selected.includes(domainId);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {domains.map((domain, index) => (
        <motion.button
          key={domain.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => handleToggle(domain.id)}
          className={cn(
            'relative flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200',
            isSelected(domain.id)
              ? 'border-primary bg-primary/5 shadow-lg'
              : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
          )}
        >
          {/* 选中标记 */}
          {isSelected(domain.id) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3"
            >
              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            </motion.div>
          )}

          {/* 图标 */}
          <div
            className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors',
              isSelected(domain.id)
                ? `bg-gradient-to-br ${domain.color} text-white`
                : 'bg-muted text-muted-foreground'
            )}
          >
            {domain.icon}
          </div>

          {/* 文字内容 */}
          <div className="flex-1 min-w-0 pr-6">
            <h3
              className={cn(
                'font-semibold mb-1.5',
                isSelected(domain.id) ? 'text-primary' : 'text-foreground'
              )}
            >
              {domain.label}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {domain.description}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
