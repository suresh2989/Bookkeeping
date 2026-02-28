import { supabase } from './supabase';

export async function getAttachmentsByTransaction(transactionId) {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('transaction_id', transactionId);
  if (error) throw error;
  return data || [];
}

export async function addAttachment({ id, transactionId, name, type, size, blob }) {
  const path = `${transactionId}/${id}-${name}`;
  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(path, blob, { contentType: type, upsert: true });
  if (uploadError) throw uploadError;

  const { error: dbError } = await supabase.from('attachments').insert({
    id,
    transaction_id: transactionId,
    name,
    type,
    size,
    storage_path: path,
  });
  if (dbError) throw dbError;
}

export async function removeAttachment(id) {
  const { data } = await supabase
    .from('attachments')
    .select('storage_path')
    .eq('id', id)
    .single();
  if (data?.storage_path) {
    await supabase.storage.from('attachments').remove([data.storage_path]);
  }
  await supabase.from('attachments').delete().eq('id', id);
}

export async function removeAttachmentsByTransaction(transactionId) {
  const { data } = await supabase
    .from('attachments')
    .select('storage_path')
    .eq('transaction_id', transactionId);
  if (data?.length) {
    await supabase.storage.from('attachments').remove(data.map(a => a.storage_path));
  }
  await supabase.from('attachments').delete().eq('transaction_id', transactionId);
}

export async function getAllAttachmentCounts() {
  const { data } = await supabase.from('attachments').select('transaction_id');
  return (data || []).reduce((acc, a) => {
    acc[a.transaction_id] = (acc[a.transaction_id] || 0) + 1;
    return acc;
  }, {});
}

export async function getAttachmentUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from('attachments')
    .createSignedUrl(storagePath, 300); // 5 min
  if (error) throw error;
  return data.signedUrl;
}
