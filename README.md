# Aesthetic Identity

Password-gated static site. The public `index.html` ships only AES-GCM ciphertext of the real page; the browser decrypts it client-side when the right password is entered. The plaintext source (`content.html`) is gitignored.

## Editing the content

1. Edit `content.html` locally.
2. Rebuild:

   ```bash
   SITE_PASSWORD='your-password' node build.js
   ```

3. Commit & push `index.html`.

## Deploy

GitHub Pages serves `index.html` from the repo root on the `main` branch.
