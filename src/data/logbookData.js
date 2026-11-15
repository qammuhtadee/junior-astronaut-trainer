/**
 * Kid-friendly NASA Mission Logbook entries (ages 7-12) with real NASA photos,
 * procedural vector art, and clearly separated formal references (including nasa-data/).
 * Arranged as 8 two-page spreads (Days 1-7 + Post-Completion Finale Spread 8).
 */
export const LOGBOOK_ENTRIES = [
  // ================= DAY 1 =================
  {
    id: 'day1_mars',
    day: 1,
    sol: 'DAY 1',
    title: 'All About Mars',
    images: ['logbook-mars1'],
    imageCaption: 'NASA Mars Orbiter View — The Rusty Red Planet',
    factText:
      '• Mars is the 4th planet from the Sun! Rusty red dust covers the ground, so we call it the Red Planet.\n' +
      '• Because Mars is farther from the Sun, it gets less than half as much sunlight as Earth (43%) and stays freezing cold (-60°C on average).\n' +
      '• Its air is super thin and unbreathable, and radio messages between Earth and Mars take 3 to 22 minutes one way!',
    formalReference:
      'NASA GSFC Planetary Fact Sheet: Mars (NSSDCA); NASA JPL Deep Space Network Handbook (810-005); NASA JSC CHAPEA.',
  },
  {
    id: 'day1_spacecraft',
    day: 1,
    sol: 'DAY 1',
    title: "What's a Spacecraft?",
    images: ['logbook-phoenix'],
    imageCaption: 'NASA Phoenix Mars Lander Touching Down on the Surface',
    factText:
      '• A spacecraft is a special machine built to fly across space and land safely on another world.\n' +
      '• Mars air is too thin for a parachute to stop a ship alone, so landers use a heat shield, parachute, and landing rockets!\n' +
      '• After landing safely, spacecraft unfold their solar wings, radios, and robot arms to explore.',
    formalReference:
      'NASA/JPL-Caltech & University of Arizona — Phoenix Mars Scout Lander Mission Overview (2008).',
  },

  // ================= DAY 2 =================
  {
    id: 'day2_solar_panels',
    day: 2,
    sol: 'DAY 2',
    title: 'Solar Panels',
    images: ['logbook-solar1'],
    imageCaption: 'Photovoltaic Solar Cells Catching Sunlight to Make Power',
    factText:
      '• Solar panels have shiny dark tiles called solar cells that catch sunlight and turn it straight into electricity!\n' +
      '• They have no moving parts and need zero fuel—just sunshine.\n' +
      '• At night, solar panels cannot make power, so astronauts switch off extra lights before sleeping to save battery energy!',
    formalReference:
      'NASA Glenn Research Center (GRC) — Space Power & Photovoltaics Fact Sheet (FS-2021-GRC); NASA NSSDCA Mars Orbit Data.',
  },
  {
    id: 'day2_solar_space',
    day: 2,
    sol: 'DAY 2',
    title: 'Solar Panels in Space',
    images: ['logbook-opportunity'],
    imageCaption: 'NASA Opportunity Rover Solar Wings in Martian Daylight',
    factText:
      '• There are no power plugs in space! Satellites, the Space Station, and Mars rovers unfold solar wings to run their tools.\n' +
      '• NASA’s solar-powered Opportunity rover was built to last 90 days, yet its solar panels kept it rolling for almost 15 years!\n' +
      '• Keeping red Martian dust wiped off the panels helps life support stay strong.',
    formalReference:
      'NASA/JPL-Caltech — Mars Exploration Rover Opportunity (MER-B) Solar Array Surface Operations Archive (2004–2019).',
  },

  // ================= DAY 3 =================
  {
    id: 'day3_dust_storm',
    day: 3,
    sol: 'DAY 3',
    title: "What's a Dust Storm?",
    images: ['logbook-dust1'],
    imageCaption: 'A Giant Martian Dust Storm Rolling Across Mars',
    factText:
      '• Fast winds on Mars pick up tiny red dust grains—as fine as baby powder—and swirl them high into the sky!\n' +
      '• Sometimes dust storms grow huge and wrap around the entire planet for weeks.\n' +
      '• Thick dust blocks out sunlight like a dark blanket, stopping solar panels from charging batteries.',
    formalReference:
      'NASA/JPL-Caltech — Mars Reconnaissance Orbiter (MRO) MARCI Global Dust Storm Opacity Report (2018).',
  },
  {
    id: 'day3_curiosity',
    day: 3,
    sol: 'DAY 3',
    title: 'Curiosity & Opportunity',
    images: ['logbook-curiosity'],
    imageCaption: 'NASA Curiosity Rover Dusty Selfie on Mars (Nuclear Powered)',
    factText:
      '• In June 2018, a giant planet-wide dust storm turned daytime dark on Mars for months.\n' +
      '• Solar-powered rover Opportunity could not charge its batteries in the dark, went quiet, and was declared no longer operational in February 2019.\n' +
      '• NASA’s Curiosity rover stayed awake—and snapped this dusty selfie!—because it uses nuclear power instead of solar panels.',
    formalReference:
      'NASA/JPL-Caltech — MER-B Opportunity Final Report (Feb 2019) & MSL Curiosity 2018 Global Storm Engineering Log.',
  },

  // ================= DAY 4 =================
  {
    id: 'day4_mars_ice',
    day: 4,
    sol: 'DAY 4',
    title: 'Mars Ice Underground',
    images: ['logbook-mars-ice'],
    imageCaption: 'Bright Subsurface Martian Water Ice Exposed Beneath Soil',
    factText:
      '• You will not find puddles or rivers on Mars today because the thin air and freezing cold turn surface water into ice or gas.\n' +
      '• Amazingly, huge sheets of frozen water are buried right beneath the red dirt!\n' +
      '• NASA’s Mars Reconnaissance Orbiter mapped this hidden ice from space, and the Phoenix lander dug just inches down to scoop up pure white ice!',
    formalReference:
      'NASA/JPL-Caltech — Mars Reconnaissance Orbiter (MRO) SHARAD/HiRISE Ice Mapping (SWIM) & Phoenix Trench Discovery (2008).',
  },
  {
    id: 'day4_water_space',
    day: 4,
    sol: 'DAY 4',
    title: 'Water Purifying in Space',
    images: ['logbook-moxie', 'logbook-perseverance'],
    imageCaption: 'Left: NASA MOXIE Oxygen Box  |  Right: Perseverance Rover',
    factText:
      '• People can only live about 3 days without water, and each astronaut breathes about 0.84 kg of oxygen daily.\n' +
      '• On the Space Station, NASA filters and recycles 98% of all water, and uses electricity to split water into breathable oxygen!\n' +
      '• On Mars, Perseverance’s golden MOXIE box also proved astronauts can make 122 grams of fresh oxygen straight from Martian air.',
    formalReference:
      'NASA MSFC ISS ECLSS 98% Water Recovery Report (2023); NASA/JPL & MIT MOXIE Report (2023); NASA-STD-3001 Vol. 2.',
  },

  // ================= DAY 5 =================
  {
    id: 'day5_nuclear_fission',
    day: 5,
    sol: 'DAY 5',
    title: 'Nuclear Fission',
    images: [],
    noImageCallout: 'HEAVY ATOM SPLITS  ➔  STEADY HEAT  ➔  24/7 MARS POWER',
    factText:
      '• Everything around you is made of tiny building blocks called atoms.\n' +
      '• Nuclear fission happens when a heavy atom—like uranium—splits apart into two smaller pieces!\n' +
      '• When atoms split, they release a huge amount of steady heat without needing air or burning fuel.\n' +
      '• Unlike solar panels, nuclear fission works day and night—even in thick dust storms!\n' +
      '• Just one small core the size of a paper-towel roll can keep an outpost powered for years.',
    formalReference:
      'NASA Glenn Research Center (GRC) & U.S. Department of Energy — Space Fission Power Fundamentals & KRUSTY Overview.',
  },
  {
    id: 'day5_fission_electricity',
    day: 5,
    sol: 'DAY 5',
    title: 'Electricity From Fission',
    images: ['logbook-nuclear-fission'],
    imageCaption: 'NASA Kilopower Compact Nuclear Fission Reactor Concept',
    factText:
      '• How does NASA’s Kilopower reactor turn splitting atoms into electricity?\n' +
      '• 1. Heat: Splitting atoms warms the reactor core to glowing heat.\n' +
      '• 2. Heat Pipes: Sealed metal pipes carry that heat up to Stirling engines.\n' +
      '• 3. Power: Heat pushes pistons inside the engines to spin generators—making up to 40 kilowatts of steady electricity, enough for 33 homes!',
    formalReference:
      'NASA GRC & Los Alamos National Laboratory — Kilopower Reactor Using Stirling Technology (KRUSTY); U.S. EIA Home Data.',
  },

  // ================= DAY 6 =================
  {
    id: 'day6_solar_storm',
    day: 6,
    sol: 'DAY 6',
    title: 'Solar Storm',
    images: ['logbook-solar-storm-1'],
    imageCaption: 'NASA Solar Dynamics Observatory Huge Solar Flare Eruption',
    factText:
      '• Sometimes our Sun blasts out huge flashes of light called Solar Flares and shoots giant clouds of fast tiny particles across space—a Solar Storm!\n' +
      '• Those invisible storm particles race faster than 2,000 kilometers every second.\n' +
      '• In May 2024, NASA’s space-weather satellites watched powerful X-class solar storms burst off the Sun toward Earth and Mars.',
    formalReference:
      'nasa-data/donki-table.csv, nasa-data/donki-snapshot.json, donki-FLR-raw.json & donki-CME-raw.json — NASA CCMC DONKI (May 2024 X5.8/X8.7 Flares, 2,119–2,678 km/s CMEs).',
  },
  {
    id: 'day6_mars_radiation',
    day: 6,
    sol: 'DAY 6',
    title: 'How It Affects Mars',
    images: ['logbook-solar-storm-2'],
    imageCaption: 'Solar Storm Particles Striking Mars Without a Magnetic Shield',
    factText:
      '• Earth has a strong magnetic shield and thick air to protect us, while Mars lacks a global magnetic shield—so solar storm rays hit the surface!\n' +
      '• In May 2024, NASA’s Curiosity rover measured storm radiation jumping over 60 times higher than calm days.\n' +
      '• Extra radiation can glitch electronics (why Safe Mode matters) and cause sickness over time, so stacking sealed water bags shields crew bunks because water slows rays down!',
    formalReference:
      'nasa-data/radlab-mars-summary.json & mars-may2024.csv (NASA OSDR Curiosity RAD, 274,998 readings); nasa-data/osdr-cards.json (OSD-360, studied in mice); nasa-data/README.md (Quinn et al., 2017).',
  },

  // ================= DAY 7 =================
  {
    id: 'day7_greenhouse',
    day: 7,
    sol: 'DAY 7',
    title: 'Greenhouse',
    images: ['logbook-greenhouse-1'],
    imageCaption: 'Astronaut Hydroponic Greenhouse Inside a Mars Habitat',
    factText:
      '• Every astronaut needs 1,900 to 3,200 calories of healthy food each day to stay strong!\n' +
      '• Because delivery rockets from Earth take many months to reach Mars, astronauts grow fresh crops on site in a Greenhouse.\n' +
      '• NASA and the Canadian Space Agency study fast crops like lettuce, radishes, wheat, and mustard plants (Arabidopsis)—even helping northern Earth towns grow fresh food!',
    formalReference:
      'nasa-data/food-facts.json — Canadian Space Agency (CSA: 1,900–3,200 kcal/day, northern Canada spinoff); nasa-data/osdr-cards.json — NASA OSDR OSD-38, OSD-16 & OSD-120.',
  },
  {
    id: 'day7_how_greenhouse_works',
    day: 7,
    sol: 'DAY 7',
    title: 'How a Greenhouse Works',
    images: [],
    vectorArt: 'greenhouse',
    imageCaption: 'Vector Diagram — Closed-Loop Martian Hydroponic Greenhouse',
    factText:
      '• Martian dirt is freezing and lacks friendly plant food, so space greenhouses use hydroponics—growing roots in warm nutrient water instead of dirt!\n' +
      '• Bright LED lamps shine like an indoor Sun while sealed water-bag walls block harsh space rays.\n' +
      '• Plants and crews team up: plants drink in the carbon dioxide we breathe out and give us oxygen plus crunchy vegetables!',
    formalReference:
      'nasa-data/osdr-cards.json (NASA OSDR Studies OSD-38, OSD-16 & OSD-120: Spaceflight Plant Roots, Light & Growth Genes); nasa-data/food-facts.json (CSA).',
  },

  // ================= FINALE (POST-CELEBRATION) =================
  {
    id: 'day8_apollo',
    day: 8,
    sol: 'FINALE',
    title: 'The Apollo Mission',
    images: ['logbook-foot-1'],
    imageCaption: 'Apollo 11 Astronaut Bootprint Left on the Moon in 1969',
    factText:
      '• In July 1969, NASA’s Apollo 11 astronauts Neil Armstrong and Buzz Aldrin became the first humans to walk on another world—our Moon!\n' +
      '• Because the Moon has no wind or rain, their famous footprints pressed into gray Moon dust are still sitting there over 50 years later.\n' +
      '• Today, NASA’s Moon orbiter tracks deep-space radiation to prepare future explorers for an even bigger journey ahead.',
    formalReference:
      'NASA Apollo 11 Lunar Surface Journal (1969); nasa-data/radlab-moon-summary2.json & moon-table.csv (LRO CRaTER, 13.15 uGy/h median); nasa-data/radlab-iss-summary.json.',
  },
  {
    id: 'day8_mars_future',
    day: 8,
    sol: 'FINALE',
    title: 'Your Mars Graduation',
    images: [],
    closingQuote: 'Maybe human will set foot on Mars one day...',
    factText:
      '• Congratulations, Junior Astronaut! Over 7 Sols you learned the exact survival science NASA uses to plan human missions:\n' +
      '  ✓ Solar arrays & 24/7 Kilopower nuclear fission\n' +
      '  ✓ Subsurface ice mining, 98% water recycling & MOXIE oxygen\n' +
      '  ✓ Space weather Safe Mode & water-bag radiation shields\n' +
      '  ✓ Hydroponic greenhouses for fresh food far from Earth',
    formalReference:
      'Complete NASA Data Archive: nasa-data/radlab-mars-summary.json, mars-may2024.csv, donki-table.csv, donki-snapshot.json, osdr-cards.json & food-facts.json.',
  },
];

const LEGACY_MAP = {
  comm_delay: 'day1_mars',
  regolith_3d: 'day1_spacecraft',
  solar_arrays: 'day2_solar_panels',
  mars_sunlight_43: 'day2_solar_space',
  opportunity_dust_2018: 'day3_curiosity',
  iss_electrolysis_moxie: 'day4_water_space',
  human_o2_consumption: 'day4_water_space',
};

const KEYWORD_MATCHES = [
  ['3-22 minutes', 'day1_mars'],
  ['Mars Dune Alpha', 'day1_spacecraft'],
  ['solar cells and panels', 'day2_solar_panels'],
  ['43% light level', 'day2_solar_space'],
  ['Opportunity went silent', 'day3_curiosity'],
  ['Mars Reconnaissance Orbiter', 'day4_mars_ice'],
  ['Phoenix lander', 'day4_mars_ice'],
  ['122 grams', 'day4_water_space'],
  ['0.84 kg', 'day4_water_space'],
  ['Kilopower', 'day5_fission_electricity'],
  ['solar storm', 'day6_solar_storm'],
  ['OSDR', 'day6_mars_radiation'],
  ['1,900', 'day7_greenhouse'],
];

/**
 * Matches either an explicit logbook entry ID, legacy ID, or a keyword inside a FactCard/Warning message.
 * @param {string} input
 * @returns {string|null}
 */
export function matchLogbookEntry(input) {
  if (!input || typeof input !== 'string') return null;
  const direct = LOGBOOK_ENTRIES.find((e) => e.id === input);
  if (direct) return direct.id;
  if (LEGACY_MAP[input]) return LEGACY_MAP[input];
  const lower = input.toLowerCase();
  const found = KEYWORD_MATCHES.find(([kw]) => lower.includes(kw.toLowerCase()));
  return found ? found[1] : null;
}
