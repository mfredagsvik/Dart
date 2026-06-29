// DART SCORE v14 - ROAST DATABASE
window.ROAST_LIBRARY = {
  hundredPlus:["Godkjent. Endelig litt dart.","100+. Nå begynner det å ligne noe.","Plutselig spiller du dart.","Over 100. Kontoret puster lettet ut."],
  highScore:["Sterkt kast. Ikke bli høy på deg selv.","Dette var nesten imponerende.","Nå lukter det dart.","Bra kast. Irriterende nok."],
  max180:["180. Det skjer ikke igjen.","Dopingkontroll.","Ta bilde, det blir sjeldent.","Nå blir du uutholdelig."],
  gay26:["26 igjen. Du er ikke uheldig lenger, du er spesialist.","20-eren har blokkert nummeret ditt.","26-klubben vurderer æresmedlemskap.","26 fant deg igjen."],
  bust:["Regning er vanskelig.","Selvtillit 100 %. Matte 0 %.","Du hadde én jobb.","Full fart rett forbi."],
  masterIn:{
    5:["Dørvakta begynner å le.","Du står fortsatt i kø.","Dette begynner å bli litt kleint."],
    8:["Har du glemt adgangskortet?","Dørvakta spør om du faktisk skal inn.","Du banker på feil dør."],
    10:["Vi bygger terrasse til deg her ute.","Du bor ute nå.","Vi setter opp postkasse til deg."],
    12:["Posten leverer hit nå.","Dørvakta har tatt lunsj.","Dette er ikke Master In, det er camping."],
    15:["Vaskedama kommer snart og kaster for deg.","Bytt hånd. Det kan umulig bli verre.","Jeg slår av lyset snart, kanskje du treffer.","Du har brukt så lang tid at vi vurderer å starte uten deg."],
    18:["KLUBBREKORD I FARE!","Dette blir historie.","Tavla vurderer å melde seg syk."],
    20:["NY BUNNREKORD!","Dette blir stående i mange år.","Det blir egen plakett på veggen."]
  },
  helmet:["HMS har overtatt kampen.","Hjelm på. De andre var ikke engang under 100.","Dette er ikke seier, det er en sikkerhetsrisiko."],
  yellow:["Gult kort. Oppfør deg.","Dommeren har sett nok.","Notert i boka.","Dette begynner å bli usportslig."],
  shootout:["45 piler brukt. Aktiv score er død. Bonusrunde starter.","Tre piler hver. Høyeste sum vinner.","Ingen checkout. Ingen unnskyldninger. Bare sum."],
  win:["Jaja, gratulerer da.","Flaks teller visst.","Ikke bli høy på deg selv.","Vi sjekker pilene etterpå."]
};
window.getMasterInRoast=function(darts){const m=window.ROAST_LIBRARY.masterIn;if(darts>=20)return rnd(m[20]);if(darts>=18)return rnd(m[18]);if(darts>=15)return rnd(m[15]);if(darts>=12)return rnd(m[12]);if(darts>=10)return rnd(m[10]);if(darts>=8)return rnd(m[8]);if(darts>=5)return rnd(m[5]);return ""};function rnd(a){return a&&a.length?a[Math.floor(Math.random()*a.length)]:""}
