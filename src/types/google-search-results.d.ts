declare module 'google-search-results-nodejs' {
  interface SearchOptions {
    engine: string;
    q: string;
    api_key: string;
    hl?: string;
    gl?: string;
    num?: number;
  }

  interface OrganicResult {
    title: string;
    link: string;
    snippet: string;
    date?: string;
  }

  interface SearchResponse {
    organic_results?: OrganicResult[];
    error?: string;
  }

  export function getJson(
    options: SearchOptions,
    callback: (result: SearchResponse) => void
  ): void;
}