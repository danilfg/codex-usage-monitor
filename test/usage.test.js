'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {windows,bar,resetLabel,tooltip}=require('../usage');
test('remaining windows',()=>assert.deepEqual(windows({rateLimits:{primary:{usedPercent:16,windowDurationMins:300},secondary:{usedPercent:58,windowDurationMins:10080}}}),[{remaining:84,label:'5h',reset:null},{remaining:42,label:'7d',reset:null}]));
test('weekly only and missing',()=>{assert.equal(windows({rateLimits:{primary:{usedPercent:1,windowDurationMins:10080}}})[0].label,'7d');assert.deepEqual(windows({}),[]);});
test('codex bucket preferred',()=>assert.equal(windows({rateLimits:{primary:{usedPercent:0}},rateLimitsByLimitId:{codex:{primary:{usedPercent:75}}}})[0].remaining,25));
test('invalid and clamped',()=>{assert.deepEqual(windows({rateLimits:{primary:{usedPercent:'40'}}}),[]);assert.equal(windows({rateLimits:{primary:{usedPercent:101}}})[0].remaining,0);});
test('bars',()=>{assert.equal(bar(0),'□□□□□');assert.equal(bar(100),'■■■■■');});

test('snake case reset timestamp',()=>{const w=windows({rate_limits:{primary:{used_percent:20,window_minutes:300,resets_at:1795000000}}})[0];assert.equal(w.reset.getTime(),1795000000000);assert.equal(w.label,'5h');});
test('full date and countdown',()=>{const reset=new Date('2026-11-18T15:30:00Z');assert.match(resetLabel(reset,new Date('2026-11-18T13:15:00Z'),'UTC'),/18\/11\/2026.*15:30.*in 2h 15m/);});
test('missing and past resets',()=>{assert.equal(resetLabel(null),'Unavailable');assert.match(resetLabel(new Date('2026-11-18T12:00:00Z'),new Date('2026-11-18T13:00:00Z'),'UTC'),/reset expected/);});
test('tooltip includes both dates',()=>{const s=tooltip([{label:'5h',remaining:84,reset:new Date('2026-11-18T15:30:00Z')},{label:'7d',remaining:42,reset:new Date('2026-11-23T09:00:00Z')}],new Date('2026-11-18T13:00:00Z'),'UTC');assert.match(s,/18\/11\/2026/);assert.match(s,/23\/11\/2026/);});

test('click popup rows contain both quota dates and bars',()=>{const {detailRows}=require('../usage');const rows=detailRows([{label:'5h',remaining:80,reset:new Date('2026-11-18T15:30:00Z')},{label:'7d',remaining:50,reset:new Date('2026-11-22T15:30:00Z')}],new Date('2026-11-18T13:00:00Z'),'UTC');assert.equal(rows[0].label,'5-hour limit — 80%');assert.equal(rows[0].description,'■■■■□');assert.match(rows[1].detail,/22\/11\/2026/);});
