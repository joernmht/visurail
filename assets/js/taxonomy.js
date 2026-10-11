/* visurail taxonomy — how rail science is clustered on this site.
   Two axes:
     domains     — the rail-internal field a work belongs to (exactly one primary, optional secondary)
     interfaces  — where rail meets another system ("Rail × Air"); zero or more
   Plus free facets on each entry: segment, method, vizType.
   Edit here; the catalog page derives everything from these lists. */
window.VISURAIL_TAXONOMY = {
  domains: [
    { id: "operations", icon: "operations", title: "Operations",
      desc: "Timetabling, capacity, dispatching & rescheduling, delays and punctuality, crew & rolling-stock scheduling." },
    { id: "infrastructure", icon: "infrastructure", title: "Infrastructure & Construction",
      desc: "Track, alignment, structures, stations; construction works, possessions, maintenance & asset management." },
    { id: "control", icon: "control", title: "Signalling & Control",
      desc: "Interlocking, train protection & control (ETCS, CBTC), automatic train operation, digital twins." },
    { id: "vehicles", icon: "vehicles", title: "Vehicles & Dynamics",
      desc: "Rolling stock, traction & braking, vehicle–track interaction, running dynamics." },
    { id: "planning", icon: "planning", title: "Network Planning & Economics",
      desc: "Network design, demand, appraisal, pricing, policy, rail freight markets." },
    { id: "energy", icon: "energy", title: "Energy & Environment",
      desc: "Traction energy, electrification, emissions, noise, climate impacts and resilience." },
    { id: "safety", icon: "safety", title: "Safety & Reliability",
      desc: "Risk, RAMS, incidents, level crossings, robustness of the system." },
  ],
  interfaces: [
    { id: "air", title: "Rail × Air", icon: "plane",
      desc: "Air–rail intermodality, airport rail links, high-speed rail vs. short-haul flights." },
    { id: "road", title: "Rail × Road", icon: "truck",
      desc: "Road–rail freight, first/last mile, level crossings, modal shift." },
    { id: "water", title: "Rail × Water", icon: "ship",
      desc: "Seaports and inland ports, hinterland rail, ship–rail transshipment." },
    { id: "urban", title: "Rail × Urban mobility", icon: "tram",
      desc: "Integration with bus, tram, metro, bike and on-demand services; station access." },
    { id: "weather", title: "Rail × Weather & Climate", icon: "weather",
      desc: "How weather and climate act on rail operations and infrastructure." },
  ],
  // optional facets — free vocabulary, kept small on purpose
  segments: ["passenger", "freight", "urban rail", "high-speed", "mixed"],
  methods: ["optimisation", "simulation", "network science", "statistics", "machine learning", "survey / empirical", "dataset"],
};
