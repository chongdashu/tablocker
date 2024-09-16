export interface BlockedSite {
  pattern: string;
  createdAt: string;
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
