// Fødevareliste med histamin-vurdering.
//
// Vurderingerne er en vejledning sammensat ud fra offentligt tilgængelige
// lavhistamin-lister – primært inspireret af SIGHI-listen (Swiss Interest Group
// Histamine Intolerance). Individuel tolerance varierer meget.
//
// Skala:
//   0 = Tåles som regel godt
//   1 = Små mængder er ofte ok – vær opmærksom
//   2 = Undgå under forsøget
//   3 = Undgå helt under forsøget
//
// Flag:
//   H = højt histaminindhold
//   F = histamin dannes hurtigt – friskhed er afgørende
//   A = andre biogene aminer (fx tyramin)
//   L = kan frigøre kroppens eget histamin ("liberator")
//   B = kan hæmme DAO, enzymet der nedbryder histamin

export const RATINGS = [
  { r: 0, label: 'Tåles godt', short: 'OK', desc: 'Tåles som regel godt. Spis frit – så frisk som muligt.' },
  { r: 1, label: 'Små mængder', short: 'Lidt', desc: 'Små mængder er ofte ok. Brug sparsomt under forsøget og hold øje med reaktioner.' },
  { r: 2, label: 'Undgå', short: 'Undgå', desc: 'Tåles dårligt af mange. Undgå under de 14 dage.' },
  { r: 3, label: 'Undgå helt', short: 'Nej', desc: 'Tåles meget dårligt af de fleste med histaminfølsomhed. Undgå helt under forsøget.' },
];

export const FLAGS = {
  H: { label: 'Højt histamin', desc: 'Indeholder i sig selv meget histamin.' },
  F: { label: 'Friskhed afgørende', desc: 'Histamin dannes hurtigt, når varen står. Køb frisk eller frossen, og spis hurtigt.' },
  A: { label: 'Andre aminer', desc: 'Indeholder andre biogene aminer (fx tyramin), der konkurrerer om samme nedbrydning.' },
  L: { label: 'Frigører histamin', desc: 'Kan få kroppen til at frigive sit eget histamin (liberator).' },
  B: { label: 'Hæmmer DAO', desc: 'Kan hæmme DAO-enzymet, som nedbryder histamin i tarmen.' },
};

export const CATEGORIES = [
  { id: 'kod', label: 'Kød & fjerkræ', icon: '🍗' },
  { id: 'fisk', label: 'Fisk & skaldyr', icon: '🐟' },
  { id: 'mejeri', label: 'Mejeri & æg', icon: '🥛' },
  { id: 'gront', label: 'Grøntsager', icon: '🥕' },
  { id: 'frugt', label: 'Frugt & bær', icon: '🍏' },
  { id: 'korn', label: 'Korn, brød & pasta', icon: '🍞' },
  { id: 'baelg', label: 'Bælgfrugter & soja', icon: '🌱' },
  { id: 'nodder', label: 'Nødder & kerner', icon: '🌰' },
  { id: 'krydderi', label: 'Krydderier & urter', icon: '🌿' },
  { id: 'sauce', label: 'Olie, saucer & bagning', icon: '🧂' },
  { id: 'sod', label: 'Sødt & snacks', icon: '🍬' },
  { id: 'drikke', label: 'Drikkevarer', icon: '🥤' },
  { id: 'andet', label: 'Færdigmad & andet', icon: '🥡' },
];

const CAT_TO_SHOP = {
  kod: 'kod', fisk: 'kod', mejeri: 'mejeri', gront: 'gront', frugt: 'gront', korn: 'kolonial',
  baelg: 'kolonial', nodder: 'kolonial', krydderi: 'krydderi', sauce: 'kolonial', sod: 'kolonial',
  drikke: 'drikke', andet: 'andet',
};

// f(id, navn, kategori, vurdering, flag, note, ekstra)
// ekstra: { alias: 'søgeord', alt: 'alternativ', shop: 'butiksafdeling', staple: true }
const f = (id, name, cat, r, flags = '', note = '', extra = {}) => ({
  id, name, cat, r, flags, note, ...extra, shop: extra.shop || CAT_TO_SHOP[cat],
});

const FRESH_MEAT = 'Frisk eller frosset kød tåles godt. Køb det så frisk som muligt, tilbered det samme dag eller frys det straks.';

export const FOODS = [
  // ---------- Kød & fjerkræ ----------
  f('kyllingebryst', 'Kyllingebryst', 'kod', 0, 'F', FRESH_MEAT, { alias: 'kylling fjerkræ' }),
  f('kyllingelaar', 'Kyllingelår / -overlår', 'kod', 0, 'F', FRESH_MEAT, { alias: 'kylling fjerkræ' }),
  f('hel-kylling', 'Hel kylling', 'kod', 0, 'F', FRESH_MEAT, { alias: 'kylling fjerkræ' }),
  f('kyllingefars', 'Hakket kylling (kyllingefars)', 'kod', 1, 'F', 'Hakket kød danner histamin hurtigere end hele stykker. Brug samme dag som købt, eller frys straks.', { alias: 'fars' }),
  f('kalkunbryst', 'Kalkun (bryst/filet)', 'kod', 0, 'F', FRESH_MEAT, { alias: 'fjerkræ' }),
  f('oksekoed', 'Oksekød (bøf, steg, culotte)', 'kod', 0, 'F', FRESH_MEAT + ' Undgå "dry-aged"/længe modnet kød.', { alias: 'okse bøf entrecote' }),
  f('hakket-okse-frisk', 'Hakket oksekød – frisk/frosset', 'kod', 0, 'F', 'Hakket samme dag hos slagteren, eller fra frost. Tilbered samme dag som det er hakket/optøet.', { alias: 'fars hakket kød oksefars' }),
  f('hakket-okse-koel', 'Hakket kød fra køledisken', 'kod', 1, 'F', 'Pakket fars har ofte stået nogle dage. Vælg den længste holdbarhed, brug den samme dag, eller køb frost.', { alias: 'fars hakket kød' }),
  f('svinekoed', 'Svinekød (mørbrad, kotelet, nakke)', 'kod', 1, 'F', 'Friskt svinekød tåles af mange, men nogle lister angiver det som muligt problematisk. Vælg gerne kylling/okse under forsøget, og hold øje.', { alias: 'gris svin mørbrad flæsk' }),
  f('hakket-svin', 'Hakket svinekød', 'kod', 1, 'F', 'Som svinekød – plus at fars danner histamin hurtigere. Brug samme dag eller frys straks.', { alias: 'fars' }),
  f('lam', 'Lammekød', 'kod', 0, 'F', FRESH_MEAT, { alias: 'lammekølle koteletter' }),
  f('kalv', 'Kalvekød', 'kod', 0, 'F', FRESH_MEAT),
  f('vildt', 'Vildt (hængt)', 'kod', 2, 'A F', 'Vildt hænger ofte og modnes, hvilket øger histamin.', { alias: 'hjort dådyr' }),
  f('toerret-skinke', 'Lufttørret skinke (serrano, parma)', 'kod', 3, 'H A', 'Modnet og tørret – meget histamin.', { alias: 'prosciutto pålæg', alt: 'Frisklavet kylling eller kalkun i skiver' }),
  f('salami', 'Salami, spegepølse, chorizo', 'kod', 3, 'H A', 'Fermenteret og modnet.', { alias: 'pålæg pepperoni', alt: 'Hjemmestegt kylling i skiver' }),
  f('bacon', 'Bacon', 'kod', 3, 'H A', 'Saltet og røget.'),
  f('roeget-koed', 'Røget pålæg / hamburgerryg', 'kod', 3, 'H A', 'Røget og lagret.', { alias: 'pålæg' }),
  f('kogt-skinke', 'Kogt skinke (pålæg)', 'kod', 2, 'F', 'Pålæg har stået længe efter tilberedning.', { alias: 'pålæg' }),
  f('kyllingepaalaeg', 'Kylling-/kalkunpålæg (købt)', 'kod', 2, 'F', 'Pålæg har stået længe. Lav hellere selv: steg et kyllingebryst og skær i skiver.', { alias: 'pålæg' }),
  f('poelser', 'Pølser (grill, wienerpølser)', 'kod', 2, 'A F', 'Forarbejdet kød – ofte med tilsætningsstoffer.', { alias: 'hotdog' }),
  f('leverpostej', 'Leverpostej', 'kod', 2, 'F', 'Indmad og forarbejdet.', { alias: 'pålæg' }),
  f('rullepoelse', 'Rullepølse', 'kod', 2, 'F', 'Forarbejdet og lagret.', { alias: 'pålæg' }),
  f('indmad', 'Indmad (lever, hjerte, nyrer)', 'kod', 2, 'F', 'Indmad fordærves hurtigt og indeholder ofte mere histamin.'),
  f('faerdige-frikadeller', 'Færdiglavede frikadeller/kødboller', 'kod', 2, 'F', 'Har stået efter tilberedning. Lav dem selv og frys.', { alias: 'kødboller' }),

  // ---------- Fisk & skaldyr ----------
  f('hvid-fisk-frossen', 'Hvid fisk, frossen (torsk, sej, kuller)', 'fisk', 0, 'F', 'Frosset straks efter fangst = lavt histamin. Optø i køleskabet og tilbered samme dag.', { alias: 'torsk sej kuller rødspætte fisk', shop: 'frost' }),
  f('laks-frossen', 'Laks, frossen', 'fisk', 0, 'F', 'Frossen laks er et godt valg. Optø i køleskabet og tilbered samme dag.', { alias: 'fisk', shop: 'frost' }),
  f('oerred-frossen', 'Ørred, frossen', 'fisk', 0, 'F', 'Som frossen laks.', { alias: 'fisk regnbueørred', shop: 'frost' }),
  f('fisk-koeledisk', 'Fisk fra køledisken / fiskehandler', 'fisk', 1, 'F', 'Fisk danner histamin meget hurtigt. Kun hvis den er helt frisk (fanget i går/i dag). Frost er sikrere.', { alias: 'frisk fisk laks torsk' }),
  f('fiskepinde', 'Fiskepinde / panerede fileter (frost)', 'fisk', 1, '', 'Frosset hurtigt, men forarbejdet. Tjek ingredienslisten.', { shop: 'frost' }),
  f('roeget-fisk', 'Røget fisk (røget laks, makrel)', 'fisk', 3, 'H', 'Røget og lagret fisk – meget histamin.', { alias: 'røget laks', alt: 'Frossen laks, bagt i ovn' }),
  f('makrel', 'Makrel (alle typer)', 'fisk', 3, 'H F', 'Makrel danner særligt hurtigt histamin.', { alias: 'makrel i tomat' }),
  f('tun-daase', 'Tun på dåse', 'fisk', 3, 'H', 'Tun er blandt de mest histaminrige fisk.', { alias: 'tunfisk', alt: 'Kogt kylling i salat' }),
  f('tun-frisk', 'Frisk tun', 'fisk', 2, 'H F', 'Tun danner meget hurtigt histamin.'),
  f('sild', 'Sild (marineret, krydder-, karry-)', 'fisk', 3, 'H', 'Marineret i eddike og lagret.', { alias: 'kryddersild marinerede' }),
  f('ansjoser', 'Ansjoser', 'fisk', 3, 'H', 'Saltet og modnet.'),
  f('sardiner', 'Sardiner', 'fisk', 3, 'H F'),
  f('rejer', 'Rejer', 'fisk', 2, 'L F', 'Skaldyr kan frigøre histamin og fordærves hurtigt.', { alias: 'skaldyr' }),
  f('muslinger', 'Muslinger, østers, krebsdyr', 'fisk', 3, 'L F', 'Skaldyr – undgå under forsøget.', { alias: 'skaldyr hummer krabbe' }),
  f('rogn', 'Rogn / kaviar / stenbiderrogn', 'fisk', 3, 'H'),
  f('surimi', 'Surimi / krabbestave', 'fisk', 2, '', 'Forarbejdet fisk med tilsætningsstoffer.'),
  f('fiskefrikadeller-koebte', 'Købte fiskefrikadeller / fiskefars', 'fisk', 2, 'F', 'Fars fordærves hurtigt. Lav selv af frossen fisk.', { alias: 'fiskefars' }),
  f('fiskesauce', 'Fiskesauce', 'fisk', 3, 'H', 'Fermenteret fisk.'),

  // ---------- Mejeri & æg ----------
  f('maelk', 'Mælk', 'mejeri', 0, '', 'Frisk mælk tåles godt.', { alias: 'sødmælk letmælk minimælk skummetmælk' }),
  f('laktosefri-maelk', 'Laktosefri mælk', 'mejeri', 0),
  f('floede', 'Fløde (piske-/madlavningsfløde)', 'mejeri', 0, '', 'Frisk fløde tåles godt.', { alias: 'piskefløde madlavningsfløde' }),
  f('smoer', 'Smør', 'mejeri', 0, '', '', { alias: 'smørbar' }),
  f('mascarpone', 'Mascarpone', 'mejeri', 0, '', 'Frisk, ikke-modnet ost.', { alias: 'ost friskost' }),
  f('flodeost', 'Flødeost naturel', 'mejeri', 0, '', 'Frisk ost. Vælg naturel uden krydderier.', { alias: 'ost friskost philadelphia buko' }),
  f('ricotta', 'Ricotta', 'mejeri', 0, '', 'Frisk ost.', { alias: 'ost friskost' }),
  f('hytteost', 'Hytteost', 'mejeri', 0, '', 'Frisk ost.', { alias: 'ost friskost cottage cheese' }),
  f('mozzarella', 'Mozzarella (frisk)', 'mejeri', 0, '', 'Frisk ost. Ikke "pizza-ost" i pose, som ofte er blandet med lagret ost.', { alias: 'ost friskost' }),
  f('kvark', 'Kvark', 'mejeri', 0, '', 'Frisk syrnet ost – tåles typisk godt.', { alias: 'ost friskost' }),
  f('creme-fraiche', 'Creme fraiche / cremefine', 'mejeri', 1, '', 'Syrnet. Små mængder tåles ofte – fløde er et sikrere valg.', { alias: 'creme fraiche' }),
  f('yoghurt', 'Yoghurt naturel', 'mejeri', 1, '', 'Syrnet med bakterier. Mange tåler det, men brug sparsomt under forsøget.', { alias: 'ymer a38 tykmælk' }),
  f('skyr', 'Skyr', 'mejeri', 1, '', 'Syrnet. Brug sparsomt under forsøget.'),
  f('kaernemaelk', 'Kærnemælk', 'mejeri', 1, '', 'Syrnet.'),
  f('kefir', 'Kefir', 'mejeri', 2, 'H', 'Fermenteret – mere histamin end yoghurt.'),
  f('feta', 'Feta', 'mejeri', 1, 'A', 'Modnes i lage. Små mængder tåles af nogle.', { alias: 'ost salatost' }),
  f('halloumi', 'Halloumi', 'mejeri', 1, '', 'Kun let modnet.', { alias: 'ost grilost' }),
  f('gede-friskost', 'Frisk gedeost', 'mejeri', 1, '', '', { alias: 'ost friskost' }),
  f('ung-ost', 'Ung skæreost (danbo, havarti, ung gouda)', 'mejeri', 2, 'H A', 'Selv ung ost er modnet nogle uger.', { alias: 'ost skiveost pålægsost mild ost' , alt: 'Flødeost, hytteost eller frisk mozzarella' }),
  f('lagret-ost', 'Lagret ost (parmesan, cheddar, gammel ost)', 'mejeri', 3, 'H A', 'Jo længere modning, jo mere histamin.', { alias: 'ost parmigiano grana pecorino emmentaler gruyere revet ost', alt: 'Mascarpone eller flødeost i saucen' }),
  f('skimmelost', 'Skimmelost (brie, camembert, blå)', 'mejeri', 3, 'H A', 'Modnet med skimmel.', { alias: 'ost gorgonzola danablu' }),
  f('aeggeblomme', 'Æggeblomme', 'mejeri', 0, '', 'Æggeblommen tåles godt.', { alias: 'æg blomme' }),
  f('aeg', 'Æg (hele, gennemstegte)', 'mejeri', 1, 'L', 'Især rå æggehvide kan frigøre histamin. Gennemkogte/stegte æg tåles af mange.', { alias: 'æggehvide' }),
  f('is', 'Flødeis (vanilje)', 'mejeri', 1, '', 'Vælg vaniljeis uden chokolade, nødder og jordbær.', { shop: 'frost' }),

  // ---------- Grøntsager ----------
  f('kartoffel', 'Kartofler', 'gront', 0, '', '', { alias: 'nye kartofler bagekartofler' }),
  f('soed-kartoffel', 'Søde kartofler', 'gront', 0),
  f('gulerod', 'Gulerødder', 'gront', 0),
  f('pastinak', 'Pastinak', 'gront', 0),
  f('persillerod', 'Persillerod', 'gront', 0),
  f('knoldselleri', 'Knoldselleri', 'gront', 0, '', '', { alias: 'selleri' }),
  f('bladselleri', 'Bladselleri', 'gront', 0, '', '', { alias: 'selleri stangselleri' }),
  f('roedbede', 'Rødbeder (friske)', 'gront', 0, '', 'Friske. Syltede rødbeder er i eddike – undgå.'),
  f('squash', 'Squash / courgette', 'gront', 0, '', '', { alias: 'zucchini' }),
  f('graeskar', 'Græskar (butternut, hokkaido)', 'gront', 0, '', '', { alias: 'butternut hokkaido' }),
  f('agurk', 'Agurk', 'gront', 0),
  f('broccoli', 'Broccoli', 'gront', 0),
  f('blomkaal', 'Blomkål', 'gront', 0),
  f('hvidkaal', 'Hvidkål', 'gront', 0, '', '', { alias: 'kål' }),
  f('spidskaal', 'Spidskål', 'gront', 0, '', '', { alias: 'kål' }),
  f('rodkaal', 'Rødkål (frisk)', 'gront', 0, '', 'Frisk rødkål er fint. Færdig rødkål på glas indeholder eddike – undgå.', { alias: 'kål' }),
  f('groenkaal', 'Grønkål', 'gront', 0, '', '', { alias: 'kål' }),
  f('rosenkaal', 'Rosenkål', 'gront', 0, '', '', { alias: 'kål' }),
  f('kinakaal', 'Kinakål / pak choi', 'gront', 0, '', '', { alias: 'kål pak choi' }),
  f('groenne-boenner', 'Grønne bønner', 'gront', 0, '', 'Tilberedte.', { alias: 'haricots verts' }),
  f('asparges', 'Asparges', 'gront', 0),
  f('porre', 'Porrer', 'gront', 0),
  f('loeg', 'Løg', 'gront', 0, '', 'Tåles af de fleste – især tilberedt.', { alias: 'gule løg skalotteløg', staple: true }),
  f('roedloeg', 'Rødløg', 'gront', 0, '', 'Tåles af de fleste.'),
  f('foraarsloeg', 'Forårsløg', 'gront', 0),
  f('hvidloeg', 'Hvidløg', 'gront', 0, '', '', { staple: true }),
  f('ingefaer', 'Ingefær (frisk)', 'gront', 0),
  f('salat', 'Salat (iceberg, romaine, hjertesalat)', 'gront', 0, '', '', { alias: 'salathoved' }),
  f('rucola', 'Rucola', 'gront', 0, '', '', { alias: 'salat' }),
  f('fennikel', 'Fennikel', 'gront', 0),
  f('radise', 'Radiser', 'gront', 0),
  f('majs', 'Majs (frisk/frossen)', 'gront', 0, '', 'Frossen eller frisk. Dåsemajs tåles af mange, men frost er sikrere.', { alias: 'majskolbe' }),
  f('artiskok', 'Artiskok', 'gront', 0),
  f('peberfrugt', 'Peberfrugt', 'gront', 1, '', 'Natskyggeplante. Små mængder tåles ofte.', { alias: 'paprika peberfrugter' }),
  f('champignon', 'Champignon', 'gront', 1, '', 'Kun helt friske. Svampe danner aminer, når de ældes.', { alias: 'svampe' }),
  f('shiitake', 'Andre svampe (shiitake, østershat m.fl.)', 'gront', 2, 'A', '', { alias: 'svampe' }),
  f('aerter', 'Ærter', 'gront', 1, '', 'Små mængder tåles ofte.', { alias: 'grønne ærter' }),
  f('rabarber', 'Rabarber', 'gront', 1),
  f('tomat', 'Tomat (også passata, ketchup, flåede)', 'gront', 3, 'H L', 'Tomat er en af de klassiske syndere – både histamin og liberator. Gælder også tomatpuré, passata og pizzasauce.', { alias: 'tomater cherrytomater passata tomatpure flåede', alt: 'Græskar- eller gulerodspuré som "rød" sauce' }),
  f('aubergine', 'Aubergine', 'gront', 3, 'H', '', { alias: 'eggplant' }),
  f('avocado', 'Avocado', 'gront', 3, 'H L', '', { alias: 'guacamole', alt: 'Hytteost eller mascarpone som cremet element' }),
  f('spinat', 'Spinat', 'gront', 3, 'H', 'Spinat indeholder meget histamin.', { alias: 'babyspinat', alt: 'Grønkål eller rucola' }),
  f('oliven', 'Oliven', 'gront', 2, 'H', 'Fermenteret/syltet.'),
  f('syltede-agurker', 'Syltede agurker, asier, pickles', 'gront', 3, 'H', 'Syltet i eddike.', { alias: 'pickles asier cornichoner' }),
  f('surkaal', 'Surkål / sauerkraut', 'gront', 3, 'H', 'Fermenteret.'),
  f('kimchi', 'Kimchi', 'gront', 3, 'H L', 'Fermenteret og stærk.'),
  f('chili-frisk', 'Chili (frisk)', 'gront', 2, 'L', 'Stærke krydderier kan forværre symptomer.', { alias: 'chili jalapeño' }),

  // ---------- Frugt & bær ----------
  f('aeble', 'Æble', 'frugt', 0, '', '', { alias: 'æbler' }),
  f('blaabaer', 'Blåbær', 'frugt', 0, '', '', { alias: 'bær' }),
  f('kirsebaer', 'Kirsebær (søde)', 'frugt', 0, '', '', { alias: 'bær' }),
  f('mango', 'Mango', 'frugt', 0),
  f('melon', 'Melon (honning-, cantaloupe)', 'frugt', 0),
  f('kaki', 'Kaki / sharon', 'frugt', 0),
  f('kokos', 'Kokos (frisk/tørret)', 'frugt', 0, '', '', { alias: 'kokosmel kokosflager' }),
  f('paere', 'Pære', 'frugt', 1, '', 'Tåles af mange, men nogle lister vurderer den lavere. Prøv lidt.', { alias: 'pærer' }),
  f('vandmelon', 'Vandmelon', 'frugt', 1),
  f('abrikos', 'Abrikos (frisk)', 'frugt', 1),
  f('fersken', 'Fersken / nektarin', 'frugt', 1, '', '', { alias: 'nektarin' }),
  f('vindruer', 'Vindruer', 'frugt', 1),
  f('solbaer', 'Solbær / ribs', 'frugt', 1, '', '', { alias: 'bær ribs' }),
  f('tranebaer', 'Tranebær', 'frugt', 1, '', '', { alias: 'bær' }),
  f('brombaer', 'Brombær', 'frugt', 1, '', '', { alias: 'bær' }),
  f('granataeble', 'Granatæble', 'frugt', 1),
  f('litchi', 'Litchi', 'frugt', 1),
  f('citron', 'Citron', 'frugt', 1, 'L', 'Lidt citronsaft som smagsgiver tåles af mange. Undgå store mængder.'),
  f('lime', 'Lime', 'frugt', 1, 'L', 'Som citron – lidt som smagsgiver.'),
  f('blomme', 'Blommer / svesker', 'frugt', 2, 'A', '', { alias: 'svesker' }),
  f('banan', 'Banan', 'frugt', 2, 'A', 'Indeholder andre aminer – især når den er moden.'),
  f('hindbaer', 'Hindbær', 'frugt', 2, 'L', '', { alias: 'bær' }),
  f('appelsin', 'Appelsin, mandarin, clementin', 'frugt', 2, 'L', 'Citrusfrugter kan frigøre histamin.', { alias: 'citrus mandarin clementin' }),
  f('grapefrugt', 'Grapefrugt', 'frugt', 2, 'L', '', { alias: 'citrus' }),
  f('toerret-frugt', 'Tørret frugt (rosiner, dadler, abrikoser)', 'frugt', 2, 'A', 'Koncentreret og ofte tilsat sulfit.', { alias: 'rosiner dadler figner tranebær tørrede' }),
  f('kiwi', 'Kiwi', 'frugt', 3, 'L'),
  f('jordbaer', 'Jordbær', 'frugt', 3, 'L', '', { alias: 'bær' }),
  f('ananas', 'Ananas', 'frugt', 3, 'L'),
  f('papaya', 'Papaya', 'frugt', 3, 'L'),

  // ---------- Korn, brød & pasta ----------
  f('ris', 'Ris (alle slags)', 'korn', 0, '', 'Kogte ris skal køles hurtigt ned, hvis de gemmes – og spises inden for et døgn.', { alias: 'jasminris basmati risottoris grødris' }),
  f('pasta', 'Pasta', 'korn', 0, '', '', { alias: 'spaghetti penne makaroni nudler' }),
  f('risnudler', 'Risnudler', 'korn', 0, '', '', { alias: 'nudler' }),
  f('hvedemel', 'Hvedemel', 'korn', 0, '', '', { alias: 'mel', staple: true }),
  f('speltmel', 'Speltmel', 'korn', 0, '', '', { alias: 'mel' }),
  f('havregryn', 'Havregryn', 'korn', 0, '', '', { alias: 'grød' }),
  f('quinoa', 'Quinoa', 'korn', 0),
  f('hirse', 'Hirse', 'korn', 0),
  f('boghvede', 'Boghvede', 'korn', 0),
  f('couscous', 'Couscous / bulgur', 'korn', 0, '', '', { alias: 'bulgur' }),
  f('polenta', 'Majsmel / polenta', 'korn', 0),
  f('majsstivelse', 'Majsstivelse (maizena)', 'korn', 0, '', '', { alias: 'maizena jævning', staple: true }),
  f('gaer', 'Gær (bagegær)', 'korn', 0, '', 'Bagt gær i brød er ok. Gærekstrakt er noget helt andet – undgå.', { shop: 'mejeri' }),
  f('lyst-broed', 'Lyst brød / boller (gærbagt)', 'korn', 0, '', 'Friskbagt gærbrød tåles godt. Frys brødet i skiver, så det er frisk.', { alias: 'franskbrød boller burgerboller pitabrød toastbrød', shop: 'brod' }),
  f('tortilla', 'Tortillas / wraps', 'korn', 0, '', 'Tjek ingredienslisten for konserveringsmidler.', { alias: 'wraps', shop: 'brod' }),
  f('riskager', 'Riskager / majskager', 'korn', 0),
  f('knaekbroed', 'Knækbrød (uden surdej)', 'korn', 0),
  f('rugbroed', 'Rugbrød', 'korn', 1, '', 'Dansk rugbrød er lavet med surdej (fermenteret). Mange tåler det, men vælg evt. gærbrød under forsøget.', { alias: 'rugbrød surdej', shop: 'brod' }),
  f('surdejsbroed', 'Surdejsbrød', 'korn', 1, '', 'Surdej er fermenteret.', { alias: 'surdej', shop: 'brod' }),
  f('hvedekim', 'Hvedekim', 'korn', 2, 'H'),

  // ---------- Bælgfrugter & soja ----------
  f('kikaerter', 'Kikærter', 'baelg', 1, '', 'Små mængder tåles ofte. Hummus indeholder også tahin og citron.', { alias: 'hummus' }),
  f('linser', 'Linser', 'baelg', 1),
  f('boenner-toerrede', 'Bønner (kidney, hvide, sorte)', 'baelg', 1, '', '', { alias: 'kidneybønner hvide bønner sorte bønner' }),
  f('edamame', 'Edamame / sojabønner', 'baelg', 2, 'L'),
  f('tofu', 'Tofu', 'baelg', 2, 'L'),
  f('sojadrik', 'Sojadrik', 'baelg', 2, 'L', '', { alias: 'sojamælk', shop: 'drikke' }),
  f('tempeh', 'Tempeh', 'baelg', 3, 'H', 'Fermenteret soja.'),
  f('miso', 'Miso', 'baelg', 3, 'H', 'Fermenteret soja.'),
  f('sojasauce', 'Sojasauce / tamari', 'baelg', 3, 'H', 'Fermenteret. Smag i stedet til med salt, ingefær, hvidløg og en smule honning.', { alias: 'soja teriyaki', alt: 'Salt + ingefær + hvidløg + lidt honning' }),

  // ---------- Nødder & kerner ----------
  f('macadamia', 'Macadamianødder', 'nodder', 0, '', '', { alias: 'nødder' }),
  f('kastanje', 'Kastanjer', 'nodder', 0, '', '', { alias: 'nødder' }),
  f('hoerfroe', 'Hørfrø', 'nodder', 0, '', '', { alias: 'kerner' }),
  f('chiafroe', 'Chiafrø', 'nodder', 0, '', '', { alias: 'kerner' }),
  f('mandler', 'Mandler', 'nodder', 1, '', '', { alias: 'nødder' }),
  f('paranoedder', 'Paranødder', 'nodder', 1, '', '', { alias: 'nødder' }),
  f('pinjekerner', 'Pinjekerner', 'nodder', 1, '', '', { alias: 'kerner' }),
  f('graeskarkerner', 'Græskarkerner', 'nodder', 1, '', '', { alias: 'kerner' }),
  f('solsikkekerner', 'Solsikkekerner', 'nodder', 1, '', '', { alias: 'kerner' }),
  f('sesam', 'Sesamfrø / tahin', 'nodder', 1, '', '', { alias: 'tahin kerner' }),
  f('hasselnoedder', 'Hasselnødder', 'nodder', 2, '', '', { alias: 'nødder' }),
  f('cashew', 'Cashewnødder', 'nodder', 2, '', '', { alias: 'nødder' }),
  f('pistacie', 'Pistacienødder', 'nodder', 2, '', '', { alias: 'nødder' }),
  f('valnoedder', 'Valnødder / pekannødder', 'nodder', 3, 'L', '', { alias: 'nødder pekan' }),
  f('peanuts', 'Jordnødder / peanutbutter', 'nodder', 3, 'L', '', { alias: 'nødder peanut butter jordnøddesmør' }),

  // ---------- Krydderier & urter ----------
  f('salt', 'Salt', 'krydderi', 0, '', '', { staple: true }),
  f('persille', 'Persille', 'krydderi', 0, '', 'Friske og tørrede krydderurter tåles generelt godt.', { alias: 'krydderurter', shop: 'gront' }),
  f('dild', 'Dild', 'krydderi', 0, '', '', { alias: 'krydderurter', shop: 'gront' }),
  f('purloeg', 'Purløg', 'krydderi', 0, '', '', { alias: 'krydderurter', shop: 'gront' }),
  f('basilikum', 'Basilikum', 'krydderi', 0, '', '', { alias: 'krydderurter', shop: 'gront' }),
  f('timian', 'Timian', 'krydderi', 0, '', '', { alias: 'krydderurter' }),
  f('rosmarin', 'Rosmarin', 'krydderi', 0, '', '', { alias: 'krydderurter' }),
  f('oregano', 'Oregano', 'krydderi', 0, '', '', { alias: 'krydderurter' }),
  f('koriander', 'Koriander (blade)', 'krydderi', 0, '', '', { alias: 'krydderurter', shop: 'gront' }),
  f('mynte', 'Mynte', 'krydderi', 0, '', '', { alias: 'krydderurter', shop: 'gront' }),
  f('salvie', 'Salvie / estragon', 'krydderi', 0, '', '', { alias: 'krydderurter estragon' }),
  f('laurbaerblad', 'Laurbærblade', 'krydderi', 0),
  f('gurkemeje', 'Gurkemeje', 'krydderi', 0, '', '', { alias: 'turmeric' }),
  f('kommen', 'Kommen', 'krydderi', 0),
  f('vanilje', 'Vanilje (stang/ægte)', 'krydderi', 0),
  f('peber', 'Sort/hvid peber', 'krydderi', 1, '', 'Lidt peber tåles af de fleste. Brug sparsomt under forsøget.', { alias: 'peber', staple: true }),
  f('paprika-pulver', 'Paprika (sød, pulver)', 'krydderi', 1),
  f('spidskommen', 'Spidskommen', 'krydderi', 1, '', '', { alias: 'cumin' }),
  f('kanel', 'Kanel', 'krydderi', 1),
  f('kardemomme', 'Kardemomme', 'krydderi', 1),
  f('muskatnod', 'Muskatnød', 'krydderi', 1),
  f('peberrod', 'Peberrod', 'krydderi', 1),
  f('chili-pulver', 'Chili, cayenne, chiliflager', 'krydderi', 2, 'L', '', { alias: 'cayennepeber' }),
  f('karry', 'Karry / garam masala / krydderiblandinger', 'krydderi', 2, 'L', 'Blandinger indeholder ofte chili og andre stærke krydderier. Lav selv med gurkemeje, ingefær og koriander.', { alias: 'curry garam masala taco krydderi' }),
  f('nelliker', 'Nelliker', 'krydderi', 2),
  f('sennep', 'Sennep', 'krydderi', 2, '', 'Indeholder eddike.'),

  // ---------- Olie, saucer & bagning ----------
  f('olivenolie', 'Olivenolie', 'sauce', 0, '', '', { staple: true }),
  f('rapsolie', 'Rapsolie / neutral olie', 'sauce', 0, '', '', { alias: 'solsikkeolie olie', staple: true }),
  f('kokosolie', 'Kokosolie', 'sauce', 0),
  f('kokosmaelk', 'Kokosmælk', 'sauce', 0, '', 'Vælg en uden for mange tilsætningsstoffer.'),
  f('honning', 'Honning', 'sauce', 0),
  f('sukker', 'Sukker', 'sauce', 0, '', '', { staple: true }),
  f('ahornsirup', 'Ahornsirup', 'sauce', 0),
  f('bagepulver', 'Bagepulver / natron', 'sauce', 0, '', '', { alias: 'natron' }),
  f('gelatine', 'Husblas / gelatine', 'sauce', 0),
  f('eddike-lys', 'Lys eddike (husholdnings-/æbleeddike)', 'sauce', 1, '', 'Destilleret eddike er den mildeste. Brug sparsomt.', { alias: 'eddike æbleeddike' }),
  f('vineddike', 'Vineddike (hvid/rød)', 'sauce', 2, 'H', '', { alias: 'eddike hvidvinseddike rødvinseddike' }),
  f('balsamico', 'Balsamico', 'sauce', 3, 'H', '', { alias: 'eddike balsamico' }),
  f('mayonnaise', 'Mayonnaise / remoulade', 'sauce', 2, '', 'Indeholder eddike og rå æg.', { alias: 'remoulade dressing' , alt: 'Dressing af mascarpone eller hytteost med purløg' }),
  f('ketchup', 'Ketchup / tomatsauce', 'sauce', 3, 'H L', '', { alias: 'tomat bbq sauce' }),
  f('pesto', 'Pesto (købt)', 'sauce', 3, 'H', 'Indeholder lagret ost. Lav selv af basilikum, olivenolie og hvidløg.'),
  f('bouillon', 'Bouillonterning / fond (købt)', 'sauce', 2, 'H', 'Indeholder ofte gærekstrakt og glutamat. Lav selv bouillon af kylling og grøntsager.', { alias: 'fond hønsebouillon grøntsagsbouillon' }),
  f('gaerekstrakt', 'Gærekstrakt (fx Marmite)', 'sauce', 3, 'H', 'Findes også i mange færdigprodukter.', { alias: 'marmite' }),
  f('worcestershire', 'Worcestershiresauce', 'sauce', 3, 'H'),
  f('hot-sauce', 'Hot sauce / sriracha / tabasco', 'sauce', 3, 'H L', '', { alias: 'sriracha tabasco chilisauce' }),
  f('glutamat', 'Glutamat (MSG, E621)', 'sauce', 2, '', 'Ikke histamin, men en kendt hovedpine-trigger hos nogle.', { alias: 'msg e621 atamon' }),

  // ---------- Sødt & snacks ----------
  f('popcorn', 'Popcorn (hjemmelavet)', 'sod', 0),
  f('hvid-chokolade', 'Hvid chokolade', 'sod', 1, '', 'Uden kakaomasse, men med tilsætningsstoffer.'),
  f('lakrids', 'Lakrids / vingummi', 'sod', 1, '', 'Farvestoffer og tilsætningsstoffer kan give reaktioner.', { alias: 'slik vingummi' }),
  f('chips', 'Chips (naturel)', 'sod', 1, '', 'Undgå varianter med krydderiblandinger.'),
  f('marcipan', 'Marcipan', 'sod', 1),
  f('chokolade', 'Chokolade (mørk og mælk)', 'sod', 3, 'A L', 'Kakao er både liberator og indeholder andre aminer.', { alias: 'chokolade kakao' }),
  f('kakao', 'Kakao / kakaopulver', 'sod', 3, 'A L', '', { alias: 'kakaomælk cocio' }),
  f('noeddecreme', 'Nøddecreme (Nutella)', 'sod', 3, 'A L', '', { alias: 'nutella' }),

  // ---------- Drikkevarer ----------
  f('vand', 'Vand / danskvand', 'drikke', 0, '', 'Drik rigeligt – dehydrering er en klassisk hovedpine-årsag.', { alias: 'danskvand mineralvand' }),
  f('urtete', 'Urtete (kamille, fennikel, pebermynte, rooibos)', 'drikke', 0, '', '', { alias: 'te rooibos kamillete pebermyntete' }),
  f('havredrik', 'Havredrik / risdrik / kokosdrik', 'drikke', 0, '', '', { alias: 'havremælk risdrik kokosdrik plantedrik' }),
  f('aeblejuice', 'Æblejuice / æblemost', 'drikke', 0),
  f('kaffe', 'Kaffe', 'drikke', 1, '', 'Mange tåler kaffe. Stop ikke brat, hvis du drikker meget – abstinenser giver selv hovedpine!', { alias: 'espresso cappuccino latte' }),
  f('mandeldrik', 'Mandeldrik', 'drikke', 1, '', '', { alias: 'mandelmælk' }),
  f('sort-te', 'Sort te', 'drikke', 2, 'B', 'Kan hæmme DAO.', { alias: 'te earl grey chai' }),
  f('groen-te', 'Grøn te / mate', 'drikke', 2, 'B', 'Kan hæmme DAO.', { alias: 'te matcha mate' }),
  f('cola', 'Cola / energidrik', 'drikke', 2, '', 'Koffein og tilsætningsstoffer.', { alias: 'energidrik red bull monster sodavand' }),
  f('appelsinjuice', 'Appelsinjuice / multijuice', 'drikke', 2, 'L', '', { alias: 'juice' }),
  f('alkoholfri-oel', 'Alkoholfri øl / vin', 'drikke', 2, 'H', 'Stadig fermenteret.'),
  f('spiritus', 'Klar spiritus (vodka, gin)', 'drikke', 2, 'B', 'Alkohol hæmmer DAO og øger tarmens optag af histamin.', { alias: 'vodka gin alkohol' }),
  f('roedvin', 'Rødvin', 'drikke', 3, 'H A B', 'Klassisk hovedpine-udløser: histamin + DAO-hæmning.', { alias: 'vin alkohol' }),
  f('hvidvin', 'Hvidvin / rosé / mousserende', 'drikke', 3, 'H B', '', { alias: 'vin champagne cava prosecco alkohol' }),
  f('oel', 'Øl', 'drikke', 3, 'H B', 'Fermenteret + alkohol.', { alias: 'alkohol' }),
  f('kombucha', 'Kombucha', 'drikke', 3, 'H', 'Fermenteret.'),

  // ---------- Færdigmad & andet ----------
  f('rester', 'Rester, der har stået i køleskab > 1 døgn', 'andet', 2, 'F', 'Histamin dannes i mad, der står – også i køleskabet. Køl hurtigt ned og spis inden for ca. et døgn – eller frys med det samme.', { alias: 'rester madpakke' }),
  f('faerdigretter', 'Færdigretter / take-away', 'andet', 2, '', 'Ukendt friskhed og ofte bouillon, tomat, ost eller sojasauce.', { alias: 'take away pizza sushi burger' }),
  f('daasemad', 'Dåsemad (kød/fisk)', 'andet', 2, 'H'),
  f('tilsaetning', 'Tilsætningsstoffer (benzoat, sulfit, farvestoffer)', 'andet', 1, 'L', 'Nogle konserverings- og farvestoffer (E2xx, E1xx) kan frigøre histamin. Vælg rene råvarer.', { alias: 'e-numre konserveringsmidler' }),
];

export const FOOD_BY_ID = Object.fromEntries(FOODS.map((x) => [x.id, x]));

export function ratingColor(r) {
  return ['var(--r0)', 'var(--r1)', 'var(--r2)', 'var(--r3)'][r] ?? 'var(--muted)';
}

const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

export function searchFoods(q, list = FOODS) {
  const n = norm(q.trim());
  if (!n) return list;
  const words = n.split(/\s+/);
  return list
    .map((x) => {
      const name = norm(x.name);
      const hay = `${name} ${norm(x.alias || '')}`;
      if (!words.every((w) => hay.includes(w))) return null;
      const tokens = hay.split(/[\s/(),–-]+/);
      const wordStart = words.every((w) => tokens.some((t) => t.startsWith(w)));
      const score = name.startsWith(n) ? 0 : wordStart ? 1 : name.includes(n) ? 2 : 3;
      return { x, score };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.x.r - b.x.r)
    .map((s) => s.x);
}
