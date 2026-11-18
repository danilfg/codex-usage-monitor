'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {hoverBar,hoverMarkdown}=require('../details');
test('hover SVG colors and lengths',()=>{for(const [p,c] of [[84,'#79c582'],[42,'#e3a536'],[20,'#f16b70']]){const uri=hoverBar(p);assert.ok(uri.startsWith('data:image/svg+xml;base64,'));const svg=Buffer.from(uri.split(',')[1],'base64').toString();assert.ok(svg.includes(c));assert.ok(svg.includes('width="'+280*p/100+'"'));}});
test('hover includes both quotas and dates',()=>{const s=hoverMarkdown([{label:'5h',remaining:84,reset:new Date('2026-11-18T15:30Z')},{label:'7d',remaining:42,reset:new Date('2026-11-23T09:00Z')}],null,new Date('2026-11-18T13:15Z'),'UTC');assert.match(s,/84%/);assert.match(s,/42%/);assert.match(s,/18\/11\/2026/);assert.match(s,/In 2h 15m/);assert.match(s,/23\/11\/2026/);});
test('hover unavailable',()=>assert.match(hoverMarkdown([],null),/Usage unavailable/));
