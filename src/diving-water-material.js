/** Unconnected optical study. Depth is a coarse DISPLAY approximation, never a
 * swimming/support surface. Existing terrain and water vertices stay untouched.
 * CPU construction tests do not establish GPU compilation or discoverability.
 */
const THREE=window.THREE;
const WIDTH=64,HEIGHT=48,MAX_DEPTH=.60;
const RECT=Object.freeze({minX:14.3,minZ:-26.45,width:19.4,height:12.9});
const ANCHOR='gl_FragColor=vec4(mix(col,uFogColor,f),.87);';
const REPLACEMENT=`vec2 pondUV=(vWorld.xz-vec2(14.3,-26.45))/vec2(19.4,12.9);
float waterDepth=texture2D(uPondDepth,pondUV).r*.60;
float waterAlpha=mix(.55,.87,smoothstep(.30,.55,waterDepth));
gl_FragColor=vec4(mix(col,uFogColor,f),waterAlpha);`;
export function divingWaterOpacity(depth){
 if(!Number.isFinite(depth))throw new TypeError('Finite display depth required');
 const t=Math.max(0,Math.min(1,(depth-.30)/.25));return .55+(.87-.55)*t*t*(3-2*t);
}
/** Attaches one private material/texture. No scene-global cache or update loop.
 * restore(): reattach original, dispose study material/texture, retain original.
 * dispose(): world-teardown path, dispose study AND detached original material.
 * Existing scene-root material.dispose() also triggers the teardown path; this
 * is necessary because that disposer does not walk ShaderMaterial uniforms.
 * The caller must not independently replace the attached material before restore.
 */
export function attachDivingWaterMaterial(water,heightAt){
 const original=water?.material;
 if(!water?.isMesh||!original?.isShaderMaterial||typeof heightAt!=='function'||original.userData.divingWaterStudy)throw new TypeError('One original pond mesh and height sampler required');
 if(original.fragmentShader.split(ANCHOR).length!==2||!original.uniforms.uTime||!original.uniforms.uColor||!original.uniforms.uFogColor||!original.uniforms.uFogDensity||!original.transparent||original.depthWrite||!original.depthTest)throw new Error('Original pond shader contract changed');
 const p=water.geometry?.attributes?.position;
 if(!p||water.geometry.type!=='CircleGeometry'||Math.abs(p.getX(0)-24)>1e-5||Math.abs(p.getY(0)+.29)>1e-6||Math.abs(p.getZ(0)+20)>1e-5)throw new Error('Expected the existing temperate pond');
 const data=new Uint8Array(WIDTH*HEIGHT*4);let minDepth=Infinity,maxDepth=-Infinity,maxQuantizationError=0;
 // Texel centres align with texture2D's normalized coordinate interpolation.
 // heightAt differs from actual rendered triangles by ~8cm at measured banks;
 // this approximation and bilinear filtering are intentionally optical only.
 for(let j=0;j<HEIGHT;j++)for(let i=0;i<WIDTH;i++){
  const x=RECT.minX+(i+.5)/WIDTH*RECT.width,z=RECT.minZ+(j+.5)/HEIGHT*RECT.height,bottom=heightAt(x,z);
  if(!Number.isFinite(bottom))throw new TypeError('Nonfinite pond display depth');
  const depth=Math.max(0,Math.min(MAX_DEPTH,-.29-bottom)),q=Math.round(depth/MAX_DEPTH*255),offset=(j*WIDTH+i)*4;
  data[offset]=q;data[offset+3]=255;minDepth=Math.min(minDepth,depth);maxDepth=Math.max(maxDepth,depth);maxQuantizationError=Math.max(maxQuantizationError,Math.abs(q/255*MAX_DEPTH-depth));
 }
 const texture=new THREE.DataTexture(data,WIDTH,HEIGHT,THREE.RGBAFormat,THREE.UnsignedByteType);
 texture.name='diving-study-approximate-water-depth';texture.encoding=THREE.LinearEncoding;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;texture.generateMipmaps=false;texture.flipY=false;texture.needsUpdate=true;
 const material=original.clone();material.name='diving-study-depth-water';material.userData.divingWaterStudy=true;
 // Preserve the original world.update(time) link, not cloned uniform values.
 for(const key of Object.keys(original.uniforms))material.uniforms[key]=original.uniforms[key];
 material.uniforms.uPondDepth={value:texture};material.fragmentShader='uniform sampler2D uPondDepth;\n'+original.fragmentShader.replace(ANCHOR,REPLACEMENT);material.needsUpdate=true;
 let closed=false;
 const onExternalDispose=()=>{if(closed)return;closed=true;material.removeEventListener('dispose',onExternalDispose);texture.dispose();original.dispose();};
 material.addEventListener('dispose',onExternalDispose);water.material=material;
 function restore(){if(closed)return false;if(water.material!==material)throw new Error('Study material ownership changed');closed=true;material.removeEventListener('dispose',onExternalDispose);water.material=original;material.dispose();texture.dispose();return true;}
 function dispose(){if(closed)return false;material.dispose();return true;}
 return{material,depthTexture:texture,stats:Object.freeze({width:WIDTH,height:HEIGHT,textureBytes:data.byteLength,heightSamples:WIDTH*HEIGHT,minDepth,maxDepth,maxQuantizationError,addedDrawEntries:0,addedTriangles:0,fragmentTextureLookups:1}),restore,dispose};
}
