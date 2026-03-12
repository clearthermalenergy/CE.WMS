import http from 'http';

let token = '';

function login() {
  const req = http.request('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, res => {
    let d = '';
    res.on('data', c => d+=c);
    res.on('end', () => {
      const parsed = JSON.parse(d);
      if(!parsed.token) { console.error('Login failed:', parsed); return; }
      token = parsed.token;
      console.log('Logged in.');
      testPermTick();
    });
  });
  req.write(JSON.stringify({email:'ananya@clearenergy.in', password:'Welcome@123'}));
  req.end();
}

function testPermTick() {
  const req = http.request('http://localhost:3001/api/settings/roles', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
  }, res => {
    let d = '';
    res.on('data', c => d+=c);
    res.on('end', () => {
      console.log('Update response:', res.statusCode, d);
      
      const req2 = http.request('http://localhost:3001/api/data', {
        headers: { 'Authorization': 'Bearer ' + token }
      }, res2 => {
        let d2 = '';
        res2.on('data', c=>d2+=c);
        res2.on('end', () => {
          const parsed = JSON.parse(d2);
          console.log('Manager permissions in /api/data:', JSON.stringify(parsed.rolePermissions.find(r => r.role === 'Manager')));
        });
      });
      req2.end();
    });
  });
  req.write(JSON.stringify({role: 'Manager', permissions: { approve_leave: true }}));
  req.end();
}

login();
