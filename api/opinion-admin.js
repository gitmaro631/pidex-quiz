import { verifyPiUser } from './_verifyPiUser.js';
import { setOpinionAdminHiddenServer } from './_firestore.js';

const ADMIN_USERNAME = 'cam1998pi';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { accessToken, docId, hide } = req.body;
    const username = await verifyPiUser(accessToken);
    if (username !== ADMIN_USERNAME) return res.status(403).json({ error: 'forbidden' });
    if (!docId || typeof docId !== 'string') return res.status(400).json({ error: 'docId required' });

    await setOpinionAdminHiddenServer(docId, !!hide);
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
