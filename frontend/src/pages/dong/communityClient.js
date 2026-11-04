import axios from 'axios';
const client = axios.create();
client.interceptors.request.use(config => {
  const token = localStorage.getItem('communityToken');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});
export async function encodeAttachments(files = []) {
  if (files.length > 5 || files.some(f => f.size > 5 * 1024 * 1024) || files.reduce((s,f) => s + f.size, 0) > 10 * 1024 * 1024) {
    throw new Error('파일은 최대 5개, 파일당 5MB, 합계 10MB까지 첨부할 수 있습니다.');
  }
  return Promise.all(files.map(file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    reader.onload = () => resolve({ name: file.name, base64: String(reader.result).split(',')[1] });
    reader.readAsDataURL(file);
  })));
}
export default client;
