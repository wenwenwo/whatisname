// app/api/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db'; // 我们稍后会创建这个
import type { SiteInfo, CheckResult } from '@/lib/types'; // 稍后创建

import wmnData from '@/lib/wmn-data.json';

// 关键：为了 Vercel 免费版，我们只筛选部分类别
// 这是规避 10 秒超时的核心策略
const CATEGORIES_TO_CHECK = [
  "Code",
  "Social",
  "Gaming",
  "News",
  "Blog"
];

// 关键：为每个 fetch 请求设置一个积极的超时 (8 秒)
const REQUEST_TIMEOUT = 8000; // 8 秒

/**
 * 检查单个网站
 */
async function checkSite(site: SiteInfo, username: string): Promise<CheckResult> {
  const url = site.uri_check.replace("{}", username);
  const result: CheckResult = {
    siteName: site.name,
    status: 'Error', // 默认状态
    url: url,
  };

  try {
    const response = await fetch(url, {
      method: site.method || 'GET',
      headers: site.headers as HeadersInit || {},
      signal: AbortSignal.timeout(REQUEST_TIMEOUT), // 超时控制
      redirect: 'follow', // WhatsMyName 依赖于跟随重定向
    });

    // 1. 检查状态码 (最可靠)
    if (response.status === site.e_code) {
      result.status = 'Available';
      return result;
    }
    if (response.status === site.m_code) {
      result.status = 'Taken';
      return result;
    }

    // 2. 如果状态码不匹配，检查响应体内容
    const text = await response.text();

    if (site.e_string && text.includes(site.e_string)) {
      result.status = 'Available';
      return result;
    }

    if (site.m_string && text.includes(site.m_string)) {
      result.status = 'Taken';
      return result;
    }
    
    // 3. 如果都不匹配，WhatsMyName 认为这是一个“未知”状态
    // 我们将其归类为 "Error" 或 "Available" (取决于配置，这里选 Error)
    // 许多 WMN 规则依赖 e_string 来确认 "Available"
    if (response.status === 200 && !site.m_string) {
       // 如果返回 200，但没有 "m_string" 来确认，我们无法判断
       result.status = 'Error';
    } else {
       // 默认回退到 e_code 检查
       result.status = (response.status === site.e_code) ? 'Available' : 'Error';
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      result.status = 'Error'; // 标记为超时错误
    }
    // 其他网络错误也标记为 Error
  }
  return result;
}

/**
 * 主 API 路由
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');
  const category = searchParams.get('category') || 'allnoporn';

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  // --- 异步日志记录 (Fire-and-forget) ---
  // 我们不 'await' 这个，让它在后台运行
  // 这样即使用户取消请求或数据库很慢，也不会拖慢 API 响应
  (async () => {
    try {
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      // 注意：这里需要 await，但在自调用函数内部
      await sql`
        INSERT INTO query_logs (username_queried, ip_address, user_agent)
        VALUES (${username}, ${ip}, ${userAgent});
      `;
    } catch (e) {
      console.error("Failed to write log to database:", e);
    }
  })();
  // ------------------------------------------

  try {
    // 1. 获取 WMN 数据库
    const wmnDataObject: Record<string, SiteInfo> = wmnData;

    // 2. 筛选网站
    const allSites = Object.values(wmnDataObject).filter(site => site.uri_check);
    let sitesToQuery: SiteInfo[];

    if (category === 'all') {
      sitesToQuery = allSites;
    } else if (category === 'allnoporn') {
      sitesToQuery = allSites.filter(site => site.category !== 'NSFW');
    } else {
      let categoryToFilter = category;
      if (category === 'coding') {
        categoryToFilter = 'Code';
      } else if (category === 'XXNSFWXX') {
        categoryToFilter = 'NSFW';
      }
      sitesToQuery = allSites.filter(site => site.category.toLowerCase() === categoryToFilter.toLowerCase());
    }

    // 3. 并行发起所有请求
    const promises = sitesToQuery.map(site => checkSite(site, username));
    const results = await Promise.allSettled(promises);

    // 4. 聚合结果
    const finalResults = results
      .map(r => (r.status === 'fulfilled' ? r.value : null))
      .filter((r): r is CheckResult => r !== null); // 过滤掉 null

    return NextResponse.json(finalResults);

  } catch (error) {
    console.error("Error in /api/check:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
