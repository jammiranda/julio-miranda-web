import { readJ, mutate, delJ, writeJ, userPath, idxPath, spacePath, sha, APP, isPro } from './_core.js';

// Invitaciones por email: si invitaron a este email a un espacio, al entrar (como sea) queda adentro.
export const pinvPath = (email) => 'pinv/' + sha('pinv:' + String(email).toLowerCase()) + '.json';

export async function addPending(email, space, by) {
  const { data } = await readJ(pinvPath(email));
  const list = (data && data.spaces) || [];
  if (!list.some((x) => x.space === space)) list.push({ space, by, ts: Date.now() });
  await writeJ(pinvPath(email), { spaces: list.slice(-20) }, null, null);
}

export async function joinPending(user) {
  const { data } = await readJ(pinvPath(user.email));
  if (!data || !data.spaces || !data.spaces.length) return user;
  const joined = [];
  for (const inv of data.spaces) {
    try {
      const { data: s } = await mutate(spacePath(inv.space), async (s) => {
        if (s.members.some((m) => m.uid === user.id)) return false;
        const { data: ix } = await readJ(idxPath(s.owner));
        const owner = ix ? (await readJ(userPath(ix.email))).data : null;
        const lim = isPro(owner) ? APP.pro.members : APP.free.members;
        if (s.members.length >= lim) return false;
        s.members.push({ uid: user.id, name: user.name, role: 'member', joined: Date.now() });
        s.settings = s.settings || {};
        s.settings.people = [...new Set([...(s.settings.people || []), user.name])];
        s.updatedAt = Date.now();
      });
      if (s && s.members.some((m) => m.uid === user.id)) joined.push(s.id);
    } catch (e) { /* espacio borrado */ }
  }
  await delJ(pinvPath(user.email));
  if (!joined.length) return user;
  const { data: u } = await mutate(userPath(user.email), (d) => { d.spaces = [...new Set([...(d.spaces || []), ...joined])]; });
  return u || user;
}
