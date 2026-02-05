"""
Craigslist housing scraper using httpx + BeautifulSoup.
Prefers embedded JSON-LD data when present; falls back to HTML parsing.
"""

import json
import httpx
from bs4 import BeautifulSoup

# Where we're asking for data (Craigslist SF Bay Area, housing section)
BASE_URL = "https://sfbay.craigslist.org"
SEARCH_PATH = "/search/hhh"
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.5",
}


def build_search_url(query: str = "", offset: int = 0):
    """
    Returns one string: the full URL, e.g.
    https://sfbay.craigslist.org/search/hhh?query=berkeley
    """
    from urllib.parse import urlencode

    path = SEARCH_PATH.rstrip("/")
    params = {}
    if query:
        params["query"] = query
    if offset:
        params["s"] = offset
    qs = urlencode(params)
    return f"{BASE_URL}{path}?{qs}" if qs else f"{BASE_URL}{path}"


def fetch_page(url: str, client=None):
    """
    Asks for one webpage and return its text (the HTML).
    Returns the page body as a string. Raises if the request fails (e.g. 404).
    """
    if client is None:
        with httpx.Client(headers=DEFAULT_HEADERS, timeout=15.0) as c:
            r = c.get(url)
            r.raise_for_status()
            return r.text
    r = client.get(url)
    r.raise_for_status()
    return r.text


def get_listings_from_jsonld(html: str):
    """
    Try to get listing data from the "hidden" JSON inside the page (JSON-LD).

    Craigslist’s search page is HTML, but inside that HTML they put a
    <script> tag with id="ld_searchpage_results" that contains the same
    listings as JSON — like a tidy list the site uses for search engines.
    This function finds that script, reads the JSON, and turns it into
    a list of listing dicts (title, location, bedrooms, bathrooms).
    It does NOT get URL or price (those come from the HTML). Returns []
    if the script is missing or the JSON is invalid.
    """
    soup = BeautifulSoup(html, "html.parser")
    script = soup.find("script", type="application/ld+json", id="ld_searchpage_results")
    if not script or not script.string:
        return []
    try:
        data = json.loads(script.string)
    except json.JSONDecodeError:
        return []
    items = data.get("itemListElement") or []
    listings = []
    for el in items:
        item = el.get("item") or {}
        addr = item.get("address") or {}
        listings.append({
            "title": item.get("name") or "",
            "location": addr.get("addressLocality") or "",
            "bedrooms": item.get("numberOfBedrooms"),
            "bathrooms": item.get("numberOfBathroomsTotal"),
            "price": "",
            "url": "",
        })
    return listings


def get_listings_from_html(html: str):
    """
    Get listings by reading the visible HTML structure (BeautifulSoup).

    When the JSON-LD block is missing or we need URLs/prices, we use this:
    we parse the HTML and look for the same things a human sees — each
    listing row (.result-row), the title link, the price, the neighborhood.
    We use CSS-style selectors to find those elements and pull their text
    or href. Returns a list of dicts with title, url, price, location.
    Returns [] if the page doesn't use .result-row (then caller can merge
    JSON-LD with URLs/prices from get_listing_urls_from_html and get_prices_from_html).
    """
    soup = BeautifulSoup(html, "html.parser")
    rows = soup.select(".result-row")
    if not rows:
        return []
    listings = []
    for row in rows:
        link_el = row.select_one("a.result-title")
        price_el = row.select_one("span.result-price") or row.select_one("div.price")
        hood_el = row.select_one(".result-hood")
        title = link_el.get_text(strip=True) if link_el else ""
        href = link_el.get("href", "") if link_el else ""
        if href and not href.startswith("http"):
            href = BASE_URL + href
        price = price_el.get_text(strip=True) if price_el else ""
        location = hood_el.get_text(strip=True) if hood_el else ""
        listings.append({
            "title": title,
            "url": href,
            "price": price,
            "location": location,
            "bedrooms": "",
            "bathrooms": "",
        })
    return listings


def get_listing_urls_from_html(html: str):
    """
    Get the list of listing detail URLs from the page, in order.

    We look for links that look like a Craigslist listing page
    (e.g. /eby/apa/d/berkeley/1234567890.html) and collect them in
    the order they appear. Used to attach URLs to JSON-LD listings
    when we don't have .result-row.
    """
    import re
    soup = BeautifulSoup(html, "html.parser")
    pattern = re.compile(r"/[a-z]+/[a-z]+/d/[^/]+/\d+\.html")
    urls = []
    seen = set()
    for a in soup.find_all("a", href=True):
        h = a["href"]
        if pattern.search(h) and h not in seen:
            seen.add(h)
            urls.append(BASE_URL + h if not h.startswith("http") else h)
    return urls


def get_prices_from_html(html: str):
    """
    Get the list of price strings from the page, in order (e.g. "$2,295").

    Craigslist shows price in div.price or span.result-price. We collect
    all of them in document order so we can match them to listings by
    index when merging with JSON-LD.
    """
    soup = BeautifulSoup(html, "html.parser")
    els = soup.select("div.price") or soup.select("span.result-price")
    return [el.get_text(strip=True) for el in els]


def parse_listings(html: str):
    """
    Get all listings from one search page: prefer backend-like data, fall back to HTML.

    Step 1: Try get_listings_from_html. If the page has .result-row, we get
    full dicts (title, url, price, location) and return them.
    Step 2: If not, try get_listings_from_jsonld to get title, location,
    bedrooms, bathrooms from the embedded JSON. Then get_listing_urls_from_html
    and get_prices_from_html and attach URL and price to each listing by
    index (first listing gets first URL and first price). Returns one list
    of dicts with title, url, price, location, bedrooms, bathrooms.
    """
    from_html = get_listings_from_html(html)
    if from_html:
        return from_html
    from_json = get_listings_from_jsonld(html)
    urls = get_listing_urls_from_html(html)
    prices = get_prices_from_html(html)
    for i, row in enumerate(from_json):
        if i < len(urls):
            row["url"] = urls[i]
        if i < len(prices):
            row["price"] = prices[i]
    return from_json


def search(query: str = "berkeley", offset: int = 0, delay_seconds: float = 0):
    """
    Run one housing search: build URL, fetch the page, parse listings, return them.

    This is the "do it all" helper: we build the search URL with build_search_url,
    wait delay_seconds (to be nice to the server), fetch the page with fetch_page,
    then turn the HTML into a list of listing dicts with parse_listings.
    Returns that list. Use delay_seconds > 0 when calling many times (e.g. pagination).
    """
    import time
    url = build_search_url(query=query, offset=offset)
    time.sleep(delay_seconds)
    html = fetch_page(url)
    return parse_listings(html)


if __name__ == "__main__":
    results = search(query="berkeley", delay_seconds=0)
    print(f"Parsed {len(results)} listings")
    for i, r in enumerate(results[:5], 1):
        title = (r.get("title") or "")[:55]
        print(f"{i}. {r.get('price', '')} | {title}...")
        print(f"   {r.get('url', '')}")
