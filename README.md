# Vouch For Me Now

**A code word that changes every 30 seconds.**

[vouchformenow.com](https://vouchformenow.com) gives each person a personal code that the people they trust can check, so on a phone call you can prove you're really you — and they can prove they're really them — even if a scammer has cloned a voice.

It's standard TOTP (the same thing behind two-factor login codes), used between humans instead of between a human and a website. Rob generates "Rob", scans it into his authenticator app, and the people who need to verify Rob scan the same QR. Jac does the same for "Jac". From then on, "read me your code" works in both directions and a voice clone can't fake it.

## How it works

1. The page generates a random 160-bit secret with `crypto.getRandomValues`.
2. It encodes the secret as an `otpauth://totp/…` URI and renders it as a QR code.
3. The named person scans it into their authenticator app (Google Authenticator, Authy, Microsoft Authenticator, 1Password, Bitwarden, Apple Passwords, Aegis, …), and so does everyone who needs to verify them.
4. The page shows the current code (HMAC-SHA1 via WebCrypto) so all the apps can be checked, then everyone closes the tab.
5. Repeat for each person, so verification runs both ways.

Nothing is stored and nothing is transmitted. There is no server.

## Threat model

**Protects against**

- Voice-cloned or impersonated phone calls from "family members"
- "This is my new number" messages asking for money
- Reuse of a fixed family code word that has leaked

**Does not protect against**

- A stolen, unlocked phone — whoever holds the device holds every code on it
- A live relay: an attacker on the line with the real person at the same moment can pass a code on within its 30-second window
- Social pressure to skip the check — the point is to make pausing normal
- Misuse by the trusted circle: anyone holding "Rob" can read Rob's code to another holder, so each person's code should go only to the people who need to verify them

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
