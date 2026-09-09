const http = require('http');
const next = require('next');

const port = Number(process.env.PORT || 3900);
const hostname = process.env.HOST || '0.0.0.0';
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    // Nilai dari pengguna SELALU ditimpa. Route handler menggunakan header
    // ini sebagai peer TCP asli; x-forwarded-for baru dipercaya bila peer
    // tersebut terdaftar sebagai reverse proxy tepercaya.
    req.headers['x-presensia-peer'] = req.socket.remoteAddress || '0.0.0.0';
    handle(req, res);
  });

  server.listen(port, hostname, () => {
    console.log(`Presensia ready on http://${hostname}:${port}`);
  });
});
