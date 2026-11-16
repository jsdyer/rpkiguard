export const STATES = {
  valid: ['Valid origin', 'A covering authorization permits the queried AS and prefix length.'],
  invalid_asn: ['Invalid origin', 'No covering entry authorizes the queried AS for this prefix.'],
  invalid_length: ['Invalid length', 'The prefix is more specific than the length allowed by the covering authorization.'],
  unknown: ['No covering authorization', 'The validator did not find a covering route authorization for this prefix.'],
};

export function asnOf(text) {
  const m = /^(?:AS)?([0-9]{1,10})$/i.exec(String(text ?? '').trim());
  const n = m ? Number(m[1]) : -1;
  return n > 0 && n <= 4294967295 ? String(n) : null;
}

export function ipOf(text) {
  const raw = String(text ?? '').trim();
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(raw)) {
    const parts = raw.split('.').map(Number);
    return parts.every(n => n <= 255) ? parts.join('.') : null;
  }
  if (!raw.includes(':') || !/^[\da-f:.]+$/i.test(raw)) return null;
  try { return new URL('http://[' + raw + ']/').hostname.slice(1, -1); }
  catch { return null; }
}

export function prefixOf(text) {
  const input = String(text ?? '').trim().split('/');
  if (input.length !== 2 || !/^\d{1,3}$/.test(input[1])) return null;
  const ip = ipOf(input[0]);
  if (!ip) return null;
  const bits = Number(input[1]), v6 = ip.includes(':');
  const width = v6 ? 128 : 32;
  if (bits > width) return null;
  if (!v6) {
    const octets = ip.split('.').map(Number);
    return octets.map((n, i) => n & (255 << Math.min(8, Math.max(0, 8 * (i + 1) - bits)))).join('.') + '/' + bits;
  }
  const halves = ip.split('::').map(seg => seg ? seg.split(':') : []);
  const groups = halves.length === 1 ? halves[0] : [...halves[0], ...Array(8 - halves[0].length - halves[1].length).fill('0'), ...halves[1]];
  const network = groups.map((n, i) => (parseInt(n, 16) & (65535 << Math.min(16, Math.max(0, 16 * (i + 1) - bits)))).toString(16)).join(':');
  return ipOf(network) + '/' + bits;
}

export function apiURL(endpoint, params) {
  const url = new URL('https://stat.ripe.net/data/' + endpoint + '/data.json');
  url.search = new URLSearchParams({ ...params, sourceapp: 'coolcode-rpkiguard' });
  return url.href;
}

export function unpack(payload, asn, prefix) {
  const data = payload?.data;
  if (!data || !Object.hasOwn(STATES, data.status) || asnOf(data.resource) !== asn || prefixOf(data.prefix) !== prefix) {
    throw new Error('RIPEstat returned an unexpected validation response.');
  }
  const roas = Array.isArray(data.validating_roas) ? data.validating_roas.filter(row => row && prefixOf(row.prefix) && /^\d+$/.test(String(row.origin)) && Number.isInteger(row.max_length)) : [];
  return { state: data.status, validator: data.validator || 'RIPEstat', time: payload.time, roas };
}
