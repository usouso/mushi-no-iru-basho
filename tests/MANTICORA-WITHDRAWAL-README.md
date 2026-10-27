# Bounded backward withdrawal (0.39.0)

When a Manticora needs a large reversal to escape, it first makes a short backward walk on its existing bare-ground lane, if there is sufficient room and the motion leads away from the observer. It then plants its feet and performs the existing turn. It does not teleport, gain invulnerability, extend its lane or change net range/cooldown. Ordinary movement and forward escape remain unchanged.

This addresses a reproducible case in which the previous long planted turn kept the insect at the same position through the next legal net attempt. Representative normal/sprint approaches now move about 12 cm during that retry interval. It remains possible to capture by approaching quietly or by following the visible movement. These are game-scale distances, not measurements of animal behavior.

Run with Node 24:

```sh
node --test tests/manticora-withdrawal.test.mjs tests/manticora-withdrawal-main.test.mjs
```

Five focused simulation/geometry groups and two actual-main/mock-browser groups pass. Five affected older study/field groups preserve frozen 0.38 ordinary and forward traces and the original geometry/capture thresholds; their intentional reversed-threat references are superseded by the new withdrawal tests. The production graph adds one group. This is 13 unique targeted groups, not a whole-suite run.

The main tests exercise real simulation, colliders, net checks and scene geometry with fake DOM/WebGL/audio/storage boundaries. They do not establish actual browser rendering, audio, durable saves, natural-looking motion or player enjoyment. Near a lane endpoint there may be no room for the backward step; the prior planted turn remains the safe fallback. No other species or battle rule changes in this step.
