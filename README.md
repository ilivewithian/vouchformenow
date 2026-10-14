# Vouch For Me Now

**A code word that changes every 30 seconds.**

[vouchformenow.com](https://vouchformenow.com) gives two people a shared secret so that, on a phone call, either can prove they're the real one — even if a scammer has cloned their voice.

It's standard TOTP (the same thing behind two-factor login codes), used between two humans instead of between a human and a website. Both people scan one QR code into any authenticator app; from then on their phones show the same six-digit code at the same time. "Read me the code" becomes a family habit that a voice clone can't fake.

## How it works

1. The page generates a random 160-bit secret with `crypto.getRandomValues`.
2. It encodes the secret as an `otpauth://totp/…` URI and renders it as a QR code.
3. Both people scan the same QR with their authenticator app (Google Authenticator, Authy, Microsoft Authenticator, 1Password, Bitwarden, Apple Passwords, Aegis, …).
4. The page shows the current code (HMAC-SHA1 via WebCrypto) so both apps can be checked, then everyone closes the tab.

Nothing is stored and nothing is transmitted. There is no server.

## Threat model

**Protects against**

- Voice-cloned or impersonated phone calls from "family members"
- "This is my new number" messages asking for money
- Reuse of a fixed family code word that has leaked

**Does not protect against**

- A stolen, unlocked phone — whoever holds the device holds the codes
- A live relay: an attacker on the line with the real person at the same moment can pass a code on within its 30-second window
- Social pressure to skip the check — the point is to make pausing normal
- Identifying *which* person in a pair is speaking; both hold the same secret, so use one secret per pair, never one per group

## Privacy and trust

Because the whole value of the tool is that the secret stays private, the site is built so you don't have to trust it:

- Single static page, no backend, no accounts, no cookies, no analytics
- Content Security Policy with no `connect-src`: the page cannot make network requests
- No CDN dependencies; the QR encoder is vendored in `vendor/`
- Works offline — save the page and open it from disk with the network off
- Source is here, MIT licensed, small enough to read in ten minutes

## Repository layout

```
index.html                 generator page
how-to-use.html            plain-English guide and threat model
app.js                     base32, otpauth URI, TOTP, UI
style.css
vendor/qrcode.js           qrcode-generator by Kazuhiko Arase (MIT)
_headers                   security headers for Cloudflare Pages
staticwebapp.config.json   same headers for Azure Static Web Apps
CNAME                      custom domain for GitHub Pages
```

Headers are duplicated as `<meta http-equiv>` tags in the HTML so the CSP applies on GitHub Pages too, which can't set response headers. HSTS can only be set as a real header, so on GitHub Pages it relies on "Enforce HTTPS" in the repo settings.

## Developing

There is no build step. Open `index.html` in a browser, or:

```
python3 -m http.server 8000
```

## Licence

MIT. See [LICENSE](LICENSE). QR encoding by [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), also MIT. "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.
