# Meter table

This file gives the value of every meter at every step of the game. All numbers are game design values, not NASA data, so they can be tuned after testing. The story and rules are in `README.md`.

## Rules behind the numbers

- **Meters:** power (spare power), oxygen, water and radiation protection. All four read "100% is good". Radiation protection never goes above 95%, because Mars always has natural radiation.
- **Solar phase (Days 1 to 4, before the reactor):** the power meter also works like a battery. Each morning the sun recharges it up to the **day cap**, which is 100 minus what the running modules take. The oxygen maker takes 40 and the water station takes 20, so the cap is 100, then 60, then 40.
- **Night drain (solar phase):** nothing recharges at night, and each part of the base drains the meter. The base itself takes 10, the oxygen maker 25, the water station 20, and the extras (lights, lab equipment, heaters) 35. **Night mode** switches the extras off.
- **After the reactor:** power stays at 100% and there is no night problem.
- **Radiation clock (Day 4 onwards):** outside tasks have no countdown number. The radiation protection meter drains while the pop-up is open, and that is the clock. Normal background outside drains 0.2 points per second, particle rain 1.5 per second, and a shielded rover 0.3 per second. Inside the base the meter recovers when the astronaut rests.
- **Rewind triggers:** any meter at 0%, radiation protection below 30%, or any wrong choice listed below.
- **Checkpoints:** a row marked with a check is a checkpoint. A rewind restores the values of the last checkpoint.

## Values at every step

A dash means the meter isn't shown yet.

| Day | Step | Power | Oxygen | Water | Radiation | Checkpoint |
|---|---|---|---|---|---|---|
| 1 | Start | - | - | - | - | |
| 1 | Panel aimed and built, power meter appears | 100 | - | - | - | ✓ |
| 1 | Night falls (story sets night mode) | 90 | - | - | - | |
| 2 | Morning, dust on the panels, meter shakes | 90 down to 75 | - | - | - | |
| 2 | Panel cleaned | 100 | - | - | - | ✓ |
| 2 | Oxygen meter appears, tanks nearly empty | 100 | 20 | - | - | |
| 2 | Ice drilled | 100 | 20 | - | - | ✓ |
| 2 | Oxygen maker built and given power | 60 | 100 | - | - | ✓ |
| 2 | Night with night mode on | 25 | 100 | - | - | |
| 2 | **Wrong:** lights left on | 0 | 100 | - | - | rewind |
| 3 | Morning recharge | 60 | 100 | - | - | |
| 3 | Water meter appears | 60 | 100 | 10 | - | |
| 3 | Water station built | 40 | 100 | 100 | - | ✓ |
| 3 | Night: night mode and water station off, oxygen on | 5 | 100 | 95 | - | |
| 3 | **Wrong:** night mode only, everything else running | 0 | 100 | 100 | - | rewind |
| 3 | **Wrong:** oxygen switched off | 10 | 25 | 100 | - | rewind |
| 4 | Morning recharge | 40 | 100 | 95 | - | |
| 4 | Dust on the panels, then cleaned | 30 up to 40 | 100 | 95 | - | |
| 4 | Reactor built, radiation meter appears, then shield placed | 100 | 100 | 95 | 95 down to 90 | ✓ |
| 4 | Comms warning, vent and pipe clog | 100 | 75 | 90 | 90 | ✓ |
| 4 | Vent fixed first (correct) | 100 | 100 | 90 | 55 | |
| 4 | **Wrong:** pipe fixed first, vent left | 100 | 30 | 95 | 55 | rewind |
| 4 | **Wrong:** both attempted | 100 | 100 | 100 | 20 | rewind |
| 4 | Safe mode set, night rest inside | 100 | 100 | 85 | 75 | |
| 5 | Storm begins | 100 | 100 | 80 | 75 | ✓ |
| 5 | Shelter built from water bags | 100 | 100 | 80 | 70 | ✓ |
| 5 | **Wrong:** going outside | 100 | 100 | 80 | 0 | rewind |
| 5 | Storm ends, pipe cleared | 100 | 100 | 90 | 70 | |
| 5 | Recycler built | 100 | 100 | 100 | 70 | ✓ |
| 5 | Night rest, ice running low | 100 | 80 | 100 | 85 | |
| 6 | Morning, ice almost gone | 100 | 70 | 100 | 85 | ✓ |
| 6 | Rover shield built | 100 | 70 | 100 | 85 | ✓ |
| 6 | Shielded mining trip | 100 | 70 | 100 | 76 | |
| 6 | **Wrong:** unshielded mining trip | 100 | 70 | 100 | 25 | rewind |
| 6 | Ice loaded into the oxygen maker | 100 | 100 | 100 | 76 | |
| 6 | Rest inside | 100 | 100 | 100 | 90 | |
| 7 | Final state shown | 100 | 100 | 100 | 90 | |

## Notes for tuning

- The oxygen drop on Day 5 and Day 6 shows the ice running low, so Day 6 has a reason to go outside.
- The unsafe radiation values (20, 25, 0) are meant to be easy to hit when the player picks the wrong option, so each rewind teaches the lesson.
- The vent and pipe tasks on Day 4 each take about 23 seconds, so the clock drains about 35 points per task. That is why only one fits.
