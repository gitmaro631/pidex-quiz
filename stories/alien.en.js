export default {
  items: {
    crystal:    { label: 'Resonance Crystal',  desc: 'Frequency amplification · unknown communication' },
    suit_patch: { label: 'Suit Repair Kit',    desc: 'Pressure maintenance · mobility' },
    beacon:     { label: 'Emergency Beacon',   desc: 'Rescue signal to mothership' },
  },
  scenes: {
    crashed_lander: {
      title: 'KEPLER-3 Landing',
      text: 'The lander engine failed. Emergency landing.\nSurface of planet KEPLER-3. The atmosphere is unbreathable but pressure holds.\nThe mothership leaves this orbit in 72 hours.\nA hologram log from the previous expedition team flickers inside the lander.',
      choices: [
        'Play the hologram log',
        'Immediately activate the beacon and send a distress signal',
        'Explore outside the lander',
      ],
    },
    holo_log: {
      title: 'Previous Expedition Log',
      text: 'Two faces appear in the hologram.\n"I\'m Nikos. First expedition commander. The resonance crystals on this planet are the language of alien life.\nDo not take one — or, if you already have one, it will be your key.\nCheng discovered it. The crystal tunes to their communication frequency."\nThe log cut out.',
      choices: [
        '[Crystal] Take out the crystal and attach it to the beacon',
        'Activate the beacon and go explore',
      ],
      requireDescs: ['No crystal. Activate beacon only.', null],
    },
    crystal_beacon: {
      title: 'Resonance Amplification',
      text: 'When you touched the crystal to the beacon antenna, the frequency exploded outward.\nA signal that would normally take 72 hours reached the mothership in 4 minutes.\n"Mothership here. Lander position confirmed. Recovery shuttle launching. ETA 90 minutes."\nThe crystal vibrated — as if something had responded.',
      endText: 'The resonance crystal served two purposes. A bridge to the mothership, and a first greeting to this planet.',
    },
    beacon_deploy: {
      title: 'Beacon Active',
      text: 'You activated the beacon. Signal transmission has begun.\nBut the reception strength is too low. It will take at least 40 hours to reach the mothership.\nTime is running out.',
      choices: [
        '[Crystal] Amplify the signal with the crystal',
        'Leave the signal running and go explore',
        '[Suit Repair] Fix the lander and raise the antenna higher',
      ],
      requireDescs: ['Insufficient signal strength. Must wait longer.', null, 'No repair tools'],
    },
    antenna_boost: {
      title: 'Antenna Repair',
      text: 'You raised the external antenna with the repair kit.\nSignal strength tripled.\nA response from the mothership. "Confirmed. Recovery shuttle launching. ETA 6 hours."',
      choices: ['Wait in the lander for the mothership'],
    },
    surface_explore: {
      title: 'Planet Surface',
      text: 'A violet plain. Light seeps from the rocks.\nThe same material as the resonance crystal.\nSomething moves in the distance. A life form.',
      choices: [
        '[Crystal] Take out the crystal and slowly approach the life form',
        'Avoid the life form and return to the lander',
        'Raise your hands toward the life form',
      ],
      requireDescs: ['No crystal. The life form feels threatening — you retreat.', null, null],
    },
    alien_contact: {
      title: 'First Contact',
      text: 'You held out the crystal and the life form stopped.\nIt had one too. The two crystals exchanged vibrations.\nImages entered your mind — lander, mothership, orbit, a direct connected path.\nThey want to guide you.',
      choices: ['Follow the life form\'s guidance'],
    },
    alien_guide: {
      title: 'Guided',
      text: 'The life form led you to the top of a hill.\nThere stood a massive signal amplification structure. Theirs.\nWhen you touched the crystal to the structure, a signal shot upward.\n"Mothership here. What is that strong signal? Lander position confirmed. Retrieving immediately."',
      endText: 'Humanity\'s first alien contact. The channel was a single resonance crystal. And courage.',
    },
    alien_hostile: {
      title: 'Misunderstanding',
      text: 'The life form emitted an alarm sound. A group swarmed.\nThey try to tear your suit.',
      endText: 'A gesture without weapons or crystal was read as a threat. Approaching without communication is dangerous.',
    },
    back_to_lander: {
      title: 'Back to Lander',
      text: 'You returned to the lander. The beacon is blinking.\nThe signal hasn\'t reached the mothership yet.\nOxygen remaining — 20 hours.',
      choices: [
        '[Crystal] Amplify the beacon with the crystal now',
        '[Suit Repair] Fix the lander antenna and raise it',
        'Wait for the signal to get through',
      ],
      requireDescs: ['No crystal. Wait for the signal.', 'No repair tools. Waiting.', null],
    },
    wait_pickup: {
      title: 'Waiting',
      text: 'Six hours later, the recovery shuttle landed.\nThe pilot opened the hatch. "You\'re alive!"',
      choices: ['Board the shuttle'],
    },
    wait_timeout: {
      title: 'Time\'s Up',
      text: 'The mothership left orbit. The signal never got through.\nOxygen ran out.',
      endText: 'The 72-hour window closed. Timing was everything.',
    },
    success_pickup: {
      title: 'Return',
      text: 'The shuttle docked with the mothership.\nThe crew applauded.\nPlanet KEPLER-3 receded through the window.',
      endText: 'You came back alive from an unknown planet. Space is vast, humans small — but tenacious.',
    },
  },
};
