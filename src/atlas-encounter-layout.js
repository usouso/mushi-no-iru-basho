/** Stable support keys, not coordinates. Generation 1..4 keeps its original
 * branch; generations 5 through 10 select one of two static supports per saved outing.
 * Separate draw channel: no encounter IDs, size, motion or site draws change.
 * Repeated choices are allowed. Never call random, storage or a live simulation.
 */
export function atlasEncounterSupportKey(snapshot){
 if(snapshot===null||snapshot===undefined)return 'A';
 if(typeof snapshot!=='object'||Array.isArray(snapshot)||![1,2,3,4,5,6,7,8,9,10].includes(snapshot.generatorVersion)||!Number.isInteger(snapshot.worldSeed)||snapshot.worldSeed<0||snapshot.worldSeed>0xffffffff||!Number.isSafeInteger(snapshot.outingCounter)||snapshot.outingCounter<1)throw new TypeError('Invalid Atlas outing support selection');
 if(snapshot.generatorVersion<5)return 'A';
 // This exact versioned input and avalanche define the gen5 support table.
 const input=`g5/${snapshot.worldSeed.toString(16).padStart(8,'0')}/${snapshot.outingCounter}/atlas/support-v1`;let h=0x811c9dc5;
 for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,0x01000193);}
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h=(h^(h>>>16))>>>0;
 return h%2===0?'A':'B';
}
