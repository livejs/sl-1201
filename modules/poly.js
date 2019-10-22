const FILTER_SMOOTHING = 0.05
const AMP_SMOOTHING = 0.01
const POLYPHONY = 12

class PolyVoice {
  constructor(synth, context) {
    const expCurve = new Float32Array(256)
    for (let i = 0; i < 128; i++) {
      let value = i / 127
      expCurve[i + 128] = Math.pow(value, 2)
    }

    this.synth = synth
    this.context = context
    this.on = false
    this.note = -1
    this.osc = new OscillatorNode(this.context, { frequency: 440, type: this.synth.oscType})
    this.envelope = new ConstantSourceNode(this.context, { offset: 0 })
    this.filter = new BiquadFilterNode(this.context, {type: 'lowpass', freqency: 0, Q: 10})
    this.amp = new GainNode(this.context, {gain: 0})
    this.filterEnvelopeAmount = new GainNode(this.context, {gain: 0.5})
    this.filterValue = new ConstantSourceNode(this.context, { offset: 0.2 })
    this.filterShaper = new WaveShaperNode(this.context, { curve: expCurve })
    this.filterOffset = new ConstantSourceNode(this.context, { offset: 20 })
    this.envelope.connect(this.filterEnvelopeAmount).connect(this.filterShaper)
    this.envelope.connect(this.amp.gain)
    this.filterValue.connect(this.filterShaper)
    this.filterShaper.connect(new GainNode(this.context, { gain: 20000 })).connect(this.filter.frequency)
    this.filterOffset.connect(this.filter.frequency)
    this.osc.connect(this.filter)
    this.filter.connect(this.amp)
    this.amp.connect(this.synth.output)
    this.osc.start()
    this.envelope.start()
    this.filterValue.start()
    this.filterOffset.start()
  }
  get active() {
    return this.on || this.context.currentTime < this.offTime
  }
  noteOn(note) {

    console.log("NOn", note, this.on)
    const time = this.context.currentTime
    this.on = true
    this.note = note
    this.osc.type = this.synth.oscType
    //this.amp.gain.linearRampToValueAtTime(1, time + this.synth.attackDuration)
    //this.amp.gain.linearRampToValueAtTime(this.synth.sustain, time + this.synth.attackDuration + this.synth.decayDuration)
    this.osc.detune.value = (note - 69) * 100                                                             
    this.envelope.offset.setTargetAtTime(0, time, 0.01)
    this.envelope.offset.linearRampToValueAtTime(1, time + this.synth.attackDuration)
    this.envelope.offset.setTargetAtTime(Math.max(0.0001, this.synth.sustain), time + this.synth.attackDuration, this.synth.decayDuration / 8)

  }
  noteOff() {
    const time = this.context.currentTime
    console.log("NOff")
    this.on = false
    //this.amp.gain.linearRampToValueAtTime(0, time + this.synth.releaseDuration)
    this.envelope.offset.setTargetAtTime(0.0000001, time, this.synth.releaseDuration / 8)
    this.note = -1
    this.offTime = this.context.currentTime + this.synth.releaseDuration
  }
}


export default class PolySynth {
  constructor({oscillator = 'sawtooth'} = {}) {
    this.context = window.audioContext
    this.output = new GainNode(this.context, {gain: 0.2})
    this.voices = []
    this.currentVoice = 0;
    this.attackDuration = 0.01
    this.decayDuration = 0.1
    this.sustain = 0.1
    this.releaseDuration = 0.1
    this.oscType = oscillator
    this.filterEnv = 0.8
    this.filterFrequency = 500
    this.Q = 2
    for(let i=0;i<POLYPHONY;i++) {
      this.voices.push(new PolyVoice(this, this.context))
    }
  }
  nextVoice() {
    let voice = this.voices[this.currentVoice]
    for (let i=0;i<POLYPHONY;i++) {
      voice = this.voices[this.currentVoice]
      this.currentVoice = (this.currentVoice + 1) % POLYPHONY
      if (!voice.active) { break; }
    }
    return voice
  }
  
  findVoiceByNote(note) {
    return this.voices.find((voice) => (voice.note === note) && voice.active)  
  }

  noteOn (note, velocity) {
    const voice = this.nextVoice()
    voice.noteOn(note)
  }

  noteOff (note) {
    const voice = this.findVoiceByNote(note)
    if (voice != null) { voice.noteOff() }
  }

  stop () {
    this.voices.forEach((voice) => voice.noteOff())
  }

  cc (control, value) {
    const time = this.context.currentTime
    if (control === 74) { // cutoff
      this.voices.forEach((voc) => {
        voc.filterValue.offset.setTargetAtTime(exp(midiFloat(value)), time, FILTER_SMOOTHING)
      })
    } else if (control === 71) { // resonance
      this.voices.forEach((voc) => {
        voc.filter.Q.setTargetAtTime(exp(midiFloat(value)) * 20, time, FILTER_SMOOTHING)
      })
    } else if (control === 70) { // filter envelope
      this.voices.forEach((voc) =>                                                                                                                        {
        voc.filterEnvelopeAmount.gain.setTargetAtTime(exp(midiFloat(value) * 2 - 1), time, FILTER_SMOOTHING)
      })
    } else if (control === 73) { // attack
      console.log("ATT", exp(midiFloat(value)) * 4)
      this.attackDuration = exp(midiFloat(value)) * 4
    } else if (control === 75) { // decay
      this.decayDuration = exp(midiFloat(value)) * 4
    } else if (control === 79) { // sustain
      this.sustain = midiFloat(value)
    } else if (control === 72) { // release
      this.releaseDuration = exp(midiFloat(value)) * 4
    } 
  }

}

function midiFloat (value, from = 0, to = 127) {
  const range = to - from
  return (value - from) / range
}

function exp (value) {
  return value * value
}