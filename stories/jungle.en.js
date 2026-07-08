export default {
  items: {
    knife:   { label: 'Knife',        desc: 'Trap building · path clearing' },
    lighter: { label: 'Lighter',      desc: 'Fire · signaling' },
    bottle:  { label: 'Water Bottle', desc: 'Water storage · purification' },
  },
  scenes: {
    crash_site: {
      title: 'Crash Site',
      text: 'You opened your eyes, trapped in helicopter wreckage. Your shoulder aches, but no broken bones. Thickening smoke warns you to leave. You hear a river to the west.',
      choices: ['Head toward the river sound', 'Search the wreckage first'],
    },
    wreck_search: {
      title: 'Wreckage Search',
      text: 'You found an emergency energy bar under the cockpit. At the same time, the smell of fuel grew stronger. One spark and it\'s over.',
      choices: ['Grab the bar and get out immediately', 'Search a little more'],
    },
    explosion: {
      title: 'Explosion',
      text: 'The fuel ignited. The blast threw you into a tree. You heard a crack from your ribs.',
      endText: 'Broken ribs. Too serious an injury to survive alone in the jungle.',
    },
    river_approach: {
      title: 'Riverbank',
      text: 'You reached the river. Murky, fast-moving water. Your throat burns. Drinking without purification risks parasites.\n\nYou looked at what you had. There must be another way.',
      choices: [
        'Drink the river water raw',
        'Boil it with the lighter',
        'Fill the bottle and keep moving',
        'Build a solar still with the bottle and lighter',
        'Ignore thirst and keep moving',
      ],
      requireDescs: [null, 'No lighter', 'No bottle', 'Need both bottle and lighter', null],
    },
    solar_still: {
      title: 'Solar Still',
      text: 'You cut one side of the bottle and set it over a puddle as a still. It took time, but you got clean water.\n\nIn the process, the shiny bottle reflected sunlight upward. Something in the sky responded. Thirty minutes later — a helicopter.',
      choices: ['Run to open ground and signal'],
    },
    early_rescue: {
      title: 'Miraculous Rescue',
      text: 'The helicopter descended. The pilot\'s eyes went wide.\n\n"You... we heard you went missing yesterday. How are you out this fast?"\n\nA water bottle and a lighter — two ordinary objects that created an extraordinary miracle.',
      endText: 'Day 1 — the combination of bottle and lighter made a Day 1 escape possible.',
    },
    drink_raw: {
      title: 'Raw River Water',
      text: 'You drank. It felt fine at first. Hours later your stomach twisted. Parasites.',
      choices: ['Push through and keep walking'],
    },
    boil_water: {
      title: 'Boiled Water',
      text: 'You gathered dry wood and started a fire. You boiled the river water and drank safely. The lighter fuel is running low.',
      choices: ['Follow the river downstream'],
    },
    day2_thirsty: {
      title: 'Dehydration',
      text: 'Dehydration is setting in. Your lips are cracked, your head is pounding.',
      choices: ['Find a stream and drink', 'Push through'],
    },
    collapse: {
      title: 'Collapse',
      text: 'Your body is burning. Your feet won\'t move anymore.',
      endText: 'Collapsed from dehydration. The jungle is unforgiving without water.',
    },
    day2_path: {
      title: 'Day Two Jungle',
      text: 'Second morning. Every muscle aches. A river tributary blocks your path ahead. You\'re desperately hungry.',
      choices: [
        'Cross the tributary',
        'Use the knife to build a trap and get food',
        'Forage for food in the plants nearby',
        'Collect rainwater in the bottle',
      ],
      requireDescs: [null, 'No knife, can\'t build a trap', null, 'No bottle', ],
    },
    rainwater: {
      title: 'Rainwater Collection',
      text: 'You spread the bottle to catch drops falling off the leaves. Clean rainwater. Useful in an unexpected way.',
      choices: ['Cross the tributary'],
    },
    set_trap: {
      title: 'Setting a Trap',
      text: 'You whittled branches with the knife to make a snare. A small rodent was caught by morning. You cooked it over a fire. Hunger faded.',
      choices: ['Cross the tributary and keep moving'],
    },
    forage: {
      title: 'Foraging',
      text: 'You found bright red berries. They look tempting. But many jungle fruits are toxic.',
      choices: ['Smell and eat them', 'Give up and head to the river'],
    },
    forage_eat: {
      title: 'Toxic Berries',
      text: 'A burning sensation in your mouth. A poisonous plant. Convulsions spread through your body.',
      endText: 'Eating unknown berries in the jungle is a gamble. A fatal mistake.',
    },
    river_cross: {
      title: 'Crossing the Tributary',
      text: 'You stepped into the tributary. The current is stronger than expected. How will you cross?',
      choices: [
        'Just force your way across',
        'Find a shallow spot and go around',
        'Use the knife to make a walking stick',
      ],
      requireDescs: [null, null, 'No knife'],
    },
    river_slip: {
      title: 'Swept Away',
      text: 'Your foot slipped. You were swept 10 meters downstream. You barely grabbed a rock. Your gear is soaked and your shoulder took a hit.',
      choices: [
        'Start a fire and dry off',
        'Keep moving while wet',
      ],
      requireDescs: ['No lighter', null],
    },
    river_safe: {
      title: 'Safe Crossing',
      text: 'It took time, but you crossed safely. You saved your strength.',
      choices: ['Keep moving'],
    },
    day3_fork: {
      title: 'Day Three Morning',
      text: 'Day three. The jungle seems to be thinning. A fork in the path.\n\nSmoke rises to the right. Barefoot tracks lead to the left.',
      choices: ['Go right toward the smoke', 'Follow the tracks to the left'],
    },
    loggers_camp: {
      title: 'Illegal Logging Camp',
      text: 'The smoke came from a logging camp. Three armed men spotted you. Their eyes are unfriendly.\n\nIf you have a lighter, there might be another way.',
      choices: [
        'Raise your hands and ask for help',
        'Watch for an opening and sneak around',
        'Set the northern brush on fire to create a distraction',
      ],
      requireDescs: [null, null, 'No lighter'],
    },
    loggers_betray: {
      title: 'Betrayal',
      text: 'The leader gave you food and let you sleep. You woke at dawn tied up deep in the jungle.',
      endText: 'Exploited by illegal loggers. A stranger\'s hospitality in an unknown place is dangerous.',
    },
    fire_diversion: {
      title: 'Fire Diversion',
      text: 'You lit the northern brush with the lighter. The loggers shouted and ran toward the flames. You slipped through the middle of the camp — and grabbed a food bag on the way out.\n\nA lighter, so obviously useful for fire, opened the path in the most unexpected way.',
      choices: ['Keep running'],
    },
    loggers_sneak: {
      title: 'Successful Bypass',
      text: 'You belly-crawled around the camp. The loggers\' cut trail was visible. Following it picked up your pace.',
      choices: ['Keep moving along the trail'],
    },
    tribe_encounter: {
      title: 'Indigenous People',
      text: 'The owner of the tracks appeared. Two indigenous people armed with spears surrounded you. One move decides this.',
      choices: [
        'Slowly raise your hands to show you\'re harmless',
        'Take out the lighter and show them the flame',
        'Look for a chance and run',
      ],
      requireDescs: [null, 'No lighter', null],
    },
    tribe_peace: {
      title: 'Trust',
      text: 'After a long silence, the indigenous person lowered their spear. They brought you to the village and gave you food and water. Next morning, they pointed you in the right direction.',
      choices: ['Head in the direction they showed'],
    },
    tribe_gift: {
      title: 'Gift of Fire',
      text: 'When you handed over the lighter their eyes lit up. They laughed and welcomed you warmly. You got food and directions, and rested for the night.',
      choices: ['Set out'],
    },
    tribe_run: {
      title: 'Escape',
      text: 'You ran. A spear grazed your head. The sounds faded — but you lost your bearings. It took half a day to find the river again.',
      choices: ['Follow the river downstream'],
    },
    researcher_event: {
      title: 'Unexpected Researchers',
      text: 'Dragging your exhausted body forward, you met two men at the jungle\'s edge.\n\nOne was an energetic foreigner muttering to himself about distributed networks. The other said little but had sharp eyes. Their packs contained satellite equipment.\n\n"I\'m Nikos. This is Cheng." A brief introduction, then without another word they handed you a slip of paper with GPS coordinates.\n\n"Six hours in that direction and you\'ll hit a road."\n\nYou asked how they ended up here — but they just smiled and disappeared into the jungle.',
      choices: ['Follow the coordinates'],
    },
    day4_final: {
      title: 'Final Day',
      text: 'Fourth afternoon. The jungle opens. A road and vehicles are visible in the distance. Squeeze out every last drop of strength.',
      choices: [
        'Sprint to the road with everything you have',
        'Send a smoke signal',
        'Shout as loud as you can',
        'Use the bottle to reflect sunlight and signal',
      ],
      requireDescs: [null, 'No lighter', null, 'No bottle'],
    },
    success_run: {
      title: 'Full Sprint',
      text: 'You poured every last bit of energy into the run. You hit the road. A passing truck stopped.',
      endText: 'Survived four days in the Amazon jungle.',
    },
    success_signal: {
      title: 'Smoke Signal',
      text: 'You gathered dry leaves and made smoke. Thirty minutes later someone came running from the road.',
      endText: 'Survived four days in the Amazon jungle.',
    },
    success_shout: {
      title: 'A Cry',
      text: 'You shouted until your voice gave out. A car on the road stopped and someone got out.',
      endText: 'Survived four days in the Amazon jungle.',
    },
    success_mirror: {
      title: 'Reflected Signal',
      text: 'You angled the bottle\'s smooth surface to catch and reflect sunlight. A vehicle on the road stopped and the driver walked toward you.\n\nThe bottle came through once more in an unexpected role.',
      endText: 'Survived four days in the Amazon jungle. The bottle was useful to the very end.',
    },
  },
};
