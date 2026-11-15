# Junior Astronaut Mission Trainer
A short-film style survival game for kids aged 7 to 12. Two astronauts crash-land on Mars, and the player runs their outpost for 7 in-game days. Every choice has a cost, and every day teaches one real NASA science idea.
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

## NASA sources used
- **DONKI** for the solar storm events on Days 4 and 5.
- **Curiosity's radiation instrument** for natural radiation on Mars.
- **Opportunity's 2018 dust storm** for Day 2.
- **Perseverance's MOXIE** for the Day 2 fun fact.
- **ISS water recovery** for Day 5.
- **OSDR** for astronaut radiation and health findings.
