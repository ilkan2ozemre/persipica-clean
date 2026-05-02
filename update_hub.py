
import os
import re
import math
from bs4 import BeautifulSoup

DIR_PATH = "."
FILES_TO_PROCESS = [
    "geo-guide.html",
    "what-an-audit-includes.html",
    "track-ai-brand-mentions.html",
    "ai-visibility-roi-calculator.html",
    "research-methodology.html",
    "research.html",
    "data.html",
    "geo-saas-cmo.html",
    "geo-professional-services.html",
    "geo-enterprise-tech.html",
    "geo-vs-seo-objection.html",
    "geo-roi-objection.html",
    "geo-platform-maturity-objection.html",
    "services.html",
    "pricing.html",
    "about.html",
    "contact.html",
    "privacy.html",
    "case-studies.html"
]

CATEGORIES = {
    "geo-guide.html": "Core Guides",
    "what-an-audit-includes.html": "Core Guides",
    "track-ai-brand-mentions.html": "Core Guides",
    "ai-visibility-roi-calculator.html": "Core Guides",
    "research-methodology.html": "Core Guides",
    "research.html": "Research & Data",
    "data.html": "Research & Data",
    "geo-saas-cmo.html": "Use Cases",
    "geo-professional-services.html": "Use Cases",
    "geo-enterprise-tech.html": "Use Cases",
    "geo-vs-seo-objection.html": "Objections",
    "geo-roi-objection.html": "Objections",
    "geo-platform-maturity-objection.html": "Objections",
    "services.html": "Persipica",
    "pricing.html": "Persipica",
    "about.html": "Persipica",
    "contact.html": "Persipica",
    "privacy.html": "Persipica",
    "case-studies.html": "Persipica"
}

WIDE_PAGES = [
    "geo-guide.html", "what-an-audit-includes.html", "track-ai-brand-mentions.html",
    "ai-visibility-roi-calculator.html", "research-methodology.html", "research.html",
    "data.html", "geo-saas-cmo.html", "geo-professional-services.html",
    "geo-enterprise-tech.html", "geo-vs-seo-objection.html", "geo-roi-objection.html",
    "geo-platform-maturity-objection.html", "services.html", "pricing.html",
    "about.html", "contact.html", "privacy.html", "case-studies.html"
]

SHARED_NAV = """
  <nav>
    <a href="index.html"><img class="nav-logo" src="../persipica-website/title.png" alt="Persipica" /></a>
    <ul class="nav-links">
      <li><a href="index.html">Learn Home</a></li>
      <li><a href="services.html">Services</a></li>
      <li><a href="pricing.html">Pricing</a></li>
      <li><a href="contact.html" class="nav-cta">Get Your Audit</a></li>
    </ul>
    <div class="hamburger" id="hamburger" aria-label="Menu"><span></span><span></span><span></span></div>
  </nav>
"""

def get_nav_with_active(active_file):
    links = [
        ("index.html", "Learn Home"),
        ("services.html", "Services"),
        ("pricing.html", "Pricing"),
        ("contact.html", "Get Your Audit")
    ]
    
    html = '  <nav>\n'
    html += '    <a href="index.html"><img class="nav-logo" src="../persipica-website/title.png" alt="Persipica" /></a>\n'
    html += '    <ul class="nav-links">\n'
    for href, label in links:
        cls = ' class="active"' if active_file == href else ''
        if href == 'contact.html':
            cls = ' class="nav-cta"'
            if active_file == href: cls = ' class="nav-cta active"'
        html += f'      <li><a href="{href}"{cls}>{label}</a></li>\n'
    html += '    </ul>\n'
    html += '    <div class="hamburger" id="hamburger" aria-label="Menu"><span></span><span></span><span></span></div>\n'
    html += '  </nav>'
    return html

def get_global_sidebar(active_file):
    sections = [
        ("Core Guides", [
            ("geo-guide.html", "GEO: The Complete Guide"),
            ("what-an-audit-includes.html", "What an audit includes"),
            ("track-ai-brand-mentions.html", "Track AI mentions"),
            ("ai-visibility-roi-calculator.html", "ROI calculator"),
            ("research-methodology.html", "Research methodology"),
        ]),
        ("Research & Data", [
            ("research.html", "Research findings"),
            ("data.html", "Data & statistics"),
        ]),
        ("Use Cases", [
            ("geo-saas-cmo.html", "GEO for B2B SaaS"),
            ("geo-professional-services.html", "GEO for professional services"),
            ("geo-enterprise-tech.html", "GEO for enterprise tech"),
        ]),
        ("Objections", [
            ("geo-vs-seo-objection.html", "GEO vs SEO"),
            ("geo-roi-objection.html", "ROI objections"),
            ("geo-platform-maturity-objection.html", "Platform maturity"),
        ]),
        ("Persipica", [
            ("services.html", "Services"),
            ("pricing.html", "Pricing"),
            ("about.html", "About"),
            ("case-studies.html", "Case Studies"),
            ("contact.html", "Contact"),
        ])
    ]
    
    html = '<aside class="global-sidebar">\n'
    for section_label, section_links in sections:
        html += '      <div class="sidebar-section">\n'
        html += f'        <p class="sidebar-section-label">{section_label}</p>\n'
        html += '        <div class="sidebar-nav">\n'
        for href, label in section_links:
            active_class = ' class="active"' if href == active_file else ''
            html += f'          <a href="{href}"{active_class}>{label}</a>\n'
        html += '        </div>\n'
        html += '      </div>\n'
    html += '    </aside>'
    return html

def get_next_page(active_file):
    try:
        idx = FILES_TO_PROCESS.index(active_file)
        if idx < len(FILES_TO_PROCESS) - 1:
            next_file = FILES_TO_PROCESS[idx + 1]
            # Simple heuristic for a nice label
            next_label = next_file.replace('.html', '').replace('-', ' ').title()
            if 'Geo' in next_label: next_label = next_label.replace('Geo', 'GEO')
            return next_file, next_label
    except ValueError:
        pass
    return None, None

FULL_FOOTER = """
  <footer class="full-footer">
    <div class="footer-col">
      <p class="footer-col-label">Guides</p>
      <a href="geo-guide.html">GEO: The Complete Guide</a>
      <a href="track-ai-brand-mentions.html">Track AI mentions</a>
      <a href="ai-visibility-roi-calculator.html">ROI calculator</a>
    </div>
    <div class="footer-col">
      <p class="footer-col-label">Use Cases</p>
      <a href="geo-saas-cmo.html">B2B SaaS</a>
      <a href="geo-professional-services.html">Professional services</a>
      <a href="geo-enterprise-tech.html">Enterprise tech</a>
    </div>
    <div class="footer-col">
      <p class="footer-col-label">Research</p>
      <a href="research.html">Research findings</a>
      <a href="data.html">Data & statistics</a>
    </div>
    <div class="footer-col">
      <p class="footer-col-label">Objections</p>
      <a href="geo-vs-seo-objection.html">GEO vs SEO</a>
      <a href="geo-roi-objection.html">ROI objections</a>
      <a href="geo-platform-maturity-objection.html">Platform maturity</a>
    </div>
    <div class="footer-col">
      <p class="footer-col-label">Persipica</p>
      <a href="https://persipica.com">Main site</a>
      <a href="services.html">Services</a>
      <a href="pricing.html">Pricing</a>
      <a href="contact.html">Get your audit</a>
    </div>
  </footer>
"""

FOOTER_BOTTOM = """
  <div class="footer-bottom">
    <img class="footer-bottom-logo" src="../persipica-website/title.png" alt="Persipica" />
    <p class="footer-bottom-copy">© 2026 Persipica. All rights reserved. <a href="https://persipica.com/privacy.html" style="color: var(--faint);">Privacy</a></p>
  </div>
"""

def estimate_reading_time(text):
    words = len(text.split())
    minutes = math.ceil(words / 200) # 200 wpm
    return minutes

def process_file(filename):
    print(f"Processing {filename}...")
    file_path = os.path.join(DIR_PATH, filename)
    if not os.path.exists(file_path):
        return

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    soup = BeautifulSoup(content, "html.parser")
    
    title_tag = soup.find("title")
    page_title = title_tag.text.split("|")[0].strip() if title_tag else filename
    category = CATEGORIES.get(filename, "Core Guides")
            
    # Extract H1 and Description
    h1_tag = soup.find("h1")
    h1_html = str(h1_tag) if h1_tag else f"<h1>{page_title}</h1>"
    
    desc_tag = soup.select_one(".sec-body, .guide-hero-desc, .article-hero-desc, .track-hero-desc, .roi-hero-desc, .guide-p")
    desc_html = ""
    if desc_tag:
        if desc_tag.name == 'p':
            desc_html = str(desc_tag)
        else:
            desc_html = f'<p class="sec-body">{desc_tag.text.strip()}</p>'
    
    # Reading time
    read_time = estimate_reading_time(soup.get_text())
    meta_info = f'<div class="article-meta"><span>{read_time} min read</span> • <span>Updated April 2026</span></div>'

    # Cleanup
    for el in soup.select(".breadcrumbs, .article-header, .article-sidebar, .global-sidebar, .local-toc, nav, footer, .footer-bottom, .full-footer, .article-meta, .next-article-link"):
        el.decompose()
    for el in soup.select(".guide-hero, .page-hero, .article-hero, .track-hero, .roi-hero, .hub-home-hero"):
        el.decompose()
        
    content_area = soup.select_one(".guide-article, .article-body, main")
    main_content = ""
    toc_links = []
    
    if content_area:
        for heading in content_area.find_all(['h2', 'h3']):
            if not heading.get('id'):
                new_id = re.sub(r'\W+', '-', heading.text.lower()).strip('-')
                heading['id'] = new_id
            toc_links.append((f"#{heading['id']}", heading.text.strip(), heading.name))
        for child in content_area.children:
            if child.name:
                main_content += str(child) + "\n"
    else:
        body = soup.find("body")
        if body:
            for heading in body.find_all(['h2', 'h3']):
                if not heading.get('id'):
                    new_id = re.sub(r'\W+', '-', heading.text.lower()).strip('-')
                    heading['id'] = new_id
                toc_links.append((f"#{heading['id']}", heading.text.strip(), heading.name))
            for child in body.children:
                if child.name and child.name != 'script':
                    main_content += str(child) + "\n"

    # Next page
    next_file, next_label = get_next_page(filename)
    next_nav_html = ""
    if next_file:
        next_nav_html = f"""
        <div class="next-article-link">
          <p>Next Up</p>
          <a href="{next_file}">{next_label} →</a>
        </div>
        """

    breadcrumbs_html = f"""
    <nav class="breadcrumbs">
      <a href="index.html">Persipica Learn</a>
      <span class="sep">/</span>
      <span class="cat">{category}</span>
    </nav>
    """

    local_toc_html = '<aside class="local-toc">\n      <p class="toc-label">On this page</p>\n      <div class="toc-links">\n'
    for href, text, tag in toc_links:
        cls = " toc-h3" if tag == 'h3' else ""
        local_toc_html += f'        <a href="{href}" class="{cls}">{text}</a>\n'
    local_toc_html += '      </div>\n    </aside>'

    # Construct the final body content
    is_wide = filename in WIDE_PAGES
    wide_class = " wide" if is_wide else ""

    new_body_content = f"""
    {get_nav_with_active(filename)}

    <div class="article-layout">
    {get_global_sidebar(filename)}

    <main class="article-content{wide_class}">
    {breadcrumbs_html}
      <header class="article-header">
    {h1_html}
    {desc_html}
    {meta_info}
      </header>

    {main_content}

    {next_nav_html}
    </main>

    {local_toc_html}
    </div>

    {FULL_FOOTER}
    {FOOTER_BOTTOM}
    """

    unique_scripts = {}
    all_scripts = soup.find_all("script")
    for script in all_scripts:
        src = script.get("src")
        content_str = script.string.strip() if script.string else ""
        key = (src, content_str)
        if key not in unique_scripts:
            unique_scripts[key] = script.extract()
        else:
            script.decompose()

    head = soup.find("head")
    body_tag = soup.find("body")
    body_tag.clear()
    body_tag.append(BeautifulSoup(new_body_content, "html.parser"))
    
    for (src, content_str), script_tag in unique_scripts.items():
        script_type = script_tag.get("type") if script_tag else None
        if src == "app.js":
            body_tag.append(script_tag)
        elif script_type == "application/ld+json" or "wf-loading" in content_str:
            if head: head.append(script_tag)
            else: body_tag.insert(0, script_tag)
        else:
            body_tag.append(script_tag)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(soup.prettify())

if __name__ == "__main__":
    for filename in FILES_TO_PROCESS:
        try:
            process_file(filename)
        except Exception as e:
            print(f"Error processing {filename}: {e}")
