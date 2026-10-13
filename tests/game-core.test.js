import test from 'node:test';
import assert from 'node:assert/strict';
import {CHALLENGES,MECHANICS,MEMORY_SYMBOLS,freshSave,validSave,normalizeSave,updateAfterRound,challengeById,makeChoiceOptions,makeMemorySequence,shuffleChallenges} from '../src/game-core.js';
test('manual contains 100 unique challenges and ten different mechanics',()=>{assert.equal(CHALLENGES.length,100);assert.equal(new Set(CHALLENGES.map(c=>c.id)).size,100);assert.equal(new Set(CHALLENGES.map(c=>c.name)).size,100);assert.equal(MECHANICS.length,10);for(const c of CHALLENGES){assert.ok(MECHANICS.includes(c.mechanic));assert.ok(c.prompt);assert.ok(c.timeLimit>0);}});
test('new save is valid and challenge lookup is exact',()=>{const s=freshSave();assert.equal(validSave(s),true);assert.equal(challengeById('mini-001').number,1);assert.equal(challengeById('missing'),null);});
test('clearing a challenge records it once and rewards each successful round',()=>{let s=freshSave(),c=CHALLENGES[0];s=updateAfterRound(s,c,true,120,1);assert.deepEqual(s.completed,[c.id]);assert.equal(s.coins,3);s=updateAfterRound(s,c,true,200,2);assert.deepEqual(s.completed,[c.id]);assert.equal(s.coins,6);assert.equal(s.highScore,200);assert.equal(s.bestStreak,2);});
test('missed challenge does not unlock or award coins',()=>{const s=updateAfterRound(freshSave(),CHALLENGES[2],false,10,0);assert.equal(s.completed.length,0);assert.equal(s.coins,0);assert.equal(s.highScore,10);});
test('malformed saves rejected and valid saves round trip',()=>{const s=freshSave();s.completed.push(CHALLENGES[3].id);assert.equal(validSave(s),true);assert.deepEqual(normalizeSave(s).completed,[CHALLENGES[3].id]);assert.equal(validSave({...s,completed:['not-a-challenge']}),false);});

test('all choice challenges have three distinct options and exactly one answer',()=>{
 for(const c of CHALLENGES.filter(c=>c.mechanic==='choice')){
  const options=makeChoiceOptions(c.number,c.difficulty);
  assert.equal(options.length,3,`challenge ${c.id}`);
  assert.equal(new Set(options.map(o=>o.label)).size,3,`duplicate options in ${c.id}`);
  assert.equal(options.filter(o=>o.ok).length,1,`answer count in ${c.id}`);
 }
});
test('every memory sequence symbol is selectable',()=>{
 const selectable=new Set(MEMORY_SYMBOLS);
 for(const c of CHALLENGES.filter(c=>c.mechanic==='memory')){
  const sequence=makeMemorySequence(c.number,c.difficulty);
  assert.ok(sequence.length>=2 && sequence.length<=5);
  for(const symbol of sequence) assert.ok(selectable.has(symbol),`unselectable symbol ${symbol} in ${c.id}`);
 }
});
test('save validation rejects negative, fractional, and unsafe progression values',()=>{
 const base=freshSave();
 assert.equal(validSave({...base,bestStreak:-1}),false);
 assert.equal(validSave({...base,coins:-1}),false);
 assert.equal(validSave({...base,highScore:1.5}),false);
 assert.equal(validSave({...base,coins:Number.MAX_SAFE_INTEGER+1}),false);
});

test('endless challenge deck contains every challenge exactly once before cycling',()=>{
 const deck=shuffleChallenges(()=>0.42);
 assert.equal(deck.length,100);
 assert.equal(new Set(deck.map(c=>c.id)).size,100);
 assert.deepEqual(new Set(deck.map(c=>c.id)),new Set(CHALLENGES.map(c=>c.id)));
});
