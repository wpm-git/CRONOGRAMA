// Defense in depth: reject every request unless Cloudflare Access signed it for this app.
const deny = (status, message) => new Response(message, {status, headers: {'Cache-Control': 'no-store'}});
const decode = part => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))));
export async function onRequest(context) {
  const {ACCESS_TEAM_DOMAIN: domain, ACCESS_AUD: aud, OWNER_EMAIL: owner} = context.env;
  if (!domain || !aud || !owner || !context.env.DB) return deny(503, 'Configuração privada incompleta.');
  const token = context.request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return deny(401, 'Acesso não autorizado.');
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw Error('token');
    const header = decode(parts[0]), payload = decode(parts[1]);
    if (header.alg !== 'RS256' || !header.kid) throw Error('algorithm');
    const issuer = `https://${domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
    if (payload.iss !== issuer || !(Array.isArray(payload.aud) ? payload.aud.includes(aud) : payload.aud === aud) ||
        payload.email?.toLowerCase() !== owner.toLowerCase() || !Number.isFinite(payload.exp) ||
        payload.exp <= Date.now() / 1000 || !Number.isFinite(payload.iat) || payload.iat > Date.now() / 1000 + 60) throw Error('claims');
    const response = await fetch(`${issuer}/cdn-cgi/access/certs`);
    if (!response.ok) throw Error('keys');
    const keys = await response.json(), jwk = keys.keys?.find(k => k.kid === header.kid && k.kty === 'RSA');
    if (!jwk) throw Error('key');
    const key = await crypto.subtle.importKey('jwk', jwk, {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['verify']);
    const signature = Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, new TextEncoder().encode(`${parts[0]}.${parts[1]}`))) throw Error('signature');
    const result = await context.next();
    const secured = new Response(result.body, result);
    secured.headers.set('Cache-Control', 'no-store');
    secured.headers.set('X-Content-Type-Options', 'nosniff');
    return secured;
  } catch { return deny(401, 'Acesso não autorizado.'); }
}
