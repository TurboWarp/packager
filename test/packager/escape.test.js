import {test} from 'node:test';
import assert from 'node:assert';
import escapeXML from "../../src/common/escape-xml.js";

test('escapeXML', () => {
  assert.deepStrictEqual(escapeXML('abc<>"\'&def'), 'abc&lt;&gt;&quot;&apos;&amp;def')
});
