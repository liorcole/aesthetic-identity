#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const password = process.env.SITE_PASSWORD;
if (!password) {
  console.error('Error: set SITE_PASSWORD env var before running build.');
  process.exit(1);
}

const contentPath = path.join(__dirname, 'content.html');
const outPath = path.join(__dirname, 'index.html');
const content = fs.readFileSync(contentPath, 'utf8');

const ITERATIONS = 250000;
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');

const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();
const payload = Buffer.concat([encrypted, tag]).toString('base64');

const saltB64 = salt.toString('base64');
const ivB64 = iv.toString('base64');

const gate = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Science of Aesthetic Identity in Dress</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #080808;
    --text: #e8e4dc;
    --text-muted: rgba(232,228,220,0.5);
    --text-dim: rgba(232,228,220,0.28);
    --gold: #c8a96e;
    --border: rgba(255,255,255,0.12);
    --border-hard: rgba(255,255,255,0.22);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .gate {
    width: 100%;
    max-width: 360px;
    text-align: center;
  }
  .gate-eyebrow {
    font-size: 10px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--gold);
    opacity: 0.8;
    margin-bottom: 18px;
  }
  .gate-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 300;
    line-height: 1.2;
    margin-bottom: 10px;
  }
  .gate-title em { font-style: italic; color: var(--gold); }
  .gate-sub {
    font-size: 11.5px;
    color: var(--text-muted);
    line-height: 1.6;
    margin-bottom: 30px;
  }
  .gate-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  .gate-input {
    background: transparent;
    border: 0.5px solid var(--border);
    color: var(--text);
    padding: 12px 14px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 300;
    letter-spacing: 0.02em;
    border-radius: 2px;
    outline: none;
    transition: border-color 0.15s;
  }
  .gate-input:focus { border-color: var(--gold); }
  .gate-input::placeholder { color: var(--text-dim); }
  .gate-btn {
    background: transparent;
    border: 0.5px solid var(--gold);
    color: var(--gold);
    padding: 11px 14px;
    font-family: inherit;
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    border-radius: 2px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .gate-btn:hover { background: var(--gold); color: #0a0a0a; }
  .gate-btn:disabled { opacity: 0.5; cursor: wait; }
  .gate-error {
    margin-top: 14px;
    font-size: 11px;
    color: #e06d6d;
    font-style: italic;
    min-height: 16px;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .gate-error.visible { opacity: 1; }
</style>
</head>
<body>
<div class="gate">
  <div class="gate-eyebrow">Private reference</div>
  <h1 class="gate-title">The Science of<br><em>Aesthetic Identity in Dress</em></h1>
  <p class="gate-sub">Enter the password to continue.</p>
  <form class="gate-form" id="gate-form" autocomplete="off">
    <input type="password" class="gate-input" id="gate-pw" placeholder="Password" autofocus />
    <button type="submit" class="gate-btn" id="gate-btn">Enter</button>
  </form>
  <div class="gate-error" id="gate-error">Incorrect password</div>
</div>

<script>
  const PAYLOAD = ${JSON.stringify(payload)};
  const SALT = ${JSON.stringify(saltB64)};
  const IV = ${JSON.stringify(ivB64)};
  const ITERATIONS = ${ITERATIONS};

  function b64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async function decrypt(password) {
    const enc = new TextEncoder();
    const salt = b64ToBytes(SALT);
    const iv = b64ToBytes(IV);
    const combined = b64ToBytes(PAYLOAD);
    // AES-GCM in WebCrypto expects ciphertext+tag concatenated, which is exactly what Node produces.
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined);
    return new TextDecoder().decode(plainBuf);
  }

  const form = document.getElementById('gate-form');
  const pw = document.getElementById('gate-pw');
  const btn = document.getElementById('gate-btn');
  const err = document.getElementById('gate-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.classList.remove('visible');
    btn.disabled = true;
    btn.textContent = 'Unlocking…';
    try {
      const html = await decrypt(pw.value);
      try { sessionStorage.setItem('ari_pw', pw.value); } catch (e) {}
      document.open();
      document.write(html);
      document.close();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = 'Enter';
      pw.value = '';
      err.classList.add('visible');
      pw.focus();
    }
  });

  // Auto-unlock if password was cached this session (so a refresh doesn't re-prompt).
  (async () => {
    try {
      const cached = sessionStorage.getItem('ari_pw');
      if (!cached) return;
      const html = await decrypt(cached);
      document.open();
      document.write(html);
      document.close();
    } catch (e) {
      try { sessionStorage.removeItem('ari_pw'); } catch (e) {}
    }
  })();
</script>
</body>
</html>`;

fs.writeFileSync(outPath, gate);
console.log(`Built ${outPath}`);
console.log(`Payload size: ${(payload.length / 1024).toFixed(1)} KB (base64)`);
