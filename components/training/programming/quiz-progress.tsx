'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizProgressProps {
  current: number;
  total: number;
  answeredQuestions: number[];
  onJumpToQuestion?: (index: number) => void;
}

export function QuizProgress({
  current,
  total,
  answeredQuestions,
  onJumpToQuestion,
}: QuizProgressProps) {
  const progress = ((current + 1) / total) * 100;
  const answeredCount = answeredQuestions.length;

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        {/* 顶部进度信息 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">答题进度</span>
            <span className="text-xs text-muted-foreground">
              ({answeredCount}/{total} 已答)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-primary">{current + 1}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{total}</span>
          </div>
        </div>

        {/* 进度条 */}
        <div className="relative h-2.5 bg-muted rounded-full overflow-hidden mb-4">
          {/* 背景进度（已答题） */}
          <div
            className="absolute top-0 left-0 h-full bg-primary/20 rounded-full"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
          {/* 当前进度 */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
          {/* 进度点 */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-md border-2 border-background"
            initial={{ left: 0 }}
            animate={{ left: `calc(${progress}% - 8px)` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* 题目序号导航 */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-hide">
            {Array.from({ length: total }, (_, i) => {
              const isAnswered = answeredQuestions.includes(i);
              const isCurrent = i === current;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onJumpToQuestion?.(i)}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer',
                    isCurrent
                      ? 'bg-primary text-primary-foreground shadow-md scale-110 ring-2 ring-primary/20'
                      : isAnswered
                      ? 'bg-primary/15 text-primary hover:bg-primary/25'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {isAnswered && !isCurrent ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// 简化的进度条版本（用于结果页等）
interface SimpleProgressProps {
  value: number;
  max: number;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function SimpleProgress({
  value,
  max,
  showPercentage = true,
  size = 'md',
  color = 'bg-primary',
}: SimpleProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  return (
    <div className="w-full">
      <div className={cn('bg-muted rounded-full overflow-hidden', heightClass)}>
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
          <span>{value}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}
