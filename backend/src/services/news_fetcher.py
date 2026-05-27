import httpx
from typing import List
from src.config import config


async def fetch_articles(queries: List[str], event_name: str) -> List[dict]:
    """
    Try NewsAPI first, fall back to Serper.
    Returns a list of {title, description, url, published_at} dicts.
    """
    articles = []

    if config.NEWS_API_KEY:
        articles = await _fetch_newsapi(queries)

    # Supplement with Serper if NewsAPI returned too little
    if len(articles) < 3 and config.SERPER_API_KEY:
        serper_results = await _fetch_serper(queries, event_name)
        articles.extend(serper_results)

    # Deduplicate by URL
    seen = set()
    unique = []
    for a in articles:
        if a["url"] not in seen:
            seen.add(a["url"])
            unique.append(a)

    return unique[:10]  # Cap at 10 articles per run


async def _fetch_newsapi(queries: List[str]) -> List[dict]:
    articles = []
    async with httpx.AsyncClient(timeout=10) as client:
        for query in queries[:3]:  # Max 3 queries to stay within rate limits
            try:
                resp = await client.get(
                    "https://newsapi.org/v2/everything",
                    params={
                        "q": query,
                        "sortBy": "publishedAt",
                        "pageSize": 5,
                        "language": "en",
                        "apiKey": config.NEWS_API_KEY,
                    }
                )
                data = resp.json()
                for article in data.get("articles", []):
                    if article.get("title") and article.get("description"):
                        articles.append({
                            "title": article["title"],
                            "description": article["description"],
                            "url": article["url"],
                            "published_at": article.get("publishedAt", ""),
                            "source": "newsapi",
                        })
            except Exception as e:
                print(f"NewsAPI error for query '{query}': {e}")

    return articles


async def _fetch_serper(queries: List[str], event_name: str) -> List[dict]:
    articles = []
    async with httpx.AsyncClient(timeout=10) as client:
        for query in queries[:2]:
            try:
                resp = await client.post(
                    "https://google.serper.dev/news",
                    headers={"X-API-KEY": config.SERPER_API_KEY},
                    json={"q": query, "num": 5}
                )
                data = resp.json()
                for item in data.get("news", []):
                    articles.append({
                        "title": item.get("title", ""),
                        "description": item.get("snippet", ""),
                        "url": item.get("link", ""),
                        "published_at": item.get("date", ""),
                        "source": "serper",
                    })
            except Exception as e:
                print(f"Serper error for query '{query}': {e}")

    return articles