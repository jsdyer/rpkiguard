import { STATES, asnOf, ipOf, prefixOf, apiURL, unpack } from './model.mjs';

const $ = id => document.getElementById(id);
const form = $('validation');
const asn = form.elements.asn, prefix = form.elements.prefix;
const status = $('status');
let validation, discovery;

function note(message, error = false) {
  status.textContent = message;
  status.dataset.error = String(error);
}

async function query(url, signal) {
  const r = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(14000)]), credentials: 'omit' });
  if (!r.ok) throw new Error('RIPEstat returned HTTP ' + r.status + '. Try again shortly.');
  return r.json();
}

function message(error) {
  if (error.name === 'TimeoutError') return 'RIPEstat did not respond in time. Try again.';
  return error.message || 'The lookup could not finish.';
}

async function validate() {
  validation?.abort();
  discovery?.abort();
  $('result').hidden = true;
  const a = asnOf(asn.value), p = prefixOf(prefix.value);
  if (!a || !p) { note('Enter an ASN and a valid IPv4 or IPv6 prefix including its length.', true); return; }
  asn.value = 'AS' + a;
  prefix.value = p;
  const task = new AbortController();
  validation = task;
  const url = apiURL('rpki-validation', { resource: a, prefix: p });
  history.replaceState(null, '', '#' + new URLSearchParams({ asn: a, prefix: p }));
  note('Checking published route authorizations…');
  try {
    const source = unpack(await query(url, task.signal), a, p);
    if (task.signal.aborted) return;
    $('result').dataset.state = source.state;
    $('verdict').textContent = STATES[source.state][0];
    $('meaning').textContent = STATES[source.state][1];
    $('subject').textContent = 'AS' + a + ' · ' + p;
    const time = source.time ? new Date(/(?:Z|[+-]\d\d:\d\d)$/.test(source.time) ? source.time : source.time + 'Z') : null;
    $('lookup-time').textContent = 'Validator ' + source.validator + ' · ' + (time && Number.isFinite(time.getTime()) ? time.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC') : 'retrieved just now');
    const rows = source.roas.map(row => {
      const tr = document.createElement('tr');
      for (const value of [row.prefix, 'AS' + row.origin, '/' + row.max_length, STATES[row.validity]?.[0] ?? row.validity ?? 'Unspecified']) {
        const td = document.createElement('td');
        td.textContent = value;
        tr.append(td);
      }
      return tr;
    });
    $('roas').replaceChildren(...rows);
    $('no-roas').hidden = !!rows.length;
    $('roa-data').hidden = !rows.length;
    $('raw').href = url;
    $('history').href = 'https://coolcode.ca/routearchaeologist/#' + new URLSearchParams({ q: p });
    $('result').hidden = false;
    note('Lookup complete.');
  } catch (error) {
    if (!task.signal.aborted) note(message(error), true);
  }
}

form.addEventListener('submit', event => { event.preventDefault(); validate(); });
document.querySelectorAll('[data-asn]').forEach(button => button.addEventListener('click', () => {
  asn.value = button.dataset.asn;
  prefix.value = button.dataset.prefix;
  validate();
}));
$('discovery').addEventListener('submit', async event => {
  event.preventDefault();
  discovery?.abort();
  validation?.abort();
  $('origins').hidden = true;
  const ip = ipOf(event.currentTarget.elements.ip.value);
  if (!ip) { note('Enter one complete IP address without a prefix length.', true); return; }
  const task = new AbortController();
  discovery = task;
  note('Finding observed route origins…');
  try {
    const response = await query(apiURL('network-info', { resource: ip }), task.signal);
    if (task.signal.aborted) return;
    const p = prefixOf(response?.data?.prefix);
    const choices = [...new Set((Array.isArray(response?.data?.asns) ? response.data.asns : []).map(asnOf).filter(Boolean))];
    if (!p || !choices.length) { note('RIPEstat returned no observed origin for this address. A known ASN and prefix can still be validated.'); return; }
    const buttons = choices.map(a => {
      const button = document.createElement('button');
      button.textContent = 'Validate AS' + a + ' · ' + p;
      button.addEventListener('click', () => { asn.value = a; prefix.value = p; validate(); });
      return button;
    });
    $('origins').replaceChildren(...buttons);
    $('origins').hidden = false;
    note('Found ' + choices.length + ' observed origin' + (choices.length === 1 ? '' : 's') + ' for ' + p + '.');
  } catch (error) {
    if (!task.signal.aborted) note(message(error), true);
  }
});
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(location.href); note('Lookup link copied.'); }
  catch { note('Copy the lookup URL from the address bar.'); }
});
const params = new URLSearchParams(location.hash.slice(1));
if (params.has('asn') && params.has('prefix')) {
  asn.value = params.get('asn');
  prefix.value = params.get('prefix');
  note('Shared lookup ready. Select Validate to query RIPEstat.');
}
