# Junior Astronaut Trainer — Complete Dialogues (Day 4 to Day 7 & Ending)

This file extracts **verbatim** all character dialogues, thought bubbles (`[Thought]`), Deep Space Comms broadcasts (`[Radio]`), inline fact reveals (`[Fact Reveal]`), choice modals, rewind/critical warnings, interaction toasts, and End-of-Sol transitions from **Day 4 onwards** (`OutpostScene.js`, `SurfaceScene.js`, `RoomScene.js`, `HudScene.js`, `PowerPanelTask.js`, and `CelebrationScene.js`).

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
