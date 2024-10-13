export interface BlockedSite {
  pattern: string;
  created_at: string;
}

export interface TabStats {
  blocked: number;
}

export interface Settings {
  enableBadges: boolean;
}

export interface DailyStats {
  blocked: number;
}

export interface BlockedPattern {
  [pattern: string]: {
    count: number;
    lastBlocked: string;
  };
}

export interface BlockedDetail {
  url: string;
  pattern: string;
  timestamp: string;
}

export interface SyncBlockedPatternsResponse {
  success: boolean;
  blocked_patterns: BlockedSite[];
}

export interface UserStats {
  total_tabs_blocked: number;
  last_updated: string;
}

export interface DailyStat {
  date: string;
  tabs_blocked: number;
}

export interface BlockedPatternStat {
  pattern: string;
  count: number;
}

export interface SyncStatsRequest {
  user_stats: UserStats;
  daily_stats: DailyStat[];
  blocked_pattern_stats: BlockedPatternStat[];
}

export interface SyncStatsResponse {
  success: boolean;
  message: string;
}

export interface BlockingHistoryRequest {
  blocking_history: BlockedDetail[];
}
