import Dexie from 'dexie';

export const db = new Dexie('SureshBookkeepingDB');

db.version(1).stores({
  attachments: 'id, transactionId',
});

export const getAttachmentsByTransaction = (transactionId) =>
  db.attachments.where('transactionId').equals(transactionId).toArray();

export const addAttachment = (att) => db.attachments.put(att);

export const removeAttachment = (id) => db.attachments.delete(id);

export const removeAttachmentsByTransaction = (transactionId) =>
  db.attachments.where('transactionId').equals(transactionId).delete();

export const getAllAttachmentCounts = async () => {
  const all = await db.attachments.toArray();
  return all.reduce((acc, a) => {
    acc[a.transactionId] = (acc[a.transactionId] || 0) + 1;
    return acc;
  }, {});
};
