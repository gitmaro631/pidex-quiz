export default {
  items: {
    rope:  { label: 'Rope',  desc: 'Raft building · lashing' },
    knife: { label: 'Knife', desc: 'Food · tool crafting' },
    flare: { label: 'Flare', desc: 'Rescue signal' },
  },
  scenes: {
    beach_wakeup: {
      title: 'Shipwrecked',
      text: 'A cruise ship struck a reef.\nYou came to on an unfamiliar beach.\nSomewhere in the Pacific. Ocean in every direction.\nFar away on the horizon, something passes — a cargo ship.',
      choices: [
        '[Flare] Fire a flare at the passing cargo ship',
        'Explore the island interior',
        'Search the shoreline for other survivors or supplies',
      ],
      requireDescs: ['No way to signal before the ship disappears', null, null],
    },
    flare_ship: {
      title: 'Signal Success',
      text: 'The flare shot up a red light.\nFive minutes later the cargo ship changed course.\nA lifeboat came down. A sailor reached out a hand.\n"Where are you from?"',
      endText: 'If you\'re not visible, you won\'t be rescued. One flare changed everything.',
    },
    beach_search: {
      title: 'Shoreline Search',
      text: 'Wreckage has washed ashore.\nLife jackets, plastic containers, wooden planks.\nAnd two people — alive.',
      choices: ['Approach the two people'],
    },
    survivor_meet: {
      title: 'Survivors',
      text: '"I\'m Nikos. This is Cheng — we\'re a marine ecology research team.\nActually, this island is one we\'ve been surveying. We have a satellite phone."\nCheng pulled it out. Battery at 5%.\nOne call left.',
      choices: ['Call the coast guard for rescue'],
    },
    sat_phone_rescue: {
      title: 'Satellite Phone',
      text: 'Connected. Location transmitted.\n"We\'ll be there within three hours."\nNikos and Cheng stayed behind to finish their data collection.',
      endText: 'An unexpected ally was on the island. People were the answer.',
    },
    explore_inland: {
      title: 'Island Interior',
      text: 'You pushed through the coconut grove.\nYou found a clear mountain stream. Your throat comes back to life.\nFrom higher ground the whole island is visible.\nOn the northern shore, there\'s a structure that looks like a hut.',
      choices: [
        '[Knife] Pick coconuts and get food',
        'Head to the northern hut',
        'Build a raft and prepare to escape',
      ],
      requireDescs: ["Can't pick them bare-handed", null, null],
    },
    coconut_food: {
      title: 'Coconuts',
      text: 'Coconut flesh and juice revived your strength.\nNow you need to find a way off.',
      choices: [
        '[Rope] Lash together a raft and try to escape',
        'Burn a smoke signal from high ground',
      ],
      requireDescs: ['No rope — the planks scatter', null],
    },
    old_hut: {
      title: 'Old Hut',
      text: 'An old fisherman\'s hut.\nInside: a worn net and matches.\nAnd a trail leading to the island\'s highest point.',
      choices: [
        '[Knife] Catch fish with the net',
        'Use the matches to light a signal fire',
      ],
      requireDescs: ["Can't prepare the net without a knife", null],
    },
    fishing: {
      title: 'Fishing',
      text: 'You caught fish. A full stomach clears your head.\nYou can make it through tomorrow.',
      choices: [
        '[Rope] Start lashing a raft together',
        'Keep burning the signal fire',
      ],
      requireDescs: ['No rope', null],
    },
    signal_smoke: {
      title: 'Signal Fire',
      text: 'You lit a fire on the highest rock.\nYou waited a day.\nThe next evening, a fishing boat in the distance turns toward the smoke.',
      choices: ['Go down to the shore and wave'],
    },
    raft_build: {
      title: 'Raft Building',
      text: 'You lashed the planks together with the rope.\nYou rigged a sail from palm leaves.\nYou need to leave before the waves get rough.',
      choices: ['Launch the raft and head into the wind'],
    },
    ocean_drift: {
      title: 'Adrift',
      text: 'Two days of drifting.\nFighting thirst to survive.\nA ship\'s lights are visible in the distance.',
      choices: [
        '[Flare] Fire the flare',
        '[Knife] Catch raw fish for hydration',
      ],
      requireDescs: ['No signal. The ship passes.', 'Dehydration worsens.'],
    },
    raw_fish_survive: {
      title: 'Raw Fish',
      text: 'You held on with raw fish for hydration.\nAt dawn the next day, the outline of an island. A different island.\nPeople probably live there.',
      choices: ['Head for the island'],
    },
    success_rescue: {
      title: 'Rescue',
      text: 'The ship stopped. A ladder came down.\n"What happened to you?" A sailor handed you a blanket.',
      endText: 'Survived three days adrift. The ocean is vast and humans are small — but you didn\'t give up.',
    },
    success_boat: {
      title: 'Rescue',
      text: 'The fishing boat came in. A sailor reached out a hand.\nA warm bowl of soup was the whole world.',
      endText: 'You came back from an uninhabited island. A single light separated life from death.',
    },
    ocean_death: {
      title: 'Lost at Sea',
      text: 'Dehydration and starvation took your consciousness.\nThe raft drifted away in the current.',
      endText: 'The ocean does not return the unprepared.',
    },
  },
};
