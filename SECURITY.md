# Security Policy

## Supported versions

Only the latest commit on `main` (and the live site built from it) receives fixes.

## Reporting a vulnerability

Please do not open a public issue for security problems.

Report privately through GitHub:
[Security → Report a vulnerability](https://github.com/batuhanmeral/data-transformer/security/advisories/new).

Include the affected URL or commit, the recipe and input that reproduce the problem
(a share link is fine if it holds no real data), and what you expected to happen.
Remove real credentials and personal data from the report.

You can expect an acknowledgement within 7 days. Confirmed issues are fixed on `main`
and credited in the advisory unless you prefer otherwise.

## Scope

Unravel is a static site: recipes, inputs and outputs are processed in the browser and
there is no backend. In scope:

- XSS or script execution through rendered output, including the HTML preview, shared
  recipe links and imported CyberChef recipes.
- Bypassing the Content Security Policy or other response headers served for the site.
- Any way for input, output or recipe data to leave the browser (network requests,
  leaks through share links beyond the URL fragment, or third-party loads).
- Incorrect or weak cryptographic operations, such as wrong results, unsafe defaults or
  misleading output.
- Secrets or personal data in the repository or build artefacts.

Out of scope: denial of service by traffic volume or by very large inputs in your own
browser, findings that require a modified deployment or browser, and missing headers on
third-party domains.
