'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface CareerCategoryStatus {
  version: string;
  latestPublishedAt: string | null;
  totalContents: number;
  category: string;
  timestamp: number;
}

interface UseCareerCategoryRefreshOptions {
  /** 分类ID */
  category: string;
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
  /** 弱网环境下的超时时间（毫秒），默认 15000 */
  weakNetworkTimeout?: number;
}

interface UseCareerCategoryRefreshResult {
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
  /** 新内容数量估算 */
  newContentCount: number;
  /** 错误信息 */
  error: string | null;
  /** 网络状态 */
  networkStatus: 'online' | 'offline' | 'weak';
  /** 手动检查更新 */
  checkForUpdates: () => Promise<void>;
  /** 刷新页面内容 */
  refresh: () => void;
  /** 清除新内容标记 */
  clearNewContentFlag: () => void;
  /** 重试 */
  retry: () => void;
}

const getStorageKey = (category: string) => `pm-hub-career-${category}-version`;
const getLastRefreshKey = (category: string) => `pm-hub-career-${category}-last-refresh`;
const getContentCountKey = (category: string) => `pm-hub-career-${category}-count`;

export function useCareerCategoryRefresh(
  options: UseCareerCategoryRefreshOptions
): UseCareerCategoryRefreshResult {
  const {
    category,
    checkInterval = 60000,
    enabled = true,
    minRefreshInterval = 30000,
    maxRetries = 3,
    retryDelay = 5000,
    onlyWhenVisible = true,
    weakNetworkTimeout = 15000,
  } = options;

  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [hasNewContent, setHasNewContent] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [newContentCount, setNewContentCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'weak'>('online');

  const retryCountRef = useRef(0);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const lastTotalRef = useRef<number>(0);

  // 从 localStorage 获取上次保存的版本
  const getStoredVersion = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(getStorageKey(category));
    } catch {
      return null;
    }
  }, [category]);

  // 从 localStorage 获取上次保存的内容数量
  const getStoredCount = useCallback((): number => {
    if (typeof window === 'undefined') return 0;
    try {
      const count = localStorage.getItem(getContentCountKey(category));
      return count ? parseInt(count, 10) : 0;
    } catch {
      return 0;
    }
  }, [category]);

  // 保存版本到 localStorage
  const saveVersion = useCallback((version: string, totalCount: number) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(getStorageKey(category), version);
      localStorage.setItem(getContentCountKey(category), totalCount.toString());
      localStorage.setItem(getLastRefreshKey(category), Date.now().toString());
    } catch {
      // ignore
    }
  }, [category]);

  // 检查是否可以刷新（避免频繁刷新）
  const canRefresh = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const lastRefresh = localStorage.getItem(getLastRefreshKey(category));
      if (lastRefresh) {
        const elapsed = Date.now() - parseInt(lastRefresh, 10);
        return elapsed >= minRefreshInterval;
      }
      return true;
    } catch {
      return true;
    }
  }, [category, minRefreshInterval]);

  // 检测网络状态
  const detectNetworkStatus = useCallback((): 'online' | 'offline' | 'weak' => {
    if (typeof navigator === 'undefined') return 'online';
    if (!navigator.onLine) return 'offline';
    
    // 检测弱网环境（通过 connection API）
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === '2g' || effectiveType === 'slow-2g') {
        return 'weak';
      }
    }
    return 'online';
  }, []);

  // 获取最新内容状态
  const fetchStatus = useCallback(async (): Promise<CareerCategoryStatus | null> => {
    const currentNetworkStatus = detectNetworkStatus();
    setNetworkStatus(currentNetworkStatus);

    if (currentNetworkStatus === 'offline') {
      throw new Error('网络已断开，请检查网络连接');
    }

    const timeout = currentNetworkStatus === 'weak' ? weakNetworkTimeout : 10000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`/api/career/status?category=${category}`, {
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
        throw new Error('请求超时，请检查网络环境');
      }
      throw err;
    }
  }, [category, detectNetworkStatus, weakNetworkTimeout]);

  // 检查更新
  const checkForUpdates = useCallback(async function checkForUpdatesInner() {
    if (!enabled || isChecking || !category) return;

    setIsChecking(true);
    setError(null);

    try {
      const status = await fetchStatus();
      if (!status || !isMountedRef.current) return;

      setLastCheckedAt(new Date());
      retryCountRef.current = 0; // 重置重试计数

      const storedVersion = getStoredVersion();
      const newVersion = status.version;
      const storedCount = getStoredCount();
      const newCount = status.totalContents;

      // 首次加载，保存版本但不提示
      if (!storedVersion) {
        setCurrentVersion(newVersion);
        saveVersion(newVersion, newCount);
        lastTotalRef.current = newCount;
        return;
      }

      setCurrentVersion(newVersion);

      // 版本不同或数量增加，说明有新内容
      if (newVersion !== storedVersion || newCount > storedCount) {
        setHasNewContent(true);
        setNewContentCount(Math.max(0, newCount - storedCount));
      }

      lastTotalRef.current = newCount;
    } catch (err) {
      const message = err instanceof Error ? err.message : '检查更新失败';
      console.error('Career category refresh check failed:', message);

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
  }, [enabled, isChecking, category, fetchStatus, getStoredVersion, getStoredCount, saveVersion, maxRetries, retryDelay]);

  // 刷新页面
  const refresh = useCallback(() => {
    if (!canRefresh()) {
      console.log('刷新间隔太短，跳过');
      return;
    }

    setIsRefreshing(true);
    saveVersion(currentVersion || '', lastTotalRef.current);
    setHasNewContent(false);
    setNewContentCount(0);

    // 使用 location.reload 刷新页面
    window.location.reload();
  }, [canRefresh, currentVersion, saveVersion]);

  // 清除新内容标记
  const clearNewContentFlag = useCallback(() => {
    setHasNewContent(false);
    setNewContentCount(0);
    setError(null);
    if (currentVersion) {
      saveVersion(currentVersion, lastTotalRef.current);
    }
  }, [currentVersion, saveVersion]);

  // 重试
  const retry = useCallback(() => {
    retryCountRef.current = 0;
    setError(null);
    checkForUpdates();
  }, [checkForUpdates]);

  // 监听网络状态变化
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online');
      // 网络恢复时自动检查
      if (enabled && !isChecking) {
        checkForUpdates();
      }
    };

    const handleOffline = () => {
      setNetworkStatus('offline');
      setError('网络已断开');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, isChecking, checkForUpdates]);

  // 页面加载时检查
  useEffect(() => {
    if (!enabled || !category) return;

    // 延迟检查，避免阻塞页面渲染
    const initialCheckTimeout = setTimeout(() => {
      checkForUpdates();
    }, 1000);

    return () => clearTimeout(initialCheckTimeout);
  }, [enabled, category, checkForUpdates]);

  // 定时检查
  useEffect(() => {
    if (!enabled || checkInterval <= 0 || !category) return;

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
  }, [enabled, checkInterval, onlyWhenVisible, category, checkForUpdates]);

  // 页面可见性变化时检查
  useEffect(() => {
    if (!enabled || !onlyWhenVisible || !category) return;

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
  }, [enabled, onlyWhenVisible, checkInterval, lastCheckedAt, category, checkForUpdates]);

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
    newContentCount,
    error,
    networkStatus,
    checkForUpdates,
    refresh,
    clearNewContentFlag,
    retry,
  };
}
