export default {
  items: {
    spear:    { label: 'Spear',    desc: 'Threat · hunting · improvised torch' },
    water_bag:{ label: 'Water Bag', desc: 'Water storage · tribal exchange' },
    fire_kit: { label: 'Flint Kit', desc: 'Fire starting · signal smoke' },
  },
  scenes: {
    jeep_crash: {
      title: 'Safari Accident',
      text: 'The safari jeep flipped when a wheel caught a crack in the dry earth.\nMiddle of Maasai Mara National Park.\nThe guide is unconscious. The radio is broken.\nFar away, a lion pride rests under acacia tree shade.',
      choices: [
        '[Flint Kit] Light dry grass and send up a smoke signal',
        'Head in the direction of the river',
        'Take refuge in an acacia tree',
      ],
      requireDescs: ['No way to start a fire', null, null],
    },
    signal_smoke: {
      title: 'Smoke Signal',
      text: 'A bundle of dry grass caught fire.\nA column of smoke rose high into the sky.\nTen minutes later, a park patrol helicopter turned and approached.',
      endText: 'The savanna sees those who rise high first. One signal separated life from death.',
    },
    tree_refuge: {
      title: 'Acacia Tree',
      text: 'You climbed the tree. Lions circle the jeep below.\nFrom the height you can see a river glinting to the north.\nTo the south, a Maasai village rooftop.',
      choices: [
        'Head toward the village',
        'Head toward the river',
      ],
    },
    river_direction: {
      title: 'Toward the River',
      text: 'You can hear the river. As you move, a lion blocks your path.\nYou\'ve made eye contact. Do not run.',
      choices: [
        '[Spear] Hold the spear forward and slowly back away',
        '[Flint Kit] Strike sparks to frighten the lion',
        'Sprint and climb the nearest tree',
      ],
      requireDescs: ['Bare-handed against the lion. It charges.', 'No fire. The lion charges.', null],
    },
    lion_standoff: {
      title: 'Standoff',
      text: 'You held the spear level and maintained eye contact.\nOne minute felt like forever.\nThe lion broke eye contact first. It slowly backed away.\nWithout the spear it would have been different.',
      choices: ['Keep moving toward the river'],
    },
    fire_lion: {
      title: 'Fire Threat',
      text: 'Sparks burst right in front of the lion\'s face.\nThe lion retreated. It fears fire.',
      choices: ['Keep moving toward the river'],
    },
    lion_tree_climb: {
      title: 'Up the Tree',
      text: 'You barely made it up, but a claw raked your leg.\nThe lion waited an hour before leaving.',
      choices: ['Keep moving toward the river'],
    },
    lion_death: {
      title: 'The Lion',
      text: 'The lion charged. It was instant.',
      endText: 'The savanna is the kingdom of predators. Bare hands means defeat.',
    },
    river_bank: {
      title: 'Riverbank',
      text: 'You reached the river and drank.\nBut crocodiles are on the far bank.\nUpstream there might be the Maasai village.',
      choices: [
        '[Spear] Threaten the crocodiles and wade across',
        'Follow the river upstream to find the village',
      ],
      requireDescs: ['No way to deal with the crocodiles', null],
    },
    croc_crossing: {
      title: 'River Crossing',
      text: 'You struck the water surface hard with the spear as you crossed.\nThe crocodiles submerged.\nYour knees were shaking when you reached the other side.',
      choices: ['Head toward the village'],
    },
    maasai_approach: {
      title: 'Maasai Village',
      text: 'A warrior stands at the village entrance.\nHe blocks the way with a raised spear.\nYou need to attempt communication.',
      choices: [
        '[Water Bag] Offer the water bag and request water',
        'Raise both hands to show peace',
      ],
      requireDescs: ['Nothing to offer. The warrior blocks you.', null],
    },
    water_exchange: {
      title: 'Water Exchange',
      text: 'You held out the water bag and the warrior\'s expression softened.\nYou were led inside the village.\nThe elder produced a radio and connected you to the park authority.',
      choices: ['Wait for rescue'],
    },
    peaceful_approach: {
      title: 'Exchange',
      text: 'You raised both hands. The warrior watched for a moment, then nodded.\nYou entered the village.',
      choices: ['Ask for help'],
    },
    researcher_camp: {
      title: 'Research Camp',
      text: 'Two tents near the river.\n"I\'m Nikos. Wildlife ecology research team. This is Cheng."\nCheng picked up a satellite phone. "I\'ll call the park authority."',
      choices: ['Wait for rescue'],
    },
    success_rescue_camp: {
      title: 'Rescue',
      text: '30 minutes later a park patrol vehicle arrived.\nNikos and Cheng stayed behind to continue their research.\n"Don\'t come without a guide next time."',
      endText: 'Two researchers were in the middle of the savanna. An unexpected meeting became a lifeline.',
    },
    night_savanna: {
      title: 'Night on the Savanna',
      text: 'Darkness fell. Hyena calls come from every direction.\nWithout fire it\'s hard to survive.',
      choices: [
        '[Flint Kit + Spear] Light the spear as a torch',
        'Spend the night up in a tree',
      ],
      requireDescs: ['Need both fire and spear', null],
    },
    torch_march: {
      title: 'Torch March',
      text: 'You lit the tip of the spear. A torch.\nHyenas fled from the fire.\nYou walked until dawn and reached the village.',
      choices: ['Enter the village'],
    },
    tree_night: {
      title: 'Night in the Tree',
      text: 'Morning came. The hyenas left.\nYou set out for the village on exhausted legs.',
      choices: ['Head toward the village'],
    },
    success_village: {
      title: 'Village',
      text: 'You were served traditional Maasai food.\nA park authority vehicle came to meet you.',
      endText: 'You passed through the kingdom of lions, crocodiles, and hyenas. You\'re alive.',
    },
    dehydration: {
      title: 'Dehydration',
      text: 'The dry season heat drew out every drop of moisture.\nYou collapsed.',
      endText: 'In the savanna, water is life. The water bag was empty.',
    },
  },
};
