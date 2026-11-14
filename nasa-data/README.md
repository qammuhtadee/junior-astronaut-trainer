# Junior Astronaut Mission Trainer: data folder guide

All files are in the `data` folder. All data is ARCHIVED (saved earlier), not live. The game must say so.

## Which file to use

| File | What it is | Use it for |
|---|---|---|
| donki-table.csv | One row per day, May 2024: flares, CMEs, storm strength, particle bursts, suggested storm level (NASA DONKI) | Storm days and warnings |
| donki-snapshot.json | Same data for game code | Loading storm days |
| mars-may2024.csv | Curiosity radiation each day of May 2024, next to Earth's storm level | Mars storm story (May 20, 2024) |
| radlab-mars-summary.json | Ten-year Mars surface summary (Curiosity MSL-RAD) | Mars background level, Sun-cycle chart |
| moon-table.csv | Yearly typical Moon level and the 5 stormiest days (LRO CRaTER) | Moon background level, Moon storm days |
| radlab-moon-summary2.json | Same Moon summary for game code | Loading Moon data |
| iss-may2024-table.csv | One row per day, May 2024, inside the ISS (DosTel detectors) | "Inside a shielded spacecraft" reference |
| radlab-iss-summary.json | Same ISS summary for game code | Loading ISS data |
| osdr-cards.json | 7 science fact cards from NASA OSDR studies (mice and plants) | Fact cards, rewards |
| food-facts.json | 6 food-in-space facts from the Canadian Space Agency | Food mechanic cards |

Files named *-raw.* and radlab-iss-may2024.csv are the original downloads. The game does not need them.

## Labels to show in the game

- Space weather: "NASA DONKI, archived data, not live."
- Mars: "NASA OSDR RadLab (Curiosity MSL-RAD), archived data, not live."
- Moon: "NASA OSDR RadLab (LRO CRaTER), archived data, not live."
- ISS: "NASA OSDR RadLab (ISS DosTel detectors), archived data, not live."
- Fact cards: "NASA Open Science Data Repository (OSDR)."
- Food facts: "Canadian Space Agency."

## Rules for using the radiation numbers

1. The unit is absorbed dose in micrograys per hour (uGy/h). It is NOT sieverts or mSv. Do not compare it to an astronaut limit in mSv.
2. Moon numbers were measured IN ORBIT around the Moon, not on the surface. Say "measured by a NASA spacecraft orbiting the Moon."
3. ISS numbers were measured INSIDE the space station in low Earth orbit. Not deep space.
4. Do NOT compare Moon, Mars and ISS numbers directly. Different instruments, different places.
5. Use the median ("typical level"), not the average or the daily highest reading. Storms and magnetic-field effects make spikes.
6. Mars storm days come from Mars data, not from Earth's DONKI table. Earth's table is only a rough guide for the Moon (our assumption).
7. The fact cards come from MOUSE and PLANT studies, not human results. Keep the "studied in" tag on each card.

## The real science behind the shielding mechanic

Published research on these same CRaTER storms (Quinn et al., 2017, *J. Space Weather Space Clim.*, 7, A16, DOI: 10.1051/swsc/2017014) modeled radiation dose behind different shielding thicknesses for the largest 2012 solar events — the same type of storms in our Moon data.

- **Thin shielding (0.3 g/cm²)** could exceed the 30-day skin dose limit during the biggest 2012 events.
- **Thicker shielding (around 10 g/cm² aluminum)** kept the dose below safety limits for the same events.

**Teaching point for the game:** it's not that storms are automatically survivable or automatically deadly — it's that **shielding thickness decides which one it is.** This is real backing for a shielding-tradeoff mechanic: more power into shielding during a storm should meaningfully reduce the dose the crew takes, because that's what the real physics shows.

## Not real NASA data

Game values (power, oxygen, how fast a crop grows, how fast food runs out) are made up by our team for game balance. Label them "game values, not NASA data."

## Not done yet

- Mars rover photos and the Astronomy Picture of the Day. NASA's picture services were not working when we tried (error 404 and 500). Try again later.