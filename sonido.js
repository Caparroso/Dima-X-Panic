const entrada = document.querySelector('#entrada');
const track = document.querySelector('#ambience');
const volumen = document.querySelector('#volumen');
const altavoz = document.querySelector('#altavoz');
const aviso = document.querySelector('#fallo-audio');
let context, gain;
let muted = false;
let lastVolume = 30;

function setVolume() {
  const amount = muted ? 0 : Number(volumen.value) / 100;
  if (gain) gain.gain.setTargetAtTime(amount, context.currentTime, 0.025);
  else track.volume = amount;
  track.muted = amount === 0;
  altavoz.dataset.muted = String(track.muted);
  const label = track.paused || track.muted ? 'Activar música' : 'Silenciar música';
  altavoz.setAttribute('aria-label', label);
  altavoz.title = label;
  volumen.setAttribute('aria-valuetext', volumen.value + ' %');
}

function startTrack() {
  // Un nodo de ganancia permite ajustar el volumen también en navegadores móviles.
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  const localFile = location.protocol === 'file:' && !track.currentSrc.startsWith('data:') && !track.src.startsWith('data:');
  if (!context && AudioEngine && !localFile) {
    try {
      context = new AudioEngine();
      const level = context.createGain();
      const source = context.createMediaElementSource(track);
      source.connect(level);
      level.connect(context.destination);
      gain = level;
      gain.gain.value = 0;
    } catch { gain = null; }
  }
  setVolume();
  const resume = gain && context.state !== 'running' ? context.resume() : Promise.resolve();
  return Promise.all([resume, track.play()]).then(() => {
    aviso.hidden = true;
    setVolume();
  }).catch(() => {
    track.pause();
    aviso.hidden = false;
    setVolume();
  });
}

entrada.addEventListener('cancel', event => event.preventDefault());
document.querySelector('#entrar').addEventListener('click', () => {
  entrada.close();
  startTrack();
  altavoz.focus({preventScroll:true});
});
volumen.addEventListener('input', () => {
  muted = false;
  if (Number(volumen.value)) lastVolume = Number(volumen.value);
  setVolume();
});
altavoz.addEventListener('click', () => {
  if (track.paused || muted || Number(volumen.value) === 0) {
    muted = false;
    if (Number(volumen.value) === 0) volumen.value = lastVolume;
    startTrack();
  } else {
    muted = true;
    setVolume();
  }
});
setVolume();
entrada.showModal();
