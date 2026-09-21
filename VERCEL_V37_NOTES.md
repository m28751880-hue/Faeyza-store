# Faeyza Store V37 — Security Admin

V37 memperkuat endpoint admin/server tanpa mengubah alur publik.

## Perubahan
- Authorization Bearer memakai constant-time comparison.
- Validasi ukuran JSON body pada endpoint sensitif.
- Header keamanan global di `vercel.json`:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy membatasi kamera/mikrofon/geolocation
  - Cross-Origin-Opener-Policy
  - Cross-Origin-Resource-Policy
- Inspector produk tetap allowlist HTTPS dan kini memvalidasi setiap redirect agar tidak mengikuti redirect ke host lain.
- Endpoint konversi, stats, sync, AI content, dan admin products diperketat.
- Secret tetap hanya di environment server; jangan taruh token di frontend/source control.

Vercel juga menyediakan Firewall/WAF untuk filtering, logging, challenge, dan rate limiting di edge; header aplikasi ini adalah lapisan tambahan, bukan pengganti WAF. https://vercel.com/security/web-application-firewall
