'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {windows,bar}=require('../usage');
test('remaining windows',()=>assert.deepEqual(windows({rateLimits:{primary:{usedPercent:16,windowDurationMins:300},secondary:{usedPercent:58,windowDurationMins:10080}}}),[{remaining:84,label:'5h',reset:null},{remaining:42,label:'7d',reset:null}]));
test('weekly only and missing',()=>{assert.equal(windows({rateLimits:{primary:{usedPercent:1,windowDurationMins:10080}}})[0].label,'7d');assert.deepEqual(windows({}),[]);});
test('codex bucket preferred',()=>assert.equal(windows({rateLimits:{primary:{usedPercent:0}},rateLimitsByLimitId:{codex:{primary:{usedPercent:75}}}})[0].remaining,25));
test('invalid and clamped',()=>{assert.deepEqual(windows({rateLimits:{primary:{usedPercent:'40'}}}),[]);assert.equal(windows({rateLimits:{primary:{usedPercent:101}}})[0].remaining,0);});
test('bars',()=>{assert.equal(bar(0),'□□□□□');assert.equal(bar(100),'■■■■■');});
