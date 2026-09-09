import { normalIp, parseDaftarCidr, ipDiizinkan, tentukanIpKlien } from '../src/lib/ip';

function cek(nama: string, aktual: unknown, harap: unknown) {
  const ok = JSON.stringify(aktual) === JSON.stringify(harap);
  console.log(`${ok ? 'LOLOS' : 'GAGAL'}  ${nama}`);
  if (!ok) console.log('  aktual=', aktual, 'harap=', harap);
  return ok;
}

let lolos = 0;
lolos += Number(cek('IPv4 mapped dinormalisasi', normalIp('::ffff:127.0.0.1'), '127.0.0.1'));
lolos += Number(cek('parse IP -> /32', parseDaftarCidr('203.0.113.10').valid, ['203.0.113.10/32']));
lolos += Number(cek('parse CIDR IPv4', parseDaftarCidr('192.168.10.0/24').valid, ['192.168.10.0/24']));
lolos += Number(cek('CIDR invalid ditolak', parseDaftarCidr('999.1.1.1').invalid, ['999.1.1.1']));
lolos += Number(cek('IP masuk CIDR', ipDiizinkan('192.168.10.44', ['192.168.10.0/24']), true));
lolos += Number(cek('IP di luar CIDR', ipDiizinkan('192.168.11.44', ['192.168.10.0/24']), false));

const proxy = ['127.0.0.1/32'];
const a = tentukanIpKlien('198.51.100.9', '203.0.113.7', '203.0.113.7', proxy);
lolos += Number(cek('XFF palsu dari peer publik DIABAIKAN', a.ip, '198.51.100.9'));
lolos += Number(cek('sumber peer saat tidak tepercaya', a.sumber, 'peer'));

const b = tentukanIpKlien('127.0.0.1', '203.0.113.7', '203.0.113.7', proxy);
lolos += Number(cek('X-Real-IP dipercaya dari proxy loopback', b.ip, '203.0.113.7'));
lolos += Number(cek('sumber x-real-ip', b.sumber, 'x-real-ip'));

console.log(`\nTOTAL: ${lolos}/10 lolos`);
process.exit(lolos === 10 ? 0 : 1);
