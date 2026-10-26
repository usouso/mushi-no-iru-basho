/** Test-only Web Locks double: callbacks are asynchronous and exclusive per name. */
import assert from 'node:assert/strict';
export function createTestLocks(){
 const tails=new Map(),requests=[];
 return {requests,request(name,options,callback){
  assert.equal(name,'mushi-journal-v2');assert.equal(options?.mode,'exclusive');assert.equal(typeof callback,'function');requests.push({name,mode:options.mode});
  const operation=(tails.get(name)||Promise.resolve()).then(()=>callback({name,mode:'exclusive'}));
  tails.set(name,operation.catch(()=>{}));return operation;
 }};
}
export function createHeldLocks(){
 const requests=[];let running=false;
 return {requests,request(name,options,callback){assert.equal(name,'mushi-journal-v2');assert.equal(options?.mode,'exclusive');return new Promise((resolve,reject)=>requests.push({name,callback,resolve,reject}));},
  async releaseNext(){assert.equal(running,false,'exclusive callbacks must not overlap');const request=requests.shift();assert.ok(request,'queued request required');running=true;try{const value=await request.callback({name:request.name,mode:'exclusive'});request.resolve(value);}catch(error){request.reject(error);}finally{running=false;}await Promise.resolve();}
 };
}
export async function flushMicrotasks(){for(let i=0;i<12;i++)await Promise.resolve();}
