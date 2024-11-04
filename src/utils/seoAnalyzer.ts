import axios from 'axios';
import * as cheerio from 'cheerio';

interface SeoAnalysisResult {
  metaScore: number;
  metaIssues: string[];
  contentScore: number;
  contentIssues: string[];
  performanceScore: number;
  performanceIssues: string[];
}

const PROXY_SERVICES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

async function fetchWithFallback(url: string): Promise<string> {
  let lastError: Error | null = null;

  for (const proxyService of PROXY_SERVICES) {
    try {
      const proxyUrl = proxyService(url);
      const response = await axios.get(proxyUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxContentLength: 10 * 1024 * 1024 // 10MB max
      });

      if (response.data) {
        return response.data;
      }
    } catch (error) {
      lastError = error as Error;
      continue; // Try next proxy
    }
  }

  throw lastError || new Error('All proxy services failed');
}

export async function analyzeSeo(url: string): Promise<SeoAnalysisResult> {
  try {
    const html = await fetchWithFallback(url);
    const $ = cheerio.load(html);

    // Meta Tags Analysis
    const metaIssues: string[] = [];
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content')?.trim();
    const keywords = $('meta[name="keywords"]').attr('content')?.trim();
    const robots = $('meta[name="robots"]').attr('content')?.trim();
    const canonical = $('link[rel="canonical"]').attr('href')?.trim();
    const viewport = $('meta[name="viewport"]').attr('content')?.trim();
    const charset = $('meta[charset]').attr('charset')?.trim();
    const ogTags = $('meta[property^="og:"]');
    const twitterTags = $('meta[name^="twitter:"]');

    if (!title) metaIssues.push('Missing title tag');
    else if (title.length < 30) metaIssues.push('Title is too short (should be at least 30 characters)');
    else if (title.length > 60) metaIssues.push('Title is too long (should be less than 60 characters)');

    if (!description) metaIssues.push('Missing meta description');
    else if (description.length < 120) metaIssues.push('Meta description is too short (should be at least 120 characters)');
    else if (description.length > 160) metaIssues.push('Meta description is too long (should be less than 160 characters)');

    if (!keywords) metaIssues.push('Missing meta keywords');
    if (!robots) metaIssues.push('Missing robots meta tag');
    if (!canonical) metaIssues.push('Missing canonical URL');
    if (!viewport) metaIssues.push('Missing viewport meta tag');
    if (!charset) metaIssues.push('Missing charset meta tag');
    if (ogTags.length === 0) metaIssues.push('Missing Open Graph tags');
    if (twitterTags.length === 0) metaIssues.push('Missing Twitter Card tags');

    // Content Analysis
    const contentIssues: string[] = [];
    const h1Elements = $('h1');
    const h1Count = h1Elements.length;
    const images = $('img');
    const links = $('a');
    const paragraphs = $('p');
    const wordCount = $('body').text().trim().split(/\s+/).length;
    const headings = $('h1, h2, h3, h4, h5, h6');
    const lists = $('ul, ol');
    const tables = $('table');
    const iframes = $('iframe');

    if (h1Count === 0) contentIssues.push('Missing H1 heading');
    if (h1Count > 1) contentIssues.push('Multiple H1 headings detected (should have exactly one)');

    const imagesWithoutAlt = images.filter((_, el) => !$(el).attr('alt')).length;
    if (imagesWithoutAlt > 0) {
      contentIssues.push(`${imagesWithoutAlt} images missing alt text`);
    }

    const externalLinks = links.filter((_, el) => {
      const href = $(el).attr('href') || '';
      return href.startsWith('http') && !href.includes(url);
    }).length;

    if (externalLinks === 0) {
      contentIssues.push('No external links found (consider adding relevant outbound links)');
    }

    if (wordCount < 300) {
      contentIssues.push('Content length is too short (should be at least 300 words)');
    }

    if (paragraphs.length < 3) {
      contentIssues.push('Too few paragraphs (should have at least 3 paragraphs)');
    }

    if (headings.length < 2) {
      contentIssues.push('Too few headings (should use proper heading hierarchy)');
    }

    if (lists.length === 0) {
      contentIssues.push('No lists found (consider using bullet points or numbered lists)');
    }

    if (tables.length === 0) {
      contentIssues.push('No tables found (consider using tables for structured data)');
    }

    // Performance Analysis
    const performanceIssues: string[] = [];
    const cssFiles = $('link[rel="stylesheet"]');
    const jsFiles = $('script[src]');
    const inlineStyles = $('[style]');
    const inlineScripts = $('script:not([src])');
    const largeImages = images.filter((_, el) => {
      const src = $(el).attr('src') || '';
      return src.endsWith('.jpg') || src.endsWith('.png') || src.endsWith('.gif');
    });

    if (cssFiles.length > 5) {
      performanceIssues.push(`High number of CSS files (${cssFiles.length} found, recommend combining)`);
    }

    if (jsFiles.length > 10) {
      performanceIssues.push(`High number of JavaScript files (${jsFiles.length} found, recommend combining)`);
    }

    if (inlineStyles.length > 5) {
      performanceIssues.push(`${inlineStyles.length} inline styles found (recommend using external CSS)`);
    }

    if (inlineScripts.length > 5) {
      performanceIssues.push(`${inlineScripts.length} inline scripts found (recommend using external JS files)`);
    }

    if (largeImages.length > 10) {
      performanceIssues.push(`${largeImages.length} large images found (recommend optimizing)`);
    }

    if (iframes.length > 2) {
      performanceIssues.push(`${iframes.length} iframes found (consider reducing for better performance)`);
    }

    // Calculate Scores
    const metaScore = Math.max(0, 100 - (metaIssues.length * 10));
    const contentScore = Math.max(0, 100 - (contentIssues.length * 8));
    const performanceScore = Math.max(0, 100 - (performanceIssues.length * 8));

    return {
      metaScore,
      metaIssues,
      contentScore,
      contentIssues,
      performanceScore,
      performanceIssues,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again or check if the website is accessible.');
      }
      if (error.response?.status === 404) {
        throw new Error('Website not found. Please check if the URL is correct.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. The website might be blocking automated requests.');
      }
      throw new Error(`Unable to analyze website: ${error.message}`);
    }
    throw new Error('Failed to analyze website. Please check your internet connection and try again.');
  }
}