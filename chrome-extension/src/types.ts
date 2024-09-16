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
