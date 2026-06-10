'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Trophy,
  RotateCcw,
  Home,
  CheckCircle,
  XCircle,
  Sigma,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizQuestion } from '@/components/training/programming/quiz-card';
import { DomainType } from '@/components/training/programming/domain-selector';
import { cn } from '@/lib/utils';

interface QuizResult {
  sessionId: string;
  totalQuestions: number;
  correctCount: number;
  answers: Record<string, string>;
  questions: QuizQuestion[];
  duration: number;
  domains: DomainType[];
  difficulty: string;
}

interface DomainStats {
  domain: DomainType;
  label: string;
  total: number;
  correct: number;
  color: string;
}

export default function MyResultsPage() {
  const router = useRouter();

  const [result, setResult] = useState<QuizResult | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [showWrongOnly, setShowWrongOnly] = useState(false);

  useEffect(() => {
    // 从 localStorage 读取当前会话ID
    const currentSessionId = localStorage.getItem('quiz-current-session');
    
    if (!currentSessionId) {
      // 没有当前会话，跳转到训练首页
      router.push('/training/programming');
      return;
    }

    const savedResult = localStorage.getItem(`quiz-result-${currentSessionId}`);
    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult));
      } catch {
        router.push('/training/programming');
      }
    } else {
      router.push('/training/programming');
    }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    );
  }

  const accuracy = Math.round((result.correctCount / result.totalQuestions) * 100);
  const wrongCount = result.totalQuestions - result.correctCount;

  // 按领域统计
  const domainStats: DomainStats[] = [
    { domain: 'frontend', label: '前端开发', total: 0, correct: 0, color: 'bg-blue-500' },
    { domain: 'backend', label: '后端开发', total: 0, correct: 0, color: 'bg-green-500' },
    { domain: 'database', label: '数据库', total: 0, correct: 0, color: 'bg-purple-500' },
  ];

  result.questions.forEach((q) => {
    const stat = domainStats.find((s) => s.domain === q.domain);
    if (stat) {
      stat.total++;
      if (result.answers[q.id] === q.correctOptionId) {
        stat.correct++;
      }
    }
  });

  const getScoreRating = (accuracy: number) => {
    if (accuracy >= 90) return { label: '优秀', color: 'text-green-500', bgColor: 'bg-green-500' };
    if (accuracy >= 80) return { label: '良好', color: 'text-blue-500', bgColor: 'bg-blue-500' };
    if (accuracy >= 60) return { label: '及格', color: 'text-amber-500', bgColor: 'bg-amber-500' };
    return { label: '需努力', color: 'text-red-500', bgColor: 'bg-red-500' };
  };

  const rating = getScoreRating(accuracy);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const getDomainLabel = (domain: DomainType | 'mixed') => {
    const labels: Record<DomainType | 'mixed', string> = {
      frontend: '前端开发',
      backend: '后端开发',
      database: '数据库',
      mixed: '混合模式',
    };
    return labels[domain] || domain;
  };

  const getDomainColor = (domain: DomainType | 'mixed') => {
    const colors: Record<DomainType | 'mixed', string> = {
      frontend: 'bg-blue-500/10 text-blue-600',
      backend: 'bg-green-500/10 text-green-600',
      database: 'bg-purple-500/10 text-purple-600',
      mixed: 'bg-orange-500/10 text-orange-600',
    };
    return colors[domain];
  };

  // 筛选错题
  const wrongQuestions = result.questions.filter(
    (q) => result.answers[q.id] !== q.correctOptionId
  );
  const displayQuestions = showWrongOnly ? wrongQuestions : result.questions;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Trophy className="h-4 w-4" />
            <span>训练完成</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            训练结果
          </h1>
          <p className="text-muted-foreground text-lg">
            查看你的训练表现，分析薄弱环节
          </p>
        </motion.div>

        {/* 总分卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto mb-10"
        >
          <div className="bg-card rounded-2xl border p-8 text-center">
            {/* 分数圆环 */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <svg className="h-40 w-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-muted"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className={rating.color}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: accuracy / 100 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{
                    strokeDasharray: '440',
                    strokeDashoffset: 440 - (440 * accuracy) / 100,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-5xl font-bold', rating.color)}>{accuracy}%</span>
                <span className="text-sm text-muted-foreground mt-1">{rating.label}</span>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-600">{result.correctCount}</span>
                </div>
                <span className="text-sm text-muted-foreground">正确</span>
              </div>
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-2xl font-bold text-red-600">{wrongCount}</span>
                </div>
                <span className="text-sm text-muted-foreground">错误</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => router.push('/training/programming')}>
                <RotateCcw className="h-5 w-5 mr-2" />
                重新训练
              </Button>
              <Button variant="outline" size="lg" onClick={() => router.push('/')}>
                <Home className="h-5 w-5 mr-2" />
                返回首页
              </Button>
            </div>
          </div>
        </motion.div>

        {/* 领域统计 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto mb-10"
        >
          <div className="bg-card rounded-2xl border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sigma className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">领域统计</h2>
                <p className="text-sm text-muted-foreground">各技术领域的答题情况</p>
              </div>
            </div>

            <div className="space-y-4">
              {domainStats
                .filter((stat) => stat.total > 0)
                .map((stat) => {
                  const percentage = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                  return (
                    <div key={stat.domain} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{stat.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {stat.correct}/{stat.total} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={cn('h-full rounded-full', stat.color)}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </motion.div>

        {/* 错题回顾 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-card rounded-2xl border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">题目回顾</h2>
                  <p className="text-sm text-muted-foreground">
                    {showWrongOnly ? `显示 ${wrongQuestions.length} 道错题` : `共 ${result.questions.length} 道题`}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWrongOnly(!showWrongOnly)}
              >
                {showWrongOnly ? '显示全部' : '只看错题'}
              </Button>
            </div>

            <div className="space-y-4">
              {displayQuestions.map((question, index) => {
                const userAnswer = result.answers[question.id];
                const isCorrect = userAnswer === question.correctOptionId;
                const isExpanded = expandedQuestions[question.id];

                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className={cn(
                      'border rounded-xl overflow-hidden transition-all',
                      isCorrect ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900'
                    )}
                  >
                    {/* 题目头部 */}
                    <button
                      onClick={() => toggleQuestion(question.id)}
                      className="w-full flex items-start gap-4 p-4 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
                          isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        )}
                      >
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium',
                              getDomainColor(question.domain)
                            )}
                          >
                            {getDomainLabel(question.domain)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            第 {index + 1} 题
                          </span>
                        </div>
                        <p className="font-medium line-clamp-2">{question.question}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {/* 展开详情 */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t bg-muted/30">
                        <div className="pt-4 space-y-3">
                          {/* 选项列表 */}
                          <div className="space-y-2">
                            {question.options.map((option) => {
                              const isUserChoice = userAnswer === option.id;
                              const isCorrectOption = option.id === question.correctOptionId;

                              return (
                                <div
                                  key={option.id}
                                  className={cn(
                                    'flex items-center gap-3 p-3 rounded-lg text-sm',
                                    isCorrectOption
                                      ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900'
                                      : isUserChoice && !isCorrectOption
                                      ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900'
                                      : 'bg-card border'
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'flex items-center justify-center w-6 h-6 rounded text-xs font-medium shrink-0',
                                      isCorrectOption
                                        ? 'bg-green-500 text-white'
                                        : isUserChoice && !isCorrectOption
                                        ? 'bg-red-500 text-white'
                                        : 'bg-muted text-muted-foreground'
                                    )}
                                  >
                                    {String.fromCharCode(65 + question.options.findIndex((o) => o.id === option.id))}
                                  </span>
                                  <span className="flex-1">{option.text}</span>
                                  {isCorrectOption && (
                                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                  )}
                                  {isUserChoice && !isCorrectOption && (
                                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* 解析 */}
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                            <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-medium text-sm">解析：</span>
                              <p className="text-sm text-muted-foreground mt-1">
                                {question.explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {displayQuestions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>太棒了！你没有错题</p>
                <p className="text-sm">继续保持！</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
