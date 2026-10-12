export class AudioManager {
  constructor() {
    this.audioListener = new THREE.AudioListener();
    this.sounds = new Map();
  }

  attachToCamera(camera) {
    camera.add(this.audioListener);
  }

  playSpatialSound(soundKey, position, volume = 0.8) {
    // Spatial sound generator for combat and spell impacts
    const sound = new THREE.PositionalAudio(this.audioListener);
    // Placeholder synthesizer trigger for demo compatibility
    const osc = this.audioListener.context.createOscillator();
    const gain = this.audioListener.context.createGain();
    osc.connect(gain);
    gain.connect(this.audioListener.context.destination);
    osc.type = soundKey === 'missile' ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(soundKey === 'missile' ? 880 : 120, this.audioListener.context.currentTime);
    gain.gain.setValueAtTime(volume * 0.2, this.audioListener.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioListener.context.currentTime + 0.3);
    osc.start();
    osc.stop(this.audioListener.context.currentTime + 0.3);
  }
}
