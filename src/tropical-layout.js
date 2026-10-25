/* Independent tropical slice. Metres, Y up; no country/season claim. */
export const TROPICAL_BOUNDS = 32;
export const TROPICAL_SPAWN = Object.freeze({x:0,z:12});
export const TROPICAL_HOMES = Object.freeze([
  Object.freeze(['morpho',0,7,1.15]),
  Object.freeze(['morpho',-6,0,1.3]),
  Object.freeze(['morpho',6,-8,1.2]),
  Object.freeze(['morpho',-3,-17,1.35]),
]);
// A modest walking loop, not an objective line or a rendered marker.
export const TROPICAL_ROUTE = Object.freeze([[0,12],[0,7],[-6,0],[6,-8],[-3,-17],[-10,-13],[-12,-3],[-6,0]].map(Object.freeze));

// Offset from the existing trail so the small physical table does not block walking.
export const TROPICAL_BAIT = Object.freeze({x:-3,z:2,topOffset:.78,colliderRadius:.34});

// Daytime resting study: two short logs beside, not across, the existing loop.
export const TROPICAL_LOGS = Object.freeze([
  Object.freeze({x:-5,z:5.5,length:2.4,radius:.42}),
  Object.freeze({x:-7,z:2.8,length:2.4,radius:.42}),
]);
