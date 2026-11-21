const form = document.querySelector('form');
const statusText = document.querySelector('#estado');
const dialog = document.querySelector('dialog');
const send = document.querySelector('#send');
const canvas = document.querySelector('canvas');
const key = 'diama-panic-20261204';
let saved, pending;
try {
  saved = JSON.parse(localStorage.getItem(key));
  pending = JSON.parse(sessionStorage.getItem(key + '-pendiente'));
} catch {}
let imageURL;
async function showTicket(ticket, demo = false) {
  await document.fonts.ready;
  const art = document.querySelector('#arte');
  await art.decode();
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#edf0df';
  ctx.fillRect(0, 0, 1200, 1010);
  ctx.drawImage(art, 0, 0, 1200, 675);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fffde8';
  ctx.shadowColor = '#183b61';
  ctx.shadowBlur = 7;
  ctx.font = '55px Sakura, serif';
  const pairs = document.querySelectorAll('.lineup p');
  pairs.forEach((row,i) => ctx.fillText(row.textContent, 545, 200 + i*60, 850));
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#173e36';
  ctx.font = '28px Arial';
  ctx.fillText(demo ? 'MUESTRA · SIN ACCESO' : 'BOLETO PERSONAL', 52, 744);
  ctx.font = '66px Sakura, serif';
  ctx.fillText(ticket.nombre, 48, 832, 760);
  ctx.font = '32px Arial';
  ctx.fillText('Viernes · 4 diciembre 2026', 52, 900);
  ctx.font = '28px Arial';
  ctx.fillText('Con registro: $100 MXN · Pago en puerta', 52, 945, 780);
  ctx.font = '23px monospace';
  ctx.fillText(ticket.token, 52, 988);
  const qr = new TicketQR(4, 0); // Versión 4, corrección M.
  qr.addData(ticket.token);
  qr.make();
  const size = qr.getModuleCount(), unit = 7, x = 884, y = 698;
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, (size+8)*unit, (size+8)*unit);
  ctx.fillStyle = '#10251f';
  for (let r=0;r<size;r++) for (let c=0;c<size;c++)
    if(qr.isDark(r,c)) ctx.fillRect(x+(4+c)*unit,y+(4+r)*unit,unit,unit);
  const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!png) throw Error('No se pudo generar el PNG.');
  if(imageURL) URL.revokeObjectURL(imageURL);
  imageURL = URL.createObjectURL(png);
  const link = document.querySelector('#descarga');
  link.href = imageURL;
  link.download = ticket.token + '.png';
  dialog.showModal();
}
document.querySelector('#cerrar').onclick = () => dialog.close();
document.querySelector('#demo').onclick = () => showTicket({nombre:'Invitación de muestra',token:'MUESTRA-SIN-ACCESO'},true).catch(() => statusText.textContent='No se pudo abrir la muestra. Vuelve a intentarlo.');
const endpoint = window.FORMSPREE_ENDPOINT;
if (saved?.token && saved?.nombre) {
  send.textContent = 'Abrir mi boleto';
  form.noValidate = true;
} else if (!/^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(endpoint)) {
  send.disabled = true;
  statusText.textContent = 'El registro abrirá pronto.';
}
form.onsubmit = async event => {
  event.preventDefault();
  if (send.disabled) return;
  send.disabled = true;
  try {
    if (!saved) {
      const nombre = form.elements.nombre.value.trim();
      const instagram = '@'+form.elements.instagram.value.trim().replace(/^@/,'').toLowerCase();
      if (!nombre) throw Error('Escribe tu nombre.');
      if (!pending || pending.nombre !== nombre || pending.instagram !== instagram) {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        const token = 'DP04-' + Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
        pending = {nombre,instagram,token,evento:'DIAMA × PANIC · 2026-12-04'};
        try { sessionStorage.setItem(key+'-pendiente',JSON.stringify(pending)); } catch {}
      }
      statusText.textContent = 'Enviando registro…';
      const response = await fetch(endpoint,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(pending)});
      if (!response.ok) throw Error('No se confirmó el registro. Inténtalo otra vez.');
      saved = {nombre:pending.nombre,token:pending.token};
      try { localStorage.setItem(key,JSON.stringify(saved)); sessionStorage.removeItem(key+'-pendiente'); } catch {}
      form.noValidate = true;
    }
    send.textContent = 'Abrir mi boleto';
    statusText.textContent = 'Registro confirmado. Guarda la imagen de tu boleto.';
    await showTicket(saved);
  } catch(error) {
    statusText.textContent = saved ? 'Tu registro está confirmado. Pulsa Abrir mi boleto para recuperar la imagen.' : (error instanceof TypeError ? 'Revisa tu conexión y vuelve a intentarlo.' : error.message);
  } finally { send.disabled = false; }
};
