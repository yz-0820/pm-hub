/**
 * 编程知识训练 API 单元测试
 * 测试覆盖率目标: ≥80%
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db/client';
import { programmingQuestions, programmingSessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// 测试数据
const TEST_QUESTION = {
  questionKey: 'test-001',
  domain: 'frontend',
  category: 'html-css',
  stem: '测试题目：HTML5中，哪个标签用于定义文档的导航链接？',
  optionA: '<nav>',
  optionB: '<header>',
  optionC: '<section>',
  optionD: '<article>',
  correctOption: 'A',
  explanation: '<nav>标签专门用于定义导航链接。',
  links: JSON.stringify([{ title: 'MDN nav', url: 'https://developer.mozilla.org/nav' }]),
  difficulty: 'beginner',
  isActive: true,
};

describe('编程知识训练 API 测试', () => {
  let testQuestionId: number;
  let testSessionId: number;

  beforeAll(async () => {
    // 插入测试题目
    const result = await db.insert(programmingQuestions).values({
      ...TEST_QUESTION,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning({ id: programmingQuestions.id });
    testQuestionId = result[0].id;
  });

  afterAll(async () => {
    // 清理测试数据
    await db.delete(programmingSessions).where(eq(programmingSessions.id, testSessionId));
    await db.delete(programmingQuestions).where(eq(programmingQuestions.id, testQuestionId));
  });

  describe('题目查询 API', () => {
    it('应该能按领域筛选题目', async () => {
      const response = await fetch(
        'http://localhost:3000/api/training/programming/questions?domain=frontend&count=5'
      );
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.questions).toHaveLength(5);
      expect(data.data.questions.every((q: any) => q.domain === 'frontend')).toBe(true);
    });

    it('应该能按难度筛选题目', async () => {
      const response = await fetch(
        'http://localhost:3000/api/training/programming/questions?difficulty=beginner&count=5'
      );
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.data.questions.every((q: any) => q.difficulty === 'beginner')).toBe(true);
    });

    it('返回的题目不应包含正确答案', async () => {
      const response = await fetch(
        'http://localhost:3000/api/training/programming/questions?count=1'
      );
      const data = await response.json();
      
      expect(data.data.questions[0].correctOption).toBeUndefined();
    });

    it('count参数应在1-50范围内', async () => {
      const response = await fetch(
        'http://localhost:3000/api/training/programming/questions?count=100'
      );
      expect(response.status).toBe(400);
    });
  });

  describe('会话管理 API', () => {
    it('应该能创建答题会话', async () => {
      const response = await fetch(
        'http://localhost:3000/api/training/programming/sessions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domains: ['frontend'],
            count: 5,
            difficulty: 'beginner',
          }),
        }
      );
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.sessionId).toBeDefined();
      expect(data.data.questions).toHaveLength(5);
      
      testSessionId = data.data.sessionId;
    });

    it('应该能获取会话详情', async () => {
      const response = await fetch(
        `http://localhost:3000/api/training/programming/sessions/${testSessionId}`
      );
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.data.session).toBeDefined();
      expect(data.data.currentQuestion).toBeDefined();
    });

    it('应该能提交答案', async () => {
      const response = await fetch(
        `http://localhost:3000/api/training/programming/sessions/${testSessionId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: testQuestionId,
            answer: 'A',
          }),
        }
      );
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.data.isCorrect).toBeDefined();
      expect(data.data.correctOption).toBeDefined();
    });

    it('应该能暂停会话', async () => {
      const response = await fetch(
        `http://localhost:3000/api/training/programming/sessions/${testSessionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'paused' }),
        }
      );
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.data.status).toBe('paused');
    });

    it('应该能提交整份答卷', async () => {
      const response = await fetch(
        `http://localhost:3000/api/training/programming/sessions/${testSessionId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.data.score).toBeDefined();
      expect(data.data.totalQuestions).toBeDefined();
      expect(data.data.correctCount).toBeDefined();
    });
  });

  describe('数据验证', () => {
    it('题目数据应包含所有必要字段', async () => {
      const question = await db.query.programmingQuestions.findFirst({
        where: eq(programmingQuestions.id, testQuestionId),
      });
      
      expect(question).toBeDefined();
      expect(question?.questionKey).toBeDefined();
      expect(question?.domain).toBeDefined();
      expect(question?.category).toBeDefined();
      expect(question?.stem).toBeDefined();
      expect(question?.optionA).toBeDefined();
      expect(question?.optionB).toBeDefined();
      expect(question?.optionC).toBeDefined();
      expect(question?.optionD).toBeDefined();
      expect(question?.correctOption).toBeDefined();
      expect(question?.explanation).toBeDefined();
    });

    it('正确答案应为A/B/C/D之一', async () => {
      const questions = await db.query.programmingQuestions.findMany({
        where: eq(programmingQuestions.isActive, true),
      });
      
      const validOptions = ['A', 'B', 'C', 'D'];
      expect(
        questions.every((q) => validOptions.includes(q.correctOption))
      ).toBe(true);
    });
  });
});
