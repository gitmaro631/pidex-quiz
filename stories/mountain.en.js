export default {
  items: {
    rope:  { label: 'Rope',      desc: 'Anchoring · rappelling · securing' },
    flare: { label: 'Signal Flare', desc: 'Rescue signal · wildlife deterrent' },
    tea:   { label: 'Altitude Tea', desc: 'Altitude sickness relief · warmth' },
  },
  scenes: {
    snowfield: {
      title: 'After the Avalanche',
      text: 'You opened your eyes. 4,800 meters above sea level.\nAn avalanche swallowed the trekking team.\nYou\'re alone. You need to get down past the ridge.\nThe wind cuts like a knife.',
      choices: [
        'Descend along the slope',
        'Follow the ridge to read the terrain',
        '[Rope + Flare] Tie the flare to the rope and shoot it across the valley',
      ],
      requireDescs: [null, null, 'Need both rope and flare'],
    },
    zipline_combo: {
      title: 'Improvised Zipline',
      text: 'You tied the flare to the rope and fired it at a rock across the valley.\nIt caught. The rope went taut.\nYou clung on and swung across. On the other side — the team\'s emergency shelter.\nTeammates come running. "How did you make it?!"',
      endText: 'Rope and flare. Ordinary gear separately — an escape route combined.',
    },
    slope_descent: {
      title: 'Steep Slope',
      text: 'An icy slope. One wrong step means a fall of hundreds of meters.\nCrevasses gape open all around.',
      choices: [
        '[Rope] Anchor with the rope and descend slowly',
        'Just go for it',
      ],
      requireDescs: ['No safety gear — too dangerous', null],
    },
    slip_fall: {
      title: 'Fall',
      text: 'Your foot slipped.\nYou slid 20 meters in an instant. You hit a rock.\nConsciousness fades.',
      endText: 'The Himalayas allow no carelessness. One foot too light.',
    },
    safe_descent: {
      title: 'Safe Descent',
      text: 'The rope got you down safely.\nBelow, a narrow valley path is visible.\nAltitude sickness sets in. A throbbing headache.',
      choices: [
        '[Altitude Tea] Drink the tea to ease the symptoms',
        'Ignore it and follow the valley path',
      ],
      requireDescs: ['Altitude sickness is getting worse', null],
    },
    tea_boost: {
      title: 'Warmth of Tea',
      text: 'Warmth spreads through your body. Altitude symptoms ease.\nYour head clears. Smoke is visible below the valley.\nSomeone lives there.',
      choices: ['Head toward the smoke'],
    },
    ridge_path: {
      title: 'On the Ridge',
      text: 'From the ridge you can see a weather station tower in the distance.\nOn the opposite slope, something that looks like a temple roof.\nThe wind is picking up. A storm is coming.',
      choices: [
        'Head to the weather station tower',
        'Descend toward the temple',
        '[Rope] Secure yourself with the rope and cross the ridge through the storm',
      ],
      requireDescs: [null, null, 'Without a rope, the ridge in a storm is suicide'],
    },
    weather_station: {
      title: 'Weather Station',
      text: 'You thought it was unmanned. The door opened — two people inside.\n"I\'m Nikos. We\'re collecting climate data. This is Cheng."\nCheng already had the satellite phone out. "I\'ll call rescue. Forty-five minutes."\nThe two said they\'d stay to resume data collection after the storm.',
      choices: ['Wait for the rescue helicopter'],
    },
    ridge_cross: {
      title: 'Ridge Crossing',
      text: 'You anchored to a rock like a rope team and crossed the ridge.\nThe storm raged but the rope held.\nOn the other side, the temple roof is right there.',
      choices: ['Head to the temple'],
    },
    valley_path: {
      title: 'Valley Path',
      text: 'Three hours of walking. You can hear chanting in the distance.\nThere are footprints in the snow. People travel this way.',
      choices: [
        'Follow the chanting',
        '[Flare] Fire a rescue signal',
      ],
      requireDescs: [null, 'No way to signal'],
    },
    snowstorm_caught: {
      title: 'Inside the Storm',
      text: 'A fierce blizzard cut off your visibility. You lost your bearings.\nHypothermia is setting in. Your hands and feet are losing feeling.',
      choices: [
        '[Flare] Fire a flare into the night sky',
        'Dig into the snow and bivouac',
      ],
      requireDescs: ['You collapse silently in an unknown place.', null],
    },
    snow_bivouac: {
      title: 'Snow Bivouac',
      text: 'You dug a snow cave. Blocking the wind brought a little warmth.\nBy dawn the storm had passed.\nBut altitude sickness is getting worse.',
      choices: [
        '[Altitude Tea] Drink the tea and suppress the symptoms',
        'Ignore the altitude sickness and push on',
      ],
      requireDescs: ['Altitude sickness worsens. Consciousness fades.', null],
    },
    tea_saves: {
      title: 'One Last Cup',
      text: 'Hot altitude tea brought your consciousness back.\nLight seeping through the snow — dawn.\nBelow, the outline of a temple emerges.',
      choices: ['Descend toward the temple'],
    },
    altitude_death: {
      title: 'Altitude Sickness',
      text: 'Everything went white. Altitude sickness compressed your brain.\nYou collapsed quietly on the snow at 4,600 meters.',
      endText: 'The altitude overwhelmed you. Always approach the mountain with reverence.',
    },
    monastery_near: {
      title: 'Tibetan Monastery',
      text: 'An old wooden gate creaked open.\nA monk came out, put his hands together, and led you inside.\nA warm room. The scent of yak butter tea.',
      choices: [
        'Ask for help and request rescue',
        '[Altitude Tea] Take out the altitude tea and share it',
      ],
      requireDescs: [null, 'Nothing to share'],
    },
    tea_ceremony: {
      title: 'Tea Offering',
      text: 'When you took out the altitude tea the monk\'s eyes lit up.\nThe same regional tea leaves — an ancient trade variety.\nThe head monk personally offered to guide you through the trade route to the village.\nA route faster than a helicopter, he said.',
      choices: ['Follow the monk\'s guidance'],
    },
    monk_help: {
      title: 'Satellite Phone',
      text: 'The monk produced an old satellite phone.\nThirty minutes later, rescue helicopter blades could be heard.',
      choices: ['Board the helicopter'],
    },
    flare_signal: {
      title: 'Red Signal',
      text: 'The flare stained the snowfield red.\nFifteen minutes later, a search helicopter appeared with its rotors beating.',
      choices: ['Board the helicopter'],
    },
    success_heli: {
      title: 'Rescue',
      text: 'When you put on the oxygen mask inside the helicopter, the world became clear again.\nThrough the window, the Himalayan snow peaks receded.',
      endText: 'The mountain let you go. Go back alive.',
    },
    success_monastery: {
      title: 'Leaving the Monastery',
      text: 'Monks put their hands together at the monastery entrance.\nIn the distance, rescue vehicle lights are visible.',
      endText: 'The Himalayan monastery held you. One who walked down from 4,800 meters.',
    },
  },
};
