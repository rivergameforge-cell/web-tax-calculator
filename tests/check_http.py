"""Verify deployed sitemap pages and first-party assets against this checkout."""
import argparse
import hashlib
import subprocess
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import unquote, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree

from seo_structure_test import Document, ROOT


def check(base, stamp, revision=None):
    origin = urlsplit(base)
    resources = {'/sitemap.xml', '/robots.txt', '/ads.txt'}
    pages = ElementTree.parse(ROOT / 'sitemap.xml').findall('{*}url/{*}loc')
    for page in pages:
        parts = urlsplit(page.text)
        relative = unquote(parts.path).lstrip('/')
        path = ROOT / (relative + 'index.html' if parts.path.endswith('/') else relative)
        doc = Document(path.read_text())
        resources.add(parts.path)
        for resource in doc.resources:
            asset = urlsplit(resource)
            if asset.scheme not in ('', 'http', 'https') or asset.netloc not in ('', 'taxcalc.co.kr'):
                continue
            if not asset.path:
                continue
            # Resolve paths relative to the containing HTML document.
            target = ROOT / unquote(asset.path.lstrip('/')) if asset.path.startswith('/') else path.parent / unquote(asset.path)
            relative_asset = target.relative_to(ROOT).as_posix()
            if target.is_dir():
                relative_asset = '' if relative_asset == '.' else relative_asset.rstrip('/') + '/'
            resources.add('/' + relative_asset)

    def verify(route):
        path = ROOT / unquote(route).lstrip('/')
        if path.is_dir():
            path /= 'index.html'
        expected_body = subprocess.check_output(['git', 'show', f'{revision}:{path.relative_to(ROOT).as_posix()}'], cwd=ROOT) if revision else path.read_bytes()
        query = 'verify=' + stamp if stamp else ''
        url = urlunsplit((origin.scheme, origin.netloc, route, query, ''))
        with urlopen(Request(url, headers={'User-Agent': 'TaxCalc-Deployment-Check/1.0'}), timeout=30) as response:
            body = response.read()
            if response.status != 200:
                raise AssertionError((route, response.status))
            if 'noindex' in response.headers.get('X-Robots-Tag', '').lower():
                raise AssertionError((route, 'noindex header'))
        if hashlib.sha256(body).digest() != hashlib.sha256(expected_body).digest():
            raise AssertionError((route, 'deployed content differs from checkout'))
        if path.suffix == '.html':
            doc = Document(body.decode('utf-8'))
            expected = 'https://taxcalc.co.kr' + route
            if doc.canonical != expected:
                raise AssertionError((route, doc.canonical))
        return route

    with ThreadPoolExecutor(max_workers=4) as pool:
        verified = list(pool.map(verify, sorted(resources)))
    print(f'{len(pages)} sitemap pages and {len(verified) - len(pages)} supporting files verified: {base}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('base')
    parser.add_argument('--stamp', default='')
    parser.add_argument('--revision', help='Compare to committed files, ignoring unrelated local changes.')
    args = parser.parse_args()
    check(args.base, args.stamp, args.revision)
