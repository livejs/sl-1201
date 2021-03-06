
```
  ________.____              ___________________  ____
 /   _____|    |            /_   \_____  \   _  \/_   |
 \_____  \|    |      ______ |   |/  ____/  /_\  \|   |
 /        |    |___  /_____/ |   /       \  \_/   |   |
/_______  |_______ \         |___\_______ \_____  |___|
        \/        \/                     \/     \/
```

MIDI DRIVEN SYNTH RIG IN YOUR BROWSER

- originally written for [JSConfEu 2019 Festival X Opening](https://youtu.be/o1rzsna263c?t=1222) ([DOMinator](https://github.com/livejs/DOMinator))
- Extended for JSConf.asia ([Bassline 418](https://github.com/livejs/bassline418))

Written by Matt McKegg (@mmckegg) & Jan Krutisch (@halfbyte)

## Action Videos

- https://www.youtube.com/watch?v=yMbfu5QiS7c
- https://www.youtube.com/watch?v=b2SJn4SWKVU

## Install / Use

- use git-lfs to check out the samples
- run npm i to install the webserver
- trigger stuff with midi! (yes, that easy. OR NOT)
- probably change the code to make it work with your midi setup

## Structure

- The modules folder contains all of the sound engine parts
- index.js contains the performance related setup
- Each Instrument, which can be one of
  - Drum/Oneshot Sampler
  - Slicer
  - Synth
- is then fed into a Mixer Channel which contains a
  - Bitcrusher
  - Dual filter (similar to these on DJ Mixers)
  - Sends to a Reverb and a Delay
  - A ducker (ala sidechain compression)

## Controller mappings

The updated controller mappings in SL-1201 are trying to be a bit more standard than the original DOMinator bindings.

Also, each channel now controls both the instrument and the mixer channel, so we use up less MIDI channels and could
potentially add more instrument instances. (The two send channels still need their own MIDI channel)

Here's the current mapping

### Mixer Channel

- 07 - Channel volume
- 91 - Reverb Send
- 92 - Delay Send
- 93 - Dual Filter
- 94 - Bit Reduction
- 95 - Rate Reduction
- 90 - Ducking Amount

### Poly Synth

- 74 - Cutoff
- 71 - Resonance
- 70 - Filter Envelope intensity
- 73 - Env Attack
- 75 - Env Decay
- 72 - Env Sustain
- 79 - Env Release

### Synth (Bass Synth)

- 74 - Cutoff
- 71 - Resonance
- 73 - Env Attack
- 75 - Env Decay
- 72 - Env Sustain
- 79 - Env Release
- 84 - Portamento
- 70 - Filter Envelope intensity
- 80 - Square <-> Saw
- 81 - Sub
- 82 - Noise
- 85 - Detune
- 86 - Vibrato

### Reverb

- 16 - Room Size
- 17 - Dampening

### Delay

- 16 - Delay Time
- 17 - Feedback




## License

See [LICENSE](LICENSE)
