import test from 'node:test';
import assert from 'node:assert/strict';
import {asnOf,prefixOf,unpack} from '../web/model.mjs';
test('normalizes IPv4 and IPv6 network boundaries',()=>{assert.equal(prefixOf('193.0.0.7/21'),'193.0.0.0/21');assert.equal(prefixOf('2001:db8:1234::9/32'),'2001:db8::/32');assert.equal(prefixOf('1.2.3.4/33'),null);assert.equal(prefixOf('2001:db8::/129'),null);});
test('ASN limits reject zero, overflow and nonnumeric input',()=>{assert.equal(asnOf('AS3333'),'3333');for(const x of ['0','4294967296','AS-1','33x'])assert.equal(asnOf(x),null);});
test('mismatched responses cannot validate a different route',()=>{const p={data:{status:'valid',resource:'AS3333',prefix:'193.0.0.0/21',validating_roas:[]}};assert.equal(unpack(p,'3333','193.0.0.0/21').state,'valid');assert.throws(()=>unpack(p,'15169','193.0.0.0/21'));assert.throws(()=>unpack(p,'3333','193.0.0.0/24'));});
