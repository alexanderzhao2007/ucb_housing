"""
Craigslist housing scraper using httpx + BeautifulSoup.
Extracts: url (full working link), address (street from detail page), price, bedrooms, bathrooms; source = craigslist.
"""

import re
import json
import time
import httpx
from bs4 import BeautifulSoup

BASE_URL = "https://sfbay.craigslist.org"
SEARCH_PATH = "/search/hhh"
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.5",
}


def build_search_url(query: str = "", offset: int = 0):
    """Full search URL, e.g. https://sfbay.craigslist.org/search/hhh?query=berkeley"""
    from urllib.parse import urlencode

    path = SEARCH_PATH.rstrip("/")
    params = {}
    if query:
        params["query"] = query
    if offset:
        params["s"] = offset
    qs = urlencode(params)
    return f"{BASE_URL}{path}?{qs}" if qs else f"{BASE_URL}{path}"


def normalize_listing_url(href: str) -> str:
    """Return full listing URL with .html so the link works."""
    if not href:
        return ""
    href = href.strip().split("#")[0]
    if href.startswith("/"):
        href = BASE_URL + href
    if not href.startswith("http"):
        return ""
    return href


def fetch_page(url: str, client=None):
    """Fetch one page; return HTML. Raises on failure."""
    if client is None:
        with httpx.Client(headers=DEFAULT_HEADERS, timeout=15.0) as c:
            r = c.get(url)
            r.raise_for_status()
            return r.text
    r = client.get(url)
    r.raise_for_status()
    return r.text


def get_listings_from_jsonld(html: str):
    """Parse JSON-LD into listing dicts (url, address, price, bedrooms, bathrooms)."""
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
        locality = addr.get("addressLocality") or ""
        region = addr.get("addressRegion") or ""
        street = addr.get("streetAddress") or ""
        address_parts = [p for p in [street, locality, region] if p]
        address = ", ".join(address_parts) if address_parts else locality or "N/A"
        bedrooms = item.get("numberOfBedrooms")
        if bedrooms is not None:
            bedrooms = str(bedrooms)
        else:
            bedrooms = "N/A"
        baths = item.get("numberOfBathroomsTotal")
        if baths is not None:
            bathrooms = str(baths)
        else:
            bathrooms = "N/A"
        listings.append({
            "url": "",
            "address": address,
            "price": "",
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
        })
    return listings


def get_listings_from_html(html: str):
    """Parse result rows into listing dicts. URLs kept full (with .html) so links work."""
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
        url = normalize_listing_url(href)
        price = (price_el.get_text(strip=True) if price_el else "").strip()
        location = (hood_el.get_text(strip=True) if hood_el else "").strip()
        address = location or title or "N/A"
        listings.append({
            "url": url,
            "address": address,
            "price": price,
            "bedrooms": "",
            "bathrooms": "N/A",
        })
    return listings


def get_listing_urls_from_html(html: str):
    """Listing detail URLs in order (full URLs with .html)."""
    soup = BeautifulSoup(html, "html.parser")
    pattern = re.compile(r"/[a-z]+/[a-z]+/d/[^/]+/\d+\.html")
    urls = []
    seen = set()
    for a in soup.find_all("a", href=True):
        h = a["href"]
        if pattern.search(h):
            full = normalize_listing_url(BASE_URL + h if not h.startswith("http") else h)
            if full and full not in seen:
                seen.add(full)
                urls.append(full)
    return urls


def get_prices_from_html(html: str):
    """Price strings in order (e.g. '$2,295')."""
    soup = BeautifulSoup(html, "html.parser")
    els = soup.select("div.price") or soup.select("span.result-price")
    return [el.get_text(strip=True) for el in els]


def extract_address_from_detail(html: str) -> str | None:
    """
    Extract street address from a Craigslist listing detail page.
    Tries: mapaddress, JSON-LD address, attrgroup "address", posting body.
    """
    soup = BeautifulSoup(html, "html.parser")
    # Craigslist: address often in .mapaddress or near #map
    addr_el = (
        soup.select_one(".mapaddress") or
        soup.select_one("[class*='mapaddress']") or
        soup.select_one("div.address")
    )
    if addr_el:
        text = addr_el.get_text(strip=True)
        if text and len(text) > 5:
            return text
    map_el = soup.select_one("#map")
    if map_el and map_el.find_previous_sibling():
        text = map_el.find_previous_sibling().get_text(strip=True)
        if text and len(text) > 5:
            return text
    # JSON-LD on detail page
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            if isinstance(data, dict):
                addr = data.get("address") or (data.get("itemReviewed") or {}).get("address")
                if isinstance(addr, dict):
                    street = addr.get("streetAddress") or ""
                    locality = addr.get("addressLocality") or ""
                    region = addr.get("addressRegion") or ""
                    if street:
                        return ", ".join([p for p in [street, locality, region] if p])
                if isinstance(addr, str) and len(addr) > 5:
                    return addr
        except (json.JSONDecodeError, TypeError):
            continue
    # Attrgroup: "address: 123 Main St"
    for attr in soup.select(".attrgroup span"):
        t = attr.get_text(strip=True).lower()
        if t.startswith("address:") or t.startswith("address :"):
            val = attr.get_text(strip=True).split(":", 1)[-1].strip()
            if len(val) > 5:
                return val
    # Look for a pattern like "123 Main St" or "123 Main Street" in the posting body
    body = soup.select_one("#postingbody") or soup.select_one(".posting-body")
    if body:
        text = body.get_text()
        # Match common street pattern (number + name + St/Ave/Blvd/etc.)
        m = re.search(r"\b(\d+[\w\s]+(?:Street|St|Avenue|Ave|Blvd|Boulevard|Way|Drive|Dr|Road|Rd|Lane|Ln|Court|Ct|Place|Pl)\b[^.]*?)(?:\s*,|\s*$|\.)", text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def fetch_address_for_listing(listing_url: str, client: httpx.Client) -> str | None:
    """Fetch listing detail page and return street address, or None."""
    try:
        r = client.get(listing_url, timeout=12.0)
        r.raise_for_status()
        return extract_address_from_detail(r.text)
    except Exception:
        return None


def parse_listings(html: str):
    """One search page -> list of listing dicts with url (full .html link), address, price, bedrooms, bathrooms."""
    from_html = get_listings_from_html(html)
    if from_html:
        return _normalize_listings(from_html)
    from_json = get_listings_from_jsonld(html)
    urls = get_listing_urls_from_html(html)
    prices = get_prices_from_html(html)
    for i, row in enumerate(from_json):
        if i < len(urls):
            row["url"] = urls[i]
        if i < len(prices):
            row["price"] = (prices[i] or "").strip()
    return _normalize_listings(from_json)


def _normalize_listings(listings: list[dict]) -> list[dict]:
    """Ensure url, address, price, bedrooms NOT NULL; bathrooms N/A if missing."""
    out = []
    for r in listings:
        url = (r.get("url") or "").strip()
        address = (r.get("address") or "").strip() or "N/A"
        price = (r.get("price") or "").strip() or "N/A"
        bedrooms = (r.get("bedrooms") or "").strip()
        if not bedrooms:
            bedrooms = "N/A"
        bathrooms = (r.get("bathrooms") or "").strip() or "N/A"
        if not url:
            continue
        out.append({
            "url": url,
            "address": address,
            "price": price,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "source": "craigslist",
        })
    return out


def search(
    query: str = "berkeley",
    offset: int = 0,
    delay_seconds: float = 0,
    fetch_addresses: bool = True,
    detail_delay_seconds: float = 1.0,
    max_detail_fetches: int = 50,
):
    """
    Run one housing search and return normalized listings.
    If fetch_addresses is True, fetches each listing's detail page to get street address (slower).
    """
    url = build_search_url(query=query, offset=offset)
    time.sleep(delay_seconds)
    html = fetch_page(url)
    listings = parse_listings(html)
    if not fetch_addresses or not listings:
        return listings
    with httpx.Client(headers=DEFAULT_HEADERS, timeout=15.0) as client:
        for i, listing in enumerate(listings):
            if i >= max_detail_fetches:
                break
            if i > 0:
                time.sleep(detail_delay_seconds)
            detail_addr = fetch_address_for_listing(listing["url"], client)
            if detail_addr:
                listing["address"] = detail_addr
    return listings


def _listing_to_row(r: dict) -> dict:
    """Map one scraped listing to Supabase row: url, address, price, bedrooms, bathrooms, source."""
    return {
        "url": (r.get("url") or "").strip()[:2048],
        "address": (r.get("address") or "N/A").strip()[:1024],
        "price": (r.get("price") or "N/A").strip()[:255],
        "bedrooms": (r.get("bedrooms") or "N/A").strip()[:50],
        "bathrooms": (r.get("bathrooms") or "N/A").strip()[:50],
        "source": "craigslist",
    }


def save_listings_to_supabase(listings: list[dict], table: str = "listings") -> int:
    """
    Upsert listings into Supabase. Uses url as unique key.
    Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).
    Returns number of rows upserted. Skips rows with empty url.
    """
    import os
    from supabase import create_client

    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("SUPABASE_ANON_KEY")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )
    if not url or not key:
        raise RuntimeError(
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in the environment"
        )
    client = create_client(url, key)
    rows = [_listing_to_row(r) for r in listings if (r.get("url") or "").strip()]
    if not rows:
        return 0
    chunk_size = 100
    total = 0
    for i in range(0, len(rows), chunk_size):
        chunk = rows[i : i + chunk_size]
        try:
            client.table(table).upsert(chunk, on_conflict="url").execute()
            total += len(chunk)
        except Exception as e:
            if total == 0:
                print(f"Upsert error (first chunk): {e}")
                print(f"Sample row: {chunk[0] if chunk else 'empty'}")
            raise
    return total


def run_pipeline(
    query: str = "berkeley",
    save: bool = True,
    fetch_addresses: bool = True,
    detail_delay_seconds: float = 1.0,
    max_detail_fetches: int = 50,
):
    """Scrape one page, optionally fetch street addresses from detail pages, then upsert. Returns (results, saved_count)."""
    results = search(
        query=query,
        delay_seconds=0,
        fetch_addresses=fetch_addresses,
        detail_delay_seconds=detail_delay_seconds,
        max_detail_fetches=max_detail_fetches,
    )
    saved = 0
    if save and results:
        try:
            saved = save_listings_to_supabase(results)
        except Exception as e:
            print(f"Supabase save failed: {e}")
    return results, saved


if __name__ == "__main__":
    import os
    import sys

    try:
        from pathlib import Path
        from dotenv import load_dotenv
        scrapers_dir = Path(__file__).resolve().parent
        load_dotenv(scrapers_dir / ".env")
        load_dotenv(scrapers_dir.parent / ".env.local")
        load_dotenv(scrapers_dir.parent / ".env")
    except ImportError:
        pass

    save = "--no-save" not in sys.argv
    fetch_addresses = "--no-address-fetch" not in sys.argv
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: python scraper.py [--no-save] [--no-address-fetch]")
        print("  Scrapes Craigslist housing for 'berkeley'; fetches each listing's page for street address; upserts to Supabase.")
        print("  Use --no-save to only scrape and print.")
        print("  Use --no-address-fetch to skip fetching detail pages (faster, addresses will be neighborhood only e.g. Berkeley, CA).")
        sys.exit(0)

    results, saved = run_pipeline(query="berkeley", save=save, fetch_addresses=fetch_addresses)
    print(f"Parsed {len(results)} listings")
    if save and saved:
        print(f"Supabase: upserted {saved} rows into table 'listings'.")
    for i, r in enumerate(results[:5], 1):
        print(f"{i}. {r.get('price', '')} | {r.get('address', '')[:55]}...")
        print(f"   {r.get('url', '')} | beds: {r.get('bedrooms')} | baths: {r.get('bathrooms')}")
