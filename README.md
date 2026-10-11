# visurail

**Interactive visualizations of rail science** — prototype for visurail.de / visurail.com.

Each entry takes one idea from a CC BY rail paper and turns it into a small browser
visualization, with a full citation and a link back to the paper.

**Credit:** the format follows [Visual Transportation Science](https://visualtransportationscience.org/),
which pairs transportation research with interactive visualizations. visurail applies it to rail only.

## Structure

The catalog is organised on two axes (`assets/js/taxonomy.js`):

- **Rail domains** (one primary per work): Operations · Infrastructure & Construction ·
  Signalling & Control · Vehicles & Dynamics · Network Planning & Economics ·
  Energy & Environment · Safety & Reliability
- **Interfaces** (zero or more): Rail × Air · Rail × Road · Rail × Water ·
  Rail × Urban mobility · Rail × Weather & Climate

## Prototype entries

| Visualization | Source (CC BY) | Domain / interface |
|---|---|---|
| One timetable, three networks | Lamanna, Prisma & Medeossi 2025, PLOS ONE | Operations |
| Own delay vs. inherited delay | Pozzobon Borin et al. 2026, arXiv:2601.16592 (FI-TW) | Operations · Rail × Weather |
| Feeder flights to rail: where do the slots go? | Dobruszkes 2025, EJTIR | Planning · Rail × Air |

All three are simplified toy models; no numbers on the pages come from the papers' data.
Licence metadata still needs checking on the publisher pages; see the issues.

## Layout

```
index.html, about.html, contribute.html
assets/css/visurail.css   design system (TUD Chair of Railway Operations CD; light + dark)
assets/js/site.js         header/footer/theme toggle
assets/js/taxonomy.js     domains + interfaces
assets/js/entries.js      catalog entries (single source of metadata)
assets/js/catalog.js      catalog renderer
assets/js/vizpage.js      citation header for viz pages
viz/<slug>/index.html     one page per visualization
```

Static site, no build step. Serve locally with `python3 -m http.server` and open
http://localhost:8000. Works on GitHub Pages as-is (`.nojekyll` included).

Design: corporate design of the Chair of Railway Operations, TU Dresden
([tud_cro_chaircd](https://github.com/joernmht/tud_cro_chaircd)): Türkis `#0A777F`, Orange `#C85000`
accent, Noto Sans (self-hosted, no font CDN).

## Licence

Code: [Apache License 2.0](LICENSE). See [NOTICE](NOTICE) for the visualized works, the
font (OFL-1.1) and the TUD logos (trademarks, not Apache-licensed).

## AI disclaimer

This repository was developed with substantial assistance from AI coding tools
(Anthropic's Claude). Code and content are reviewed by the maintainers, who take
responsibility for them.
