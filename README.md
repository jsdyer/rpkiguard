# RPKI Guard

<!-- coolcode:guide -->
Submit an ASN and prefix to inspect the validation result and covering authorizations. A shared link only fills the form; select Validate to send it to RIPEstat, and distinguish an unauthorized origin from a prefix that exceeds the allowed length.
<!-- /coolcode:guide -->

Run `python3 scripts/build.py`, then serve `dist/`, or publish it through GitHub Pages. There are no build dependencies or credentials.

The browser queries the RIPEstat RPKI Validation and Network Info endpoints after the user submits a form. The former queries Routinator and returns the classification and covering validated payloads. The latter uses observed BGP data. Route history links open CoolCode Route Archaeologist. Shared links populate the query without transmitting it until the user selects Validate.

The first two examples use the RIPE NCC's documented `AS3333 / 193.0.0.0/21` pair and an alternate origin. Actual reports reflect the upstream data at lookup time. See [RIPEstat's validation documentation](https://stat.ripe.net/docs/data-api/api-endpoints/rpki-validation).

## Regression checks

Pull requests that change code run logic tests and Chromium checks at this tool’s
Pages subpath, including a real control interaction and 320/390-pixel layouts.
Documentation-only pull requests skip this workflow. Publication waits for the
same checks. Test data stays in a separate job and is never packaged for Pages.

```sh
node --test tests/*.test.mjs
python3 scripts/build.py
python3 -m pip install -r tests/browser-requirements.txt
python3 -m playwright install chromium
python3 tests/browser_smoke.py
```
