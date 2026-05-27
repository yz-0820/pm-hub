'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Layers, BarChart3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DomainSelector, DomainType } from '@/components/training/programming/domain-selector';
import { cn } from '@/lib/utils';

// 难度选项
const difficultyOptions = [
  { id: 'beginner', label: '简单', color: 'bg-green-500', textColor: 'text-white' },
  { id: 'intermediate', label: '中等', color: 'bg-amber-500', textColor: 'text-white' },
  { id: 'advanced', label: '困难', color: 'bg-red-500', textColor: 'text-white' },
];

// 题目数量选项
const countOptions = [10, 20, 30];

export default function ProgrammingTrainingPage() {
  const [selectedDomains, setSelectedDomains] = useState<DomainType[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('intermediate');
  const [selectedCount, setSelectedCount] = useState<number>(20);
  const [isStarting, setIsStarting] = useState(false);

  const handleStartTraining = async () => {
    if (selectedDomains.length === 0) return;
    setIsStarting(true);

    try {
      const response = await fetch('/api/training/programming/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domains: selectedDomains,
          count: selectedCount,
          difficulty: selectedDifficulty,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create session failed:', response.status, errorText);
        throw new Error(`Failed to create session: ${response.status} - ${errorText}`);
      }
      const data = await response.json();

      if (data.success && data.data.sessionId) {
        const params = new URLSearchParams({
          domains: selectedDomains.join(','),
          difficulty: selectedDifficulty,
        });
        window.location.href = `/training/programming/quiz/${data.data.sessionId}?${params.toString()}`;
      } else {
        throw new Error(data.error || '创建会话失败');
      }
    } catch (error) {
      console.error('Start training error:', error);
      alert(error instanceof Error ? error.message : '开始训练失败，请重试');
    } finally {
      setIsStarting(false);
    }
  };

  const canStart = selectedDomains.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 页面头部 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            编程知识训练
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            系统化题库训练，巩固前端、后端和数据库核心概念
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {/* 领域选择 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">选择训练领域</h2>
                  <p className="text-sm text-muted-foreground">选择你要练习的技术领域</p>
                </div>
              </div>
              <DomainSelector selected={selectedDomains} onChange={setSelectedDomains} />
            </motion.section>

            {/* 难度选择 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl border p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-semibold">选择难度</h2>
                  <p className="text-sm text-muted-foreground">根据你的水平选择合适的难度</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {difficultyOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedDifficulty(option.id)}
                    className={cn(
                      'relative py-3 px-4 rounded-lg border-2 text-center font-medium transition-all',
                      selectedDifficulty === option.id
                        ? cn(option.color, option.textColor, 'border-transparent shadow-md')
                        : 'border-border bg-background text-foreground hover:border-muted-foreground/30'
                    )}
                  >
                    {option.label}
                    {selectedDifficulty === option.id && (
                      <motion.div
                        layoutId="difficulty-indicator"
                        className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-white/80"
                      />
                    )}
                  </button>
                ))}
              </div>
            </motion.section>

            {/* 题目数量选择 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl border p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <List className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <h2 className="font-semibold">题目数量</h2>
                  <p className="text-sm text-muted-foreground">选择本次训练的题目数量</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {countOptions.map((count) => (
                  <button
                    key={count}
                    onClick={() => setSelectedCount(count)}
                    className={cn(
                      'relative py-3 px-4 rounded-lg border-2 text-center font-medium transition-all',
                      selectedCount === count
                        ? 'bg-primary text-primary-foreground border-transparent shadow-md'
                        : 'border-border bg-background text-foreground hover:border-muted-foreground/30'
                    )}
                  >
                    {count} 题
                    {selectedCount === count && (
                      <motion.div
                        layoutId="count-indicator"
                        className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary-foreground/80"
                      />
                    )}
                  </button>
                ))}
              </div>
            </motion.section>

            {/* 开始按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-4"
            >
              <Button
                size="lg"
                className="w-full h-12 text-base font-semibold rounded-xl"
                disabled={!canStart || isStarting}
                onClick={handleStartTraining}
              >
                {isStarting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  />
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    开始训练
                  </>
                )}
              </Button>
              {!canStart && (
                <p className="text-center text-sm text-muted-foreground mt-3">
                  请至少选择一个训练领域
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
