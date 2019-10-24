import Synth from './modules/synth.js'
import PolySynth from './modules/poly.js'
import MixerChannel from './modules/mixer-channel.js'
import MidiRouter from './modules/midi-router.js'
import SampleLoader from './modules/sample-loader.js'
import Slicer from './modules/slicer.js'
import DrumSampler from './modules/drum-sampler.js'
import DelayFX from './modules/delay-fx.js'
import ReverbFX from './modules/reverb-fx.js'

const BEAT_TICKS = 24

window.audioContext = new AudioContext()
console.log('ENGAGE!')

let startButton = document.getElementById('start')

startButton.addEventListener('click', (ev) => {
  window.audioContext.resume()
  ev.target.disabled = true
  ev.target.innerText = 'Started!'
  window.setTimeout(() => {
    ev.target.hidden = true
  }, 300)
})

if (window.audioContext.state === 'running') {
  startButton.hidden = true
}

var clockDisplay = document.getElementById('clock')
var cueDisplay = document.getElementById('cueDisplay')

var ticks = 0

var ui = {
  clock: () => {
    clockDisplay.innerText = ticks
    ticks += 1
  },
  stop: () => {
    clockDisplay.innerText = 'STOPPED'
    ticks = 0
  },
  noteOn: (note) => {
    cueDisplay.innerText = 'VISUAL CUE ' + note
  }
}

function init () {
  // TODO: configure correct midi device
  var midiInputs = [
    // new MidiRouter(/DOMinator/, { useClock: true }), // sequencer (mac)
    new MidiRouter(/loopMIDI/, { useClock: true }), // sequencer (windows)
    // new MidiRouter(/LD Output/, { useClock: true }) // Loop Drop (Matt)
    // new MidiRouter(/UM-ONE/), // Improjam (Jan)
    // new MidiRouter(/Midi Through Port-0/, { useClock: true }) // Improjam (Jan local)
  ]

  // MIDI Channels for Inst + Send from 1
  const drums = new DrumSampler('drums.wav', 36, 63)

  // Accoustic Kit
  drums.config(36, { volume: 1.0 }) // Kick 1
  drums.config(37, { volume: 1.0 }) // Click
  drums.config(38, { volume: 1.0 }) // Snare 1
  drums.config(39, { volume: 1.0 }) // clap
  drums.config(40, { volume: 1.0 }) // Snare 2
  drums.config(41, { volume: 1.0 }) // Boom Kick
  drums.config(42, { volume: 0.5, chokeGroup: 'h' }) // HH Cl
  drums.config(43, { volume: 1.0 }) // Tom Low
  drums.config(44, { volume: 1.0 }) // Snap
  drums.config(45, { volume: 1.0 }) // Tom Mid
  drums.config(46, { volume: 0.5, chokeGroup: 'h' }) // HH Op
  drums.config(47, { volume: 1.0 }) // Tom Hi
  drums.config(48, { volume: 1.0 }) // Clapslap ?
  drums.config(49, { volume: 0.5 }) // Ride 1
  drums.config(50, { volume: 0.3 }) // Crash
  drums.config(51, { volume: 0.5 }) // Ride 2

  // 808 Kit
  drums.config(52, { volume: 1.5 }) // Kick
  drums.config(53, { volume: 1.0 }) // Snare
  drums.config(54, { volume: 1.0 }) // Clap
  drums.config(55, { volume: 0.5, chokeGroup: 'h' }) // HH Cl
  drums.config(56, { volume: 0.5, chokeGroup: 'h' }) // Maracas
  drums.config(57, { volume: 0.2 }) // Ride

  // Synth Kit

  drums.config(58, { volume: 1.5 }) // Kick 1
  drums.config(59, { volume: 1.0 }) // Snare 1
  drums.config(60, { volume: 1.0 }) // Kick 2
  drums.config(61, { volume: 0.2 }) // Klang
  drums.config(62, { volume: 1.5 }) // Snare 2
  drums.config(63, { volume: 1.0 }) // Tom


  
  const bass = new Synth()
  const lead = new Synth()
  const poly = new PolySynth()
  
  const slicer = new Slicer({
    ticks: 42 * BEAT_TICKS * 4,
    sliceCount: 42 * 4,
    startNote: 0
  })

  const oneshots = new DrumSampler('oneshot.wav', 36, 44)
  oneshots.config(36, { volume: 0.1 })
  oneshots.config(37, { volume: 0.3 })
  oneshots.config(38, { volume: 0.8, chokeGroup: 'v' })
  oneshots.config(39, { chokeGroup: 'v' })
  oneshots.config(40, { chokeGroup: 'v' })
  oneshots.config(41, { volume: 1.5, chokeGroup: 'v' })
  oneshots.config(42, { volume: 1.5, chokeGroup: 'v' })
  oneshots.config(43, { chokeGroup: 'v' })
  const reverbFX = new ReverbFX()
  const delayFX = new DelayFX()

  // MIDI Channels for mixer channels from 8
  const drumsChannel = new MixerChannel()
  const bassChannel = new MixerChannel({ duckAmount: 0.9 })
  const polyChannel = new MixerChannel({ duckAmount: 1 })
  const leadChannel = new MixerChannel({ duckAmount: 1, highPass: 100 })
  const slicerChannel = new MixerChannel({ duckAmount: 0.8 })
  const oneshotsChannel = new MixerChannel({ duckAmount: 0.8 })
  const delayChannel = new MixerChannel({ duckAmount: 1, highPass: 200, volume: 1, reverb: 0.1 })
  const reverbChannel = new MixerChannel({ duckAmount: 0.8, highPass: 100 })

  // Connect inst/fx to channel strips
  const masterOutput = new GainNode(window.audioContext, { gain: 0.8 })
  const limiter = new DynamicsCompressorNode(window.audioContext, {
    threshold: 0,
    knee: 0,
    ratio: 20,
    attack: 0.005,
    release: 0.05
  })
  const postLimiter = new GainNode(window.audioContext, { gain: 0.8 })

  drums.output.connect(drumsChannel.input)
  bass.output.connect(bassChannel.input)
  poly.output.connect(polyChannel.input)
  lead.output.connect(leadChannel.input)
  slicer.output.connect(slicerChannel.input)
  oneshots.output.connect(oneshotsChannel.input)
  delayFX.output.connect(delayChannel.input)
  reverbFX.output.connect(reverbChannel.input)
  masterOutput.connect(limiter).connect(postLimiter).connect(window.audioContext.destination)

  // connect channel strips to output
  ;[
    drumsChannel, bassChannel, polyChannel, leadChannel, slicerChannel, oneshotsChannel,
    delayChannel, reverbChannel
  ].forEach((ch) => ch.output.connect(masterOutput))

  // connect sends
  ;[
    drumsChannel, bassChannel, leadChannel, polyChannel, slicerChannel, oneshotsChannel
  ].forEach((ch) => {
    ch.reverbSend.connect(reverbFX.input)
    ch.delaySend.connect(delayFX.input)
  })
  delayChannel.reverbSend.connect(reverbFX.input)

  // MIDI router connections
  ;[
    [drums, drumsChannel],
    [bass, bassChannel], 
    [poly, polyChannel], 
    [lead, leadChannel], 
    [slicer, slicerChannel], 
    [oneshots, oneshotsChannel],
    [reverbFX, reverbChannel], 
     [delayFX, delayChannel],
    [ui] // to display clock info
  ].forEach((obj, i) => {
    midiInputs.forEach(router => {
      router.connect(i + 1, obj)
    })
  })

  // Sample loader config
  const loader = new SampleLoader()

  loader.register(drums.sampleNames)
  loader.register(oneshots.sampleNames)

  // assign samples after all been loaded and decoded
  loader.load().then(() => {
    loader.getBuffers(drums.sampleNames).forEach((buffer, index) => {
      drums.setBuffer(index, buffer)
    })
    loader.getBuffers(oneshots.sampleNames).forEach((buffer, index) => {
      oneshots.setBuffer(index, buffer)
    })
    console.log('LOADED!')
  }).catch((e) => console.log(e))

  // expose for debugging
  window.bass = bass
  window.bassChannel = bassChannel
  window.slicer = slicer
  window.slicerChannel = slicerChannel
  window.midiInputs = midiInputs

  // expose for debugging
  window.drums = drums
  window.drumsChannel = drumsChannel
}

async function asyncInit () {
  try {
    await window.audioContext.audioWorklet.addModule('./worklets/bitcrusher.js?v=1')
    console.log('ADD MODULE')
  } catch (e) {
    console.log(e)
  }
  console.log('LETS INIT')
  init()
}

asyncInit()
