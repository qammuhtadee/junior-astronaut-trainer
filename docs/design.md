# Junior Astronaut Mission Trainer
### [View the Meter Table (meter.md)](./meter.md)
A short-film style survival game for kids aged 7 to 12. Two astronauts crash-land on Mars, and the player runs their outpost for 7 in-game days. Every choice has a cost, and every day teaches one real NASA science idea.

All facts below are written from memory. Before they go into the game, confirm each one on a NASA page and record its source and date in the logbook. The game never presents static data as live.

## The story

Two astronauts crash-land on Mars after some serious accidents. **Muntasir** is the engineer, who looks after power and shielding. **Maisha** is the scientist-medic, who looks after air and water. The radio takes a long time to fix, and then they find the message delay to Earth is around 20 minutes each way. That forces the player to make autonomous decisions instead of waiting on the base. Robots had already 3D-printed the outpost walls from Martian soil (real research), so the crew only installs the equipment.

The whole game is framed as a **mission trainer**, so a wrong choice is never a death. It shows "Simulation paused: rewind?" with a short fact explaining what went wrong.

## How it plays

- **Two rooms and an airlock.** The game has two static rooms, the outpost inside and the surface of Mars outside. Each is a single screen, and nothing scrolls. An airlock connects them: standing at the airlock and pressing Space / tap fades the first room to black and fades the other one in. The two backgrounds are joined side by side only for the opening cutscene, where the view slides from the Martian surface towards the outpost, which is already built, and the astronaut goes inside.
- **Walking.** In both rooms the top 60% of the screen is background (the wall inside, the sky and dunes outside) and the bottom 40% is the floor. The astronaut walks left and right with the arrow keys, and up and down within the floor area, which is taller than the astronaut. On a phone, on-screen buttons do the same.
- **Interacting.** Standing at a station shows "Press Space / tap". That opens a **close-up pop-up task**, like the task windows in Among Us. Esc closes it.
- **One astronaut per day.** The story decides who is working, and the player never chooses. The other astronaut is not shown. On the three days when both work (the two ice-mining days and the reactor day), control passes automatically from one to the other.
- **Meters.** They appear one at a time as the story needs them: power on Day 1, oxygen on Day 2, water on Day 3, radiation protection on Day 4. For all four meters, 100% is good.
  - **Power** means spare power. Running something uses some of it. After the reactor it stays at 100% even with everything running.
  - **Radiation protection** can never reach 100%, because Mars always has natural radiation. It starts at 95% and ends near 90%.
- **Hints.** A thinking-bubble fact comes before every choice, and it never gives the answer.
- **Conversation.** At the start of the both astronauts converse with each other about potential problems and solution which is part of the hints section.
- **Build cap.** Each day allows at most one build, so no day can end in a stalemate.
- **Logbook.** It updates at the start of each day with pictures and facts. The end of the game shows it in a scrapbook art style.

## Day-by-day script

### Day 1: First light (Muntasir)

- **Story:** the outpost has no power. A pop-up explains how solar panels make electricity, with NASA rover and space station photos.
- **Mini-game:** Aim the panel (see the catalog).
- **Meter introduced:** power.
- **Evening:** the astronauts chat in speech clouds, then say "ohh it's night time". A hint says panels don't charge at night, and the player can walk outside to see the black starry sky.
- **Facts:** Mars gets about 43% of the sunlight Earth gets. Opportunity and Spirit were solar-powered. The ISS has large solar arrays.

### Day 2: Dust and air (both)

- **Morning:** the logbook shows how panels work. Power is slowly falling and the meter shakes. A flashback shows a dust storm covering the panels.
- **Fact:** Opportunity went silent in the global dust storm of June 2018, and its mission was declared over in February 2019.
- **Mini-game:** Clean the panel (Muntasir).
- **Problem:** the oxygen tanks are almost empty. The astronauts learn that oxygen can be made from Martian ice by splitting water with electricity, as the ISS does. This is the only oxygen source in the game. Fun fact: Perseverance's MOXIE made oxygen from the air instead, about 122 g in total.
- **Mini-game:** Drill for ice (Muntasir, with Maisha outside beside him).
- **Build:** the oxygen maker (Maisha), as a build puzzle. Choice: give it part of the power. If they refuse, rewind with a fact that one person needs about 0.84 kg of oxygen a day.
- **Meter introduced:** oxygen. Power falls to 60%.
- **Night:** the power panel. The correct choice is to turn off the lights and sleep within the time window. If they stay up, rewind.

### Day 3: Water (Maisha)

- **Morning:** the logbook now holds how to clean panels, how oxygen is made, and the night problem.
- **Problem:** water is at 10%. The meter is introduced.
- **Warning:** the water station drops power from 60% to about 40%. The player is tempted to build it anyway. Facts: Phoenix dug up water ice on Mars in 2008, and melting ice takes a lot of energy.
- **Mini-game:** Connect the pipes (the water station build).
- **Result:** water is refilled.
- **Night:** 40% isn't enough, so the power panel again. The correct answer is to switch off the water station and the lights and keep oxygen on, since the water tank is already full. Wrong choice: switch off oxygen, then rewind with the rule of thumb of about 3 minutes without air against about 3 days without water.

### Day 4: Dust again, then nuclear (both)

- **Morning:** another dust storm, so Muntasir cleans the panels (the same mini-game). The astronauts get frustrated with solar and one suggests nuclear power.
- **Facts:** Curiosity and Perseverance run on a nuclear battery and kept working through the 2018 storm. A small surface reactor makes tens of kilowatts (NASA's target has been about 40) day and night, in dust. A kilogram of enriched uranium holds millions of times more energy than a kilogram of chemical fuel.
- **Mini-game:** Build the reactor, using the shield and control-rod mini-game (both astronauts).
- **Meter introduced:** radiation protection, at 95%, as the crew works outside and a Geiger counter appears on the reactor. The facts explain that natural radiation on Mars is always there (Curiosity measured about 0.67 mSv per day, roughly 100 times Earth's) and that the reactor sits far from the base behind shielding, so its own contribution is small.
- **Result:** power shoots to 100%, and the night problem is gone.
- **Comms warning:** a solar storm is coming tomorrow and cosmic particles are already arriving. The oxygen vent and water pipe clog, and the crew can handle only one before the radiation meter gets low. Choice: fix the oxygen vent first (Maisha, Swap the filter) and return. Water first, or both, means rewind.
- **Before sleeping:** Muntasir uses the power panel to put non-essential devices into safe mode. A fact warns how solar storms disturb electronics.

### Day 5: The storm (Maisha)

- **Morning:** the logbook is updated and the storm hits. Going outside means rewind with a debrief.
- **Mini-game:** Build the shelter with water bags around the sleeping area. The bags stay full and drinkable, so the water meter doesn't change. Fact: water blocks radiation well.
- **After the storm:** fix the water pipe (Clear the clog).
- **Build:** the water recycling system. Fact: the ISS recovers about 98% of its water.
- **Result:** water reaches 100%.

### Day 6: Ice and shielding (both)

- **Morning:** the logbook is updated. The ice reserve is almost gone.
- **Build:** shield the mining rover with water bags (Muntasir). Wrong choice: go out unshielded, then rewind.
- **Mini-game:** Drill for ice again, then Maisha loads the ice into the oxygen maker.
- **Result:** oxygen reaches 100% and radiation protection ends near 90%. All four meters are in good shape.

### Day 7: Celebration

Both astronauts celebrate and the scene fades. The game invites the player to open the finished logbook in a scrapbook art style.

## Mini-game catalog

Each is a close-up pop-up that takes about 10 seconds, with one simple action. They are built from only six basic inputs (slider, swipe, hold, drag, toggle and tap), so each template is built once and re-skinned.

| # | Mini-game | How it works | Template | Used on |
|---|---|---|---|---|
| 1 | Aim the panel | Drag a slider to tilt the panel until the sun-bar fills | Slider | Day 1 |
| 2 | Clean the panel | Swipe a rag across a 4x4 panel until it is clean | Swipe | Day 2, Day 4 |
| 3 | Drill for ice | Hold to drill, release to cool, and reach the ice layer without overheating | Hold and release | Day 2, Day 6 |
| 4 | Build puzzle | Drag the labelled parts into their outlines (oxygen maker, pipes for the water station, recycler) | Drag and place | Day 2, Day 3, Day 5 |
| 5 | Power panel | Flip the switches. Keep life support on and turn the rest off | Toggle | Day 2, Day 3, Day 4 |
| 6 | Shield and rods | Drag shield blocks between the reactor and the base, then slide the control rods to the green zone | Drag and slider | Day 4 |
| 7 | Swap the filter | Slide out the dirty vent filter and slide in a clean one | Drag | Day 4 |
| 8 | Clear the clog | Tap the dust clumps in the pipe until it is clear, then hold the flush button | Tap | Day 5 |
| 9 | Water-bag wall | Drag water bags into every gap in a wall until the radiation counter turns green | Drag and place | Day 5, Day 6 |
| 10 | Load the ice | Drag ice chunks into the oxygen maker's hopper | Drag | Day 6 |

## NASA sources we plan to use

- **DONKI** for the solar storm events on Days 4 and 5.
- **Curiosity's radiation instrument** for natural radiation on Mars.
- **Opportunity's 2018 dust storm** for Day 2.
- **Perseverance's MOXIE** for the Day 2 fun fact.
- **ISS water recovery** for Day 5.
- **OSDR** for astronaut radiation and health findings.
