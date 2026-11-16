# RPKI Guard

Run `python3 scripts/build.py`, then serve `dist/`, or publish it through GitHub Pages. There are no build dependencies or credentials.

The browser queries the RIPEstat RPKI Validation and Network Info endpoints after the user submits a form. The former queries Routinator and returns the classification and covering validated payloads. The latter uses observed BGP data. Route history links open CoolCode Route Archaeologist. Shared links populate the query without transmitting it until the user selects Validate.

The first two examples use the RIPE NCC's documented `AS3333 / 193.0.0.0/21` pair and an alternate origin. Actual reports reflect the upstream data at lookup time. See [RIPEstat's validation documentation](https://stat.ripe.net/docs/data-api/api-endpoints/rpki-validation).
