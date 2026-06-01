'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizProgress } from '@/components/training/programming/quiz-progress';
import { QuizCard, QuizQuestion } from '@/components/training/programming/quiz-card';
import { DomainType } from '@/components/training/programming/domain-selector';
import { cn } from '@/lib/utils';

interface SessionQuestionPayload {
  id: number;
  domain: QuizQuestion['domain'];
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
  links: string | null;
}

// 解析 links 字段：支持字符串URL和JSON数组两种格式
function parseLinks(links: string | null | undefined): NonNullable<QuizQuestion['relatedLinks']> {
  if (!links) return [];
  if (typeof links === 'string') {
    if (!links.trim()) return [];
    if (links.trim().startsWith('http')) {
      const url = links.trim();
      return [{ title: url, url }];
    }
    try {
      const parsed = JSON.parse(links);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (typeof item === 'string') return { title: item, url: item };
            if (
              item &&
              typeof item === 'object' &&
              'url' in item &&
              typeof item.url === 'string'
            ) {
              return {
                title: 'title' in item && typeof item.title === 'string' ? item.title : item.url,
                url: item.url,
              };
            }
            return null;
          })
          .filter((item): item is NonNullable<QuizQuestion['relatedLinks']>[number] => item !== null);
      }
      if (typeof parsed === 'string') return [{ title: parsed, url: parsed }];
    } catch {
      return [{ title: links, url: links }];
    }
  }
  return [];
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;

  // 从 URL 参数获取配置
  const domains = (searchParams.get('domains')?.split(',') as DomainType[]) || ['mixed'];
  const difficulty = searchParams.get('difficulty') || 'intermediate';

  // 状态管理
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [startTime] = useState(() => Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化：从 API 获取会话和题目
  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(`/api/training/programming/sessions/${sessionId}`);
        if (!response.ok) throw new Error('Failed to load session');
        const data = await response.json();

        if (data.success && data.data.session) {
          const sessionQuestions = (data.data.questions || []) as SessionQuestionPayload[];

          // 将 API 返回的题目转换为组件需要的格式
          const formattedQuestions: QuizQuestion[] = sessionQuestions.map((q) => ({
            id: String(q.id),
            domain: q.domain,
            question: q.stem,
            options: [
              { id: 'A', text: q.optionA },
              { id: 'B', text: q.optionB },
              { id: 'C', text: q.optionC },
              { id: 'D', text: q.optionD },
            ],
            correctOptionId: q.correctOption,
            explanation: q.explanation,
            relatedLinks: parseLinks(q.links),
          }));

          setQuestions(formattedQuestions);
        }
      } catch (error) {
        console.error('Load session error:', error);
      }
    }

    loadSession();
  }, [sessionId]);

  // 恢复进度（从 localStorage）
  useEffect(() => {
    const savedProgress = localStorage.getItem(`quiz-progress-${sessionId}`);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setCurrentIndex(progress.currentIndex || 0);
        setAnswers(progress.answers || {});
        setShowResults(progress.showResults || {});
      } catch {
        // 忽略解析错误
      }
    }
  }, [sessionId]);

  // 保存进度到 localStorage
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(
        `quiz-progress-${sessionId}`,
        JSON.stringify({
          currentIndex,
          answers,
          showResults,
          startTime,
        })
      );
    }
  }, [currentIndex, answers, showResults, sessionId, questions.length, startTime]);

  const currentQuestion = questions[currentIndex];
  const selectedOptionId = currentQuestion ? answers[currentQuestion.id] || null : null;
  const showResult = currentQuestion ? showResults[currentQuestion.id] || false : false;
  const answeredQuestions = Object.keys(answers).map((id) =>
    questions.findIndex((q) => q.id === id)
  );

  const handleSelectOption = useCallback((optionId: string, event?: React.MouseEvent) => {
    if (!currentQuestion) return;
    
    // 阻止事件冒泡和默认行为
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
    setShowResults((prev) => ({ ...prev, [currentQuestion.id]: true }));
  }, [currentQuestion]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // 计算结果
    const correctCount = questions.filter(
      (q) => answers[q.id] === q.correctOptionId
    ).length;

    // 保存结果到 localStorage
    const result = {
      sessionId,
      totalQuestions: questions.length,
      correctCount,
      answers,
      questions,
      duration: Math.floor((Date.now() - startTime) / 1000),
      domains,
      difficulty,
    };

    localStorage.setItem(`quiz-result-${sessionId}`, JSON.stringify(result));
    localStorage.removeItem(`quiz-progress-${sessionId}`);

    // 直接跳转到结果页
    window.location.href = `/training/programming/results/${sessionId}`;
  };

  // 检查是否可以提交（所有题目都已作答）
  const canSubmit = questions.length > 0 && Object.keys(answers).length === questions.length;
  const answeredCount = Object.keys(answers).length;

  if (questions.length === 0 || !currentQuestion) {
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

  return (
    <div className="min-h-screen bg-background">
      {/* 进度条 */}
      <QuizProgress
        current={currentIndex}
        total={questions.length}
        answeredQuestions={answeredQuestions}
        onJumpToQuestion={handleJumpToQuestion}
      />

      {/* 主内容区 */}
      <div className="pt-6 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* 顶部操作栏 */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              onClick={() => window.location.href = '/training/programming'}
            >
              <ChevronLeft className="h-4 w-4" />
              退出
            </button>
          </div>

          {/* 题目卡片 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-2xl border p-6 sm:p-8"
            >
              <QuizCard
                question={currentQuestion}
                selectedOptionId={selectedOptionId}
                showResult={showResult}
                onSelectOption={handleSelectOption}
              />
            </motion.div>
          </AnimatePresence>

          {/* 答题进度提示 */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>
              已答 {answeredCount} / {questions.length} 题
              {canSubmit && ' - 可以提交答卷了'}
            </span>
          </div>
        </div>
      </div>

      {/* 底部固定操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {/* 上一题按钮 */}
            <Button
              variant="outline"
              size="lg"
              className="min-h-12 px-6"
              disabled={currentIndex === 0}
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              上一题
            </Button>

            {/* 中间状态显示 */}
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {currentIndex + 1} / {questions.length}
              </span>
              {answeredCount < questions.length && (
                <span>还剩 {questions.length - answeredCount} 题</span>
              )}
            </div>

            {/* 下一题/提交按钮 */}
            {currentIndex < questions.length - 1 ? (
              <Button
                size="lg"
                className="min-h-12 px-6"
                onClick={handleNext}
              >
                下一题
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            ) : (
              <Button
                size="lg"
                className={cn(
                  'min-h-12 px-6',
                  canSubmit && 'bg-green-600 hover:bg-green-700'
                )}
                disabled={!canSubmit || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  />
                ) : (
                  <>
                    <Flag className="h-5 w-5 mr-2" />
                    提交答卷
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
