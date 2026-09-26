#!/usr/bin/env python3
"""Generate the colour schemes of backend_theme_bas from one source of truth.

Run from the repository root:  python3 tools/build_schemes.py

For every scheme in SCHEMES it writes
  backend_theme_bas/static/src/schemes/<key>.scss            CSS tokens (--t-*) under html:root
  backend_theme_bas/static/src/schemes/<key>_variables.scss  compile-time Odoo variables
and it regenerates
  backend_theme_bas/static/src/scss/tokens_default.scss      default tokens (:root)
  backend_theme_bas/data/ir_asset.xml                        one ir.asset pair per scheme
  backend_theme_bas/static/src/settings/schemes_data.js      names/descriptions/previews for the settings page

Components only read the --t-* tokens, so a new scheme is a new entry here.
"""
import json
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent / "backend_theme_bas"
IMG = "/backend_theme_bas/static/src/img"
DEFAULT_SCHEME = "maritime"

# Maritime.Studio is the complete reference: every other scheme overrides part of it.
MARITIME = {
    "font-body": "\"Open Sans\", Arial, \"Helvetica Neue\", sans-serif",
    "font-heading": "\"Exo 2\", \"Open Sans\", Arial, sans-serif",
    "ink": "#1e2b4a",
    "muted": "#5b6b8c",
    "subtle": "#8a97b1",
    "heading": "#254284",
    "label": "#5b6b8c",
    "label-weight": "600",
    "link": "#147a70",
    "link-hover": "#0f635b",
    "link-decoration": "none",
    "canvas": "#e3e9f2",
    "canvas-image": "none",
    "surface": "#ffffff",
    "surface-alt": "#f3f6fb",
    "border": "#c9d3e3",
    "border-light": "#e2e8f1",
    "radius-card": "10px",
    "radius": "8px",
    "radius-input": "6px",
    "shadow": "0 1px 2px rgba(37, 66, 132, .08), 0 4px 14px rgba(37, 66, 132, .07)",
    "shadow-pop": "0 8px 28px rgba(27, 49, 105, .22)",
    "focus": "#1d9a8e",
    "focus-ring": "0 0 0 3px rgba(29, 154, 142, .22)",
    "accent": "#1d9a8e",
    "accent-text": "#ffffff",
    "accent-tint": "#e3f3f1",
    "selected": "#e3f3f1",
    "hover-row": "#f3f6fb",
    "btn-radius": "8px",
    "btn-weight": "600",
    "btn-primary-bg": "#1d9a8e",
    "btn-primary-border": "#1d9a8e",
    "btn-primary-text": "#ffffff",
    "btn-primary-hover-bg": "#147a70",
    "btn-primary-hover-border": "#147a70",
    "btn-primary-hover-text": "#ffffff",
    "btn-bg": "#ffffff",
    "btn-border": "#c9d3e3",
    "btn-text": "#254284",
    "btn-hover-bg": "#f3f6fb",
    "btn-hover-border": "#aab8cf",
    "btn-active-bg": "#254284",
    "btn-active-border": "#254284",
    "btn-active-text": "#ffffff",
    "navbar-bg": "#254284",
    "navbar-text": "rgba(255, 255, 255, .88)",
    "navbar-text-hover": "#ffffff",
    "navbar-hover-bg": "rgba(255, 255, 255, .10)",
    "navbar-marker": "#1d9a8e",
    "navbar-font": "var(--t-font-heading)",
    "navbar-shadow": "0 1px 4px rgba(20, 35, 75, .35)",
    "sidebar-bg": "#254284 url(\"/backend_theme_bas/static/src/img/waves.svg\") no-repeat left bottom 12px",
    "sidebar-pad-bottom": "72px",
    "sidebar-border": "0",
    "sidebar-font": "var(--t-font-heading)",
    "sidebar-weight": "600",
    "sidebar-item-radius": "8px",
    "sidebar-text": "rgba(255, 255, 255, .86)",
    "sidebar-icon": "rgba(255, 255, 255, .62)",
    "sidebar-hover-bg": "#34528f",
    "sidebar-hover-text": "#ffffff",
    "sidebar-active-bg": "rgba(29, 154, 142, .22)",
    "sidebar-active-text": "#ffffff",
    "sidebar-active-icon": "#1d9a8e",
    "sidebar-marker": "#1d9a8e",
    "sidebar-divider": "rgba(255, 255, 255, .14)",
    "window-bg": "transparent",
    "window-text": "rgba(255, 255, 255, .78)",
    "window-border": "0",
    "window-hover-bg": "#34528f",
    "window-active-bg": "rgba(255, 255, 255, .12)",
    "window-active-text": "#ffffff",
    "hero-bg": "#254284 url(\"/backend_theme_bas/static/src/img/peaks.svg\") no-repeat center bottom / 100% 64px",
    "hero-text": "#ffffff",
    "hero-sub": "rgba(255, 255, 255, .78)",
    "hero-padding": "26px 32px 58px",
    "hero-size": "28px",
    "home-icon-bg": "#e3f3f1",
    "home-icon": "#1d9a8e",
    "thead-bg": "#f3f6fb",
    "thead-text": "#254284",
    "thead-weight": "600",
    "grid": "#e2e8f1",
    "row-num": "#8a97b1",
    "tab-bg": "transparent",
    "tab-text": "#5b6b8c",
    "tab-border": "0",
    "tab-radius": "0",
    "tab-active-bg": "transparent",
    "tab-active-text": "#254284",
    "tab-active-shadow": "inset 0 -3px 0 #1d9a8e",
    "tab-hover-bg": "transparent",
    "hint-bg": "#e3f3f1",
    "hint-border": "#1d9a8e",
    "dialog-title": "#254284",
    "totals-bg": "#f3f6fb",
    "kanban-col-bg": "rgba(255, 255, 255, .45)",
    "statusbar-current-bg": "#1d9a8e",
    "statusbar-current-text": "#ffffff"
}

STEEL_OVERRIDES = {
    "font-body": "Arial, \"Helvetica Neue\", Helvetica, \"Liberation Sans\", sans-serif",
    "font-heading": "var(--t-font-body)",
    "ink": "#26323f",
    "muted": "#4d5b6b",
    "subtle": "#7b8794",
    "heading": "#3279c5",
    "label": "#4d4d4d",
    "label-weight": "400",
    "link": "#1f5fad",
    "link-hover": "#154a8a",
    "link-decoration": "underline",
    "canvas": "#b3c3d2",
    "canvas-image": "url(\"/backend_theme_bas/static/src/img/grain.png\")",
    "surface-alt": "#f2f2f2",
    "border": "#b4b4b4",
    "border-light": "#dcdcdc",
    "radius-card": "4px",
    "radius": "3px",
    "radius-input": "2px",
    "shadow": "0 1px 2px rgba(22, 38, 56, .18), 0 2px 8px rgba(22, 38, 56, .08)",
    "shadow-pop": "0 4px 16px rgba(0, 0, 0, .25)",
    "focus": "#f5a623",
    "focus-ring": "0 0 0 1px #f5a623",
    "accent": "#1f5fad",
    "accent-tint": "#fbe3b3",
    "selected": "#fbe3b3",
    "hover-row": "#fdf3dc",
    "btn-radius": "3px",
    "btn-weight": "400",
    "btn-primary-bg": "linear-gradient(#fee18d, #fdd35b)",
    "btn-primary-border": "#d9a41f",
    "btn-primary-text": "#1a1a1a",
    "btn-primary-hover-bg": "linear-gradient(#fed877, #f9c535)",
    "btn-primary-hover-border": "#c28d0d",
    "btn-primary-hover-text": "#000000",
    "btn-bg": "linear-gradient(#ffffff, #e9e9e9)",
    "btn-border": "#b4b4b4",
    "btn-text": "#333333",
    "btn-hover-bg": "linear-gradient(#ffffff, #dedede)",
    "btn-hover-border": "#999999",
    "btn-active-bg": "#d6d6d6",
    "btn-active-border": "#8c8c8c",
    "btn-active-text": "#000000",
    "navbar-bg": "#3e5670",
    "navbar-marker": "#f5a623",
    "navbar-font": "var(--t-font-body)",
    "navbar-shadow": "0 1px 3px rgba(0, 0, 0, .25)",
    "sidebar-bg": "#d4dee7",
    "sidebar-pad-bottom": "8px",
    "sidebar-border": "1px solid #a7b7c7",
    "sidebar-font": "var(--t-font-body)",
    "sidebar-weight": "400",
    "sidebar-item-radius": "0",
    "sidebar-text": "#1d2a38",
    "sidebar-icon": "#3e5670",
    "sidebar-hover-bg": "#e3eaf0",
    "sidebar-hover-text": "#000000",
    "sidebar-active-bg": "#ffffff",
    "sidebar-active-text": "#1d2a38",
    "sidebar-active-icon": "#1d2a38",
    "sidebar-marker": "#f5a623",
    "sidebar-divider": "#a7b7c7",
    "window-bg": "#c4d1dc",
    "window-text": "#1d2a38",
    "window-border": "1px solid #a7b7c7",
    "window-hover-bg": "#e3eaf0",
    "window-active-bg": "#ffffff",
    "window-active-text": "#1d2a38",
    "hero-bg": "transparent",
    "hero-text": "#1d2a38",
    "hero-sub": "#3f5064",
    "hero-padding": "14px 24px 4px",
    "hero-size": "20px",
    "home-icon-bg": "transparent",
    "home-icon": "#4a4a4a",
    "thead-bg": "#f2f2f2",
    "thead-text": "#4d4d4d",
    "thead-weight": "400",
    "grid": "#e6e6e6",
    "row-num": "#666666",
    "tab-bg": "#f2f2f2",
    "tab-text": "#333333",
    "tab-border": "1px solid #d6d6d6",
    "tab-radius": "2px 2px 0 0",
    "tab-active-bg": "#ffffff",
    "tab-active-text": "#000000",
    "tab-active-shadow": "none",
    "tab-hover-bg": "#e8e8e8",
    "hint-bg": "#fbf3cf",
    "hint-border": "transparent",
    "dialog-title": "#3279c5",
    "totals-bg": "#e4e4e4",
    "kanban-col-bg": "rgba(255, 255, 255, .35)",
    "statusbar-current-bg": "#fbe3b3",
    "statusbar-current-text": "#000000"
}

CLASSIC_OVERRIDES = {
    "ink": "#333333",
    "muted": "#666666",
    "canvas": "#ffffff",
    "canvas-image": "none",
    "radius-card": "2px",
    "shadow": "0 0 0 1px #dedede",
    "navbar-bg": "#f2f2f2",
    "navbar-text": "#333333",
    "navbar-text-hover": "#000000",
    "navbar-hover-bg": "rgba(0, 0, 0, .06)",
    "navbar-shadow": "none",
    "sidebar-bg": "#f2f2f2",
    "sidebar-border": "1px solid #d6d6d6",
    "sidebar-text": "#333333",
    "sidebar-icon": "#4a4a4a",
    "sidebar-hover-bg": "#e2e2e2",
    "sidebar-active-text": "#000000",
    "sidebar-active-icon": "#000000",
    "sidebar-divider": "#d6d6d6",
    "window-bg": "#e4e4e4",
    "window-text": "#333333",
    "window-border": "1px solid #d6d6d6",
    "window-hover-bg": "#d9d9d9",
    "window-active-text": "#000000",
    "hero-text": "#222222",
    "hero-sub": "#666666",
    "kanban-col-bg": "#f5f5f5"
}

# --- Pastel schemes -----------------------------------------------------------
# Light pastel canvas and panels, the darkest colour of each palette for the top bar,
# text and the default button (pastel tones fail contrast as button backgrounds with
# white text), the soft accent colour for markers, selection and focus.

PASTEL_BASE = {
    "font-body": '"Open Sans", Arial, "Helvetica Neue", sans-serif',
    "font-heading": '"Open Sans", Arial, "Helvetica Neue", sans-serif',
    "link-decoration": "none",
    "canvas-image": "none",
    "radius-card": "12px", "radius": "8px", "radius-input": "6px",
    "btn-radius": "8px", "btn-weight": "600",
    "navbar-font": "var(--t-font-heading)",
    "sidebar-pad-bottom": "8px", "sidebar-font": "var(--t-font-heading)", "sidebar-weight": "600",
    "sidebar-item-radius": "8px", "window-border": "0",
    "hero-padding": "22px 32px 22px", "hero-size": "26px",
    "tab-bg": "transparent", "tab-border": "0", "tab-radius": "0", "tab-active-bg": "transparent",
    "tab-hover-bg": "transparent", "thead-weight": "600", "label-weight": "600",
}

def pastel(p):
    """Build a pastel scheme from a palette dict (see the three calls below)."""
    t = dict(PASTEL_BASE)
    t.update({
        "ink": p["ink"], "muted": p["muted"], "subtle": p["subtle"],
        "heading": p["ink"], "label": p["muted"],
        "link": p["link"], "link-hover": p["ink"],
        "canvas": p["canvas"], "surface": p["surface"], "surface-alt": p["surface_alt"],
        "border": p["border"], "border-light": p["border_light"],
        "shadow": f"0 1px 2px {p['shadow']}, 0 6px 18px {p['shadow_soft']}",
        "shadow-pop": f"0 10px 30px {p['shadow']}",
        "focus": p["accent"], "focus-ring": f"0 0 0 3px {p['accent_ring']}",
        "accent": p["accent_strong"], "accent-text": "#ffffff", "accent-tint": p["tint"],
        "selected": p["tint"], "hover-row": p["surface_alt"],
        "btn-primary-bg": p["primary"], "btn-primary-border": p["primary"], "btn-primary-text": "#ffffff",
        "btn-primary-hover-bg": p["ink"], "btn-primary-hover-border": p["ink"], "btn-primary-hover-text": "#ffffff",
        "btn-bg": p["surface"], "btn-border": p["border"], "btn-text": p["ink"],
        "btn-hover-bg": p["surface_alt"], "btn-hover-border": p["muted"],
        "btn-active-bg": p["primary"], "btn-active-border": p["primary"], "btn-active-text": "#ffffff",
        "navbar-bg": p["navbar"], "navbar-text": p["navbar_text"], "navbar-text-hover": "#ffffff",
        "navbar-hover-bg": "rgba(255, 255, 255, .10)", "navbar-marker": p["accent"],
        "navbar-shadow": f"0 1px 4px {p['shadow']}",
        "sidebar-bg": p["sidebar"], "sidebar-border": f"1px solid {p['border']}",
        "sidebar-text": p["ink"], "sidebar-icon": p["muted"],
        "sidebar-hover-bg": p["sidebar_hover"], "sidebar-hover-text": p["ink"],
        "sidebar-active-bg": p["surface"], "sidebar-active-text": p["ink"], "sidebar-active-icon": p["accent_strong"],
        "sidebar-marker": p["accent"], "sidebar-divider": p["border"],
        "window-bg": "transparent", "window-text": p["muted"],
        "window-hover-bg": p["sidebar_hover"], "window-active-bg": p["surface"], "window-active-text": p["ink"],
        "hero-bg": p["hero"], "hero-text": p["hero_text"], "hero-sub": p["hero_sub"],
        "home-icon-bg": p["tint"], "home-icon": p["accent_strong"],
        "thead-bg": p["surface_alt"], "thead-text": p["ink"], "grid": p["border_light"], "row-num": p["subtle"],
        "tab-text": p["muted"], "tab-active-text": p["ink"], "tab-active-shadow": f"inset 0 -3px 0 {p['accent']}",
        "hint-bg": p["tint"], "hint-border": p["accent"],
        "dialog-title": p["ink"], "totals-bg": p["surface_alt"], "kanban-col-bg": p["kanban_col"],
        "statusbar-current-bg": p["primary"], "statusbar-current-text": "#ffffff",
    })
    return t

# Milk #FBF7F4, Blush Oat #E8D8CE, Dusty Rose #B98F88, Cocoa Taupe #7A6258, Espresso Brown #3B2F2A
COCOA = pastel({
    "ink": "#3b2f2a", "muted": "#7a6258", "subtle": "#a8948c", "link": "#7a6258",
    "canvas": "#f3ebe6", "surface": "#fffdfb", "surface_alt": "#fbf7f4",
    "border": "#e0cfc4", "border_light": "#efe4dc",
    "shadow": "rgba(59, 47, 42, .10)", "shadow_soft": "rgba(59, 47, 42, .06)",
    "accent": "#b98f88", "accent_ring": "rgba(185, 143, 136, .30)", "accent_strong": "#9c706a",
    "tint": "#f5e6e2", "primary": "#7a6258",
    "navbar": "#3b2f2a", "navbar_text": "rgba(251, 247, 244, .90)",
    "sidebar": "#e8d8ce", "sidebar_hover": "#f1e6de",
    "hero": "#e8d8ce", "hero_text": "#3b2f2a", "hero_sub": "#7a6258",
    "kanban_col": "rgba(251, 247, 244, .70)",
})

# Concerto #D7D7D6, Cloudy Sky #B7B8BB, Cinereous #A08A81, Alaska Gray #595D66, Blue Anthracite #272B36
CLOUD = pastel({
    "ink": "#272b36", "muted": "#595d66", "subtle": "#8e9096", "link": "#595d66",
    "canvas": "#e9e9e8", "surface": "#ffffff", "surface_alt": "#f4f4f3",
    "border": "#c9cacc", "border_light": "#e2e2e1",
    "shadow": "rgba(39, 43, 54, .10)", "shadow_soft": "rgba(39, 43, 54, .06)",
    "accent": "#a08a81", "accent_ring": "rgba(160, 138, 129, .30)", "accent_strong": "#7f6a61",
    "tint": "#eee8e5", "primary": "#595d66",
    "navbar": "#272b36", "navbar_text": "rgba(242, 242, 241, .90)",
    "sidebar": "#d7d7d6", "sidebar_hover": "#e4e4e3",
    "hero": "#b7b8bb", "hero_text": "#272b36", "hero_sub": "#3e424c",
    "kanban_col": "rgba(255, 255, 255, .55)",
})

# Navy: Deep Navy, Navy Ink, Ocean Blue, Steel Blue, Dusk Blue / Sand: Rich, Golden, Soft Beige, Light, Ivory
SAND = pastel({
    "ink": "#1b2a4a", "muted": "#4f6a92", "subtle": "#8fa3bf", "link": "#2c4770",
    "canvas": "#f2e6d3", "surface": "#fffcf6", "surface_alt": "#faf4ea",
    "border": "#e0cdb0", "border_light": "#efe3cf",
    "shadow": "rgba(27, 42, 74, .12)", "shadow_soft": "rgba(27, 42, 74, .06)",
    "accent": "#d4a86a", "accent_ring": "rgba(212, 168, 106, .35)", "accent_strong": "#b8865b",
    "tint": "#f6ead5", "primary": "#2c4770",
    "navbar": "#1b2a4a", "navbar_text": "rgba(250, 244, 234, .90)",
    "sidebar": "#e8d3b5", "sidebar_hover": "#f0e0c7",
    "hero": "#1b2a4a", "hero_text": "#faf4ea", "hero_sub": "rgba(250, 244, 234, .75)",
    "kanban_col": "rgba(250, 244, 234, .70)",
})

# --- Chart palettes -------------------------------------------------------------
# Six categorical series colours per scheme, in fixed order, generated in OKLCH and
# checked with the dataviz validator (lightness band, chroma floor, CVD and
# normal-vision separation of adjacent pairs); plus the scorecard up / down colours.
CHARTS = {
    "bas": (["#2971c6", "#e78b30", "#12a7a7", "#c43f3e", "#764aa2", "#55a144"], "#2e8b57", "#c43f3e"),
    "maritime": (["#009d90", "#3860ac", "#d49824", "#ce514d", "#8559b2", "#5bae5f"], "#2f9e5b", "#d0474b"),
    "cocoa": (["#b25d5f", "#3a6aa7", "#c69f47", "#955890", "#12a195", "#46712b"], "#4d8a55", "#b25d5f"),
    "cloud": (["#3f69a7", "#cb7a5d", "#0099a6", "#875a9a", "#c7a74d", "#4a925c"], "#4a925c", "#c05a50"),
    "sand": (["#3463a6", "#d4a14a", "#c06240", "#209993", "#7457a3", "#89a455"], "#3f8a5a", "#c06240"),
}

def chart_tokens(key):
    series, up, down = CHARTS[key]
    tokens = {f"chart-{i + 1}": colour for i, colour in enumerate(series)}
    tokens.update({"chart-up": up, "chart-down": down})
    return tokens

MARITIME.update(chart_tokens("maritime"))
STEEL_OVERRIDES.update(chart_tokens("bas"))
COCOA.update(chart_tokens("cocoa"))
CLOUD.update(chart_tokens("cloud"))
SAND.update(chart_tokens("sand"))

# --- Compile-time Odoo variables per scheme ----------------------------------
ARIAL = 'Arial, "Helvetica Neue", Helvetica, "Liberation Sans", sans-serif'
OPEN_SANS = '"Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif'

def variables(community, text, navbar, border, body=OPEN_SANS, heading=None, link=None):
    lines = [f"$o-community-color: {community};"]
    if link:
        lines.append(f"$o-main-link-color: {link};")
    lines += [
        f"$o-font-family-sans-serif: {body};",
        f"$o-headings-font-family: {heading or '$o-font-family-sans-serif'};",
        f"$o-main-text-color: {text};",
        f"$o-navbar-background: {navbar};",
        f"$o-navbar-border-bottom: 1px solid {border};",
    ]
    return lines

def merged(base, *overrides):
    out = dict(base)
    for o in overrides:
        out.update(o)
    return out

STEEL = merged(MARITIME, STEEL_OVERRIDES)
CLASSIC = merged(STEEL, CLASSIC_OVERRIDES)

SCHEMES = [
    {"key": "classic", "name": "BAS Classic",
     "description": "Light 1C / BAS look: grey panels, flat white pages, yellow default button.",
     "tokens": CLASSIC, "variables": variables("#1f5fad", "#333333", "#f2f2f2", "#cfcfcf", ARIAL)},
    {"key": "steel", "name": "BAS Steel",
     "description": "BAS layout on a steel-blue canvas: dark steel top bar, white sheets, yellow default button.",
     "tokens": STEEL, "variables": variables("#1f5fad", "#1d2a38", "#3e5670", "#2f4459", ARIAL)},
    {"key": "maritime", "name": "Maritime.Studio",
     "description": "Brand colours: Navy panels, Maritime Teal accents, rounded cards, Exo 2 headings.",
     "tokens": MARITIME, "variables": variables("#1d9a8e", "#1e2b4a", "#254284", "#1b3169", OPEN_SANS,
                                                '"Exo 2", "Open Sans", Arial, sans-serif', "#147a70")},
    {"key": "cocoa", "name": "Milk & Cocoa",
     "description": "Pastel: milk and blush oat surfaces, dusty rose accents, espresso text.",
     "tokens": COCOA, "variables": variables("#7a6258", "#3b2f2a", "#3b2f2a", "#2a211d")},
    {"key": "cloud", "name": "Cloudy Grey",
     "description": "Pastel: concerto and cloudy sky greys, cinereous accents, blue anthracite text.",
     "tokens": CLOUD, "variables": variables("#595d66", "#272b36", "#272b36", "#1b1e26")},
    {"key": "sand", "name": "Navy & Sand",
     "description": "Pastel: warm sand surfaces, golden accents, midnight navy text and top bar.",
     "tokens": SAND, "variables": variables("#2c4770", "#1b2a4a", "#1b2a4a", "#141b2d")},
]

# --- Writers --------------------------------------------------------------------
def token_block(selector, tokens, title):
    body = "\n".join(f"    --t-{k}: {v};" for k, v in tokens.items())
    return f"// {title}\n// Generated by tools/build_schemes.py - edit the generator, not this file.\n{selector} {{\n{body}\n}}\n"

def first_colour(value):
    return value.split(" url(")[0].strip()

def preview(t):
    return {
        "navbar": t["navbar-bg"], "navbarText": t["navbar-text"],
        "sidebar": first_colour(t["sidebar-bg"]),
        "sidebarBorder": t["sidebar-border"].split()[-1] if t["sidebar-border"] != "0" else first_colour(t["sidebar-bg"]),
        "sidebarText": t["sidebar-text"], "marker": t["sidebar-marker"], "canvas": t["canvas"],
        "card": t["surface"], "radius": t["radius-card"], "primary": t["btn-primary-bg"],
        "primaryText": t["btn-primary-text"], "primaryBorder": t["btn-primary-border"],
        "line": t["border-light"], "title": t["heading"],
    }

def main():
    keys = set(MARITIME)
    for scheme in SCHEMES:
        missing = keys - set(scheme["tokens"])
        assert not missing, f"{scheme['key']} misses tokens {missing}"
        d = ROOT / "static/src/schemes"
        (d / f"{scheme['key']}.scss").write_text(
            token_block("html:root", scheme["tokens"], f"{scheme['name']}: {scheme['description']}"))
        (d / f"{scheme['key']}_variables.scss").write_text(
            f"// {scheme['name']}: compile-time Odoo variables.\n"
            "// Generated by tools/build_schemes.py - edit the generator, not this file.\n"
            + "\n".join(scheme["variables"]) + "\n")

    (ROOT / "static/src/scss/tokens_default.scss").write_text(token_block(
        ":root", MARITIME, "Default token values (Maritime.Studio); the active scheme overrides them with html:root."))

    records = []
    for scheme in SCHEMES:
        active = "True" if scheme["key"] == DEFAULT_SCHEME else "False"
        base = f"/backend_theme_bas/static/src/schemes/{scheme['key']}"
        records.append(f'''        <record id="scheme_{scheme['key']}_variables" model="ir.asset">
            <field name="name">Colour scheme {escape(scheme['name'])}: variables</field>
            <field name="bundle">web._assets_primary_variables</field>
            <field name="directive">before</field>
            <field name="target">web/static/src/scss/primary_variables.scss</field>
            <field name="path">{base}_variables.scss</field>
            <field name="active" eval="{active}"/>
        </record>
        <record id="scheme_{scheme['key']}_tokens" model="ir.asset">
            <field name="name">Colour scheme {escape(scheme['name'])}: tokens</field>
            <field name="bundle">web.assets_backend</field>
            <field name="path">{base}.scss</field>
            <field name="active" eval="{active}"/>
        </record>''')
    (ROOT / "data/ir_asset.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<odoo>\n'
        '    <!-- Generated by tools/build_schemes.py. Colour schemes: one pair of assets per scheme\n'
        '         (Odoo variables + CSS tokens), exactly one pair active, switched by Settings > Theme.\n'
        '         Paths start with "/" so they resolve both for a module installed from the file\n'
        '         system and for one imported as a zip (served from attachments).\n'
        '         noupdate: the chosen scheme survives module updates. -->\n'
        '    <data noupdate="1">\n' + "\n".join(records) + "\n    </data>\n</odoo>\n")

    js_items = []
    for scheme in SCHEMES:
        js_items.append(
            "    {\n"
            f"        key: {json.dumps(scheme['key'])},\n"
            f"        name: _t({json.dumps(scheme['name'])}),\n"
            f"        description: _t({json.dumps(scheme['description'])}),\n"
            f"        preview: {json.dumps(preview(scheme['tokens']))},\n"
            "    },")
    (ROOT / "static/src/settings/schemes_data.js").write_text(
        "// Generated by tools/build_schemes.py - edit the generator, not this file.\n"
        'import { _t } from "@web/core/l10n/translation";\n\n'
        f"export const DEFAULT_SCHEME = {json.dumps(DEFAULT_SCHEME)};\n\n"
        "export const SCHEMES = [\n" + "\n".join(js_items) + "\n];\n")
    print("generated", len(SCHEMES), "schemes")

if __name__ == "__main__":
    main()
