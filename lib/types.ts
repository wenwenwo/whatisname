// lib/types.ts

// 从 wmn-data.json 来的站点信息
export interface SiteInfo {
  name: string;
  cat: string;
  uri_check: string;
  uri_pretty?: string;
  e_code: number;
  e_string: string | null;
  m_code: number;
  m_string: string | null;
  method?: string;
  headers?: Record<string, string> | null;
  // ... (json 文件中还有其他字段, 但这些是核心)
}

export interface WmnData {
  sites: SiteInfo[];
}

// 我们的 API 返回给前端的结果
export interface CheckResult {
  siteName: string;
  status: 'Available' | 'Taken' | 'Error';
  url: string;
}
