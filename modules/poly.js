class PolyVoice {
  constructor(synth, context) {
    this.synth = synth
    this.context = context
    this.on = false
    this.note = 0
  }
  get active() {
    return this.on
  }
  noteOn(note) {
    if (this.on) {
      this.noteOff()
    }
    this.on = true
    this.note = note
    this.osc = new Oscillator(this.context, { frequency: 440})
    this.osc.detune = (note - 69) * 100
    this.osc.connect(this.synth.output)
    this.osc.start()
  }
  noteOff() {
    this.on = false
    this.osc.stop()
  }
}

class PolySynth {
  POLYPHONY = 6
  constructor() {
    this.context = window.audioContext
    this.output = new GainNode(this.context, {gain: 0.2})
    this.voices = []
    for(let i=0;i<POLYPHONY;i++) {
      this.voices.push(new PolyVoice(this, this.context))
    }
  }
  findVoice() {
    
  }

  noteOn (note, velocity) {
    this.findVoice.noteOn(note)
  }

  noteOff (note) {
    this.findVoiceByNote(note).noteOff()
  }

  stop () {
    this.voices.forEach((voice) => voice.noteOff())
  }
}