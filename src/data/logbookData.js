/**
 * Live NASA Mission Logbook entries & matcher.
 * Facts, quantitative mission data, open-source NASA public domain references, and astronaut diary notes.
 */
export const LOGBOOK_ENTRIES = [
  {
    id: 'comm_delay',
    sol: 'SOL 1',
    title: 'Earth–Mars One-Way Light Time',
    matchKey: '3-22 minutes',
    dataMetric: 'Distance: 54.6M – 401M km  |  One-Way Delay: 3.0 – 22.3 min',
    factText:
      'Radio signals travel at the speed of light (~300,000 km/s). Depending on orbital positions, a one-way message between Earth and Mars takes 3 to 22 minutes—up to 44 minutes for a reply.',
    diaryNote:
      "Maisha's Log: Mission Control can't steer us in real time. We have to make autonomous crew decisions.",
    photoCaption: 'NASA Deep Space Network (DSN) Earth–Mars Relay Geometry (Public Domain)',
    reference: 'Ref: NASA JPL Deep Space Network (DSN) Telecommunications Link Design Handbook (810-005)',
  },
  {
    id: 'regolith_3d',
    sol: 'SOL 1',
    title: '3D-Printed Martian Regolith Habitat',
    matchKey: 'Mars Dune Alpha',
    dataMetric: 'Structure: 1,700 sq ft Lavacrete  |  Analog: CHAPEA at NASA JSC',
    factText:
      'Robotic precursors can mix basaltic Martian soil (regolith) with binders to 3D-print radiation-resistant habitat shells before astronauts land. NASA simulated this in the Mars Dune Alpha habitat.',
    diaryNote:
      "Muntasir's Log: The 3D-printed regolith walls survived the dust! We just need to bring its power and life support online.",
    photoCaption: 'NASA JSC CHAPEA / Mars Dune Alpha 3D-Printed Habitat Structure (Public Domain)',
    reference: 'Ref: NASA Johnson Space Center — Crew Health and Performance Exploration Analog (CHAPEA, 2023)',
  },
  {
    id: 'solar_arrays',
    sol: 'SOL 1',
    title: 'Spacecraft Photovoltaic Solar Arrays',
    matchKey: 'solar cells and panels',
    dataMetric: 'Cell Efficiency: ~30% Triple-Junction  |  ISS Array Output: 240 kW',
    factText:
      'In deep space where fuel resupply is impossible, multi-junction photovoltaic cells convert sunlight directly into DC electricity to power spacecraft, orbital stations, and surface rovers.',
    diaryNote:
      "Muntasir's Log: Unfurled and aimed our surface photovoltaic array toward the Sun. Battery charging steady!",
    photoCaption: 'NASA Mars Exploration Rover & ISS Photovoltaic Array Wings (Public Domain)',
    reference: 'Ref: NASA Glenn Research Center — Space Power & Photovoltaics Fact Sheet (FS-2021-GRC)',
  },
  {
    id: 'mars_sunlight_43',
    sol: 'SOL 1',
    title: 'Martian Solar Irradiance (43% of Earth)',
    matchKey: '43% light level',
    dataMetric: 'Mars Orbit: 1.524 AU  |  Solar Flux: ~590 W/m² vs Earth 1,361 W/m²',
    factText:
      'Because Mars orbits 1.52 times farther from the Sun than Earth, inverse-square law reduces solar irradiance to ~43% of Earth levels—and solar generation drops to 0% during the 12.3-hour Martian night.',
    diaryNote:
      "Maisha's Log: Night fell and solar input stopped completely. Every switch on our breaker board costs precious battery reserve.",
    photoCaption: 'NASA GSFC Solar Irradiance Comparison: Earth (1.0 AU) vs. Mars (1.52 AU) (Public Domain)',
    reference: 'Ref: NASA Goddard Space Flight Center (GSFC) — Planetary Fact Sheet: Mars (NSSDCA)',
  },
  {
    id: 'opportunity_dust_2018',
    sol: 'SOL 2',
    title: '2018 Global Dust Storm & Opportunity',
    matchKey: 'Opportunity went silent',
    dataMetric: 'Storm Optical Depth (tau): >10.8  |  MER-B Longevity: 5,111 Sols',
    factText:
      'Fine iron-oxide dust lofted by Martian storms coats solar panels and blocks sunlight. In June 2018, a planet-encircling storm silenced NASA rover Opportunity; its mission was declared complete in Feb 2019.',
    diaryNote:
      "Muntasir's Log: Wiped 16 coated cells clean after an overnight squall. Without manual cleaning, dust starves our array.",
    photoCaption: 'NASA/JPL-Caltech Opportunity Rover Atmospheric Opacity Series, June 2018 (Public Domain)',
    reference: 'Ref: NASA/JPL-Caltech — Mars Exploration Rover Opportunity (MER-B) Final Mission Report (2019)',
  },
  {
    id: 'iss_electrolysis_moxie',
    sol: 'SOL 2',
    title: 'ISRU Oxygen: Water Electrolysis & MOXIE',
    matchKey: '122 grams',
    dataMetric: 'ISS OGS: 2H2O -> 2H2 + O2  |  Perseverance MOXIE Total: 122 g O2',
    factText:
      'The ISS Oxygen Generation System splits liquid water into breathable O2 and H2 using electricity. On Mars, subsurface water ice can be melted and electrolyzed—while Perseverance MOXIE also extracted 122 g of O2 from CO2 air.',
    diaryNote:
      "Muntasir's Log: Drilled a clean subsurface water-ice core! Maisha is piping it into our electrolysis chamber now.",
    photoCaption: 'NASA/JPL-Caltech Perseverance MOXIE ISRU Unit & ISS Electrolysis Schematic (Public Domain)',
    reference: 'Ref: NASA/JPL-Caltech & MIT Haystack — MOXIE In-Situ Resource Utilization Completion Report (2023)',
  },
  {
    id: 'human_o2_consumption',
    sol: 'SOL 2',
    title: 'Crew Metabolic O2 Demand & Night Load',
    matchKey: '0.84 kg',
    dataMetric: 'Metabolic O2 Rate: 0.84 kg / person / sol  |  Electrolysis Load: 40%',
    factText:
      'According to NASA life-support standards, one astronaut consumes ~0.84 kg of oxygen every 24 hours. Continuous electrolysis requires steady electrical load, forcing non-essential habitat lighting off at night.',
    diaryNote:
      "Maisha's Log: Allocated 40% power to the Oxygen Maker and cut cabin lights before bed so life support runs safely all night.",
    photoCaption: 'NASA ECLSS Crew Metabolic Oxygen Balance & Habitat Load Profile (Public Domain)',
    reference: 'Ref: NASA-STD-3001 Vol. 2 & Life Support Baseline Values and Assumptions Document (NASA/TP-2015-218570)',
  },
];

/**
 * Matches either an explicit logbook entry ID or a substring inside a FactCard/Warning message.
 * @param {string} input
 * @returns {string|null}
 */
export function matchLogbookEntry(input) {
  if (!input || typeof input !== 'string') return null;
  const direct = LOGBOOK_ENTRIES.find((e) => e.id === input);
  if (direct) return direct.id;
  const lower = input.toLowerCase();
  const matched = LOGBOOK_ENTRIES.find((e) => lower.includes(e.matchKey.toLowerCase()));
  return matched ? matched.id : null;
}
