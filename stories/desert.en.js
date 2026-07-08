export default {
  items: {
    hat:    { label: 'Hat',      desc: 'Sun protection · desert customs' },
    mirror: { label: 'Mirror',   desc: 'Signaling · direction finding' },
    cloth:  { label: 'Wide Cloth', desc: 'Tent · sandstorm shield' },
  },
  scenes: {
    storm_end: {
      title: 'After the Storm',
      text: 'The sandstorm ended. You open your eyes to nothing but sand in every direction.\nThe expedition vehicle and all equipment are gone.\nThe sun is overhead. Your skin is already burning.\nIn the far distance, a stone wall of Roman-era ruins is visible.',
      choices: [
        'Use the sun\'s position to navigate and walk',
        'Take shelter at the ruins wall and assess the situation',
        'Try to reflect sunlight with the mirror',
      ],
      requireDescs: [null, null, 'No mirror'],
    },
    mirror_signal_open: {
      title: 'Miracle',
      text: 'You aligned the reflection angle and light shot outward.\nMinutes later, a helicopter in the distance began to turn.\nIt landed five minutes later. A rescue team.\n"How did you signal us so precisely from there?" A single hand mirror crossed the desert.',
      endText: 'A hand mirror bridged the desert and the sky. Time to escape — 23 minutes.',
    },
    shadow_walk: {
      title: 'Sun Compass',
      text: 'You used stick shadows to set a direction. Northeast should be toward the road.\nBut the midday heat is brutal. Something glimmers in the distance.\nOasis, or mirage?',
      choices: [
        'Run toward the glimmer',
        '[Hat] Walk slowly toward the ridge with shade',
        '[Cloth] Set up an improvised tent and avoid the heat',
      ],
      requireDescs: [null, 'Nothing to block the sun', 'No cloth to make shade'],
    },
    mirage_chase: {
      title: 'Mirage',
      text: 'You ran, but there was nothing there. A mirage.\nYou collapsed on the ground. Nausea hits.\nEnergy is completely gone. You can barely stand alone.',
      choices: [
        'Crawl toward the ridge with your last strength',
        '[Cloth] Cover yourself with the cloth and prepare for night travel',
      ],
      requireDescs: [null, 'No way to make shade. You collapse.'],
    },
    cloth_shelter: {
      title: 'Sand Tent',
      text: 'You fixed the cloth between two rocks as a makeshift tent.\nYou slept through the brutal afternoon sun.\nNight came. The temperature dropped from 37°C to 18°C.\nStars pour down. Orion shows you east.',
      choices: ['Walk through the night using the stars as a compass', 'Wait until dawn and then set out'],
    },
    night_march: {
      title: 'Desert Night',
      text: 'You walked under starlight. It was cool.\nMaybe three hours in, a flickering light appears in the distance — like a campfire.',
      choices: ['Approach the light', 'Ignore the light and keep walking toward the road'],
    },
    dawn_start: {
      title: 'Dawn Departure',
      text: 'Five in the morning, the horizon turned red.\nYour temperature recovered. Beyond a distant ridge, a black asphalt line is visible.',
      choices: ['Cross the ridge and head for the road'],
    },
    shaded_march: {
      title: 'Ruin Carvings',
      text: 'The hat reduced energy drain.\nSoon you can see bas-reliefs carved into the ruin walls.\nStar charts and directional markings — waypoints left by ancient caravans.\nNortheast — toward an oasis.',
      choices: ['Head northeast', 'Search inside the ruins for water'],
    },
    oasis_path: {
      title: 'Toward the Oasis',
      text: 'Two hours of walking and you can see palm trees.\nIt\'s real. Your pace quickens.',
      choices: ['Run'],
    },
    oasis_found: {
      title: 'Oasis',
      text: 'There\'s a well under the date palms.\nYou drew water and drank deeply. Strength returns.\nNow the choice — wait here, or keep moving?',
      choices: ['Wait at the oasis for rescue', 'Drink your fill then head for the road'],
    },
    oasis_wait: {
      title: 'Waiting',
      text: 'Two days passed but no one came.\nThere\'s water, but no food.\nYou can\'t hold out any longer. You have to move.',
      choices: ['Squeeze out your last strength and head for the road'],
    },
    ruin_explore: {
      title: 'Roman Ruins',
      text: 'It was a Roman Porta Magna. Inside, stairs descend underground — a storage facility.\nAt the bottom, an ancient cistern — with water still in it!',
      choices: [
        'Drink and recover, then find your bearings',
        'Explore deeper into the ruins',
      ],
    },
    ruin_deep: {
      title: 'Two People',
      text: 'Light seeps from deep inside the hall.\nTwo laptops are open, two people are sitting there.\nOne stands and speaks. "I\'m Nikos. We\'re doing geological survey work. This is Cheng."\nCheng already has a satellite phone out. "I\'ll call for rescue. Twenty minutes."',
      choices: ['Gratefully wait for the rescue helicopter'],
    },
    researcher_rescue: {
      title: 'Rescue',
      text: 'The helicopter came. Nikos and Cheng stayed behind to continue data collection.\n"We call it the Desert Protocol. You survived even in these conditions."\nThe two waved and disappeared back into the ruins.',
      endText: 'Two unexpected people were in the ruins. They appeared and vanished like fate.',
    },
    ridge_overlook: {
      title: 'Ridge View',
      text: 'From the ridge you can see asphalt in the far distance.\nAbout three hours away. But a brown dust cloud is rising on the horizon.\nAnother storm is coming.',
      choices: [
        'Sprint to the road before the storm hits',
        '[Cloth] Wrap yourself in the cloth and ride out the storm',
        'Hide in a rock crevice',
      ],
      requireDescs: [null, 'Nothing to wrap yourself in. The storm takes you.', null],
    },
    storm_race: {
      title: 'Racing the Storm',
      text: 'You ran, but the storm was faster.\nSand stabbed your eyes and you lost your direction.\nYou woke the next morning with nothing left.',
      choices: ['Crawl toward the road on your last reserves'],
    },
    cloth_storm_survive: {
      title: 'Through the Storm',
      text: 'You wrapped the cloth over your eyes and nose and crouched down.\nTwo hours later the storm passed. Not a grain of sand got in.\nThe road feels closer now.',
      choices: ['Head toward the road'],
    },
    rock_shelter: {
      title: 'Rock Crevice',
      text: 'You weathered the storm. But your throat is on fire.\nInside the crevice, a half-buried water bottle. Left by the expedition team. A little water inside.',
      choices: ['Drink and head for the road'],
    },
    bedouin_camp: {
      title: 'Bedouin Camp',
      text: 'A Bedouin nomad camp.\nA camel caravan will depart for a desert-edge village in three days.\nThe chief gestures — do you want to join?',
      choices: [
        'Join the caravan',
        '[Hat] Offer the hat as a gift and request faster travel',
      ],
      requireDescs: [null, 'Nothing to offer'],
    },
    hat_gift: {
      title: 'Desert Courtesy',
      text: 'In the desert, a hat is a precious gift.\nThe chief\'s eyes light up with a smile. He offers his finest camel.\nYou reached the village in a day.',
      choices: ['Ride the camel to the village'],
    },
    caravan_join: {
      title: 'Caravan',
      text: 'The desert sunset seen from camel-back brought tears to your eyes.\nThree days later, the village minaret came into view.',
      choices: ['Enter the village'],
    },
    highway_sight: {
      title: 'Asphalt',
      text: 'Asphalt under your feet. Ten minutes later a truck raises dust and stops.\nThe driver holds out water. "Where did you come from?"',
      choices: ['Climb into the truck'],
    },
    success_town: {
      title: 'Village Arrival',
      text: 'Children came running as you crossed into the village.\nA glass of clean water. A piece of bread. The most delicious things in the world.',
      endText: 'The desert sent you back. Harder than before.',
    },
    success_highway: {
      title: 'Escape',
      text: 'You felt the air conditioning from the truck\'s passenger seat.\nThe desert shrank in the window behind you.',
      endText: 'Three days in the desert. Survived on asphalt.',
    },
    desert_collapse: {
      title: 'The Limit',
      text: 'You can\'t move anymore.\nSand fills your vision. Consciousness fades.',
      endText: 'The desert heat took everything. One step short.',
    },
  },
};
