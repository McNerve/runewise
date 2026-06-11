/**
 * Structurally faithful OSRS-wiki page fixtures for layout QA. Each mimics
 * the real MediaWiki HTML shapes (switch infoboxes with display:none
 * variants, lighttable drop tables, questdetails, tabbers, galleries,
 * hatnotes, math, rowspan/colspan tables) that the article pipeline must
 * survive without JS or wiki CSS.
 */

const P = (t) => `<p>${t}</p>`;
const H2 = (t) => `<div class="mw-heading2"><h2>${t}</h2><span class="mw-editsection">[edit]</span></div>`;
const H3 = (t) => `<div class="mw-heading3"><h3>${t}</h3></div>`;
const row = (l, v) => `<tr><th>${l}</th><td>${v}</td></tr>`;
const wrap = (body) => `<div class="mw-parser-output">${body}</div>`;

// Switch infobox: ALL versions present in HTML; wiki JS hides the inactive
// ones via display:none. This is the shape that broke production.
function switchInfobox(name, versions) {
  const buttons = versions.map((v, i) =>
    `<span class="button${i === 0 ? " button-selected" : ""}" data-switch-index="${i + 1}">${v.label}</span>`).join("");
  const cell = (key) => versions.map((v, i) =>
    `<span data-attr-param="${key}"${i > 0 ? ' style="display:none"' : ""}>${v[key] ?? ""}</span>`).join("");
  return `<table class="infobox infobox-monster infobox-switch">
<caption>${name}</caption>
<tr><td colspan="2"><div class="infobox-buttons">${buttons}</div></td></tr>
<tr><td colspan="2" class="infobox-image">${versions.map((v, i) =>
    `<span${i > 0 ? ' style="display:none"' : ""}><img src="/images/${v.image}" width="120" height="100"></span>`).join("")}</td></tr>
${row("Combat level", cell("combat"))}
${row("Max hit", cell("maxhit"))}
${row("Released", '<a href="/w/8_January">8 January</a> <a href="/w/2015">2015</a> <small>(<a href="/w/Update">Update</a>)</small>')}
</table>`;
}

const lighttable = `<table class="wikitable lighttable sortable">
<tr><th></th><th>Item</th><th>Quantity</th><th>Rarity</th><th>Price</th></tr>
<tr class="table-bg-green"><td><img src="/images/Big_bones.png" width="24"></td><td><a href="/w/Big_bones">Big bones</a></td><td>1</td><td data-sort-value="1">Always</td><td>284</td></tr>
<tr class="table-bg-yellow"><td><img src="/images/Rune_longsword.png" width="24"></td><td><a href="/w/Rune_longsword">Rune longsword</a></td><td>1</td><td data-sort-value="0.03125">1/32</td><td>18,521</td></tr>
<tr class="table-bg-orange"><td><img src="/images/Dragon_med_helm.png" width="24"></td><td><a href="/w/Dragon_med_helm">Dragon med helm</a></td><td>1</td><td data-sort-value="0.0078125">1/128</td><td>59,021</td></tr>
<tr class="table-bg-red"><td><img src="/images/Draconic_visage.png" width="24"></td><td><a href="/w/Draconic_visage">Draconic visage</a></td><td>1</td><td data-sort-value="0.0002">1/5,000</td><td>4,182,220</td></tr>
</table>`;

const questDetails = `<table class="wikitable questdetails">
<tr><th class="questdetails-header">Start point</th><td><img src="/images/Quest_point_icon.png" width="16"> Talk to <a href="/w/Alec_Kincade">Alec Kincade</a> outside the <a href="/w/Myths%27_Guild">Myths' Guild</a>.</td></tr>
<tr><th class="questdetails-header">Official difficulty</th><td>Grandmaster</td></tr>
<tr><th class="questdetails-header">Requirements</th><td><ul>
<li>200 <a href="/w/Quest_points">Quest points</a></li>
<li><img src="/images/Magic_icon.png" width="16"> 75 <a href="/w/Magic">Magic</a></li>
<li><img src="/images/Smithing_icon.png" width="16"> 70 <a href="/w/Smithing">Smithing</a></li>
<li>Completion of the following quests:<ul>
<li><a href="/w/Legends%27_Quest">Legends' Quest</a></li>
<li><a href="/w/Dream_Mentor">Dream Mentor</a><ul><li><a href="/w/Lunar_Diplomacy">Lunar Diplomacy</a></li></ul></li>
</ul></li>
</ul></td></tr>
<tr><th class="questdetails-header">Items required</th><td><ul><li>3 <a href="/w/Molten_glass">molten glass</a></li><li>An <a href="/w/Axe">axe</a></li></ul></td></tr>
<tr><th class="questdetails-header">Enemies to defeat</th><td><a href="/w/Vorkath">Vorkath</a> (level 392), <a href="/w/Galvek">Galvek</a> (level 608)</td></tr>
</table>`;

const moneyTable = `<table class="wikitable sortable">
<tr><th>Method</th><th>Hourly profit</th><th>Skills</th><th>Category</th></tr>
<tr><td><a href="/w/Money_making_guide/Killing_Vorkath">Killing Vorkath</a></td><td>3,847,000</td><td>90+ combat</td><td>Combat</td></tr>
<tr><td><a href="/w/Money_making_guide/Blast_furnace">Smithing runite bars at Blast Furnace</a></td><td>1,012,000</td><td>85 Smithing</td><td>Skilling</td></tr>
<tr><td><a href="/w/Money_making_guide/Pickpocketing_elves">Pickpocketing elves</a></td><td>2,940,000</td><td>85 Thieving</td><td>Thieving</td></tr>
</table>`;

const tabber = `<div class="tabber">
<div class="tabbertab" title="Melee"><p>Use a <a href="/w/Zamorakian_hasta">Zamorakian hasta</a> with full obsidian. Pray Piety and flick to Protect from Magic for the dragonfire phases.</p></div>
<div class="tabbertab" title="Ranged"><p>The <a href="/w/Toxic_blowpipe">blowpipe</a> with dragon darts is best in slot. Stand at distance to avoid melee.</p></div>
<div class="tabbertab" title="Magic"><p>Not recommended — Vorkath has very high magic defence.</p></div>
</div>`;

const gallery = `<ul class="gallery mw-gallery-traditional">
<li class="gallerybox"><div class="thumb"><img src="/images/Barrows_top.png" width="120"></div><div class="gallerytext"><p>The Barrows mounds</p></div></li>
<li class="gallerybox"><div class="thumb"><img src="/images/Barrows_tunnel.png" width="120"></div><div class="gallerytext"><p>The tunnels beneath</p></div></li>
</ul>`;

const messagebox = `<table class="messagebox warning"><tr><td><b>Warning:</b> The Wilderness is a dangerous area where other players can attack you. Do not bring items you are not willing to lose.</td></tr></table>`;

const hatnote = `<div class="hatnote">This article is about the boss. For the pet, see <a href="/w/Vorki">Vorki</a>.</div>`;

const thumbFigure = `<div class="thumb tright"><div class="thumbinner"><img src="/images/Fishing_spot.png" width="180"><div class="thumbcaption">A fishing spot off the coast of Catherby</div></div></div>`;

const mathSpan = `<p>The max hit formula is <span class="mwe-math-element"><img class="mwe-math-fallback-image-inline" alt="\\lfloor 0.5 + E \\cdot (B+64)/640 \\rfloor" src="/images/math/abc.svg"></span> where E is effective strength.</p>`;

const coinsTpl = `<span class="coins coins-pos">1,284,302</span>`;

const transcript = `<div class="transcript collapsible"><b>Alec Kincade:</b> Welcome to the Myths' Guild!<br><b>Player:</b> What is this place?<br><b>Alec Kincade:</b> A haven for those who have proven themselves against the greatest of myths.</div>`;

const skillTraining = `${H3("Levels 1–15: Regular trees")}
${P('Cut <a href="/w/Tree">regular trees</a> around Lumbridge. Expect ~25 logs per hour banked.')}
<table class="wikitable"><tr><th>Level</th><th>Method</th><th>XP/hr</th></tr>
<tr><td>1–15</td><td>Regular trees</td><td>7,000</td></tr></table>
${H3("Levels 15–35: Oak trees")}
${P('Oaks at Draynor are the fastest. Power-chop and drop.')}
${H3("Levels 35–99: Teak trees")}
${P('1.5-tick teaks on Fossil Island reach 200k xp/hr with perfect inputs.')}`;

export const QA_PAGES = {
  "zulrah": { title: "Zulrah", html: wrap(`
${hatnote}
${switchInfobox("Zulrah", [
    { label: "Serpentine", combat: "725", maxhit: "41", image: "Zulrah_serpentine.png" },
    { label: "Magma", combat: "725", maxhit: "41 (45 with melee)", image: "Zulrah_magma.png" },
    { label: "Tanzanite", combat: "725", maxhit: "41", image: "Zulrah_tanzanite.png" },
  ])}
${P('<b>Zulrah</b> is a level 725 solo-only snake boss, fought at a shrine east of <a href="/w/Zul-Andra">Zul-Andra</a>.')}
${H2("Rotations")}
${P("Zulrah follows one of four fixed rotations, beginning with the serpentine form.")}
${H3("Rotation 1")}${P("Green → Red → Blue → Green (melee) → Blue …")}
${H3("Rotation 2")}${P("Green → Blue → Red → Green …")}
${H2("Drops")}
${lighttable}
${H2("Update history")}
${P("Should not appear.")}`) },

  "dragon slayer ii": { title: "Dragon Slayer II", html: wrap(`
${questDetails}
${P('<b>Dragon Slayer II</b> is the sequel to <a href="/w/Dragon_Slayer_I">Dragon Slayer I</a>, and the most difficult quest in the game upon release.')}
${H2("Walkthrough")}
${H3("The map piece")}
${P('Talk to Alec Kincade. He directs you to the <a href="/w/Lithkren">Lithkren</a> vault.')}
<ol><li>Travel to the Digsite</li><li>Search the winch<ol><li>Use rope on winch</li><li>Climb down</li></ol></li><li>Defeat the guardian</li></ol>
${H3("Vorkath")}
${P("Equip your dragonfire protection before crossing the bridge.")}
${transcript}
${H2("Rewards")}
<ul><li>5 <a href="/w/Quest_points">Quest points</a></li><li>80,000 Smithing experience</li><li>Access to <a href="/w/Vorkath">Vorkath</a></li></ul>`) },

  "woodcutting": { title: "Woodcutting", html: wrap(`
<table class="infobox"><caption>Woodcutting</caption>${row("Members", "No")}${row("Release date", "4 January 2001")}</table>
${P('<b>Woodcutting</b> is a gathering skill that involves chopping down trees to obtain logs.')}
${H2("Training")}
${skillTraining}
${H2("Useful equipment")}
${P('The <a href="/w/Dragon_axe">dragon axe</a> requires 61 Woodcutting.')}`) },

  "money making guide": { title: "Money making guide", html: wrap(`
${P("This guide lists high-profit methods with their requirements. Profits are estimated from Grand Exchange prices and assume efficient play.")}
${H2("Combat")}
${moneyTable}
${H2("Skilling")}
${moneyTable}`) },

  "killing vorkath guide": { title: "Money making guide/Killing Vorkath", html: wrap(`
<table class="wikitable"><tr><th colspan="2">Killing Vorkath</th></tr>
${row("Profit", coinsTpl + " per hour")}
${row("Activity time", "Continuous")}
${row("Skills", '90+ <img src="/images/Ranged_icon.png" width="16"> Ranged')}
</table>
${P("Vorkath is one of the most profitable solo bosses in the game.")}
${H2("Inputs and outputs")}
<table class="wikitable"><tr><th>Inputs</th><th>Outputs</th></tr>
<tr><td>50 dragon darts (34,100)</td><td>2 × Superior dragon bones (38,936)</td></tr></table>`) },

  "wilderness": { title: "Wilderness", html: wrap(`
${messagebox}
${P('The <b>Wilderness</b> is a large player-versus-player area in the north of Gielinor.')}
${H2("Levels")}
${P("Wilderness levels increase as you go north, from 1 to 56. The level range of players who can attack you equals the Wilderness level plus your combat bracket.")}
${H2("Notable locations")}
<ul><li><a href="/w/Chaos_Temple">Chaos Temple</a></li><li><a href="/w/Revenant_Caves">Revenant Caves</a></li></ul>`) },

  "king black dragon": { title: "King Black Dragon", html: wrap(`
<table class="infobox infobox-monster"><caption>King Black Dragon</caption>
${row("Combat level", "276")}${row("Max hit", "25 (65 dragonfire)")}${row("Attack style", '<a href="/w/Melee">Melee</a>, <a href="/w/Dragonfire">Dragonfire</a>')}</table>
${P('The <b>King Black Dragon</b> is a three-headed dragon located in his lair accessible from the Wilderness.')}
${H2("Drops")}
${H3("100%")}
<table class="wikitable lighttable"><tr><th>Item</th><th>Quantity</th><th>Rarity</th></tr>
<tr class="table-bg-green"><td><a href="/w/Dragon_bones">Dragon bones</a></td><td>1</td><td>Always</td></tr></table>
${H3("Weapons and armour")}
${lighttable}`) },

  "barrows": { title: "Barrows", html: wrap(`
${P('<b>Barrows</b> is a combat minigame where players defeat the six Barrows brothers and loot their crypts.')}
${H2("The brothers")}
<table class="wikitable"><tr><th>Brother</th><th>Combat</th><th>Style</th><th>Equipment effect</th></tr>
<tr><td rowspan="2"><a href="/w/Dharok_the_Wretched">Dharok</a></td><td rowspan="2">115</td><td>Melee</td><td>Hits harder at low HP</td></tr>
<tr><td>—</td><td>Greataxe</td></tr>
<tr><td><a href="/w/Ahrim_the_Blighted">Ahrim</a></td><td>98</td><td>Magic</td><td>Lowers Strength</td></tr></table>
${H2("Gallery")}
${gallery}`) },

  "prayer": { title: "Prayer", html: wrap(`
<table class="infobox"><caption>Prayer</caption>${row("Members", "No")}</table>
${P('<b>Prayer</b> is a combat skill granting temporary stat boosts and protection effects.')}
${H2("Mechanics")}
${mathSpan}
${P("Prayer points drain at a rate determined by active prayers and prayer bonus.")}
${H2("Bone values")}
<table class="wikitable sortable"><tr><th>Bones</th><th>XP</th><th>Gilded altar</th><th>Chaos altar</th></tr>
<tr><td>Dragon bones</td><td>72</td><td>252</td><td>504</td></tr>
<tr><td>Superior dragon bones</td><td>150</td><td>525</td><td>1,050</td></tr></table>`) },

  "goblin": { title: "Goblin", html: wrap(`
${switchInfobox("Goblin", [
    { label: "Level 2", combat: "2", maxhit: "1", image: "Goblin_2.png" },
    { label: "Level 5", combat: "5", maxhit: "1", image: "Goblin_5.png" },
    { label: "Level 11", combat: "11", maxhit: "2", image: "Goblin_11.png" },
    { label: "Level 13", combat: "13", maxhit: "2", image: "Goblin_13.png" },
    { label: "Level 16", combat: "16", maxhit: "3", image: "Goblin_16.png" },
  ])}
${P('<b>Goblins</b> are low-level monsters found throughout Gielinor; a staple first kill for new adventurers.')}
${H2("Locations")}
<table class="wikitable"><tr><th>Location</th><th>Levels</th><th>Spawns</th></tr>
<tr><td>Lumbridge</td><td>2, 5</td><td>12</td></tr><tr><td>Goblin Village</td><td>2, 5, 11</td><td>20</td></tr></table>`) },

  "achievement diary": { title: "Achievement Diary", html: wrap(`
${P('<b>Achievement Diaries</b> are sets of tasks tied to regions of Gielinor, each with four tiers of difficulty and rewards.')}
${H2("Diaries")}
<dl><dt>Ardougne Diary</dt><dd>Tasks around East and West Ardougne.</dd>
<dt>Karamja Diary</dt><dd>The only diary with a gloves reward line.</dd></dl>
${H2("Rewards")}
${P("Each tier grants a reward item plus passive benefits.")}`) },

  "clue scroll (master)": { title: "Clue scroll (master)", html: wrap(`
<table class="infobox"><caption>Clue scroll (master)</caption>${row("Tradeable", "No")}</table>
${P('A <b>master clue scroll</b> is the highest tier of Treasure Trail.')}
${H2("Coordinates")}
<table class="wikitable"><tr><th>Clue</th><th>Location</th><th>Notes</th></tr>
<tr><td>01 degrees 30 minutes north, 08 degrees 11 minutes west</td><td>Karamja jungle</td><td>Bring a spade</td></tr></table>
${H2("Anagrams")}
<table class="wikitable"><tr><th>Anagram</th><th>Solution</th></tr><tr><td>SNAH</td><td><a href="/w/Hans">Hans</a></td></tr></table>`) },

  "chambers of xeric": { title: "Chambers of Xeric", html: wrap(`
${P('The <b>Chambers of Xeric</b> is a scalable raid beneath Mount Quidamortem.')}
${H2("Mechanics")}
${P("Points determine loot chance; deaths reduce points.")}
${H2("Rooms")}
${H3("Tekton")}${tabber}
${H3("Vespula")}${P("Kill the grubs to keep the portal damage manageable.")}
${H3("Ice demon")}${P("Light kindling with a fire spell to thaw the demon.")}
${H2("Rewards")}
${lighttable}
${H2("Gallery")}
${gallery}`) },

  "fishing spot": { title: "Fishing spot", html: wrap(`
${thumbFigure}
${P('A <b>fishing spot</b> is an interactable point where players can catch fish. Spots periodically move along the shoreline.')}
${H2("Types")}
<table class="wikitable"><tr><th>Option</th><th>Fish</th><th>Level</th></tr>
<tr><td>Net</td><td>Shrimps, anchovies</td><td>1</td></tr>
<tr><td>Harpoon</td><td>Tuna, swordfish</td><td>35</td></tr></table>`) },

  "whip (disambiguation)": { title: "Whip (disambiguation)", html: wrap(`
${P('<b>Whip</b> may refer to:')}
<ul><li><a href="/w/Abyssal_whip">Abyssal whip</a>, a weapon dropped by abyssal demons</li>
<li><a href="/w/Abyssal_tentacle">Abyssal tentacle</a>, its kraken-upgraded variant</li></ul>`) },

  "poll 81": { title: "Poll 81", html: wrap(`
${P("This poll opened 1 May 2026 and closed 8 May 2026. All questions required a 70% majority to pass.")}
${H2("Questions")}
<table class="wikitable"><tr><th>Question</th><th>Yes</th><th>No</th><th>Result</th></tr>
<tr><td>Should we add the proposed Sailing skill?</td><td>71.3%</td><td>28.7%</td><td>Passed</td></tr></table>`) },

  "grand exchange": { title: "Grand Exchange", html: wrap(`
${hatnote}
${P('The <b>Grand Exchange</b> is a trading system allowing players to buy and sell nearly every tradeable item.')}
${H2("Buying limits")}
${P("Each item has a four-hour buy limit; popular consumables allow thousands while rare equipment may be capped at 8.")}
${H2("Taxes")}
${P("A 2% tax applies to sales above 50 coins, funding item sinks.")}`) },

  "lumbridge": { title: "Lumbridge", html: wrap(`
<table class="infobox"><caption>Lumbridge</caption>${row("Released", "4 January 2001")}${row("Music", '<a href="/w/Harmony">Harmony</a>, <a href="/w/Yesteryear">Yesteryear</a>')}</table>
${P('<b>Lumbridge</b> is the starting town for new players, situated on the River Lum.')}
${H2("Features")}
<ul><li>Lumbridge Castle</li><li>The church of Saradomin</li><li>Combat tutors</li></ul>`) },

  "abyssal demon": { title: "Abyssal demon", html: wrap(`
<table class="infobox infobox-monster"><caption>Abyssal demon</caption>
${row("Combat level", "124")}${row("Slayer level", "85")}${row("Slayer XP", "150")}</table>
${P('<b>Abyssal demons</b> are Slayer monsters requiring 85 Slayer, famous for dropping the <a href="/w/Abyssal_whip">abyssal whip</a>.')}
${H2("Drops")}
${lighttable}`) },

  "tutorial island": { title: "Tutorial Island", html: wrap(`
${P('<b>Tutorial Island</b> teaches new players the basics of the game before they arrive in Lumbridge.')}
${H2("Instructors")}
<table class="wikitable"><tr><th>Instructor</th><th>Teaches</th></tr>
<tr><td>Survival Expert</td><td>Fishing, firemaking, cooking</td></tr>
<tr><td>Master Chef</td><td>Bread baking</td></tr></table>`) },

  "raids overview": { title: "Raids", html: wrap(`
${P('<b>Raids</b> are large group PvM encounters with scaling difficulty and unique reward pools.')}
${H2("Comparison")}
<table class="wikitable sortable"><tr><th>Raid</th><th>Team size</th><th>Difficulty</th><th>Notable uniques</th></tr>
<tr><td><a href="/w/Chambers_of_Xeric">Chambers of Xeric</a></td><td>1–100</td><td>High</td><td>Twisted bow</td></tr>
<tr><td><a href="/w/Theatre_of_Blood">Theatre of Blood</a></td><td>1–5</td><td>Very high</td><td>Scythe of vitur</td></tr>
<tr><td><a href="/w/Tombs_of_Amascut">Tombs of Amascut</a></td><td>1–8</td><td>Scaling</td><td>Tumeken's shadow</td></tr></table>`) },

  "castle wars": { title: "Castle Wars", html: wrap(`
${P('<b>Castle Wars</b> is a team-based capture-the-flag minigame.')}
${H2("Rewards")}
<table class="wikitable"><tr><th>Item</th><th>Tickets</th></tr>
<tr><td>Decorative sword</td><td>500</td></tr></table>
${H2("Strategy")}
${P("Defenders should barricade the underground route early.")}`) },
};
