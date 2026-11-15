# Junior Astronaut Trainer — Complete Dialogues (Day 1 to Day 7 & Ending)

This file extracts **verbatim** all character dialogues, thought bubbles (`[Thought]`), radio / Deep Space Comms broadcasts (`[Radio]`), inline fact reveals (`[Fact Reveal]`), floating `FactCard` popups, first-time tutorials, choice modals, rewind/critical warnings, interaction toasts, and End-of-Sol transitions across **Day 1 through Day 7 and the Celebration Ending** (`SurfaceScene.js`, `OutpostScene.js`, `RoomScene.js`, `HudScene.js`, `SolarAlignTask.js`, `OxygenBuildTask.js`, `WaterBuildTask.js`, `PowerPanelTask.js`, and `CelebrationScene.js`).

---

## DAY 1 — Crash Landing, Mission Logbook, Solar Array & First Night

### 1.1 Crash Landing & Surface Intro Dialogue (Mars Surface)
*Sources: `src/scenes/SurfaceScene.js` (`startIntroDialogue`, L329–416) & `src/scenes/HudScene.js` (`L1278`, `L1349–1370`)*

- **Muntasir** `[!]` *(Speaking)*:
  > "Ah, here we go, the spacecraft went out of orbit and crashed on Mars."
- **Maisha** *(Speaking)*:
  > "Thank god, it didn't fall in a bad manner, we got out safe. Is the radio saying anything?"
- **Radio** `[Radio]`:
  > "Spacecraft is bound on orbit. Telemetry link severed during atmospheric entry—executing automated orbital relay protocol."
- **Muntasir** *(Speaking)*:
  > "Seems like our base on earth doesn't know about the crash. We have some facts to check."
- **Inline Fact Reveal** `[Fact Reveal]`:
  > "Fact: depending on relative position of earth to mars, it can take from 3-22 minutes to send a message and get a response back between earth and mars due to the vast distance it has to cover."
- **Muntasir** *(Speaking)*:
  > "How are we going to keep track of all these NASA facts and mission telemetry?"
- **Maisha** *(Speaking)*:
  > "I'm keeping track of everything we learn in our Mission Logbook! Every task and NASA fact gets recorded live at the top of our screen."
- **First-Time Logbook Tutorial Overlay** (`HudScene.js:1278`):
  > "MISSION LOGBOOK UPDATED!
  >
  > Maisha records every NASA fact, mission photo, and reference
  > in this open 2-page journal.
  >
  > Whenever you see the RED DOT on the Logbook icon above,
  > a new discovery has been added. Click it anytime to flip pages!"
- **Maisha** *(Speaking)*:
  > "So we would have to work independently without any help from the base station."
- **Muntasir** *(Speaking)*:
  > "Where do we take shelter?"
- **Maisha** *(Speaking)*:
  > "Seems like we have an outpost already build for living."
- **Inline Fact Reveal** `[Fact Reveal]`:
  > "Fact: NASA has plans to build an outpost on Mars Surface using regolith, a type of martian soil that can be compressed into bricks when combined with other chemicals, which will be 3D printed. The Mars Dune Alpha at the Johnson Space Centre has already simulated the process of building, on Earth in artificial environments"
- **Muntasir** *(Speaking)*:
  > "Let's go in..."
- **First-Time Controls Tutorial Overlay** (`HudScene.js:1349–1370`, right after walking to the Airlock):
  - Header: `MISSION CONTROLS TUTORIAL`
  > "• Use ARROW KEYS (◄ ▲ ▼ ►) to walk around the Martian surface & outpost.
  > • Stand near any glowing station or Airlock and press SPACE (or TAP) to interact."

### 1.2 Dark Outpost Visit 1 (Inside Outpost)
*Source: `src/scenes/OutpostScene.js` (`initFirstDarkVisit`, L200–206)*

- **Maisha** *(Speaking)*:
  > "Seems like we don't have any power or lights, we should do something about it. Let's get out."

### 1.3 Solar Array Deployment & Alignment (Mars Surface)
*Sources: `src/scenes/SurfaceScene.js` (`initSurfacePostCrash`, L465–480; `runPowerChargeUp`, L580) & `src/scenes/tasks/SolarAlignTask.js` (`L176–207`)*

- **Muntasir** `[Thought]`:
  > "We can build a solar panel right there, so that we can harvest light energy and turn it into electricity."
- **Post-Thought FactCard** (`fact:show`, `SurfaceScene.js:477`):
  > "Fact: NASA uses solar cells and panels on spacecraft to make them navigate on space where other manners of electricity production is impractical"
- **First-Time Solar Alignment Tutorial** (`SolarAlignTask.js:176, 207`):
  - Header: `FIRST-TIME TUTORIAL: AIM SOLAR PANEL`
  > "Use the ARROW KEYS (◄ ▲ ▼ ►) to steer the solar array
  > and center the glowing Sun inside the crosshair!
  > (You can also drag with mouse or touch.)"
- **Toast after Alignment** (`SurfaceScene.js:580`):
  > "Power restored! Walk to the Airlock to go inside."

### 1.4 Returning Inside & Restoring Habitat Lights (Inside Outpost)
*Sources: `src/scenes/OutpostScene.js` (`initPowerRestoredVisit`, L236–244; `onLightsRestored`, L357–394; `onLightsTurnedOff`, L417–419) & `src/scenes/tasks/PowerPanelTask.js` (`L101–103, L479`)*

- **Maisha** `[Thought]` (upon entering powered dark Outpost):
  > "Muntasir connected the solar array! I should walk over to the Power Panel and flip the breaker switch to turn on the habitat lights."
- **Power Panel Toggle** (`PowerPanelTask.js:102–103`): `LIGHTS` — `"Main habitat illumination"`
- **Power Panel Toast** (if applied before turning lights ON, `PowerPanelTask.js:479`):
  > "Switch LIGHTS to [ONLINE] to turn on the habitat lights!"
- **Muntasir** *(Speaking, after lights turn ON)*:
  > "Hurray. We can finally see."
- **Maisha** *(Speaking)*:
  > "It's night-time, and seems like the battery isn't charging."
- **Muntasir** *(Speaking)*:
  > "At night there is no sun, so there is no natural light for the solar panels to be powered up, we have to be careful about energy consumption soon."
- **Muntasir** *(Speaking)*:
  > "Seems like we are both tired. Let's have some rest on our bunks."
- **Post-Dialogue FactCard** (`fact:show`, `OutpostScene.js:386`):
  > "Fact: Mars surface has about 43% light level of earth, so its also harder for solar panels to recharge there"
- **Toast** (subsequent lights ON, `OutpostScene.js:394`): `"Habitat lights online."`
- **Rewind Warning** (if lights turned OFF afterwards, `OutpostScene.js:418`):
  > "You can't navigate around without lights! Turn on the lights at the Power Panel or rewind to the checkpoint."

### 1.5 Day 1 Toasts, Sleep Guards & End-of-Sol 1 Transition
*Source: `src/scenes/RoomScene.js` (`L98–108, L252, L512–523`)*

- **Progression Toasts & Warnings**:
  - Airlock (Surface -> Outpost before solar panel): `"Build and align the solar panel first!"`
  - Airlock (Outpost -> Surface before lights intro): `"Turn on the lights at the Power Panel first!"`
  - Airlock (Outpost -> Surface if lights turned back OFF): `"You can't navigate around without lights! Turn on the lights or rewind to the checkpoint."`
  - Solar Panel (`L252`): `"Solar array is aligned and perfectly fine."`
  - Bed Sleep Guards (`L512, L516`): `"Turn on the lights at the Power Panel first!"` / `"You can't navigate around without lights! Turn on the lights before resting."`
- **End-of-Sol 1 Transition** (`RoomScene.js:523`, with storm audio):
  > `END OF SOL 1`
  >
  > `Muntasir and Maisha rest on their bunks.`
  > `Overnight, a Martian dust storm sweeps across the outpost and coats the solar panels...`
  >
  > `SOL 2 BEGINS`

---

## DAY 2 — Dust Storm Clean-Up, Ice Drilling & Oxygen Maker

### 2.1 Morning Intro (Inside Outpost)
*Source: `src/scenes/OutpostScene.js` (`initDay2Outpost`, L476–500)*

- **Maisha** *(Speaking)*:
  > "Good morning, Muntasir! Look at our Power meter—it's shaking and dropping slowly!"
- **Muntasir** *(Speaking)*:
  > "An overnight Martian dust storm must have coated our solar array outside!"
- **Muntasir** `[Thought]`:
  > "I should go outside through the Airlock and wipe the dust off the solar panel."
- **Post-Dialogue FactCard** (`fact:show`, `OutpostScene.js:499`):
  > "Fact: NASA's Mars Exploration Rover Opportunity went silent in the global Martian dust storm of June 2018, and its mission was declared over in February 2019."

### 2.2 Cleaning Solar Panel & Low Oxygen Alert (Mars Surface)
*Source: `src/scenes/SurfaceScene.js` (`onDay2PanelCleaned`, L757–781)*

- **Maisha** `[!]` *(Speaking)*:
  > "Muntasir! I just checked the life support console—our habitat oxygen reserves are getting dangerously low!"
- **Muntasir** *(Speaking)*:
  > "We can melt subsurface Martian ice and split water with electricity to make oxygen, just like the ISS!"
- **Maisha** *(Speaking)*:
  > "Look over there—the surface scanner found subsurface ice! Drill a core sample while I prepare the outpost."
- **Post-Dialogue FactCard** (`fact:show`, `SurfaceScene.js:780`):
  > "Fact: Just like the ISS Oxygen Generation System (OGS) splits water into hydrogen and breathable oxygen via electrolysis, NASA's MOXIE experiment on Perseverance proved we can generate oxygen on Mars—producing 122 grams of pure oxygen."

### 2.3 After Drilling Ice Core (Mars Surface)
*Source: `src/scenes/SurfaceScene.js` (`onDay2IceDrilled`, L814–822)*

- **Muntasir** `[Thought]`:
  > "Got the Martian ice core! Let's head back inside so Maisha can build the Oxygen Maker."

### 2.4 Building Oxygen Maker & Loading Hopper (Inside Outpost)
*Sources: `src/scenes/OutpostScene.js` (`initDay2Outpost`, L521–529; `onDay2OxygenBuilt`, L655–673) & `src/scenes/tasks/OxygenBuildTask.js` (`L320`)*

- **Maisha** `[Thought]` (upon Muntasir returning with ice):
  > "Muntasir drilled the Martian ice! I can assemble the Oxygen Maker right here and split the water into breathable O2."
- **Non-Canon Power Allocation Rewind Warning** (`OxygenBuildTask.js:320`):
  > "You can't survive without oxygen! One astronaut needs about 0.84 kg of oxygen a day. Allocate power to the Oxygen Maker!"
- **Maisha** *(Speaking, after assembly)*:
  > "Great! The Oxygen Maker is assembled and wired into the habitat power grid."
- **Muntasir** *(Speaking)*:
  > "Now we need to feed our harvested Martian ice blocks into its top Hopper so it can melt the ice and produce breathable air."
- **Maisha** `[Thought]`:
  > "I should walk up to the Oxygen Maker and load the ice blocks into the Hopper."

### 2.5 After Loading Ice & Day 2 Night Prep (Inside Outpost)
*Source: `src/scenes/OutpostScene.js` (`onDay2IceLoaded`, L703–729)*

- **Maisha** *(Speaking)*:
  > "The ice is melting inside the Hopper! Fresh breathable oxygen is flowing into the habitat now."
- **Muntasir** *(Speaking)*:
  > "Night has fallen and the solar panels cannot charge in the dark, so keeping both the lights and the Oxygen Maker running all night will drain our battery."
- **Maisha** `[Thought]`:
  > "I should open the Power Panel and turn off the habitat lights to save power for the Oxygen Maker before we rest on the bunks."
- **Post-Dialogue FactCard** (`fact:show`, `OutpostScene.js:728`):
  > "Fact: On Mars, splitting water with electricity makes O2 just like on the ISS. Perseverance's MOXIE also made ~122g of oxygen from Martian CO2 air. One person needs ~0.84 kg O2/day."

### 2.6 Day 2 Warnings, Toasts & End-of-Sol 2 Transition
*Sources: `src/scenes/tasks/PowerPanelTask.js` (`L747–775`), `src/scenes/HudScene.js` (`L840`), & `src/scenes/RoomScene.js` (`L113–131, L223, L264, L269, L403, L536–564`)*

- **Rewind Warnings**:
  - Oxygen switched OFF (`PowerPanelTask.js:747`): `"Warning: Never switch off the Oxygen Maker! Without life support, breathable air in the habitat will run out fast."`
  - Oxygen hits 0% (`HudScene.js:840`): `"CRITICAL: Habitat Oxygen hit 0%! Turn OXYGEN MAKER back ON or rewind!"`
- **Power Panel Toasts (`PowerPanelTask.js`)**:
  - `"Oxygen Maker back online and habitat lights off for the night."` (`L767`)
  - `"Habitat lights off for the night. Rest on the bunks!"` (`L768`)
  - `"Oxygen Maker back online."` (`L774, L779`)
- **Progression Toasts & Bed Sleep Guards (`RoomScene.js`)**:
  - Airlock (Surface -> Outpost): `"Clean the solar panel first!"` / `"Drill for subsurface ice before heading back inside!"`
  - Airlock (Outpost -> Surface): `"Build the Oxygen Maker inside first!"` / `"Load Martian ice into the Oxygen Maker Hopper first!"`
  - Solar Panel / Ice Site / Oxygen Maker (`L223, L264, L269, L403`): `"Solar array is clean and operating at 100%."` / `"Clean the solar array first!"` / `"Ice core already harvested for today."` / `"Oxygen Maker is online and producing breathable air."`
  - Bed (`L536, L541`): `"Build the Oxygen Maker first!"` / `"Load Martian ice into the Oxygen Maker Hopper first!"`
  - Bed Warnings (`L547, L556`): `"Oxygen Maker is OFF and oxygen is dropping! Flip OXYGEN back ON at the Power Panel or rewind before sleeping."` / `"Leaving the lights on overnight with the Oxygen Maker running drained the battery to 0%! Turn off the lights at the Power Panel before sleeping."`
- **End-of-Sol 2 Transition** (`RoomScene.js:563`):
  > `END OF SOL 2`
  >
  > `With the lights off and the Oxygen Maker humming softly, the crew rests safely through the night...`
  >
  > `SOL 3 BEGINS`

---

## DAY 3 — Water Crisis, Subsurface Ice Pipeline & Power Balancing

### 3.1 Morning Intro (Inside Outpost)
*Source: `src/scenes/OutpostScene.js` (`initDay3Outpost`, L758–786)*

- **Muntasir** *(Speaking)*:
  > "For the past 2 days, we didn't have water. I only had a little bit of food. I'm really hungry and dehydrated."
- **Maisha** *(Speaking)*:
  > "I think we have enough dried foods to last a few days."
- **Muntasir** *(Speaking)*:
  > "But water is scarce out here on Mars, and we only have the ice which we can drill again, and use it to get water."
- **Maisha** *(Speaking)*:
  > "I think we can salvage the water station from our spacecraft and use it to melt and purify the ice. Let’s go get some ice from the pile outside!"
- **Post-Dialogue FactCard** (`fact:show`, `OutpostScene.js:785`):
  > "Fact: Liquid water cannot stay on Mars's low-pressure surface, so astronauts must drill buried water ice—mapped globally by NASA's Mars Reconnaissance Orbiter."

### 3.2 After Drilling Fresh Ice Outside (Mars Surface)
*Source: `src/scenes/SurfaceScene.js` (`onDay3IceDrilled`, L874–888)*

- **Maisha** `[Thought]`:
  > "Harvested plenty of subsurface Martian ice! Let’s head back inside through the Airlock and salvage our Water Station."
- **Post-Thought FactCard** (`fact:show`, `SurfaceScene.js:887`):
  > "Fact: NASA's Phoenix lander uncovered bright subsurface water ice just centimeters beneath Martian soil in 2008—confirming astronauts can harvest local ice!"

### 3.3 Returning Inside & Building Water Station (Inside Outpost)
*Sources: `src/scenes/OutpostScene.js` (`initDay3Outpost`, L817–825; `onDay3WaterBuilt`, L1024–1037) & `src/scenes/tasks/WaterBuildTask.js` (`L398`)*

- **Maisha** `[Thought]` (before Water Station build):
  > "Got the ice core! I salvaged the Water Station parts from our spacecraft—let’s connect the pipes and build it."
- **Non-Canon Power Allocation Rewind Warning** (`WaterBuildTask.js:398`):
  > "Warning: Without power to heat and purify Martian ice, the crew will dehydrate! Humans can survive only about 3 days without water."
- **Maisha** *(Speaking, after pipe assembly)*:
  > "Now we can get fresh water here! Running the heater and filter draws extra power from our grid, though—a fair trade to stay hydrated."
- **Maisha** `[Thought]`:
  > "Let’s drop the Martian ice blocks into the Water Station hopper to melt and purify it!"

### 3.4 Loading Ice into Water Station & Oxygen Depletion Alert (Inside Outpost)
*Source: `src/scenes/OutpostScene.js` (`onDay3WaterIceLoaded`, L1065–1092)*

- **Maisha** *(Speaking)*:
  > "Fresh purified water is filling our outpost storage tank! Wait—hear that alert chime?"
- **Muntasir** *(Speaking)*:
  > "Our oxygen meter is also depleting! Let’s put the rest of the ice on the Oxygen Maker production and call it a day."
- **Maisha** `[Thought]`:
  > "Walk over to the Oxygen Maker and load the rest of our harvested ice!"
- **Post-Dialogue FactCard** (`fact:show`, `OutpostScene.js:1091`):
  > "Fact: On the International Space Station, NASA recycles ~98% of all water using heat, distillation, and filtration beds so crews never run dry!"

### 3.5 After Refilling Oxygen -> Day 3 Night Prep (Inside Outpost)
*Source: `src/scenes/OutpostScene.js` (`onDay3OxIceLoaded`, L1116–1140)*

- **Maisha** *(Speaking)*:
  > "Nighttime is hitting again, and the power is going out faster now with both Water and Oxygen life support active."
- **Muntasir** *(Speaking)*:
  > "It is more important we keep the habitat lights OFF before sleeping—while leaving Oxygen and Water production running!"
- **Maisha** `[Thought]`:
  > "Switch off ONLY the lights at the Power Breaker Board, then get some rest in the Bunks."

### 3.6 Day 3 Warnings, Toasts & End-of-Sol 3 Transition
*Sources: `src/scenes/tasks/PowerPanelTask.js` (`L710–781`), `src/scenes/HudScene.js` (`L840, L972`), & `src/scenes/RoomScene.js` (`L134–148, L229, L279, L344–352, L410–415, L574–608`)*

- **Power Panel Rewind Warnings (`PowerPanelTask.js`)**:
  - Oxygen switched OFF (`L710`): `"Warning: Switching off the Oxygen Maker saves power, but breathable air is depleting fast! You will suffocate without oxygen."`
  - Water switched OFF (`L719`): `"Warning: Switching off the Water Station saves power, but water purification stops and the crew risks severe dehydration!"`
  - Lights turned back ON (`L728`): `"Warning: Turning the lights back on dropped reserve power into the red danger zone! Keep the lights off before sleeping."`
  - Water back ON toast (`L781`): `"Water Station back online."`
- **Critical Meter Alerts (`HudScene.js`)**:
  - Oxygen 0% (`L840`): `"CRITICAL: Habitat Oxygen hit 0%! Turn OXYGEN MAKER back ON or rewind!"`
  - Water 0% (`L972`): `"CRITICAL: Habitat Water hit 0%! Rewind to allocate power or turn WATER STATION back ON!"`
- **Progression Toasts & Bed Sleep Guards (`RoomScene.js`)**:
  - Airlock (`L134, L139, L143, L147`): `"Drill for subsurface ice before heading back inside!"` / `"Build the Water Station inside first!"` / `"Load Martian ice into the Water Station first!"` / `"Load the remaining ice into the Oxygen Maker first!"`
  - Solar Panel / Ice Site / Water Station / Oxygen Maker (`L229, L279, L344, L352, L410, L415`): `"Solar array is clear today—focus on water and ice!"` / `"Ice core already harvested for today."` / `"Drill Martian ice outside first!"` / `"Water Station is online and purifying Martian water."` / `"Build and supply the Water Station with ice first!"` / `"Oxygen Maker is online and producing breathable air."`
  - Bed Guards (`L574, L578, L582, L586`): `"Drill subsurface Martian ice outside first!"` / `"Build the Water Station first!"` / `"Load ice into the Water Station first!"` / `"Load the remaining ice into the Oxygen Maker before sleeping!"`
  - Bed Warnings (`L592, L601`): `"Life support systems (Oxygen & Water) must remain active overnight! Rewind and keep both life support switches ON."` / `"Leaving the lights on overnight with Oxygen and Water running drops battery power into the danger zone (30%)! Turn off only the lights at the Power Panel before sleeping."`
- **End-of-Sol 3 Transition** (`RoomScene.js:608`, with storm audio):
  > `END OF SOL 3`
  >
  > `With the habitat lights off, water purified, and oxygen flowing, the crew rests safely through the night...`
  >
  > `SOL 4 BEGINS`

---

## DAY 4 — Dust Storm #2, Kilopower Nuclear Reactor, Deep Space Comms & Safe Mode

### 4.1 Morning Intro (Inside Outpost)
*Source: `src/scenes/OutpostScene.js` (`initDay4Outpost`, L1172–1196)*

- **Muntasir** `[!]` *(Speaking)*:
  > "Seems like a second dust storm hit the solar panels overnight! Our power has gone down to dangerous levels."
- **Maisha** *(Speaking)*:
  > "We can turn off the Water Station for now since we have enough stored to last a while, and save up on emergency power!"
- **Muntasir** *(Speaking)*:
  > "I'm gonna go outside and fix the panels up once you pause the water pump."
- **Maisha** `[Thought]`:
  > "Use the Power Breaker Board to switch OFF only the Water Station for now."

### 4.2 After Pausing Water Station (Inside Outpost)
*Source: `src/scenes/tasks/PowerPanelTask.js` (`L703`) & `src/scenes/OutpostScene.js` (`onDay4WaterTurnedOff`, L1364–1377)*

- **Toast** (`PowerPanelTask.js:703`):
  > "Water station paused to save power. Head outside to fix the solar panels!"
- **Maisha** *(Speaking)*:
  > "Water Station paused and emergency power boosted! Head outside through the Airlock, Muntasir—I'll monitor life support from inside."
- **Muntasir** `[Thought]`:
  > "Got it! I'll head out through the Airlock now to clean and realign the solar panels."

### 4.3 After Cleaning & Realigning Solar Panels (Mars Surface)
*Source: `src/scenes/SurfaceScene.js` (`onDay4PanelAligned`, L1082–1121)*

- **Muntasir** *(Speaking)*:
  > "This is frustrating and dangerous for us to have such limited power options that do not work at night and get knocked out by frequent dust storms!"
- **Muntasir** *(Speaking)*:
  > "Also, sunlight on Mars is much weaker than on Earth, so solar panels alone cannot generate enough steady electricity."
- **Maisha** *(Speaking)*:
  > "We must find a better, reliable, safe, always-on alternative power source. Do you have any idea?"
- **Muntasir** *(Speaking)*:
  > "We have very limited options out here for continuous power—I suggest nuclear fission power!"
- **Maisha** *(Speaking)*:
  > "Yes! We can build a compact nuclear power station right outside here so storms and darkness never stop us."
- **Muntasir** *(Speaking)*:
  > "Let’s build it! Walk up to the reactor plot beside us to assemble and stabilize the Kilopower core."
- **Post-Dialogue FactCard** (`fact:show`, `SurfaceScene.js:1120`):
  > "Fact: At ~43% of Earth's sunlight, Martian solar power delivers under 1 kW on dusty days and 0 kW at night. NASA's Kilopower nuclear reactor produces 10–40 kW non-stop—40 kW powers ~33 average American homes (U.S. EIA avg ~1.2 kW/home)!"

### 4.4 After Building Kilopower Reactor (Mars Surface)
*Source: `src/scenes/SurfaceScene.js` (`onDay4ReactorBuilt`, L1163–1195)*

- **Geiger Badge** (`L1163`): `GEIGER: 7.83 uGy/hr (SAFE — 100%)`
- **Muntasir** *(Speaking)*:
  > "We now have continuous power all the time—without worrying about dust storms, nighttime darkness, or growing equipment demands as our survival needs expand!"
- **Muntasir** `[!]` *(Speaking)*:
  > "Wait—hear that faint clicking on our reactor's built-in Geiger counter? Is Mars radioactive right now?"
- **Maisha** *(Speaking)*:
  > "Don't worry! That's just Mars's normal natural background radiation—about 7.83 micrograys per hour (0.188 mGy/day). I've brought up our Radiation Safety Meter at a full 100% safe level so we can monitor any spikes!"
- **Inline Fact Reveal** `[Fact Reveal]`:
  > "NASA Fact — Mars Surface Background Radiation: Measurements from NASA Curiosity MSL-RAD (274,998 archived readings in NASA OSDR RadLab) show an average Mars surface background of ~7.83 uGy/hr (0.188 mGy/day)—totally non-lethal over short EVAs, though astronauts track cumulative exposure closely. (Refs: NASA OSDR RadLab / Curiosity MSL-RAD)"
- **Maisha** *(Speaking)*:
  > "Since our Radiation Meter is steady at 100% and we're safe right now, let's head back inside to check our console and get some rest!"
- **Toast** (`L1195`):
  > "Kilopower Reactor online & Radiation Meter active (100% Safe)! Return inside."

### 4.5 Deep Space Comms Alert & Solar Storm Explanation (Inside Outpost)
*Source: `src/scenes/OutpostScene.js` (`initDay4Outpost`, L1239–1293)*

- **Muntasir** *(Speaking)*:
  > "Kilopower is online and supplying steady power! Both life support systems are running safely."
- **Maisha** `[!]` *(Speaking)*:
  > "Wait—do you hear that chime? Our Deep Space Comms console inside the bunker just locked onto a signal from Earth!"
- **Comms (NASA DSN)** `[Radio]`:
  > "—SIGNAL LOCKED— NASA Deep Space Network to Ares Outpost: X-class solar flare observed on solar limb. Severe Coronal Mass Ejection and Solar Particle Event forecast to strike Mars tonight at 22:40 MST."
- **Maisha** `[!]` *(Speaking)*:
  > "We finally heard back from Comms—and it's an urgent space-weather alert! A heavy solar storm is going to hit Mars tonight!"
- **Muntasir** *(Speaking)*:
  > "Whoa—what is a solar storm, Maisha? Why did Comms warn us if we're already inside the habitat?"
- **Maisha** *(Speaking)*:
  > "In my academy, I learned that massive solar eruptions fire radiation and charged plasma straight into Mars, threatening any exposed or unshielded electronics!"
- **Inline Fact Reveal** `[Fact Reveal]`:
  > "NASA Fact — Solar Storms on Mars: A solar storm (CME & Solar Energetic Particle event) blasts high-energy radiation and plasma across space. Unlike Earth, Mars has no global magnetic field and just ~1% of Earth’s atmosphere, so particles strike directly—causing radiation spikes and voltage surges in unshielded electronics. Major events like the May 2024 X-class storm triggered global Mars auroras and Curiosity RAD alerts. (Refs: NASA DONKI; NASA MAVEN & Curiosity RAD; NASA OSDR RadLab)"
- **Maisha** *(Speaking)*:
  > "We must therefore turn off non-essential electronics around here, or switch the habitat grid into Safe Mode before sleeping!"
- **Inline Fact Reveal** `[Fact Reveal]`:
  > "NASA Fact — Habitat & Spacecraft Safe Mode: When a solar particle storm hits, NASA flight controllers place rovers and habitats into Safe Mode—isolating vulnerable electronic buses through surge-protection relays so induced currents cannot fry hardware, while preserving vital life-support loops. (Refs: NASA JPL Fault Protection Guide; NASA Goddard Space Weather Center)"
- **Muntasir** `[Thought]`:
  > "Head to the Power Breaker Board and switch on SAFE MODE! Leaving electronics unprotected tonight could fry the entire bunker."

### 4.6 After Enabling Safe Mode (Inside Outpost)
*Source: `src/scenes/OutpostScene.js` (`onDay4SafeModeEnabled`, L1442–1464)*

- **Muntasir** *(Speaking)*:
  > "SAFE MODE is locked in! Look at that shielding halo on our power monitor—the habitat circuits are surge-protected."
- **Maisha** *(Speaking)*:
  > "And with Kilopower running underground, our Oxygen, Water, and thermal loops stay shielded and online all through the solar storm!"
- **Muntasir** *(Speaking)*:
  > "Even better—Earth Control knows we're alive and safe on Mars. Let's finally get some rest on the bunks."
- **Maisha** *(Speaking)*:
  > "Right behind you—see you tomorrow morning, Commander!"

### 4.7 Day 4 Power Panel Description, Blockers, Rewind Warnings & Sleep Transition
*Sources: `PowerPanelTask.js` (`L187–188, L693`), `RoomScene.js` (`L151–173, L241, L370–376, L383–389, L451–457, L621–649`)*

- **Power Panel Safe Mode Toggle** (`PowerPanelTask.js:187–188`):
  - `SAFE MODE` — `"Isolate & surge-protect circuits for solar storm"`
- **Rewind Warnings**:
  - `PowerPanelTask.js:693`: `"Warning: Leaving electrical systems unprotected during a Martian solar storm will overload and destroy the habitat electronics! Enable SAFE MODE on the Power Panel."`
  - `RoomScene.js:641` (attempting sleep without Safe Mode): `"Warning: Sleeping without SAFE MODE during a Martian solar storm will overload and destroy the habitat electronics! Enable SAFE MODE on the Power Panel."`
- **Progression Toasts (`RoomScene.js`)**:
  - Airlock (Outpost -> Surface before pausing water): `"Turn off the Water Station at the Power Panel first to save power!"`
  - Airlock (Outpost -> Surface during storm alert before Safe Mode): `"Solar storm inbound! Switch on SAFE MODE at the Power Panel before leaving!"`
  - Airlock (Surface -> Outpost): `"Clean the dust off the solar panel first!"` / `"Realign the solar panel toward the sun first!"` / `"Build and activate the Kilopower Nuclear Reactor before heading inside!"`
  - Solar Panel after repair (`L241`): `"Solar array repaired, though Martian sunlight alone remains weak."`
  - Reactor (`L383, L388`): `"Clean and realign the solar panels first!"` / `"Kilopower Reactor online—delivering continuous nuclear power!"`
  - Power Panel (`L454–455`): `"Safe Mode is active and shielding all habitat circuits through tonight’s solar storm!"` / `"Power Breaker Board locked during emergency repair—head outside to fix the solar array!"`
  - Water Station (`L373–374`): `"Water Station paused temporarily to conserve emergency power."` / `"Water Station running continuously on nuclear power!"`
  - Bed Sleep Guards (`L622, L626, L630, L634`): `"Pause the Water Station at the Power Panel first!"` / `"Clean and realign the solar panels outside first!"` / `"Build and activate the Kilopower Nuclear Reactor outside before sleeping!"` / `"Listen to the incoming Comms alert first!"`
- **End-of-Sol 4 Transition** (`RoomScene.js:648`, with solar storm audio):
  > `END OF SOL 4`
  >
  > `Overnight, the severe solar storm sweeps across Mars—SAFE MODE shields every circuit while Kilopower keeps oxygen and thermal loops alive!`
  >
  > `SOL 5 BEGINS`

---

## DAY 5 — Solar Storm Shelter & Water-Bag Bunk Shielding

### 5.1 Morning Intro During Active Solar Storm (Inside Outpost)
*Source: `src/scenes/OutpostScene.js` (`initDay5Outpost`, L1543–1576)*

- **Muntasir** `[!]` *(Speaking)*:
  > "Listen to that solar storm howling outside! Even with SAFE MODE protecting our electronics, gamma rays and solar particles are creeping through the bunker walls!"
- **Maisha** *(Speaking)*:
  > "Oxygen and water are draining normally as we breathe and drink, while our Radiation Meter is dipping. Whatever happens—DO NOT go outside through the Airlock today!"
- **Muntasir** *(Speaking)*:
  > "Agreed—EVA right now would be lethal! How do we shield our Bunks before tonight's storm wave?"
- **Maisha** *(Speaking)*:
  > "Let’s stack sealed bags of drinking water against our bunk walls! Hydrogen-rich H2O absorbs particle radiation—and because the water stays sealed, zero drinking water is wasted!"
- **Inline Fact Reveal** `[Fact Reveal]`:
  > "NASA Fact — Mars Solar Storm & Water-Bag Shielding: In May 2024, NASA Curiosity RAD recorded a Mars peak of 303.99 uGy/hr (vs 7.83 uGy/hr normal). Hydrogen-rich water slows cosmic & solar protons without wasting mass—astronauts can even drink the sealed shielding water later! (Refs: NASA OSDR RadLab Mars-May2024; NASA JPL)"
- **Maisha** `[Thought]`:
  > "Walk over to the Bunks and deploy all 5 H2O shield bags right now!"

### 5.2 After Deploying 5 Water Bags Around Bunks (Inside Outpost)
*Source: `src/scenes/OutpostScene.js` (`onDay5BunksBagged`, L1604–1620)*

- **Muntasir** *(Speaking)*:
  > "All 5 drinkable H2O bags are locked into our sleeping walls—look, our bunk Radiation Protection stabilized right at 95%!"
- **Inline Fact Reveal** `[Fact Reveal]`:
  > "NASA Fact — Low-Dose Radiation Biology (OSD-360): Even small cumulative radiation doses caused measurable tissue responses 1–4 months later in space studies—making bunk H2O shielding vital whenever solar storms hit Mars. (Refs: NASA OSDR Study OSD-360)"
- **Maisha** *(Speaking)*:
  > "Safe Mode stays locked for tonight so circuits stay safe, and our shielded bunks are ready. Rest at the Bunks until tomorrow!"

### 5.3 Day 5 Rewind Warnings, Blocker Toasts & Sleep Transition
*Sources: `RoomScene.js` (`L177, L442, L667, L674`) & `HudScene.js` (`L626`)*

- **Airlock Non-Canon Exit Warning** (`RoomScene.js:177`):
  > `"DANGER: Severe solar particle storm radiation is hitting the surface! Stay sheltered inside and deploy water bags around your Bunks."`
- **Critical Unshielded Bunk Decay Alert** (`HudScene.js:626`):
  > `"CRITICAL: Solar particle & gamma rays penetrated unshielded bunks! Place sealed water bags around the Bunks."`
- **Station Toasts (`RoomScene.js`)**:
  - Power Panel (`L442`): `"SAFE MODE is locked ON — power circuits remain surge-protected!"`
  - Bed before bagging (`L667`): `"Deploy 5 sealed H2O Shield Bags around the Bunks first!"`
- **End-of-Sol 5 Transition** (`RoomScene.js:674`):
  > `END OF SOL 5`
  >
  > `Protected behind sealed water-bag walls and SAFE MODE electronics, the crew sleeps safely through the storm!`
  >
  > `SOL 6 BEGINS`

---

## DAY 6 — Food Crisis, Mars Greenhouse & Crew Radiation Rotation

### 6.1 Morning Intro & Space Food Crisis (Inside Outpost)
*Source: `src/scenes/OutpostScene.js` (`initDay6Outpost`, L1650–1684)*

- **Maisha** *(Speaking)*:
  > "Good morning! The solar storm roar outside has finally quieted down—what a relief after yesterday."
- **Comms (NASA DSN)** `[Radio]`:
  > "—SOLAR ADVISORY— Main flare peak has subsided, but an elevated particle radiation shower (12.47–21.08 uGy/hr bursts) persists on the Martian surface. Work fast on any EVA!"
- **Muntasir** `[!]` *(Speaking)*:
  > "Wait—we also have a huge problem inside! Our dry food rations are completely on the brink of finishing today!"
- **Maisha** *(Speaking)*:
  > "Resupply from Earth takes months! Using our compact space-botany seeds from CSA and NASA OSDR research, we can assemble a closed-loop Greenhouse on the surface right now and grow fast crops!"
- **Inline Fact Reveal** `[Fact Reveal]`:
  > "NASA & CSA Space Food Data: Astronauts need 1,900–3,200 kcal/day, and Earth deliveries are impossible on Mars. Hydroponic studies like Arabidopsis (NASA OSDR OSD-38, OSD-16, OSD-120), dwarf wheat, lettuce & radishes provide sustainable nutrition—even inspiring northern Earth farming! (Refs: CSA Food Facts; NASA OSDR OSD-38/16/120)"
- **Muntasir** `[Thought]`:
  > "Let's head out fast through the Airlock—every second outside counts on our Radiation Meter!"

### 6.2 Stepping Outside to Mars Surface (Muntasir)
*Source: `src/scenes/SurfaceScene.js` (`initDay6Surface`, L1247, L1260–1267)*

- **Geiger Badge** (`L1247`): `GEIGER ALERT: 21.08 uGy/hr — LIMIT EVA TIME!`
- **Muntasir** *(Speaking)*:
  > "The Geiger counter is climbing fast out here! Let's hurry to the Greenhouse plot, assemble the dome quickly, and minimize our exposure!"

### 6.3 After Assembling the Greenhouse & Crew Swap Choice (Mars Surface)
*Source: `src/scenes/SurfaceScene.js` (`onDay6GreenhouseBuilt`, L1370–1383; `showDay6SwapChoice`, L1411–1475; `executeSwapToMaisha`, L1506)*

- **Muntasir** `[!]` *(Speaking)*:
  > "Ugh... the greenhouse frame is up, but my radiation dosimeter is flashing red! I'm feeling dizzy from radiation sickness!"
- **Maisha** *(Speaking)*:
  > "Stop right there, Muntasir! Your exposure dropped to half—if you stay out to farm the seeds, it will hit dangerous biological limits. Let's swap shifts right now!"
- **Crew Exposure Modal (`CREW RADIATION EXPOSURE CHOICE`, `L1411–1462`)**:
  - Description: `"Muntasir's Radiation Meter dropped to 52% while assembling the greenhouse.\nWho should farm and seed the hydroponic crops now?"`
  - **Option 1 (Canon):** `"SWAP WITH MAISHA (ROTATE EXPOSURE & FARM CROPS)"`
    - **Toast (`L1506`):** `"Crew rotated! Maisha is active—plant the space crops quickly!"`
  - **Option 2 (Non-Canon):** `"KEEP WORKING AS MUNTASIR (IGNORE RADIATION ALERT)"`
    - **Rewind Warning (`L1473`):** `"RADIATION SICKNESS: Pushing Muntasir past safe dose limits risks severe radiation injury! Rewind and swap with Maisha to rotate crew exposure."`

### 6.4 After Seeding Crops (Mars Surface -> Return to Outpost)
*Source: `src/scenes/SurfaceScene.js` (`onDay6CropsPlanted`, L1521–1532)*

- **Maisha** `[Thought]`:
  > "All 4 space-crop varieties are seeded and misting! Let’s get back inside the bunker right now before the solar shower climbs any higher."
- **Toast** (`L1532`):
  > "Crops planted! Return inside through the Airlock."

### 6.5 Evening Strategy Inside Outpost (After Planting Crops)
*Source: `src/scenes/OutpostScene.js` (`initDay6Outpost`, L1704–1726)*

- **Muntasir** *(Speaking)*:
  > "The radiation outside now is lethal—we have to do something about it before harvesting."
- **Maisha** *(Speaking)*:
  > "I think tomorrow we can deploy some water bags around the greenhouses just like we did with our bunks!"
- **Muntasir** *(Speaking)*:
  > "Hmm, water is liquid and can act like particle-slowing walls so our workstations will stay shielded the day after."
- **Maisha** *(Speaking)*:
  > "Let's sleep for today and recover inside!"

### 6.6 Day 6 Critical Alerts, Blocker Toasts & Sleep Transition
*Sources: `HudScene.js` (`L707`) & `RoomScene.js` (`L183–193, L316, L684, L689`)*

- **Critical Outdoor Radiation Alert** (`HudScene.js:707`):
  > `"RADIATION DANGER: Extended outdoor exposure reached lethal dose limits! Rotate crew or rewind!"`
- **Toasts (`RoomScene.js`)**:
  - Airlock (Outpost evening): `"Radiation outside is lethal—rest in the Bunks for tonight!"`
  - Airlock (Surface incomplete): `"Assemble the Mars Greenhouse quickly before returning!"` / `"Have Maisha finish planting the crops before going back inside!"`
  - Greenhouse (`L316`): `"Crops are seeded and germinating inside the Greenhouse!"`
  - Bed (`L684`): `"Build the Greenhouse and seed space crops outside first!"`
- **End-of-Sol 6 Transition** (`RoomScene.js:689`):
  > `END OF SOL 6`
  >
  > `Muntasir rests away radiation fatigue indoors while Maisha’s new hydroponic seeds begin sprouting outside...`
  >
  > `SOL 7 BEGINS`

---

## DAY 7 — Optimization, Fresh Ice Refill, Water-Bag Shields & Harvest

### 7.1 Morning Intro (Inside Outpost)
*Source: `src/scenes/OutpostScene.js` (`initDay7Outpost`, L1755–1782)*

- **Maisha** *(Speaking)*:
  > "Good morning!"
- **Muntasir** *(Speaking)*:
  > "Today is our optimization day—let’s fix whatever we can so this base is completely self-sustaining!"
- **Maisha** *(Speaking)*:
  > "We have to deploy water bags around the Greenhouse and by the Ice Drilling Site."
- **Muntasir** *(Speaking)*:
  > "Our Oxygen and Water are depleting! Let's first bring in fresh ice, because we won't have enough water for the shielding bags too."
- **Maisha** *(Speaking)*:
  > "Let's go! I'll drill fresh subsurface ice outside, and Muntasir can load it into our stations inside!"

### 7.2 After Drilling Fresh Ice Outside (Mars Surface)
*Source: `src/scenes/SurfaceScene.js` (`onDay7IceDrilled`, L1582–1593)*

- **Maisha** `[Thought]`:
  > "Fresh ice core harvested! I’ll pass these ice crates inside so Muntasir can top up our Water and Oxygen tanks to 100% before we deploy the shielding bags."
- **Toast** (`L1593`):
  > "Ice drilled! Head inside through the Airlock to refill Water & O2."

### 7.3 Passing Ice Inside & Loading Both Life-Support Stations (Inside Outpost)
*Source: `src/scenes/OutpostScene.js` (`initDay7Outpost`, L1806–1813; `onDay7WaterIceLoaded`, L1835; `onDay7OxIceLoaded`, L1842–1849)*

- **Maisha** *(Speaking)*:
  > "Here are the fresh ice cores from outside, Muntasir! Load them into our Water Station and Oxygen Maker to refill both to 100%!"
- **Toast after Water Refill** (`L1835`):
  > "Water at 100%! Now load remaining ice into the Oxygen Maker."
- **Muntasir** *(Speaking, after Oxygen Refill)*:
  > "Oxygen and Water are both back at 100%! Let's now deploy the water bags outside around the Ice Site and Greenhouse, and then we can harvest the food and call it a day!"

### 7.4 Surface Shielding & Day 7 Blocker Toasts
*Sources: `src/scenes/SurfaceScene.js` (`L1606, L1615`) & `src/scenes/RoomScene.js` (`L197–211, L294–300, L323–335, L359–364, L422–429, L698`)*

- **Surface Completion Toasts (`SurfaceScene.js`)**:
  - Ice Drill Site shielded (`L1606`): `"Ice Drill Site shielded! Now deploy water bags around the Greenhouse."`
  - Greenhouse shielded (`L1615`): `"Greenhouse shielded (Radiation 95%)! Harvest the fresh crops now!"`
- **Progression Toasts (`RoomScene.js`)**:
  - Airlock (`L197, L202, L209`): `"Load fresh ice into the Water Station and Oxygen Maker inside first!"` / `"Drill fresh Martian ice outside first!"` / `"Finish deploying both Water-Bag Shields and harvesting crops outside!"`
  - Ice Site (`L294, L299`): `"Take the ice inside first so Muntasir can refill Water & Oxygen!"` / `"Ice Drill Site is protected with drinkable H2O bags!"`
  - Greenhouse (`L323, L325, L327, L335`): `"Drill fresh Martian ice at the Ice Site first!"` / `"Load ice inside to restore Water and Oxygen to 100% first!"` / `"Deploy Water-Bag Radiation Shields at the Ice Drill Site first!"` / `"Fresh crops harvested!"`
  - Water Station (`L359, L364`): `"Maisha needs to drill fresh subsurface ice outside first!"` / `"Water reserve restored cleanly to 100%!"`
  - Oxygen Maker (`L422, L424, L429`): `"Drill fresh subsurface ice outside first!"` / `"Refill the Water Station with ice first!"` / `"Oxygen reserve restored cleanly to 100%!"`
  - Bed (`L698`): `"Complete all Sol 7 optimization tasks (Ice -> Water/O2 -> Shields -> Harvest)!"`

---

## ENDING CELEBRATION — Ares Outpost Stabilized

*Source: `src/scenes/CelebrationScene.js` (`L93–168`)*

### Final Crew Dialogue
- **Muntasir** `[!]` *(Speaking)*:
  > "Hurray! We harvested fresh Martian crops, refilled our water and oxygen to 100%, and fortified our outdoor stations with water-bag radiation shields!"
- **Maisha** *(Speaking)*:
  > "Finally, we have figured out the complete process of survival! If we continue mining for more ice, harvesting food, and keeping track of our oxygen, water, and radiation levels every week, we can keep surviving for the next few weeks!"
- **Muntasir** *(Speaking)*:
  > "The rescue mission from Earth will need quite a lot of time to reach us—on the count of months—so we must properly manage every resource we have and keep our radio charged for any further storm forecasts!"
- **Maisha** `[!]` *(Speaking)*:
  > "Hurray! We survived 7 Sols and built a sustainable home on Mars!"

### Completion Banner (`L145–161`)
> **COMPLETE! CONGRATULATIONS!**
>
> Muntasir & Maisha stabilized Ares Outpost across 7 Sols!
>
> - ✓ Solar Arrays & Kilopower Nuclear Power Online
> - ✓ Subsurface Ice Drilled: 100% Oxygen & Clean Water
> - ✓ Water-Bag Radiation Shields & Solar Storm Safe Mode
> - ✓ Sustainable Mars Greenhouse Harvested (NASA & CSA Data)
