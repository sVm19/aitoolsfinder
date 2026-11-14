import urllib.request
import re

req = urllib.request.Request('https://aitoolsfinder.cloud', headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    urls = set(re.findall(r'(?:src|href)="([^"]+)"', html))
    print(f"Total URLs found: {len(urls)}")
    for u in sorted(urls):
        full_u = u
        if u.startswith('/'):
            full_u = 'https://aitoolsfinder.cloud' + u
        if full_u.startswith('http'):
            try:
                r = urllib.request.urlopen(urllib.request.Request(full_u, headers={'User-Agent': 'Mozilla/5.0'}))
                print(f"{r.status}: {full_u}")
            except urllib.error.HTTPError as e:
                print(f"==> {e.code} [ERROR]: {full_u}")
            except Exception as e:
                print(f"==> FAILED: {full_u} ({e})")
except Exception as e:
    print(f"Failed to fetch homepage: {e}")
