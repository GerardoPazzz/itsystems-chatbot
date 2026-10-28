/**
 * Obtiene un refresh token de la Gmail API para enviar correos desde Railway.
 *
 * Uso:
 *   $env:GMAIL_CLIENT_ID="xxx.apps.googleusercontent.com"
 *   $env:GMAIL_CLIENT_SECRET="xxx"
 *   npm run oauth:token
 *
 * Se abre la URL que se imprime, se autoriza con la cuenta emisora y el
 * script muestra el GMAIL_REFRESH_TOKEN para pegarlo en Railway.
 *
 * Requiere que el refresh token sea de larga duracion: la app OAuth debe
 * estar publicada (In production) o en modo Internal, no en Testing
 * (en Testing caduca a los 7 dias).
 */
import http from 'http';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const PORT = 3000;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\nFaltan variables de entorno. Define GMAIL_CLIENT_ID y GMAIL_CLIENT_SECRET.\n');
  process.exit(1);
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPE);
// access_type=offline es lo que hace que Google devuelva el refresh token.
// prompt=consent lo fuerza aunque ya haya autorizacion previa.
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

console.log('\nAbre esta URL en el navegador y autoriza con la cuenta que envia los correos:\n');
console.log(authUrl.toString());
console.log('\nEsperando la redireccion en ' + REDIRECT_URI + ' ...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '', REDIRECT_URI);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.end('Error: ' + error);
    console.error('\nSe denego la autorizacion:', error);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.end('Esperando la autorizacion...');
    return;
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokens: any = await tokenResponse.json();

    if (!tokenResponse.ok || !tokens.refresh_token) {
      res.end('Error al obtener el token');
      console.error('\nError:', tokens.error_description || tokens.error || tokenResponse.status);
      server.close();
      process.exit(1);
    }

    console.log('\n=============================================');
    console.log('GMAIL_REFRESH_TOKEN (copia este valor):');
    console.log('=============================================');
    console.log(tokens.refresh_token);
    console.log('\nPegalo en Railway como variable de entorno GMAIL_REFRESH_TOKEN,');
    console.log('junto con GMAIL_CLIENT_ID y GMAIL_CLIENT_SECRET.');
    console.log('=============================================\n');

    res.end('Listo. Ya puedes cerrar esta pestana.');
  } catch (err: any) {
    res.end('Error');
    console.error('\nError inesperado:', err?.message || err);
  } finally {
    server.close();
    setTimeout(() => process.exit(0), 500);
  }
});

server.listen(PORT, () => {
  console.log('Servidor escuchando en http://localhost:' + PORT);
});
