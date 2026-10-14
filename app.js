/* vouchformenow — everything here runs in your browser. Nothing is sent anywhere. */
(function () {
  "use strict";

  var B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

  function base32Encode(bytes) {
    var out = "", bits = 0, value = 0;
    for (var i = 0; i < bytes.length; i++) {
      value = (value << 8) | bytes[i];
      bits += 8;
      while (bits >= 5) {
        out += B32[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) out += B32[(value << (5 - bits)) & 31];
    return out;
  }

  function base32Decode(str) {
    str = str.toUpperCase().replace(/[^A-Z2-7]/g, "");
    var bytes = [], bits = 0, value = 0;
    for (var i = 0; i < str.length; i++) {
      value = (value << 5) | B32.indexOf(str[i]);
      bits += 5;
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    return new Uint8Array(bytes);
  }

  function randomSecret() {
    var bytes = new Uint8Array(20); // 160 bits, the RFC 4226 recommendation
    crypto.getRandomValues(bytes);
    return base32Encode(bytes);
  }

  function groupSecret(s) {
    return s.replace(/(.{4})/g, "$1 ").trim();
  }

  function otpauthUri(secret, label) {
    var issuer = "VouchForMeNow";
    var account = (label || "").trim() || "Me";
    return "otpauth://totp/" + encodeURIComponent(issuer) + ":" + encodeURIComponent(account) +
      "?secret=" + secret + "&issuer=" + encodeURIComponent(issuer) +
      "&algorithm=SHA1&digits=6&period=30";
  }

  function renderQr(uri) {
    var qr = qrcode(0, "M");
    qr.addData(uri);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }

  var totpKey = null;
  function importKey(secret) {
    return crypto.subtle.importKey(
      "raw", base32Decode(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
    );
  }

  function totp(key, counter) {
    var msg = new Uint8Array(8);
    for (var i = 7; i >= 0; i--) { msg[i] = counter & 255; counter = Math.floor(counter / 256); }
    return crypto.subtle.sign("HMAC", key, msg).then(function (sig) {
      var h = new Uint8Array(sig);
      var off = h[h.length - 1] & 15;
      var bin = ((h[off] & 127) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
      return String(bin % 1000000).padStart(6, "0");
    });
  }

  // --- UI ---
  var $ = function (id) { return document.getElementById(id); };
  var labelInput = $("label");
  var qrWrap = $("qr");
  var secretEl = $("secret");
  var codeEl = $("code");
  var countdownEl = $("countdown");
  var currentSecret = null;
  var lastCounter = -1;

  function regenerate() {
    currentSecret = randomSecret();
    lastCounter = -1;
    draw();
    importKey(currentSecret).then(function (k) { totpKey = k; tick(); });
  }

  var addLink = $("addlink");

  function draw() {
    if (!currentSecret) return;
    var uri = otpauthUri(currentSecret, labelInput.value);
    qrWrap.innerHTML = renderQr(uri);
    addLink.href = uri;
    secretEl.textContent = groupSecret(currentSecret);
  }

  function tick() {
    if (!totpKey) return;
    var now = Math.floor(Date.now() / 1000);
    var counter = Math.floor(now / 30);
    countdownEl.textContent = (30 - (now % 30)) + "s";
    if (counter !== lastCounter) {
      lastCounter = counter;
      totp(totpKey, counter).then(function (c) { codeEl.textContent = c.slice(0, 3) + " " + c.slice(3); });
    }
  }

  labelInput.addEventListener("input", draw);
  $("regen").addEventListener("click", regenerate);
  $("copy").addEventListener("click", function () {
    if (!currentSecret) return;
    navigator.clipboard.writeText(currentSecret).then(function () {
      $("copy").textContent = "Copied";
      setTimeout(function () { $("copy").textContent = "Copy secret"; }, 1500);
    });
  });
  $("reveal").addEventListener("click", function () {
    var hidden = secretEl.classList.toggle("hidden");
    $("reveal").textContent = hidden ? "Show secret as text" : "Hide secret";
  });

  if (!window.crypto || !crypto.subtle || !crypto.getRandomValues) {
    $("unsupported").classList.remove("hidden");
    $("generator").classList.add("hidden");
  } else {
    regenerate();
    setInterval(tick, 500);
  }
})();
