/** A field-only readability fill, not a physical lighting or emissive effect.
 * The existing silhouette, material alpha, depth test, fog and draw count stay
 * intact. This changes only the lit colour inside already-visible fragments.
 * No distance markers, outlines through plants, added mesh or per-frame work.
 * Materials belong to the newly created model; texture ownership is unchanged.
 */
const patched = new WeakSet();
const OUTPUT = 'gl_FragColor = vec4( outgoingLight, diffuseColor.a );';
const KEY = 'insect-readability-1';

export function applyInsectReadability(root, { inspection = false, species = root?.userData?.species } = {}) {
  // The small natural-light cue is the point of the firefly study. Do not turn
  // the whole insect into a beacon or change the observation model's colours.
  if (inspection || species === 'firefly' || !root?.traverse) return root;
  const nocturnal = species === 'rhino' || species === 'stag';
  const edgeStrength = nocturnal ? .24 : .60;
  const shadowFloor = nocturnal ? .08 : .22;
  root.traverse(node => {
    if (!node.isMesh) return;
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      // Thin transparent membranes keep their original translucency. Custom
      // shader/basic/line materials are also outside this small adapter.
      if (!material?.isMeshStandardMaterial || material.transparent || patched.has(material)) continue;
      const previousCompile = material.onBeforeCompile;
      const previousKey = material.customProgramCacheKey;
      const defaultKey = window.THREE.Material.prototype.customProgramCacheKey;
      material.onBeforeCompile = function(shader, renderer) {
        previousCompile.call(this, shader, renderer);
        // Unknown upstream shaders keep their prior result instead of breaking
        // rendering. The shipped r128 standard shader is checked in tests.
        if (!shader.fragmentShader.includes(OUTPUT)) return;
        shader.fragmentShader = shader.fragmentShader.replace(OUTPUT, `
  // ${KEY}: view-angle contrast inside the original depth-tested surface.
  float insectEdge = smoothstep( 0.45, 0.92, 1.0 - abs( dot( normal, normalize( vViewPosition ) ) ) );
  outgoingLight = max( outgoingLight, diffuseColor.rgb * ${shadowFloor.toFixed(2)} );
  vec3 insectEdgeFill = min( vec3( 0.65 ), diffuseColor.rgb * 0.72 + vec3( 0.08 ) );
  outgoingLight = mix( outgoingLight, max( outgoingLight, insectEdgeFill ), insectEdge * ${edgeStrength.toFixed(2)} );
  ${OUTPUT}`);
      };
      material.customProgramCacheKey = function() {
        // THREE's default key reads this.onBeforeCompile; retain the *previous*
        // hook text in that case, while preserving explicit dynamic cache keys.
        const base = previousKey === defaultKey ? previousCompile.toString() : previousKey.call(this);
        return `${base}|${KEY}:${edgeStrength}:${shadowFloor}`;
      };
      patched.add(material);
      material.needsUpdate = true;
    }
  });
  return root;
}
