const reply = (data, status = 200) => Response.json(data, {status, headers: {'Cache-Control': 'no-store'}});
export async function onRequestGet({env}) {
  const row = await env.DB.prepare('SELECT version, payload FROM app_state WHERE id = 1').first();
  return reply(row ? {version: row.version, ...JSON.parse(row.payload)} : {version: 0, records: [], settings: {name: ''}});
}
export async function onRequestPut({request, env}) {
  if ((Number(request.headers.get('Content-Length')) || 0) > 1024 * 1024) return reply({error: 'Arquivo muito grande.'}, 413);
  const raw = await request.text();
  if (raw.length > 1024 * 1024) return reply({error: 'Arquivo muito grande.'}, 413);
  let input;
  try { input = JSON.parse(raw); } catch { return reply({error: 'JSON inválido.'}, 400); }
  if (!Number.isSafeInteger(input.version) || input.version < 0 || !Array.isArray(input.records) ||
      !input.records.every(r => r && typeof r === 'object' && typeof r.id === 'string' &&
        typeof r.type === 'string' && typeof r.date === 'string' && typeof r.due === 'string' &&
        Array.isArray(r.history)) ||
      !input.settings || typeof input.settings !== 'object' || Array.isArray(input.settings)) return reply({error: 'Dados inválidos.'}, 400);
  const payload = JSON.stringify({records: input.records, settings: input.settings});
  let result;
  if (input.version === 0) {
    result = await env.DB.prepare('INSERT INTO app_state(id, version, payload) VALUES(1, 1, ?) ON CONFLICT(id) DO NOTHING').bind(payload).run();
  } else {
    result = await env.DB.prepare('UPDATE app_state SET version = version + 1, payload = ? WHERE id = 1 AND version = ?')
      .bind(payload, input.version).run();
  }
  if (!result.meta.changes) return reply({error: 'Dados alterados em outro dispositivo. Atualize antes de salvar.'}, 409);
  return reply({version: input.version + 1});
}
