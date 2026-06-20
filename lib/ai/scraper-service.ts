import * as cheerio from 'cheerio';

export async function scrapeUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unnecessary elements to clean up text
    $('script, style, nav, footer, header, iframe, noscript, svg, path, button').remove();

    // Extract text and condense whitespace
    let text = $('body').text();
    text = text.replace(/\s+/g, ' ').trim();

    return text.substring(0, 15000); // Limit to ~15k characters to fit context limits nicely
  } catch (error) {
    console.error(`Error scraping URL ${url}:`, error);
    return `Error scraping ${url}`;
  }
}

export async function gatherProductContext(
  productName: string,
  officialUrl?: string,
  competitorUrls: string[] = []
): Promise<string> {
  let context = `Product Name: ${productName}\n\n`;

  if (officialUrl) {
    const officialContent = await scrapeUrlContent(officialUrl);
    context += `=== OFFICIAL SOURCE (${officialUrl}) ===\n${officialContent}\n\n`;
  }

  for (const url of competitorUrls) {
    if (!url) continue;
    const content = await scrapeUrlContent(url);
    context += `=== COMPETITOR SOURCE (${url}) ===\n${content}\n\n`;
  }

  return context;
}
