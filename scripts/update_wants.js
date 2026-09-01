const fs = require('fs');
const https = require('https');
const cheerio = require('cheerio');

const FALLBACK_VILLAGERS = [
  { name: "Ashura", loc: "Kilima Tavern", wants: [{name: "Sweet Leaf", love: false}, {name: "Kilima Catfish", love: false}, {name: "Fish Stew", love: true}, {name: "Celebration Cake", love: true}] },
  { name: "Auni", loc: "Tavern / Kilima Fields", wants: [{name: "Ship Fragments", love: false}, {name: "Garden Mantis", love: false}, {name: "Firebreathing Dragonfly", love: true}, {name: "Blueberry Pie", love: true}] },
  { name: "Badruu", loc: "Daiya Family Farm", wants: [{name: "Potato Seed", love: false}, {name: "HydratePro Fertilizer", love: false}, {name: "Batterfly Beans", love: true}, {name: "Rice 'n Beans", love: true}] },
  { name: "Caleri", loc: "Library", wants: [{name: "Crystal Lake Lotus", love: false}, {name: "Heat Root", love: false}, {name: "Bahari Glowbug", love: true}, {name: "Lotus Leaf Tea", love: true}] },
  { name: "Chayne", loc: "Apothecary", wants: [{name: "Tomato", love: false}, {name: "Wheat Seed", love: false}, {name: "Candied Kopaa Nuts", love: true}, {name: "Cream of Mushroom Soup", love: true}] },
  { name: "Delaila", loc: "Daiya Family Farm", wants: [{name: "Channel Catfish", love: false}, {name: "QualityUp Fertilizer", love: false}, {name: "Stalking Catfish", love: true}, {name: "Breakfast Skillet", love: true}] },
  { name: "Einar", loc: "Fisherman's Lagoon", wants: [{name: "Silver Salmon", love: false}, {name: "Spineshell Crab", love: false}, {name: "Charged Cardinal", love: true}, {name: "Long Nosed Unicorn Fish", love: true}] },
  { name: "Elouisa", loc: "Kilima Village", wants: [{name: "Ship Fragments", love: false}, {name: "Bahari Bee", love: false}, {name: "Raspberry Beetle", love: true}, {name: "Ancient Amber Beetle", love: true}] },
  { name: "Eshe", loc: "Mayor's Estate", wants: [{name: "Fur", love: false}, {name: "Silk", love: false}, {name: "Petit Fives", love: true}, {name: "Gold Ore", love: true}] },
  { name: "Hassian", loc: "Kilima Outskirts", wants: [{name: "Congee", love: false}, {name: "Elder Sernuk Antlers", love: false}, {name: "Azure Chapaa Tail", love: true}, {name: "Eleroo Eel", love: true}] },
  { name: "Hekla", loc: "Mirror Pond Ruins", wants: [{name: "Grilled Fish", love: false}, {name: "Fried Catfish Dinner", love: false}, {name: "Dawnspur Tea", love: true}, {name: "Celebration Cake", love: true}] },
  { name: "Hodari", loc: "Bahari Bay", wants: [{name: "Copper Ore", love: false}, {name: "Copper Bar", love: false}, {name: "Jadium Ore", love: true}, {name: "Steak Dinner", love: true}] },
  { name: "Jel", loc: "Tailor Shop", wants: [{name: "Barracuda", love: false}, {name: "Lunar Fairy Moth", love: false}, {name: "Midnight Floatfish", love: true}, {name: "Jewelled Mantis", love: true}] },
  { name: "Jina", loc: "Mirror Pond Ruins", wants: [{name: "Grilled Mushroom", love: false}, {name: "Glass Pane", love: false}, {name: "Radiant Sunfish", love: true}, {name: "Cream of Mushroom Soup", love: true}] },
  { name: "Kenli", loc: "Town Hall", wants: [{name: "Chapaa Meat", love: false}, {name: "Striped Chapaa Tail", love: false}, {name: "Azure Chapaa Tail", love: true}, {name: "Muujin Bahari", love: true}] },
  { name: "Kenyatta", loc: "Town Hall", wants: [{name: "Garden Mantis", love: false}, {name: "Pickled Onions", love: false}, {name: "Lake Shark", love: true}, {name: "Meaty Stir Fry", love: true}] },
  { name: "Nai'o", loc: "Daiya Family Farm", wants: [{name: "Waterlogged Boot", love: false}, {name: "Fish Stew", love: false}, {name: "Apple Tree Seed", love: true}, {name: "Fruit Smoothie Bowl", love: true}] },
  { name: "Najuma", loc: "Bahari Bay Workshop", wants: [{name: "Knapweed", love: false}, {name: "Garden Snail", love: false}, {name: "Ancient Wood Plank", love: true}, {name: "Blueberry Pie", love: true}] },
  { name: "Reth", loc: "Kilima Tavern", wants: [{name: "Spice Sprouts", love: false}, {name: "Largemouth Bass", love: false}, {name: "Kopaa Nuts", love: true}, {name: "Palian Onion Soup", love: true}] },
  { name: "Sifuu", loc: "Blacksmith Shop", wants: [{name: "Muujin Meat", love: false}, {name: "Pickled Carrots", love: false}, {name: "Beans On Toast", love: true}, {name: "Jadium Ore", love: true}] },
  { name: "Subira", loc: "Inn (Upstairs)", wants: [{name: "Potato", love: false}, {name: "Grilled Oyster", love: false}, {name: "Ogopuu Skin", love: true}, {name: "Spitfire Cicada", love: true}] },
  { name: "Tamala", loc: "Bahari Woods", wants: [{name: "Common Field Cricket", love: false}, {name: "Garden Millipede", love: false}, {name: "Palian Betta", love: true}, {name: "Ancient Amber Beetle", love: true}] },
  { name: "Tau", loc: "Village / Farm", wants: [{name: "Trout Dinner", love: false}, {name: "Heartwood Plank", love: false}, {name: "Lantern Ashwood", love: true}, {name: "Apple", love: true}] },
  { name: "Tish", loc: "Furniture Store", wants: [{name: "Sundrop Lily", love: false}, {name: "Heartwood Plank", love: false}, {name: "Ashwood Plank", love: true}, {name: "Jadium Bar", love: true}] },
  { name: "Zeki", loc: "General Store", wants: [{name: "Silvery Minnow", love: false}, {name: "Silk", love: false}, {name: "Bronze Bluegill", love: true}, {name: "Black Pearl", love: true}] }
];

function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => reject(err));
  });
}

async function run() {
  console.log('Fetching weekly wants...');
  let villagers = [];

  try {
    const html = await fetchHTML('https://paliapedia.com/tools/weekly-wants');
    const $ = cheerio.load(html);

    // Parse HTML structure
    $('.villager-row, .card, [data-villager]').each((i, el) => {
      const name = $(el).find('.villager-name, h3').first().text().trim();
      const loc = $(el).find('.villager-loc, .location').first().text().trim() || 'Kilima Village';
      const wants = [];

      $(el).find('.want-badge, .item-slot, .gift-item').each((j, itemEl) => {
        const itemName = $(itemEl).text().trim();
        const isLove = $(itemEl).hasClass('love') || $(itemEl).find('.heart-icon').length > 0;
        if (itemName) wants.push({ name: itemName, love: isLove });
      });

      if (name && wants.length > 0) {
        villagers.push({ name, loc, wants });
      }
    });
  } catch (err) {
    console.warn('Scraping encountered an error, falling back to cached seed list:', err.message);
  }

  const finalVillagers = villagers.length > 0 ? villagers : FALLBACK_VILLAGERS;

  const data = {
    updatedAt: new Date().toISOString(),
    villagers: finalVillagers
  };

  fs.writeFileSync('wants.json', JSON.stringify(data, null, 2));
  console.log(`wants.json generated with ${finalVillagers.length} villagers.`);
}

run();
