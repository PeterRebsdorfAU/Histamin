// Viden & tips. Tekst som simple afsnit; "list" bliver til punktopstilling.

export const GUIDE = [
  {
    id: 'hvad',
    icon: '🔬',
    title: 'Hvad er histaminintolerance?',
    body: [
      'Histamin er et stof, kroppen selv bruger (fx ved allergi), og som også findes i mad. Normalt nedbryder enzymet DAO (diaminoxidase) i tarmen det histamin, vi spiser.',
      'Hvis DAO ikke kan følge med – eller man spiser meget histamin på én gang – kan "spanden løbe over". Det kan give symptomer som:',
    ],
    list: [
      'Hovedpine og migræne',
      'Tilstoppet eller løbende næse',
      'Rødme, varme i ansigtet, kløe eller udslæt',
      'Oppustethed, mavesmerter, diarré',
      'Hjertebanken, uro, træthed eller søvnbesvær',
    ],
    after: [
      'Det er en "spand"-effekt: Det er den samlede mængde over dagen, der tæller – ikke én enkelt fødevare. Derfor kan man ofte tåle lidt af noget, men ikke meget.',
    ],
  },
  {
    id: 'forsoeget',
    icon: '🧪',
    title: 'Sådan fungerer 14-dages forsøget',
    body: [
      'De 14 dage er en såkaldt eliminationsfase: I spiser så lavt histamin som muligt og ser, om hovedpinen og de andre symptomer bliver mindre.',
    ],
    list: [
      'Dag 1–4: Kroppen skal "tømme spanden". Mange mærker ikke forskel endnu – hold fast!',
      'Dag 5–14: Her viser det sig typisk, om der er en effekt.',
      'Notér hovedpine hver dag – også "ingen hovedpine" på gode dage. Det er sammenligningen, der giver svaret.',
      'Hold øvrige vaner stabile (søvn, kaffe, træning), så I kan se effekten af maden alene.',
      'Efter forsøget genintroducerer man fødevarer én ad gangen – se "Efter de 14 dage".',
    ],
  },
  {
    id: 'friskhed',
    icon: '❄️',
    title: 'Friskhed er det vigtigste',
    body: [
      'Histamin dannes af bakterier, mens maden står – også i køleskabet. Det betyder, at HVORDAN maden er opbevaret, er lige så vigtigt som HVAD det er.',
    ],
    list: [
      'Køb fisk frossen – frosset straks efter fangst er det sikreste.',
      'Kød: Køb det så friskt som muligt og tilbered det samme dag – eller frys det, så snart I kommer hjem.',
      'Optø altid i køleskabet (ikke på køkkenbordet), og tilbered samme dag.',
      'Hakket kød danner histamin hurtigere end hele stykker.',
      'Indkøb hellere 2–3 gange om ugen end én stor tur.',
      'Frys brød i skiver, og rist det direkte fra fryseren.',
    ],
  },
  {
    id: 'rester',
    icon: '🍱',
    title: 'Rester og madpakker',
    body: [
      'Rester er en af de mest oversete kilder til histamin. Mad, der står et par dage i køleskabet, kan indeholde markant mere histamin end frisklavet.',
    ],
    list: [
      'Køl resterne hurtigt ned (fx i en flad bøtte) – lad dem ikke stå på komfuret.',
      'Spis rester inden for ca. et døgn.',
      'Skal de gemmes længere: frys dem samme aften. Brug "Fryseren" i appen til at holde styr på dem.',
      'Til madpakken: Lav dobbelt portion til aftensmad og pak frokosten med det samme.',
      'Kogte ris skal især køles hurtigt.',
    ],
  },
  {
    id: 'madlavning',
    icon: '👩‍🍳',
    title: 'Madlavning uden de klassiske smagsgivere',
    body: [
      'Mange "smagsbomber" er netop histaminrige: tomat, parmesan, sojasauce, bouillonterning, vin, eddike og chili. Her er alternativerne:',
    ],
    list: [
      'Bouillon: Kog selv på kyllingelår, gulerod, porre og laurbær – frys i portioner.',
      'Cremet sauce: fløde, mascarpone eller flødeost i stedet for revet ost.',
      'Syrlighed: et lille skvæt citron (sparsomt) i stedet for eddike.',
      '"Rød" sauce: græskar- eller gulerodspuré i stedet for tomat.',
      'Umami: brunet smør, ristede løg, hvidløg og stegeskyen fra panden.',
      'Varme: ingefær og hvidløg i stedet for chili.',
      'Friskhed: masser af friske krydderurter – persille, dild, basilikum, purløg, mynte.',
    ],
  },
  {
    id: 'drikke',
    icon: '🥤',
    title: 'Drikkevarer, kaffe og alkohol',
    list: [
      'Drik 1,5–2 liter vand om dagen. Dehydrering er en af de hyppigste hovedpine-årsager i sig selv.',
      'Alkohol – især rødvin, hvidvin, mousserende og øl – er både histaminrigt og hæmmer DAO. Drop det helt i de 14 dage.',
      'Sort og grøn te kan hæmme DAO. Skift til urtete (kamille, fennikel, rooibos, pebermynte).',
      'Kaffe tåles af mange. Stop IKKE brat med kaffe under forsøget – koffeinabstinenser giver hovedpine i 2–9 dage og forstyrrer resultatet. Hold samme mængde.',
    ],
  },
  {
    id: 'andre-triggere',
    icon: '🧠',
    title: 'Andre hovedpine-triggere at holde øje med',
    body: [
      'Hovedpine har mange mulige årsager. Hold øje med disse – og skriv dem gerne i noten på dagen:',
    ],
    list: [
      'Søvn: for lidt (og for meget) søvn',
      'Stress og spænding i nakke/skuldre',
      'For lidt vand og for lange pauser mellem måltider (lavt blodsukker)',
      'Koffein – både for meget og abstinenser',
      'Hormoner: mange oplever mere hovedpine omkring menstruation. Østrogen påvirker også histamin og DAO',
      'Skærmtid og anstrengte øjne',
      'Overforbrug af smertestillende: tager man det mere end ca. 10–15 dage om måneden, kan det i sig selv give hovedpine',
    ],
  },
  {
    id: 'medicin',
    icon: '💊',
    title: 'Medicin og kosttilskud',
    body: [
      'Nogle typer medicin kan påvirke DAO eller histamin. Stop eller ændr aldrig medicin uden at tale med lægen.',
    ],
    list: [
      'Spørg lægen eller apoteket, hvis du tager fast medicin, om den kan påvirke histamin.',
      'DAO-tilskud (enzymkapsler til måltidet) og antihistamin findes – men tal med lægen, før I bruger dem. Under selve forsøget giver det klarest svar at lade være, så I ser effekten af kosten alene.',
      'Notér smertestillende, når du registrerer hovedpine – det er vigtigt for vurderingen bagefter.',
    ],
  },
  {
    id: 'ude',
    icon: '🍽️',
    title: 'Spise ude og hos andre',
    list: [
      'Simpelt er bedst: grillet kylling/kød, kartofler/ris og grøntsager uden sauce.',
      'Spørg efter maden uden dressing, ost og tomat.',
      'Undgå buffeter – maden har ofte stået længe.',
      'Sushi, pizza, burgere med ost/bacon, asiatisk med sojasauce og indisk karry er svære.',
      'Fortæl gerne værterne, at du er i et 14-dages kostforsøg – de fleste synes, det er helt fint.',
      'Spiser du noget uden for planen, så skriv det i Mad-tjek. Det er ikke "snyd" – det er data!',
    ],
  },
  {
    id: 'laege',
    icon: '🩺',
    title: 'Hvornår skal man søge læge?',
    danger: true,
    body: [
      'Appen er et hjælpeværktøj til et kostforsøg – ikke medicinsk rådgivning. Tal gerne med egen læge om hovedpinen, også selvom forsøget går godt.',
      'Søg straks læge (ring 1813 eller 112 ved akut fare), hvis der er:',
    ],
    list: [
      'Pludselig, voldsom hovedpine – "den værste nogensinde"',
      'Hovedpine med feber, stiv nakke, forvirring, synsforstyrrelser, lammelser eller talebesvær',
      'Hovedpine efter et slag mod hovedet',
      'Hævelse af læber/tunge/svælg eller vejrtrækningsbesvær',
      'Ny type hovedpine, der bliver ved med at blive værre',
    ],
    after: [
      'Overvej også at gå til lægen, hvis hovedpinen er hyppig, uanset hvad forsøget viser. Medbring rapporten fra appen (under Fremskridt).',
    ],
  },
];

// Idéer til morgenmad, frokost og mellemmåltider
export const IDEAS = {
  morgen: {
    label: 'Morgenmad',
    icon: '🌅',
    items: [
      { title: 'Havregrød med blåbær og æble', foods: ['havregryn', 'maelk', 'blaabaer', 'aeble', 'honning'] },
      { title: 'Chiagrød med kokosmælk og mango', foods: ['chiafroe', 'kokosmaelk', 'mango'] },
      { title: 'Smoothie med mango, blåbær og havredrik', foods: ['mango', 'blaabaer', 'havredrik'] },
      { title: 'Ristet brød med smør og hytteost + agurk', foods: ['lyst-broed', 'smoer', 'hytteost', 'agurk'] },
      { title: 'Riskager med flødeost og radiser', foods: ['riskager', 'flodeost', 'radise'] },
      { title: 'Kvark med blåbær og hørfrø', foods: ['kvark', 'blaabaer', 'hoerfroe'] },
    ],
  },
  frokost: {
    label: 'Frokost & madpakke',
    icon: '🥪',
    items: [
      { title: 'Gårsdagens rester (nedkølet hurtigt, max ~1 døgn)', foods: [] },
      { title: 'Suppe fra fryseren + friskt brød', foods: ['lyst-broed'] },
      { title: 'Risalat med kylling, agurk, majs og persille', foods: ['ris', 'kyllingebryst', 'agurk', 'majs', 'persille'] },
      { title: 'Wrap med hjemmestegt kylling, salat og hytteost', foods: ['tortilla', 'kyllingebryst', 'salat', 'hytteost'] },
      { title: 'Brød med selvstegt kalkun i skiver og agurk', foods: ['lyst-broed', 'kalkunbryst', 'agurk'] },
      { title: 'Lun kartoffelsalat med dild, purløg og olivenolie', foods: ['kartoffel', 'dild', 'purloeg', 'olivenolie'] },
      { title: 'Quinoasalat med kylling, mynte og agurk', foods: ['quinoa', 'kyllingebryst', 'mynte', 'agurk'] },
    ],
  },
  snack: {
    label: 'Mellemmåltider',
    icon: '🍎',
    items: [
      { title: 'Æble, melon, mango eller blåbær', foods: ['aeble', 'melon', 'mango', 'blaabaer'] },
      { title: 'Gulerodsstænger og agurk med hytteost-dip', foods: ['gulerod', 'agurk', 'hytteost'] },
      { title: 'Riskager med lidt honning', foods: ['riskager', 'honning'] },
      { title: 'Hjemmelavede popcorn', foods: ['popcorn'] },
      { title: 'En håndfuld macadamianødder', foods: ['macadamia'] },
      { title: 'Hjemmebagte havrebarer (havregryn, honning, smør)', foods: ['havregryn', 'honning', 'smoer'] },
    ],
  },
  soedt: {
    label: 'Noget sødt',
    icon: '🍰',
    items: [
      { title: 'Bagt æble med kanel (lidt) og havregryn', foods: ['aeble', 'havregryn', 'smoer'] },
      { title: 'Blåbær med piskefløde', foods: ['blaabaer', 'floede'] },
      { title: 'Mango-is: frossen mango blendet med kokosmælk', foods: ['mango', 'kokosmaelk'] },
      { title: 'Pandekager med æggeblomme, blåbær og ahornsirup', foods: ['hvedemel', 'maelk', 'aeggeblomme', 'blaabaer', 'ahornsirup'] },
    ],
  },
};

export const HEADACHE_LABELS = ['Ingen', 'Meget let', 'Let', 'Let', 'Moderat', 'Moderat', 'Moderat', 'Kraftig', 'Kraftig', 'Meget kraftig', 'Værst tænkelige'];
