'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {quotaColor,renderCard,documentHtml}=require('../details');
test('quota color boundaries',()=>{for(const [n,color] of [[100,'green'],[51,'green'],[50,'amber'],[21,'amber'],[20,'red'],[0,'red']])assert.equal(quotaColor(n),color);});
test('continuous bars and reset dates',()=>{const html=renderCard([{label:'5h',remaining:84,reset:new Date('2026-11-18T15:30Z')},{label:'7d',remaining:42,reset:new Date('2026-11-23T09:00Z')}],null,new Date('2026-11-18T13:15Z'),'UTC');assert.match(html,/width:84%/);assert.match(html,/width:42%/);assert.match(html,/18\/11\/2026/);assert.match(html,/In 2h 15m/);assert.match(html,/#79c582/);assert.match(html,/#e3a536/);});
test('clamp values and escape untrusted text',()=>{const html=renderCard([{label:'<script>',remaining:130,reset:null},{label:'test',remaining:-5,reset:null}],null);assert.match(html,/width:100%/);assert.match(html,/width:0%/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);});
test('offline document uses restrictive CSP',()=>{const html=documentHtml([],null);assert.match(html,/default-src 'none'/);assert.match(html,/script-src 'nonce-/);assert.match(html,/Usage unavailable/);assert.match(html,/id="close"/);});
