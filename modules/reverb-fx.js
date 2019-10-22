function LowpassCombFilter (context) {
  var node = context.createDelay(1)

  var output = context.createBiquadFilter()

  // this magic number seems to fix everything in Chrome 53
  // see https://github.com/livejs/freeverb/issues/1#issuecomment-249080213
  output.Q.value = -3.0102999566398125

  output.type = 'lowpass'
  node.dampening = output.frequency

  var feedback = context.createGain()
  node.resonance = feedback.gain

  node.connect(output)
  output.connect(feedback)
  feedback.connect(node)

  node.dampening.value = 3000
  node.delayTime.value = 0.1
  node.resonance.value = 0.5

  return node
}

// adapted from: https://github.com/TONEnoTONE/Tone.js/blob/master/Tone/effect/Freeverb.js

const combFilterTunings = [1557 / 44100, 1617 / 44100, 1491 / 44100, 1422 / 44100, 1277 / 44100, 1356 / 44100, 1188 / 44100, 1116 / 44100]
const allpassFilterFrequencies = [225, 556, 441, 341]

function Freeverb (audioContext) {
  var node = audioContext.createGain()
  node.channelCountMode = 'explicit'
  node.channelCount = 2

  var output = audioContext.createGain()
  var merger = audioContext.createChannelMerger(2)
  var splitter = audioContext.createChannelSplitter(2)
  var highpass = audioContext.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 200

  var wet = audioContext.createGain()
  var dry = audioContext.createGain()

  node.connect(dry)
  node.connect(wet)
  wet.connect(splitter)
  merger.connect(highpass)
  highpass.connect(output)
  dry.connect(output)

  var combFilters = []
  var allpassFiltersL = []
  var allpassFiltersR = []
  var roomSize = 0.8
  var dampening = 3000

  // make the allpass filters on the right
  for (var l = 0; l < allpassFilterFrequencies.length; l++) {
    var allpassL = audioContext.createBiquadFilter()
    allpassL.type = 'allpass'
    allpassL.frequency.value = allpassFilterFrequencies[l]
    allpassFiltersL.push(allpassL)

    if (allpassFiltersL[l - 1]) {
      allpassFiltersL[l - 1].connect(allpassL)
    }
  }

  // make the allpass filters on the left
  for (var r = 0; r < allpassFilterFrequencies.length; r++) {
    var allpassR = audioContext.createBiquadFilter()
    allpassR.type = 'allpass'
    allpassR.frequency.value = allpassFilterFrequencies[r]
    allpassFiltersR.push(allpassR)

    if (allpassFiltersR[r - 1]) {
      allpassFiltersR[r - 1].connect(allpassR)
    }
  }

  allpassFiltersL[allpassFiltersL.length - 1].connect(merger, 0, 0)
  allpassFiltersR[allpassFiltersR.length - 1].connect(merger, 0, 1)

  // make the comb filters
  for (var c = 0; c < combFilterTunings.length; c++) {
    var lfpf = LowpassCombFilter(audioContext)
    lfpf.delayTime.value = combFilterTunings[c]
    if (c < combFilterTunings.length / 2) {
      splitter.connect(lfpf, 0)
      lfpf.connect(allpassFiltersL[0])
    } else {
      splitter.connect(lfpf, 1)
      lfpf.connect(allpassFiltersR[0])
    }
    combFilters.push(lfpf)
  }

  Object.defineProperties(node, {
    roomSize: {
      get: function () {
        return roomSize
      },
      set: function (value) {
        roomSize = value
        refreshFilters()
      }
    },
    dampening: {
      get: function () {
        return dampening
      },

      set: function (value) {
        dampening = value
        refreshFilters()
      }
    }
  })

  refreshFilters()

  node.connect = output.connect.bind(output)
  node.disconnect = output.disconnect.bind(output)
  node.wet = wet.gain
  node.dry = dry.gain

  // expose combFilters for direct automation
  node.combFilters = combFilters

  return node

  // scoped

  function refreshFilters () {
    for (var i = 0; i < combFilters.length; i++) {
      combFilters[i].resonance.value = roomSize
      combFilters[i].dampening.value = dampening
    }
  }
}

function midiFloat (value, from = 0, to = 127) {
  const range = to - from
  return (value - from) / range
}

export default class ReverbFX {
  constructor () {
    this.ctx = window.audioContext
    this.freeverb = Freeverb(this.ctx)
  }
  get output () {
    return this.freeverb
  }
  get input () {
    return this.freeverb
  }
  cc (ctrl, value) {
    if (ctrl === 16) {
      this.freeverb.roomSize = midiFloat(value)
    }
    if (ctrl === 17) {
      this.freeverb.dampening = midiFloat(value) * 2000
    }
  }
}
