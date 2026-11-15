# Junior Astronaut Trainer — NASA Data Integration, Game Facts & References

This document audits **every scientific fact, short note, bio-safety warning, minigame tooltip, and Logbook record** across the entire codebase (`src/`), traces how files in [`nasa-data/`](./) were integrated, and clearly separates **`nasa-data/` sources** from **3rd-party / external agency sources**. Where `nasa-data/` offers a direct alternative or more rigorous replacement for an external or simplified in-game statement, a dedicated **Replacement / Alternative from `nasa-data/`** subsection is provided alongside the original text for comparison.

---

## Part 1: Inventory & Integration of `nasa-data/` Directory (All 18 Files)

Only **4 files** from `nasa-data/` were directly transcribed as numeric/scientific constants into the game's Day 4–7 JavaScript scenes and tasks, while **3 files** provided naming/reference context (`README.md`, `donki-table.csv`, `donki-snapshot.json`) and **11 files** remained unused in `src/`. Note that `src/` stores these values as inline string literals and constants inside `OutpostScene.js`, `SurfaceScene.js`, `CropFarmTask.js`, `GreenhouseBuildTask.js`, and `WaterBagShieldTask.js` rather than importing the JSON/CSV files at runtime.

| # | `nasa-data/` File | Status in Game | Data / Records Extracted | Exact `src/` Integration Points | How It Was Integrated |
|---|---|---|---|---|---|
| 1 | `radlab-mars-summary.json` | **Directly Used (Day 4 & Day 5)** | Curiosity MSL-RAD 10-year summary (`274,998` readings, `2015-01-01` to `2024-06-03`): mean `7.83 uGy/hr`, `0.188 mGy/day`. | `SurfaceScene.js` (`L1163`, `L1180`, `L1185`); `OutpostScene.js` (`L1568`) | Powers Day 4 reactor Geiger badge (`GEIGER: 7.83 uGy/hr (SAFE — 100%)`), Maisha's radiation explanation, Day 4 `isFactReveal` short note, and Day 5 storm-vs-normal baseline comparison. |
| 2 | `mars-may2024.csv` | **Directly Used (Day 5 & Day 6)** | `2024-05-20` peak `303.99 uGy/h` (`139` readings, avg `69.34`); `2024-05-21` elevated shower avg `12.47 uGy/h`, max `21.08 uGy/h` (`108` readings). | `OutpostScene.js` (`L1568`, `L1661`); `SurfaceScene.js` (`L1247`) | Day 5 storm `isFactReveal` quotes `303.99 uGy/hr`; Day 6 NASA DSN Comms advisory quotes `12.47–21.08 uGy/hr bursts`; Day 6 surface Geiger badge displays `21.08 uGy/hr`. |
| 3 | `osdr-cards.json` | **Directly Used (Day 5 & Day 6)** | `OSD-360` (low-dose radiation biology at 1, 2, 4 months); `OSD-38`, `OSD-16`, `OSD-120` (`Arabidopsis` spaceflight plant studies). | `OutpostScene.js` (`L1613`, `L1676`); `CropFarmTask.js` (`L6`, `L113`) | `OSD-360` drives Day 5 bunk-shielding biological fact; `OSD-38/16/120` power Day 6 food-crisis fact and `Arabidopsis (OSD-38)` seed pack & footer in `CropFarmTask.js`. (`OSD-804`, `OSD-486`, `OSD-342` are unused.) |
| 4 | `food-facts.json` | **Directly Used (Day 6 & Day 7)** | Canadian Space Agency (CSA): astronauts need `1,900–3,200 kcal/day`; Mars Earth resupply is impossible; compact fresh space crops benefit remote northern Earth communities. | `OutpostScene.js` (`L1671`, `L1676`); `GreenhouseBuildTask.js` (`L177`); `CropFarmTask.js` (`L113`); `CelebrationScene.js` (`L161`) | Integrated into Day 6 morning dialogue, Day 6 food `isFactReveal` note, Greenhouse build subtitle, and Crop Farm plant/harvest footer. |
| 5 | `README.md` | **Reference Context** | Attribution rules (`NASA DONKI`, `NASA OSDR RadLab`), `uGy/h` caveats, median-vs-mean rules, and **Quinn et al. (2017)** (`DOI: 10.1051/swsc/2017014`) shielding paper. | `SurfaceScene.js` (`L1185`); `OutpostScene.js` (`L1276`, `L1568`) | Supplied the citation phrasing (`NASA DONKI`, `NASA OSDR RadLab`) and inspired the Day 5 water-bag radiation-shielding tradeoff. |
| 6 | `donki-table.csv` | **Citation Context Only** | May 2024 daily flare/CME/Kp/SEP summary table (`2024-05-03` to `2024-05-25`). | `OutpostScene.js` (`L1276`) | Referenced generically as `(Refs: NASA DONKI...)` on Day 4 Solar Storm card; exact flare classes/Kp values were not transcribed. |
| 7 | `donki-snapshot.json` | **Citation Context Only** | Detailed May 2024 CCMC DONKI CME speeds (`2,119–2,678 km/s`), flares (`X8.7`, `X5.8`, `X3.9`), `Kp=9`, SEP events. | `OutpostScene.js` (`L1256`, `L1276`) | Inspired the Day 4 DSN X-class flare/CME radio warning and `NASA DONKI` citation without embedding numeric Earth storm telemetry. |
| 8–18 | `moon-table.csv`, `radlab-moon-summary2.json`, `iss-may2024-table.csv`, `radlab-iss-summary.json`, `donki-CME-raw.json`, `donki-FLR-raw.json`, `donki-GST-raw.json`, `donki-SEP-raw.json`, `radlab-iss-may2024.csv`, `radlab-mars-raw.csv`, `radlab-moon-raw.csv` | **Unused** | Lunar LRO CRaTER orbital radiation & historical storms; ISS DosTel May 2024 shielded readings; raw DONKI JSON feeds; multi-MB raw RadLab CSV logs. | None in `src/` | Not referenced anywhere in `src/`; available below in Part 2 as `nasa-data/` alternatives/enhancements. |

---

## Part 2: All In-Game Facts & Short Notes by Day

> **Scope Note:** `FactCard` displays floating 15-second short notes (`fact:show` and `DialogueBox` `isFactReveal: true` entries, which also auto-log into `GameState`), `LogbookModal` (`src/data/logbookData.js`) expands the 7 Day 1–2 unlocked discoveries with technical telemetry, `WarningCard` presents biological/engineering survival thresholds, and task modals display educational footers. All of them are extracted below day-by-day.

---

### DAY 1 — Touchdown, Solar Array & Habitat Setup

#### Fact 1.1 — Earth–Mars Communication Delay
- **Trigger & Location:** Post-landing conversation (`isFactReveal: true`) in `src/scenes/SurfaceScene.js` (`L354–355`). Expanded in `src/data/logbookData.js` (`comm_delay`).
- **Verbatim In-Game Fact Text:**
  > `"Fact: depending on relative position of earth to mars, it can take from 3-22 minutes to send a message and get a response back between earth and mars due to the vast distance it has to cover."`
- **Logbook Expansion (`comm_delay`):** Adds orbital separation `54.6M – 401M km` and one-way light-time `3.0 – 22.3 min`.
- **Source Classification:** **3rd-Party / External NASA Source** (Not in `nasa-data/`).
- **Detailed References:**
  - NASA Jet Propulsion Laboratory (JPL), *Deep Space Network (DSN) Telecommunications Link Design Handbook (810-005)* — Earth–Mars one-way light-time propagation latency at conjunction vs. opposition (`54.6 million km` closest approach to `401 million km` farthest opposition at speed of light `c = 299,792.458 km/s`).
  - NASA Mars Exploration Program, *"Mars in a Minute / Communications with Earth"*: https://mars.nasa.gov/mars2020/spacecraft/rover/communications/
- **Replacement / Alternative from `nasa-data/`:** None in `nasa-data/` (directory covers radiation, space weather, space food, and OSDR biology rather than DSN RF link budgets).

---

#### Fact 1.2 — 3D-Printed Martian Regolith & Mars Dune Alpha
- **Trigger & Location:** Reaching the habitat exterior (`isFactReveal: true`) in `src/scenes/SurfaceScene.js` (`L403–404`). Expanded in `src/data/logbookData.js` (`regolith_3d`).
- **Verbatim In-Game Fact Text:**
  > `"Fact: NASA has plans to build an outpost on Mars Surface using regolith, a type of martian soil that can be compressed into bricks when combined with other chemicals, which will be 3D printed. The Mars Dune Alpha at the Johnson Space Centre has already simulated the process of building, on Earth in artificial environments"`
- **Logbook Expansion (`regolith_3d`):** Adds `1,700 sq ft Lavacrete` simulated habitat details.
- **Source Classification:** **3rd-Party / External NASA Source** (Not in `nasa-data/`).
- **Detailed References:**
  - NASA Johnson Space Center (JSC), *Crew Health and Performance Exploration Analog (CHAPEA)*, 2023 — 1,700-square-foot 3D-printed `Lavacrete` regolith-simulant habitat built with ICON at NASA JSC. Ref: `NASA JSC — CHAPEA, 2023` (https://www.nasa.gov/humans-in-space/chapea/).
  - NASA Marshall Space Flight Center (MSFC) / ICON, *3D-Printed Habitat Challenge & Olympus Project*.
- **Replacement / Alternative from `nasa-data/`:** None in `nasa-data/`.

---

#### Fact 1.3 — Spacecraft Solar Arrays in Deep Space
- **Trigger & Location:** Unfurling and aligning the solar array (`fact:show`) in `src/scenes/SurfaceScene.js` (`L476–477`). Expanded in `src/data/logbookData.js` (`solar_arrays`).
- **Verbatim In-Game Fact Text:**
  > `"Fact: NASA uses solar cells and panels on spacecraft to make them navigate on space where other manners of electricity production is impractical"`
- **Logbook Expansion (`solar_arrays`):** Adds `~30% Triple-Junction` photovoltaic efficiency and `240 kW` ISS solar array reference output.
- **Source Classification:** **3rd-Party / External NASA Source** (Not in `nasa-data/`).
- **Detailed References:**
  - NASA Glenn Research Center (GRC), *Space Photovoltaic Fact Sheet (`FS-2021-GRC`)* — triple-junction III-V solar cells (~30% efficiency) and International Space Station 8-wing Solar Array Wing (`240 kW` peak generation).
- **Replacement / Alternative from `nasa-data/`:** None in `nasa-data/`.

---

#### Fact 1.4 — 43% Martian Sunlight Intensity
- **Trigger & Location:** Entering the Outpost on Day 1 before switching on habitat lights (`fact:show`) in `src/scenes/OutpostScene.js` (`L385–386`). Expanded in `src/data/logbookData.js` (`mars_sunlight_43`).
- **Verbatim In-Game Fact Text:**
  > `"Fact: Mars surface has about 43% light level of earth, so its also harder for solar panels to recharge there"`
- **Logbook Expansion (`mars_sunlight_43`):** Adds `1.524 AU` mean solar distance, `~590 W/m² vs Earth 1,361 W/m²` solar irradiance, and `12.3-hour Martian night` (half of a `24h 39m 35s` Sol).
- **Source Classification:** **3rd-Party / External NASA Source** (Not in `nasa-data/`).
- **Detailed References:**
  - NASA Goddard Space Flight Center (GSFC), *National Space Science Data Center Coordinated Archive (NSSDCA) — Mars Fact Sheet*: https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html (`586.2–590 W/m²` mean solar irradiance at `1.524 AU` vs Earth `1,361 W/m²` = `43.1–43.4%`; mean solar day `24.6597 hr`).
- **Replacement / Alternative from `nasa-data/`:** None in `nasa-data/`.

---

### DAY 2 — Dust Storm Aftermath & Oxygen Production

#### Fact 2.1 — Opportunity Rover Silenced by the 2018 Global Dust Storm
- **Trigger & Location:** Morning of Day 2 inside Outpost (`fact:show`) in `src/scenes/OutpostScene.js` (`L498–499`). Expanded in `src/data/logbookData.js` (`opportunity_dust_2018`).
- **Verbatim In-Game Fact Text:**
  > `"Fact: NASA's Mars Exploration Rover Opportunity went silent in the global Martian dust storm of June 2018, and its mission was declared over in February 2019."`
- **Logbook Expansion (`opportunity_dust_2018`):** Adds atmospheric optical depth `tau > 10.8` and `5,111 Sols` total surface lifetime.
- **Source Classification:** **3rd-Party / External NASA Source** (Not in `nasa-data/`).
- **Detailed References:**
  - NASA/JPL-Caltech, *Mars Exploration Rover Opportunity (MER-B) Final Mission Report (Feb 13, 2019)* — Last contact June 10, 2018 (Sol 5111) as Perseverance Valley storm reached opacity `tau > 10.8`, cutting sunlight by >99.99%.
- **Replacement / Alternative from `nasa-data/`:** None in `nasa-data/`.

---

#### Fact 2.2 — ISS OGS Electrolysis & Perseverance MOXIE Oxygen Generation
- **Trigger & Location:** After drilling ice outside on Day 2 (`fact:show`) in `src/scenes/SurfaceScene.js` (`L779–780`). Expanded in `src/data/logbookData.js` (`iss_electrolysis_moxie`).
- **Verbatim In-Game Fact Text:**
  > `"Fact: Just like the ISS Oxygen Generation System (OGS) splits water into hydrogen and breathable oxygen via electrolysis, NASA's MOXIE experiment on Perseverance proved we can generate oxygen on Mars—producing 122 grams of pure oxygen."`
- **Source Classification:** **3rd-Party / External NASA & MIT Source** (Not in `nasa-data/`).
- **Detailed References:**
  - NASA/JPL-Caltech & MIT Haystack Observatory, *MOXIE (Mars Oxygen ISRU Experiment) Completion Report (Sept 2023)* — 16 runs producing a total of `122 grams` of `>=98%` pure O2 from Martian CO2 atmosphere (`https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/`).
  - NASA Marshall Space Flight Center (MSFC), *ISS Environmental Control and Life Support System (ECLSS) — Oxygen Generation System (OGS) Proton Exchange Membrane (PEM) Water Electrolysis*.
- **Replacement / Alternative from `nasa-data/`:** None in `nasa-data/`.

---

#### Fact 2.3 — Human Daily Oxygen Consumption (`0.84 kg O2/day`) & In-Situ O2
- **Trigger & Location:** Completing Oxygen Maker assembly & ice load inside Outpost (`fact:show`) in `src/scenes/OutpostScene.js` (`L727–728`), plus `WarningCard` in `src/scenes/tasks/OxygenBuildTask.js` (`L319–321`). Expanded in `src/data/logbookData.js` (`human_o2_consumption`).
- **Verbatim In-Game Text:**
  - Short Note (`OutpostScene.js:728`):
    > `"Fact: On Mars, splitting water with electricity makes O2 just like on the ISS. Perseverance's MOXIE also made ~122g of oxygen from Martian CO2 air. One person needs ~0.84 kg O2/day."`
  - Oxygen Rewind Warning (`OxygenBuildTask.js:320`):
    > `"You can't survive without oxygen! One astronaut needs about 0.84 kg of oxygen a day. Allocate power to the Oxygen Maker!"`
- **Source Classification:** **3rd-Party / External NASA Source** (Not in `nasa-data/`).
- **Detailed References:**
  - NASA, *NASA Space Flight Human-System Standard (`NASA-STD-3001`, Vol. 2: Human Factors, Habitability, and Environmental Health)* — Nominal metabolic O2 consumption `~0.835–0.84 kg/crewmember-day` (`1.85 lb/day`).
  - NASA Technical Publication `NASA/TP-2015-218570` (*Life Support Baseline Values and Assumptions Document*).
- **Replacement / Alternative from `nasa-data/`:** None in `nasa-data/`.

---

### DAY 3 — Water Crisis, Subsurface Ice & ISS Water Recycling

#### Fact 3.1 — Mars Low-Pressure Subsurface Ice (MRO Mapping)
- **Trigger & Location:** Morning of Day 3 inside Outpost (`fact:show`) in `src/scenes/OutpostScene.js` (`L784–785`).
- **Verbatim In-Game Fact Text:**
  > `"Fact: Liquid water cannot stay on Mars's low-pressure surface, so astronauts must drill buried water ice—mapped globally by NASA's Mars Reconnaissance Orbiter."`
- **Source Classification:** **3rd-Party / External NASA Source** (Not in `nasa-data/`, and not yet added to `logbookData.js`).
- **Detailed References:**
  - NASA/JPL-Caltech, *Mars Reconnaissance Orbiter (MRO) — SHARAD (Shallow Radar) & HiRISE Water Ice Mapping* (Mars surface pressure `~6–7 mbar`, below the `6.11657 mbar` triple point of water across most elevations; Subsurface Water Ice Mapping / SWIM project).
- **Replacement / Alternative from `nasa-data/`:** None in `nasa-data/`.

---

#### Fact 3.2 — Phoenix Lander 2008 Subsurface Ice Discovery
- **Trigger & Location:** After drilling ice outside on Day 3 (`fact:show`) in `src/scenes/SurfaceScene.js` (`L886–887`).
- **Verbatim In-Game Fact Text:**
  > `"Fact: NASA's Phoenix lander uncovered bright subsurface water ice just centimeters beneath Martian soil in 2008—confirming astronauts can harvest local ice!"`
- **Source Classification:** **3rd-Party / External NASA Source** (Not in `nasa-data/`).
- **Detailed References:**
  - NASA/JPL-Caltech & University of Arizona, *Phoenix Mars Scout Lander Mission (2008)* — Robotic Arm trench ("Dodo-Goldilocks", June 2008) exposed bright subsurface water-ice deposits ~`5 cm` beneath regolith that sublimated over 4 Sols (Smith et al., *Science*, 2009).
- **Replacement / Alternative from `nasa-data/`:** None in `nasa-data/`.

---

#### Fact 3.3 — ISS ~98% Closed-Loop Water Recovery
- **Trigger & Location:** Completing Day 3 Water Station repair & ice load (`fact:show`) in `src/scenes/OutpostScene.js` (`L1090–1091`).
- **Verbatim In-Game Fact Text:**
  > `'Fact: On the International Space Station, NASA recycles ~98% of all water using heat, distillation, and filtration beds so crews never run dry!'`
- **Source Classification:** **3rd-Party / External NASA Source** (Not in `nasa-data/`).
- **Detailed References:**
  - NASA Johnson Space Center & Marshall Space Flight Center, *ISS ECLSS Water Recovery System (WRS) Milestone Update (June 2023)* — achieved `~98%` closed-loop water recovery across Urine Processor Assembly (UPA), Brine Processor Assembly (BPA), and Water Processor Assembly (WPA) catalytic/filtration beds.
- **Replacement / Alternative from `nasa-data/`:** None in `nasa-data/`.

---

#### Fact 3.4 — Human Dehydration Limit (~3 Days Without Water)
- **Trigger & Location:** Rewind Warning inside `src/scenes/tasks/WaterBuildTask.js` (`L397–399`).
- **Verbatim In-Game Text:**
  > `'Warning: Without power to heat and purify Martian ice, the crew will dehydrate! Humans can survive only about 3 days without water.'`
- **Source Classification:** **3rd-Party / External Medical & NASA Reference** (Not in `nasa-data/`).
- **Detailed References:**
  - General human physiology benchmark & NASA `NASA-STD-3001` hydration / fluid-loss survival thresholds (critical acute water deprivation threshold `~3 days` under nominal thermal loads).
- **Replacement / Alternative from `nasa-data/`:** None in `nasa-data/`.

---

### DAY 4 — Kilopower Nuclear Fission, Background Radiation, Solar Storms & Safe Mode

#### Fact 4.1 — Martian Solar Deficit vs. Kilopower 10–40 kW Nuclear Fission
- **Trigger & Location:** After aligning solar panels during Day 4 (`fact:show`) in `src/scenes/SurfaceScene.js` (`L1119–1120`), plus footer in `src/scenes/tasks/ReactorBuildTask.js` (`L188`).
- **Verbatim In-Game Text:**
  - Short Note (`SurfaceScene.js:1120`):
    > `"Fact: At ~43% of Earth's sunlight, Martian solar power delivers under 1 kW on dusty days and 0 kW at night. NASA's Kilopower nuclear reactor produces 10–40 kW non-stop—40 kW powers ~33 average American homes (U.S. EIA avg ~1.2 kW/home)!"`
  - Reactor Mini-Game Footer (`ReactorBuildTask.js:188`):
    > `'A small Kilopower fission unit supplies steady 40 kW electricity day & night!'`
- **Source Classification:** **3rd-Party / External NASA, LANL & U.S. EIA Sources** (Not in `nasa-data/`).
- **Detailed References:**
  - NASA Glenn Research Center (GRC) & Los Alamos National Laboratory (LANL), *Kilopower Reactor Using Stirling Technology (KRUSTY) Mars Surface Power Architecture* (1–10 kWe modular units, 4×10 kW = `40 kWe` nominal outpost architecture: https://www.nasa.gov/tdm/kilopower/).
  - U.S. Energy Information Administration (EIA), *Residential Electricity Consumption Survey / FAQ* (~`10,500–10,791 kWh/yr` average U.S. home = `~1.2 kW` continuous average load; `40 kW / 1.2 kW ≈ 33.3 homes`).
  - NASA GSFC NSSDCA *Mars Fact Sheet* (`~43%` solar irradiance).
- **Replacement / Alternative from `nasa-data/`:** None in `nasa-data/`.

---

#### Fact 4.2 — Mars Surface Background Radiation (`7.83 uGy/hr`, Geiger Counter)
- **Trigger & Location:** After assembling Kilopower on Day 4 (`isFactReveal: true`) in `src/scenes/SurfaceScene.js` (`L1184–1185`), plus Geiger badge (`L1163`) and Maisha dialogue (`L1180`).
- **Verbatim In-Game Text:**
  > `'NASA Fact — Mars Surface Background Radiation: Measurements from NASA Curiosity MSL-RAD (274,998 archived readings in NASA OSDR RadLab) show an average Mars surface background of ~7.83 uGy/hr (0.188 mGy/day)—totally non-lethal over short EVAs, though astronauts track cumulative exposure closely. (Refs: NASA OSDR RadLab / Curiosity MSL-RAD)'`
  - Geiger Badge (`SurfaceScene.js:1163`): `'GEIGER: 7.83 uGy/hr (SAFE — 100%)'`
- **Source Classification:** **Directly from `nasa-data/` Directory** (`radlab-mars-summary.json`).
- **Detailed References (`nasa-data/`):**
  - `nasa-data/radlab-mars-summary.json`: `mission: "MSL"`, `instrument: "RAD"`, `target: "Mars"`, `unit: "uGy/h"`, `dateRange: "2015-01-01 to 2024-06-03"`, `totalReadings: 274998`, `avgUGyPerHour: 7.83`, `avgMGyPerDay: 0.188`, `min: 0.98224556`, `max: 303.98798`, `yearlyAverages`: `2015: 7.51`, `2016: 8.15`, `2017: 7.91`, `2018: 8.76`, `2019: 9.75`, `2020: 9.4`, `2021: 9.21`, `2022: 8.07`, `2023: 5.95`, `2024: 5.65`.
  - NASA Open Science Data Repository (OSDR) RadLab Portal / Curiosity Mars Science Laboratory Radiation Assessment Detector (MSL-RAD).
- **Replacement / Alternative from `nasa-data/` (Per `nasa-data/README.md` Rule 5 & Multi-World Summaries):**
  - **Why consider an alternative?** `nasa-data/README.md` Rule 5 cautions: *"Use the median for a mission's 'typical' level — it ignores storm spikes. Don't say 'typical is 304' when 304 is the stormiest reading."* The `7.83 uGy/hr` number in `radlab-mars-summary.json` is the **10-year arithmetic mean** (which includes storm spikes up to `303.99 uGy/hr`, e.g., May 20, 2024). In calm conditions from `mars-may2024.csv` (days without storms, 2024-05-01 to 2024-05-19 & 2024-05-22 to 2024-05-31), daily averages cluster tightly around **`3.79 – 5.41 uGy/h`** (calm median **`~4.6–4.8 uGy/h`**), and the 2024 yearly average is **`5.65 uGy/h`**.
  - **Original (Kept for Comparison):**
    > `'...show an average Mars surface background of ~7.83 uGy/hr (0.188 mGy/day)...'`
  - **Replacement Using `nasa-data/mars-may2024.csv` + `nasa-data/radlab-mars-summary.json` + Cross-World Context (`radlab-iss-summary.json` & `radlab-moon-summary2.json`):**
    > `'NASA Fact — Mars Surface Background Radiation: Across 274,998 Curiosity MSL-RAD readings in NASA OSDR RadLab (2015–2024), calm Martian surface days stay around ~4.6 uGy/hr (May 2024 quiet days: 3.79–5.41 uGy/hr), with a 10-year storm-inclusive mean of 7.83 uGy/hr (0.188 mGy/day)—close to shielded ISS orbit (~4.6 uGy/hr median, ISS DosTel) and lower than unshielded lunar orbit (13.15 uGy/hr median, LRO CRaTER). (Refs: nasa-data/radlab-mars-summary.json; nasa-data/mars-may2024.csv; nasa-data/radlab-iss-summary.json; nasa-data/radlab-moon-summary2.json)'`

---

#### Fact 4.3 — Solar Storms on Mars (CME / SEP Warning & May 2024 Global Event)
- **Trigger & Location:** Day 4 Evening Comms Alert (`isFactReveal: true`) in `src/scenes/OutpostScene.js` (`L1275–1276`), preceded by DSN radio alert (`L1256`).
- **Verbatim In-Game Text:**
  > `'NASA Fact — Solar Storms on Mars: A solar storm (CME & Solar Energetic Particle event) blasts high-energy radiation and plasma across space. Unlike Earth, Mars has no global magnetic field and just ~1% of Earth’s atmosphere, so particles strike directly—causing radiation spikes and voltage surges in unshielded electronics. Major events like the May 2024 X-class storm triggered global Mars auroras and Curiosity RAD alerts. (Refs: NASA DONKI; NASA MAVEN & Curiosity RAD; NASA OSDR RadLab)'`
- **Source Classification:** **Mixed (`nasa-data/` Context + 3rd-Party Planetary/MAVEN Facts)**
  - **From `nasa-data/`:** References to `NASA DONKI`, `NASA OSDR RadLab`, and the May 2024 X-class storm event (`donki-table.csv`, `donki-snapshot.json`, `mars-may2024.csv`).
  - **From 3rd-Party / External:** Mars lacking a global dipole magnetic field, having `~1%` of Earth's surface atmospheric pressure (~`6 mbar` vs `1013 mbar`), induced voltage surges, and NASA MAVEN May 2024 global Mars auroras.
- **Detailed References:**
  - `nasa-data/donki-table.csv` & `nasa-data/donki-snapshot.json` (NASA CCMC DONKI, `https://ccmc.gsfc.nasa.gov/tools/DONKI/`).
  - `nasa-data/mars-may2024.csv` (May 20, 2024 MSL-RAD spike).
  - NASA MAVEN & Curiosity Mission Update (June 2024), *"NASA Watches Mars Light Up During Epic Solar Storm"* — May 2024 X-class flares & global proton/UV auroras observed by MAVEN.
  - NASA GSFC NSSDCA *Mars Fact Sheet* (`~1%` atmospheric surface density/pressure, absence of global intrinsic magnetic dipole).
- **Replacement / Alternative from `nasa-data/` (`donki-table.csv`, `donki-snapshot.json`, `mars-may2024.csv`, `moon-table.csv`):**
  - **Why add concrete `nasa-data/` telemetry?** Currently the Day 4 card says `"Major events like the May 2024 X-class storm"` without using the real DONKI magnitudes/speeds in `donki-snapshot.json` / `donki-table.csv`, and doesn't show the key `README.md` Rule 6 contrast between Earth-side DONKI storm levels and Mars-side RAD spikes.
  - **Original (Kept for Comparison):**
    > `'Major events like the May 2024 X-class storm triggered global Mars auroras and Curiosity RAD alerts. (Refs: NASA DONKI; NASA MAVEN & Curiosity RAD; NASA OSDR RadLab)'`
  - **Replacement / Enriched Telemetry Using `nasa-data/donki-table.csv`, `nasa-data/donki-snapshot.json` & `nasa-data/mars-may2024.csv`:**
    > `'NASA Fact — May 2024 Solar Storms (DONKI & Mars RAD): NASA DONKI recorded multiple X-class flares including May 11 (X5.8, Kp 9 geomagnetic storm & SEP), May 14 (X8.7 flare + 2,119 km/s CME), and a 2,678 km/s CME on May 20, 2024. On May 20, even when Earth DONKI storm level sat at 0, Curiosity RAD on Mars spiked to 303.99 uGy/hr (avg 69.34 uGy/hr vs ~4.8 uGy/hr calm), because Mars lacks a global magnetic field and has ~1% of Earth’s atmosphere. (Refs: nasa-data/donki-table.csv; nasa-data/donki-snapshot.json; nasa-data/mars-may2024.csv; NASA MAVEN)'`
  - *(Optional Deep-Space Comparison in `nasa-data/moon-table.csv` & `donki-SEP-raw.json`)*: LRO CRaTER around the Moon recorded `33,936.4 uGy/hr` on `2012-01-24` and `28,924.0 uGy/hr` on `2012-03-08` (top SEP events in `moon-table.csv`).

---

#### Fact 4.4 — Habitat & Spacecraft Safe Mode Fault Protection
- **Trigger & Location:** Day 4 Evening Comms sequence (`isFactReveal: true`) in `src/scenes/OutpostScene.js` (`L1284–1285`), plus Power Panel toggle description in `src/scenes/tasks/PowerPanelTask.js` (`L188`) and rewind warning in `RoomScene.js` (`L641`) / `PowerPanelTask.js` (`L693`).
- **Verbatim In-Game Text:**
  - Short Note (`OutpostScene.js:1285`):
    > `'NASA Fact — Habitat & Spacecraft Safe Mode: When a solar particle storm hits, NASA flight controllers place rovers and habitats into Safe Mode—isolating vulnerable electronic buses through surge-protection relays so induced currents cannot fry hardware, while preserving vital life-support loops. (Refs: NASA JPL Fault Protection Guide; NASA Goddard Space Weather Center)'`
  - Rewind Warning (`RoomScene.js:641` / `PowerPanelTask.js:693`):
    > `'Warning: Sleeping without SAFE MODE during a Martian solar storm will overload and destroy the habitat electronics! Enable SAFE MODE on the Power Panel.'`
- **Source Classification:** **3rd-Party / External NASA Engineering Sources** (Not in `nasa-data/`).
- **Detailed References:**
  - NASA Jet Propulsion Laboratory (JPL), *Spacecraft Fault Protection & Safe Mode Design Principles* (isolated secondary science payloads / non-essential buses while preserving thermal, power, and command loops; e.g., Mars Odyssey / MRO / Curiosity safe-mode transitions).
  - NASA Goddard Space Flight Center, *Space Weather Research Center (SWRC) / CCMC Operational Advisories*.
- **Replacement / Alternative from `nasa-data/`:** None directly for Safe Mode relay engineering; operational storm-trigger examples come from `nasa-data/donki-SEP-raw.json` (instruments `GOES-P`, `SOHO`, `STEREO A` issuing real-time Solar Energetic Particle alerts) and `nasa-data/donki-table.csv` (`hasSEP: true` on May 9, 10, 11, 2024).

---

### DAY 5 — Solar Storm Shelter & Water-Bag Bunk Shielding

#### Fact 5.1 — Mars Solar Storm Peak (`303.99 uGy/hr`) & Sealed Water-Bag Shielding
- **Trigger & Location:** Day 5 Morning inside Outpost (`isFactReveal: true`) in `src/scenes/OutpostScene.js` (`L1567–1568`), plus `WaterBagShieldTask.js` (`L261`) and `RoomScene.js` (`L177`) / `HudScene.js` (`L626`).
- **Verbatim In-Game Text:**
  - Short Note (`OutpostScene.js:1568`):
    > `'NASA Fact — Mars Solar Storm & Water-Bag Shielding: In May 2024, NASA Curiosity RAD recorded a Mars peak of 303.99 uGy/hr (vs 7.83 uGy/hr normal). Hydrogen-rich water slows cosmic & solar protons without wasting mass—astronauts can even drink the sealed shielding water later! (Refs: NASA OSDR RadLab Mars-May2024; NASA JPL)'`
  - Shielding Minigame Footer (`WaterBagShieldTask.js:261`):
    > `'Hydrogen in sealed water slows & blocks gamma/particle radiation with 0% H2O wastage!'`
- **Source Classification:** **Mixed (`nasa-data/` Storm Readings + 3rd-Party Shielding Physics)**
  - **From `nasa-data/`:** `303.99 uGy/hr` peak (`nasa-data/mars-may2024.csv` row `2024-05-20`, highest = `303.99 uGy/h`, average = `69.34 uGy/h`, 139 readings; `radlab-mars-summary.json` `max: 303.98798`, `avgUGyPerHour: 7.83`).
  - **From 3rd-Party / External:** Hydrogen-rich H2O proton stopping power & "Water Walls" / potable bunk shielding mass reuse.
- **Detailed References:**
  - `nasa-data/mars-may2024.csv` (`date: 2024-05-20`, `readings: 139`, `avgUGyPerHour: 69.34`, `maxUGyPerHour: 303.99`).
  - `nasa-data/radlab-mars-summary.json` (`avgUGyPerHour: 7.83`, `max: 303.98798`).
  - NASA Ames / Advanced Exploration Systems, *"Water Walls" Life Support & Radiation Shielding Architecture* (using potable water/wastewater bladders around crew quarters; low-Z hydrogen atoms minimize secondary bremsstrahlung neutrons vs. high-Z metals).
  - NASA Exploration Crew Health, *ISS Water-Bag / Polyethylene Crew Quarters Storm Shelter Protocols*.
- **Replacement / Alternative from `nasa-data/` (`README.md` Quinn et al. 2017 & `radlab-iss-summary.json` / `mars-may2024.csv`):**
  - **Why consider `nasa-data/` alternatives?**
    1. `nasa-data/README.md` cites **Quinn et al. (2017)** (`doi:10.1051/swsc/2017014`) proving quantitatively how shielding areal density (`0.3 g/cm²` thin aluminum vs `10 g/cm²` thick aluminum) determines whether solar storm exposure crosses the 30-day skin dose limit.
    2. `mars-may2024.csv` `2024-05-20` has `69.34 uGy/h` 24-hr mean (`~1.66 mGy/day`) with a `303.99 uGy/h` peak, while calm May days are `3.79–5.41 uGy/h` (rather than the storm-inflated `7.83 uGy/hr` 10-yr mean).
    3. `radlab-iss-summary.json` (`median ~4.6 uGy/h` across May 2024 inside ISS modules) shows how spacecraft hull shielding keeps LEO crews near calm levels during the same May 2024 solar storm week.
  - **Original (Kept for Comparison):**
    > `'In May 2024, NASA Curiosity RAD recorded a Mars peak of 303.99 uGy/hr (vs 7.83 uGy/hr normal). Hydrogen-rich water slows cosmic & solar protons without wasting mass—astronauts can even drink the sealed shielding water later! (Refs: NASA OSDR RadLab Mars-May2024; NASA JPL)'`
  - **Replacement Using `nasa-data/README.md` + `nasa-data/mars-may2024.csv` + `nasa-data/radlab-iss-summary.json`:**
    > `'NASA Fact — Mars Solar Storm Peak & Shielding Thickness: On May 20, 2024, Curiosity RAD measured an average of 69.34 uGy/hr and a peak of 303.99 uGy/hr (over 60× calm May days at ~4.8 uGy/hr), whereas inside the shielded ISS DosTel detectors held a median of ~4.6 uGy/hr. Modeling by Quinn et al. (2017, DOI: 10.1051/swsc/2017014) confirms thin shielding (0.3 g/cm² Al) risks exceeding 30-day skin dose limits during strong SEPs while thick shielding (10 g/cm² Al—or hydrogen-rich potable water walls) keeps crews safe! (Refs: nasa-data/mars-may2024.csv; nasa-data/radlab-iss-summary.json; nasa-data/README.md — Quinn et al., 2017)'`

---

#### Fact 5.2 — Low-Dose Cumulative Radiation Biology (`OSD-360`)
- **Trigger & Location:** After placing all 5 water bags around the Bunks on Day 5 (`isFactReveal: true`) in `src/scenes/OutpostScene.js` (`L1612–1613`).
- **Verbatim In-Game Fact Text:**
  > `'NASA Fact — Low-Dose Radiation Biology (OSD-360): Even small cumulative radiation doses caused measurable tissue responses 1–4 months later in space studies—making bunk H2O shielding vital whenever solar storms hit Mars. (Refs: NASA OSDR Study OSD-360)'`
- **Source Classification:** **Directly Adapted from `nasa-data/` Directory** (`osdr-cards.json` -> `OSD-360`).
- **Detailed References (`nasa-data/`):**
  - `nasa-data/osdr-cards.json`, card `id: "OSD-360"`:
    - `title`: `"How does space radiation change the body months later?"`
    - `organism`: `"mice"`
    - `simple`: `"Scientists gave mice small doses of three kinds of radiation, then checked their spleens 1, 2 and 4 months later. Even small doses left effects months after exposure ended."`
    - `why`: `"Mars astronauts will get steady low radiation doses for months. NASA needs to shield crews and watch their health over time."`
- **Replacement / Alternative from `nasa-data/` (`osdr-cards.json` & `README.md` Rule 7 + Unused Health Cards):**
  - **Why replace?** `nasa-data/README.md` Rule 7 explicitly instructs: **"Keep the 'studied in' tag on each card. Never claim an animal study happened in humans."** The current in-game text omits `"mice"` and `"spleens"`, generalizing to `"in space studies"`. Also `osdr-cards.json` contains **3 unused crew-health studies** (`OSD-804`, `OSD-486`, `OSD-342`) if additional crew biology notes are wanted.
  - **Original (Kept for Comparison):**
    > `'NASA Fact — Low-Dose Radiation Biology (OSD-360): Even small cumulative radiation doses caused measurable tissue responses 1–4 months later in space studies—making bunk H2O shielding vital whenever solar storms hit Mars. (Refs: NASA OSDR Study OSD-360)'`
  - **Replacement Using Exact `nasa-data/osdr-cards.json` (`OSD-360`) Text:**
    > `'NASA Fact — Low-Dose Radiation Biology (OSD-360, Studied in Mice): Scientists gave mice small doses of three kinds of radiation and examined their spleens 1, 2, and 4 months later. Even small doses left measurable effects months after exposure ended—showing why astronauts on Mars need bunk H2O shielding and continuous health tracking! (Refs: nasa-data/osdr-cards.json — OSD-360)'`
  - **Additional Unused Biology Cards Available in `nasa-data/osdr-cards.json`:**
    - `OSD-804` (*Studied in mice*): Low gravity weakens muscles even during a 30-day mission.
    - `OSD-486` (*Studied in mice*): After 13 days in space, mouse bones took months to rebuild; Mars trips last 2–3 years.
    - `OSD-342` (*Studied in mice*): Without strong gravity, fluids drift toward the head, changing the brain's protective outer covering.

---

### DAY 6 — Radiation Shower, Food Crisis & Mars Greenhouse

#### Fact 6.1 — Post-Storm Elevated Particle Shower (`12.47–21.08 uGy/hr`)
- **Trigger & Location:** Day 6 Morning Comms broadcast (`isRadio: true`) in `src/scenes/OutpostScene.js` (`L1658–1661`) and Day 6 Surface Geiger Badge in `src/scenes/SurfaceScene.js` (`L1247`).
- **Verbatim In-Game Text:**
  - Comms Radio (`OutpostScene.js:1661`):
    > `'—SOLAR ADVISORY— Main flare peak has subsided, but an elevated particle radiation shower (12.47–21.08 uGy/hr bursts) persists on the Martian surface. Work fast on any EVA!'`
  - Surface Geiger Badge (`SurfaceScene.js:1247`):
    > `'GEIGER ALERT: 21.08 uGy/hr — LIMIT EVA TIME!'`
- **Source Classification:** **Directly from `nasa-data/` Directory** (`mars-may2024.csv`).
- **Detailed References (`nasa-data/`):**
  - `nasa-data/mars-may2024.csv`, row `2024-05-21`: `readings: 108`, `avgUGyPerHour: 12.47`, `maxUGyPerHour: 21.08` — exact day-after storm recovery telemetry from NASA Curiosity MSL-RAD.
- **Replacement / Alternative from `nasa-data/`:** Already uses exact `nasa-data/mars-may2024.csv` row `2024-05-21` values verbatim.

---

#### Fact 6.2 — Astronaut Calorie Needs (`1,900–3,200 kcal/day`), Impossible Resupply & Space Crops
- **Trigger & Location:** Day 6 Morning dialogue & `isFactReveal` card in `src/scenes/OutpostScene.js` (`L1671`, `L1675–1676`), plus `GreenhouseBuildTask.js` (`L177`) and `CropFarmTask.js` (`L5–9`, `L113`).
- **Verbatim In-Game Text:**
  - Short Note (`OutpostScene.js:1676`):
    > `'NASA & CSA Space Food Data: Astronauts need 1,900–3,200 kcal/day, and Earth deliveries are impossible on Mars. Hydroponic studies like Arabidopsis (NASA OSDR OSD-38, OSD-16, OSD-120), dwarf wheat, lettuce & radishes provide sustainable nutrition—even inspiring northern Earth farming! (Refs: CSA Food Facts; NASA OSDR OSD-38/16/120)'`
  - Greenhouse Footer (`GreenhouseBuildTask.js:177`):
    > `'Compact closed-loop hydroponics grow fresh crops far from Earth resupply.'`
  - Crop Farming List & Footer (`CropFarmTask.js:6–9, 113`):
    - Crops: `Arabidopsis (OSD-38)`, `Dwarf Space Wheat`, `Red Romaine Lettuce`, `Radish Microgreens`
    - Footer: `'CSA & NASA OSDR (OSD-38/16/120): Astronauts need 1,900-3,200 kcal/day from compact fresh crops.'`
- **Source Classification:** **Mixed (`nasa-data/` CSA + OSDR Cards + 3rd-Party Crop Additions)**
  - **From `nasa-data/food-facts.json` (CSA):**
    - `1,900–3,200 kcal/day` caloric requirement (`"How much food does one astronaut need each day?"`).
    - Earth deliveries impossible on Mars (`"Can we just send delivery rockets to Mars?"`: ISS gets shipments every few months, Mars resupply takes too long so astronauts must grow their own food).
    - Compact, lightweight, nutritious, tasty, and mission-length shelf-life constraints (`"What makes good space food?"`, `"How long does space food need to stay fresh?"`).
    - Spinoff benefit to remote northern Earth communities (`"How does space food research help Earth?"` — specifically mentions *northern Canada*).
  - **From `nasa-data/osdr-cards.json` (`OSD-38`, `OSD-16`, `OSD-120`):**
    - `OSD-38`: *"What happens when plants grow in space?"* (Arabidopsis DNA/root & leaf changes under spaceflight).
    - `OSD-16`: *"How do plants turn light and gravity into growth?"* (Arabidopsis growth signaling genes).
    - `OSD-120`: *"How do plants adapt so fast to microgravity?"* (Arabidopsis rapid genetic switch in microgravity).
  - **From 3rd-Party / External NASA Crop Research (Not in `nasa-data/`):**
    - Specific crop names `Dwarf Space Wheat`, `Red Romaine Lettuce` ("Outredgeous" grown on ISS Veggie), and `Radish Microgreens` (Plant Habitat-02 ISS radish study) were added externally for kid-friendly edible variety (`food-facts.json` does not name specific crops, and `osdr-cards.json` only lists `Arabidopsis`).
- **Detailed References:**
  - `nasa-data/food-facts.json` -> Canadian Space Agency (CSA): `https://www.asc-csa.gc.ca/eng/sciences/food-production/growing-healthy-food-in-space-and-remote-areas.asp`
  - `nasa-data/osdr-cards.json` -> NASA OSDR studies `OSD-38`, `OSD-16`, `OSD-120` (`organism: "Arabidopsis"`).
  - External (for 3 edible crops): NASA Veggie & Advanced Plant Habitat (APH) ISS experiments (*Red Romaine Lettuce* — Veggie VEG-01/03; *Radish* — APH-02; *Dwarf Wheat* — Lada/SVET space greenhouse heritage).
- **Replacement / Alternative from `nasa-data/` (`food-facts.json` & `osdr-cards.json`):**
  - **Why offer a strict `nasa-data/` replacement?** If you want 100% traceability solely to `nasa-data/` without external edible-crop names (`dwarf wheat, lettuce & radishes`), the replacement uses only CSA `food-facts.json` + OSDR `Arabidopsis` (`OSD-38`, `OSD-16`, `OSD-120`).
  - **Original (Kept for Comparison):**
    > `'NASA & CSA Space Food Data: Astronauts need 1,900–3,200 kcal/day, and Earth deliveries are impossible on Mars. Hydroponic studies like Arabidopsis (NASA OSDR OSD-38, OSD-16, OSD-120), dwarf wheat, lettuce & radishes provide sustainable nutrition—even inspiring northern Earth farming! (Refs: CSA Food Facts; NASA OSDR OSD-38/16/120)'`
  - **Strict `nasa-data/`-Only Replacement (`food-facts.json` + `osdr-cards.json`):**
    > `'CSA & NASA OSDR Space Food Data: Astronauts burn 1,900–3,200 calories each day. Unlike the ISS (resupplied every few months), Mars crews cannot rely on Earth deliveries and must grow compact, lightweight, nutritious, shelf-stable food on site. Model plant studies like Arabidopsis (NASA OSDR OSD-38, OSD-16, OSD-120) reveal how plants adapt roots, leaves, and growth genes off Earth—research that also helps remote communities like northern Canada grow fresh food! (Refs: nasa-data/food-facts.json — CSA; nasa-data/osdr-cards.json — OSD-38, OSD-16, OSD-120)'`

---

#### Fact 6.3 — Crew Dose-Rotation & Radiation Sickness Warning
- **Trigger & Location:** Non-canon Day 6 swap rejection in `src/scenes/SurfaceScene.js` (`L1472–1475`) and `src/scenes/HudScene.js` (`L706–709`).
- **Verbatim In-Game Text:**
  - `SurfaceScene.js:1473`: `'RADIATION SICKNESS: Pushing Muntasir past safe dose limits risks severe radiation injury! Rewind and swap with Maisha to rotate crew exposure.'`
  - `HudScene.js:707`: `'RADIATION DANGER: Extended outdoor exposure reached lethal dose limits! Rotate crew or rewind!'`
- **Source Classification:** **3rd-Party / General NASA ALARA Dose-Management Principle** (Inspired by `radlab-mars-summary.json` / `osdr-cards.json` `OSD-360` cumulative tracking).
- **Detailed References:**
  - NASA *ALARA ("As Low As Reasonably Achievable")* crew radiation rotation principle & `NASA-STD-3001` Career Effective Dose Limit (`600 mSv` NASA career limit updated in 2022).
- **Replacement / Alternative from `nasa-data/`:** `nasa-data/osdr-cards.json` (`OSD-360`) and `nasa-data/README.md` (Quinn et al., 2017 — 30-day skin dose limit modeling) provide the quantitative justification in `nasa-data/`.

---

### DAY 7 — Optimization, Shielding Both Surface Sites & Harvest

Day 7 reuses the educational modals from Day 5 and Day 6 rather than adding new `FactCard` popups:
- **`WaterBagShieldTask.js` (`L261`):** Placed around `Ice Drill Site` and `Mars Greenhouse` (`mode: 'ice_site'` and `mode: 'greenhouse'`):
  > `'Hydrogen in sealed water slows & blocks gamma/particle radiation with 0% H2O wastage!'`
  *(See Fact 5.1 above for sources & `nasa-data/README.md` Quinn et al., 2017 alternative.)*
- **`CropFarmTask.js` (`L113`):** Harvesting the 4 crops into Crew Ration Crate (`mode: 'harvest'`):
  > `'CSA & NASA OSDR (OSD-38/16/120): Astronauts need 1,900-3,200 kcal/day from compact fresh crops.'`
  *(See Fact 6.2 above for exact `nasa-data/food-facts.json` & `nasa-data/osdr-cards.json` breakdown.)*

---

### Cross-Cutting UI & Logbook Meta-Note

- **`HudScene.js` (`L1278` — First-Time Logbook Introduction Note):**
  > `'MISSION LOGBOOK UPDATED!\n\nMaisha records every NASA fact, mission photo, and reference\nin this open 2-page journal.\n\nWhenever you see the RED DOT on the Logbook icon above,\na new discovery has been added. Click it anytime to flip pages!'`
- **Note on Logbook Persistence (`src/data/logbookData.js` vs `GameState.js`):**
  - `src/data/logbookData.js` defines rich 2-page journal cards with Wikimedia/NASA open-license images and references for Days 1–2 (`comm_delay`, `regolith_3d`, `solar_arrays`, `mars_sunlight_43`, `opportunity_dust_2018`, `iss_electrolysis_moxie`, `human_o2_consumption`).
  - Day 3–6 discoveries unlocked via `FactCard` / `isFactReveal` record dynamically into `GameState.discoveredFacts` and trigger the red notification badge in the HUD.
