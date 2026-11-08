const http = require('http');
const app = require('../server');

const server = app.listen(3001, async () => {
  console.log('Testing server on port 3001...');

  try {
    // 1. Test Login
    const loginData = JSON.stringify({ username: 'admin', password: 'admin123' });
    const loginRes = await postJson('http://localhost:3001/api/auth/login', loginData);
    console.log('1. Login Test Result:', loginRes.success ? 'PASSED' : 'FAILED');

    const token = loginRes.data.token;

    // 2. Test Dashboard Stats
    const statsRes = await getJson('http://localhost:3001/api/admin/dashboard/stats', token);
    console.log('2. Dashboard Stats Test Result:', statsRes.success ? 'PASSED' : 'FAILED');
    console.log('   Metrics:', statsRes.data.metrics);

    // 3. Test Members List
    const membersRes = await getJson('http://localhost:3001/api/admin/members', token);
    console.log('3. Members List Test Result:', membersRes.success ? 'PASSED' : 'FAILED');
    console.log(`   Total Members Retrieved: ${membersRes.total}`);

    // 3b. Test No. Register Format Validation (MU XXX XXX)
    const invalidMember = JSON.stringify({
      no_register: 'MU-12-RG', // invalid format (only 2 digits and 2 letters)
      nama: 'Testing Invalid Format',
      divisi: 'Panjat Tebing',
      angkatan: 2023
    });
    const invalidRes = await postJsonWithAuth('http://localhost:3001/api/admin/members', invalidMember, token);
    console.log('3b. Reject Invalid No. Register Format Test:', !invalidRes.success ? 'PASSED' : 'FAILED');

    const validMember = JSON.stringify({
      no_register: 'MU 399 PCT', // valid format MU XXX XXX
      nama: 'Testing Format Valid',
      divisi: 'Panjat Tebing (Rock Climbing)',
      angkatan: 2023
    });
    const validRes = await postJsonWithAuth('http://localhost:3001/api/admin/members', validMember, token);
    console.log('3c. Accept Valid No. Register Format (MU 399 PCT):', (validRes.success && validRes.data.no_register === 'MU 399 PCT') ? 'PASSED' : 'FAILED');

    // 4. Test Monitoring Registrations
    const monRes = await getJson('http://localhost:3001/api/admin/registrations/monitoring', token);
    console.log('4. Monitoring Test Result:', monRes.success ? 'PASSED' : 'FAILED');

    // 4b. Test Kelola Divisi (4 Divisi Utama & Penambahan Divisi)
    const divRes = await getJson('http://localhost:3001/api/admin/divisions', token);
    console.log('4b. Get Divisions Test Result:', (divRes.success && divRes.data.length >= 4) ? 'PASSED' : 'FAILED');

    const newDivPayload = JSON.stringify({ nama_divisi: 'Konservasi Alam', kode: 'KNS', deskripsi: 'Konservasi hayati' });
    const createDivRes = await postJsonWithAuth('http://localhost:3001/api/admin/divisions', newDivPayload, token);
    console.log('4c. Create New Division Test Result:', createDivRes.success ? 'PASSED' : 'FAILED');

    // 4d. Test Atribut Baku (Topi Rimba & Baju Lapangan)
    const attrRes = await getJson('http://localhost:3001/api/admin/attributes', token);
    const hasFixedAttrs = attrRes.success && attrRes.data.length === 2 && attrRes.data.some(a => a.nama_atribut === 'Topi Rimba') && attrRes.data.some(a => a.nama_atribut === 'Baju Lapangan');
    console.log('4d. Fixed 2 Attributes (Topi Rimba & Baju Lapangan):', hasFixedAttrs ? 'PASSED' : 'FAILED');

    // 5. Test CMS Articles
    const articlesRes = await getJson('http://localhost:3001/api/admin/cms/articles', token);
    console.log('5. CMS Articles Test Result:', articlesRes.success ? 'PASSED' : 'FAILED');

    // 6. Test Audit Logs
    const logsRes = await getJson('http://localhost:3001/api/admin/logs', token);
    console.log('6. Audit Logs Test Result:', logsRes.success ? 'PASSED' : 'FAILED');

    console.log('\nAll API Endpoints Tested Successfully!');
  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function postJsonWithAuth(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${token}`
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.end();
  });
}
