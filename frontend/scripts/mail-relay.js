const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 8090;
const GMAIL_USER = 'eshoppingzone.notifications@gmail.com';
const GMAIL_PASS = 'nnwungywcyfbmkkm';

function sendSmtpEmail(to, subject, body) {
  return new Promise((resolve, reject) => {
    // Escape single quotes for PowerShell
    const cleanTo = (to || '').replace(/'/g, "''");
    const cleanSubj = (subject || '').replace(/'/g, "''");
    const cleanBody = (body || '').replace(/'/g, "''");

    const psScript = `
      $smtp = New-Object System.Net.Mail.SmtpClient("smtp.gmail.com", 587);
      $smtp.EnableSsl = $true;
      $smtp.Credentials = New-Object System.Net.NetworkCredential('${GMAIL_USER}', '${GMAIL_PASS}');
      $mail = New-Object System.Net.Mail.MailMessage;
      $mail.From = '${GMAIL_USER}';
      $mail.To.Add('${cleanTo}');
      $mail.Subject = '${cleanSubj}';
      $mail.Body = '${cleanBody}';
      $smtp.Send($mail);
      Write-Output "SENT";
    `;

    const ps = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', psScript]);
    let stdout = '';
    let stderr = '';

    ps.stdout.on('data', (d) => { stdout += d.toString(); });
    ps.stderr.on('data', (d) => { stderr += d.toString(); });

    ps.on('close', (code) => {
      if (code === 0 && stdout.includes('SENT')) {
        resolve(true);
      } else {
        reject(new Error(stderr || stdout || 'Failed to dispatch email via PowerShell SMTP'));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || '';

  if (req.method === 'POST' && (url.includes('/notifications') || url.includes('/send'))) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const to = payload.recipientEmail || payload.email || payload.to;
        const subject = payload.subject || 'EShopping Zone Notification';
        const content = payload.content || payload.message || payload.body || '';

        console.log(`[Mail Relay] Received notification for: ${to} | Subject: "${subject}"`);

        if (to && to.includes('@') && !to.endsWith('@example.com')) {
          try {
            await sendSmtpEmail(to, subject, content);
            console.log(`[Mail Relay] ✅ Live SMTP email dispatched to ${to}`);
          } catch (err) {
            console.error(`[Mail Relay] ⚠️ SMTP error: ${err.message}`);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          id: Date.now(),
          recipientEmail: to,
          subject,
          content,
          status: 'SENT',
          createdAt: new Date().toISOString()
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Health check
  if (url === '/health' || url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'UP', service: 'MailRelayServer' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`🚀 [Mail Relay Server] Listening on http://localhost:${PORT} (Connected to Gmail SMTP)`);
});
