import escapeXML from "../../src/common/escape-xml";

test('escapeXML', () => {
  expect(escapeXML('abc<>"\'&def')).toEqual('abc&lt;&gt;&quot;&apos;&amp;def')
});
