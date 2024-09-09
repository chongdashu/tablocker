export interface BlockedSite {
  pattern: string;
  createdAt: string;
}

export interface TabStats {
  blocked: number;
  allowed: number;
}

export interface Settings {
  enableNotifications: boolean;
}
