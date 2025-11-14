// app/api/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { log, LogLevel } from '@/lib/logger';
import type { SiteInfo, CheckResult, WmnData } from '@/lib/types';
import wmnData from '@/lib/wmn-data.json';

const REQUEST_TIMEOUT = 8000; // 8 秒

async function checkSite(site: SiteInfo, username: string): Promise<CheckResult> {
  const checkUrl = site.uri_check.replace("{account}", username);
  const profileUrl = site.uri_pretty ? site.uri_pretty.replace("{account}", username) : checkUrl;

  const result: CheckResult = {
    siteName: site.name,
    status: 'Error', // 默认状态
    url: profileUrl, // Use profileUrl for the link
  };
  console.log(`[checkSite] Checking ${site.name} for username ${username} at ${checkUrl}`);

  try {
    const response = await fetch(checkUrl, {
      method: site.method || 'GET',
      headers: site.headers as HeadersInit || {},
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      redirect: 'follow',
    });

    if (response.status === site.e_code) {
      result.status = 'Available';
      console.log(`[checkSite] ${site.name} - Available (e_code)`);
      return result;
    }
    if (response.status === site.m_code) {
      result.status = 'Taken';
      console.log(`[checkSite] ${site.name} - Taken (m_code)`);
      return result;
    }

    const text = await response.text();

    if (site.e_string && text.includes(site.e_string)) {
      result.status = 'Available';
      console.log(`[checkSite] ${site.name} - Available (e_string)`);
      return result;
    }

    if (site.m_string && text.includes(site.m_string)) {
      result.status = 'Taken';
      console.log(`[checkSite] ${site.name} - Taken (m_string)`);
      return result;
    }
    
    if (response.status === 200 && !site.m_string) {
       result.status = 'Error';
       console.log(`[checkSite] ${site.name} - Error (200 but no m_string)`);
    } else {
       result.status = (response.status === site.e_code) ? 'Available' : 'Error';
       console.log(`[checkSite] ${site.name} - ${result.status} (fallback)`);
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      result.status = 'Error';
      console.log(`[checkSite] ${site.name} - Error (Timeout)`);
    } else {
      console.error(`[checkSite] ${site.name} - Error: ${error}`);
    }
  }
  return result;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');
  const category = searchParams.get('category') || 'allnoporn';

  log(LogLevel.INFO, `Request for username: ${username}`, { category });

  console.log(`[API] Received request for username: ${username}, category: ${category}`);

  if (!username) {
    console.log('[API] Username is missing.');
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  (async () => {
    try {
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      const sql = `
        INSERT INTO query_logs (username_queried, ip_address, user_agent)
        VALUES ($1, $2, $3)
      `;
      console.log('Logging to query_logs with params:', [username, ip, userAgent]);
      await query(sql, [username, ip, userAgent]);

      console.log(`[API] Logged query for username: ${username}`);
    } catch (e) {
      console.error("[API] Failed to write log to database:", e);
    }
  })();

  try {
    const wmnDataObject: WmnData = wmnData as WmnData;

    const allSites = wmnDataObject.sites.filter(site => site.uri_check);
    console.log(`[API] Total sites in WMN database: ${allSites.length}`);
    let sitesToQuery: SiteInfo[];

    if (category === 'all') {
      sitesToQuery = allSites;
    } else if (category === 'allnoporn') {
      sitesToQuery = allSites.filter(site => site.cat !== 'NSFW');
    } else {
      let categoryToFilter = category;
      if (category === 'coding') {
        categoryToFilter = 'Code';
      } else if (category === 'XXNSFWXX') {
        categoryToFilter = 'NSFW';
      }
      sitesToQuery = allSites.filter(site => site.cat.toLowerCase() === categoryToFilter.toLowerCase());
    }
    console.log(`[API] Sites to query after filtering by category '${category}': ${sitesToQuery.length}`);

    const promises = sitesToQuery.map(site => checkSite(site, username));
    const results = await Promise.allSettled(promises);

    const finalResults = results
      .map(r => (r.status === 'fulfilled' ? r.value : null))
      .filter((r): r is CheckResult => r !== null);
    
    console.log(`[API] Final results for ${username}:`, finalResults);

    return NextResponse.json(finalResults);

  } catch (error) {
    console.error("[API] Error in /api/check:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}