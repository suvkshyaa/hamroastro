export function useMessageSound() {
    const isMuted = () => localStorage.getItem("soundMuted") === "true";


    const playSound = () => {
    if (isMuted()) return; // ✅ Skip if muted
    try {
      // ✅ Create sound using Web Audio API - no external files needed!
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // ✅ Soft notification sound - like WhatsApp
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5 note
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1); // A5 note
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
    } catch (err) {
      console.log("Sound not available:", err);
    }
  };

  const playOutgoingSound = () => {
    if (isMuted()) return; // ✅ Skip if muted
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // ✅ Shorter softer sound for outgoing
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
      
    } catch (err) {}
  };

  const toggleMute = () => {
    const current = isMuted();
    localStorage.setItem("soundMuted", !current);
    return !current; // returns new muted state
  };

  return { playSound, playOutgoingSound, toggleMute, isMuted };
}