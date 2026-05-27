'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface CareerStatus {
  version: string;
  latestPublishedAt: string | null;
  totalContents: number;
  timestamp: number;
}

interface UseCareerAutoRefreshOptions {
  /** 检查间隔（毫秒），默认 60000 (1分钟) */
  checkInterval?: number;
  /** 是否启用，默认 true */
  enabled?: boolean;
  /** 最小刷新间隔（毫秒），防止频繁刷新，默认 30000 (30秒) */
  minRefreshInterval?: number;
  /** 最大重试次数，默认 3 */
  maxRetries?: number;
  /** 重试延迟（毫秒），默认 5000 */
  retryDelay?: number;
  /** 是否在页面可见时才检查，默认 true */
  onlyWhenVisible?: boolean;
}

interface UseCareerAutoRefreshResult {
  /** 当前状态版本 */
  currentVersion: string | null;
  /** 是否有新内容 */
  hasNewContent: boolean;
  /** 是否正在检查 */
  isChecking: boolean;
  /** 是否正在刷新 */
  isRefreshing: boolean;
  /** 最后检查时间 */
  lastCheckedAt: Date | null;
  /** 错误信息 */
  error: string | null;
  /** 手动检查更新 */
  checkForUpdates: () => Promise<void>;
  /** 刷新页面内容 */
  refresh: () => void;
  /** 清除新内容标记 */
  clearNewContentFlag: () => void;
}

const STORAGE_KEY = 'pm-hub-career-version';
const LAST_REFRESH_KEY = 'pm-hub-career-last-refresh';

function getCurrentCareerCategory(): string {
  if (typeof window === 'undefined') return 'all';
  try {
    const u = new URL(window.location.href);
    return u.searchParams.get('category') || 'all';
  } catch {
    return 'all';
  }
}

function makeKey(prefix: string, category: string): string {
  return `${prefix}:${category}`;
}

export function useCareerAutoRefresh(
  options: UseCareerAutoRefreshOptions = {}
): UseCareerAutoRefreshResult {
  const {
    checkInterval = 60000,
    enabled = true,
    minRefreshInterval = 30000,
    maxRetries = 3,
    retryDelay = 5000,
    onlyWhenVisible = true,
  } = options;

  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [hasNewContent, setHasNewContent] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const retryCountRef = useRef(0);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // 从 localStorage 获取上次保存的版本
  const getStoredVersion = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const category = getCurrentCareerCategory();
      return localStorage.getItem(makeKey(STORAGE_KEY, category));
    } catch {
      return null;
    }
  }, []);

  // 保存版本到 localStorage
  const saveVersion = useCallback((version: string) => {
    if (typeof window === 'undefined') return;
    try {
      const category = getCurrentCareerCategory();
      localStorage.setItem(makeKey(STORAGE_KEY, category), version);
      localStorage.setItem(makeKey(LAST_REFRESH_KEY, category), Date.now().toString());
    } catch {
      // ignore
    }
  }, []);

  // 检查是否可以刷新（避免频繁刷新）
  const canRefresh = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const category = getCurrentCareerCategory();
      const lastRefresh = localStorage.getItem(makeKey(LAST_REFRESH_KEY, category));
      if (lastRefresh) {
        const elapsed = Date.now() - parseInt(lastRefresh, 10);
        return elapsed >= minRefreshInterval;
      }
      return true;
    } catch {
      return true;
    }
  }, [minRefreshInterval]);

  // 获取最新内容状态
  const fetchStatus = useCallback(async (): Promise<CareerStatus | null> => {
    try {
      const category = getCurrentCareerCategory();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      const response = await fetch(`/api/career/status?${new URLSearchParams({ category }).toString()}`, {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || '获取状态失败');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw err;
    }
  }, []);

  // 检查更新
  const checkForUpdates = useCallback(async function checkForUpdatesInner() {
    if (!enabled || isChecking) return;

    setIsChecking(true);
    setError(null);

    try {
      const status = await fetchStatus();
      if (!status || !isMountedRef.current) return;

      setLastCheckedAt(new Date());
      retryCountRef.current = 0; // 重置重试计数

      const storedVersion = getStoredVersion();
      const newVersion = status.version;

      // 首次加载，保存版本但不提示
      if (!storedVersion) {
        setCurrentVersion(newVersion);
        saveVersion(newVersion);
        return;
      }

      setCurrentVersion(newVersion);

      // 版本不同，说明有新内容
      if (newVersion !== storedVersion) {
        setHasNewContent(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '检查更新失败';
      console.error('Career auto-refresh check failed:', message);

      // 重试逻辑
      retryCountRef.current++;
      if (retryCountRef.current < maxRetries) {
        setError(`检查失败，${retryDelay / 1000}秒后重试...`);
        checkTimeoutRef.current = setTimeout(checkForUpdatesInner, retryDelay);
      } else {
        setError(message);
        retryCountRef.current = 0;
      }
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  }, [enabled, isChecking, fetchStatus, getStoredVersion, saveVersion, maxRetries, retryDelay]);

  // 刷新页面
  const refresh = useCallback(() => {
    if (!canRefresh()) {
      console.log('刷新间隔太短，跳过');
      return;
    }

    setIsRefreshing(true);
    saveVersion(currentVersion || '');
    setHasNewContent(false);

    try {
      const u = new URL(window.location.href);
      u.searchParams.delete('page');
      const category = u.searchParams.get('category') || 'all';
      if (category === 'all') u.searchParams.delete('category');
      const qs = u.searchParams.toString();
      window.location.href = qs ? `${u.pathname}?${qs}` : u.pathname;
    } catch {
      window.location.reload();
    }
  }, [canRefresh, currentVersion, saveVersion]);

  // 清除新内容标记
  const clearNewContentFlag = useCallback(() => {
    setHasNewContent(false);
    if (currentVersion) {
      saveVersion(currentVersion);
    }
  }, [currentVersion, saveVersion]);

  // 页面加载时检查
  useEffect(() => {
    if (!enabled) return;

    // 延迟检查，避免阻塞页面渲染
    const initialCheckTimeout = setTimeout(() => {
      checkForUpdates();
    }, 1000);

    return () => clearTimeout(initialCheckTimeout);
  }, [enabled, checkForUpdates]);

  // 定时检查
  useEffect(() => {
    if (!enabled || checkInterval <= 0) return;

    const scheduleNextCheck = () => {
      checkTimeoutRef.current = setTimeout(() => {
        // 如果设置了只在可见时检查，检查页面可见性
        if (onlyWhenVisible && document.hidden) {
          scheduleNextCheck();
          return;
        }
        checkForUpdates().then(() => {
          if (isMountedRef.current) {
            scheduleNextCheck();
          }
        });
      }, checkInterval);
    };

    scheduleNextCheck();

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [enabled, checkInterval, onlyWhenVisible, checkForUpdates]);

  // 页面可见性变化时检查
  useEffect(() => {
    if (!enabled || !onlyWhenVisible) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && lastCheckedAt) {
        const elapsed = Date.now() - lastCheckedAt.getTime();
        // 如果超过检查间隔，立即检查
        if (elapsed >= checkInterval) {
          checkForUpdates();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, onlyWhenVisible, checkInterval, lastCheckedAt, checkForUpdates]);

  // 清理
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentVersion,
    hasNewContent,
    isChecking,
    isRefreshing,
    lastCheckedAt,
    error,
    checkForUpdates,
    refresh,
    clearNewContentFlag,
  };
}
