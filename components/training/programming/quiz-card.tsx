'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Lightbulb, ExternalLink, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DomainType } from './domain-selector';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  domain: DomainType;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  relatedLinks?: { title: string; url: string }[];
}

interface QuizCardProps {
  question: QuizQuestion;
  selectedOptionId: string | null;
  showResult: boolean;
  onSelectOption: (optionId: string, event?: React.MouseEvent) => void;
}

export function QuizCard({
  question,
  selectedOptionId,
  showResult,
  onSelectOption,
}: QuizCardProps) {
  const isCorrect = selectedOptionId === question.correctOptionId;

  const getDomainLabel = (domain: DomainType) => {
    const labels: Record<DomainType, string> = {
      frontend: '前端开发',
      backend: '后端开发',
      database: '数据库',
    };
    return labels[domain];
  };

  const getDomainColor = (domain: DomainType) => {
    const colors: Record<DomainType, string> = {
      frontend: 'bg-blue-500/10 text-blue-600',
      backend: 'bg-green-500/10 text-green-600',
      database: 'bg-purple-500/10 text-purple-600',
    };
    return colors[domain];
  };

  return (
    <div className="space-y-6">
      {/* 题目头部 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              getDomainColor(question.domain)
            )}
          >
            {getDomainLabel(question.domain)}
          </span>
        </div>
        
        {/* 题干 */}
        <motion.h2
          key={question.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-base font-bold leading-relaxed text-foreground"
          style={{ fontSize: '16px' }}
        >
          {question.question}
        </motion.h2>
      </div>

      {/* 选项列表 */}
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrectOption = option.id === question.correctOptionId;
          const showCorrect = showResult && isCorrectOption;
          const showWrong = showResult && isSelected && !isCorrectOption;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!showResult) {
                  onSelectOption(option.id, e);
                }
              }}
              disabled={showResult}
              className={cn(
                'w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200',
                showCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                  : showWrong
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                  : isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/30 hover:bg-accent/50',
                showResult && !isSelected && !isCorrectOption && 'opacity-60'
              )}
            >
              {/* 选项标记 */}
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold shrink-0 transition-colors',
                  showCorrect
                    ? 'bg-green-500 text-white'
                    : showWrong
                    ? 'bg-red-500 text-white'
                    : isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {showCorrect ? (
                  <Check className="h-5 w-5" />
                ) : showWrong ? (
                  <X className="h-5 w-5" />
                ) : (
                  String.fromCharCode(65 + index)
                )}
              </div>

              {/* 选项文字 */}
              <span
                className={cn(
                  'flex-1 pt-1 leading-relaxed',
                  showCorrect
                    ? 'text-green-700 dark:text-green-300'
                    : showWrong
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-foreground'
                )}
                style={{ fontSize: '14px' }}
              >
                {option.text}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* 答案解析 */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'p-4 rounded-xl border-l-4',
                isCorrect
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-500'
                  : 'bg-amber-50 dark:bg-amber-950/20 border-amber-500'
              )}
            >
              {/* 答案状态 */}
              <div className="flex items-center gap-2 mb-3">
                {isCorrect ? (
                  <>
                    <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-green-700 dark:text-green-300">
                      回答正确
                    </span>
                  </>
                ) : (
                  <>
                    <div className="h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center">
                      <X className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-amber-700 dark:text-amber-300">
                      回答错误
                    </span>
                  </>
                )}
              </div>

              {/* 解析内容 */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-sm">解析：</span>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>
                </div>

                {/* 相关链接 */}
                {question.relatedLinks && question.relatedLinks.length > 0 && (
                  <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-sm">延伸阅读：</span>
                      <div className="mt-2 space-y-2">
                        {question.relatedLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {link.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
