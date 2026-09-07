# -*- coding: utf-8 -*-
"""Fill kobunen / gendaibunen for all 54 Genji chapters.

Preserves existing JA kobun/gendaibun and pilot EN where already present.
Does not add desc/descen.
"""
from __future__ import annotations

import json
from pathlib import Path

PATH = Path("src/data/emaki-text-data/chapters-of-genji.json")

# English excerpts for every chapter (1–54).
# kobunen: literary opening-style English
# gendaibunen: clear modern English aligned with the chapter synopsis
EN = {
    "1": {
        "kobunen": (
            "In which reign was it? Among the many Consorts and Intimates in service, "
            "there was one who, though not of the very highest rank, enjoyed exceptional favor. "
            "Ladies who from the first had thought highly of themselves treated her as an affront "
            "and grew ever more spiteful; even the courtiers, hearing of the Emperor's secret visits, "
            "felt displeased and added their resentment. …"
        ),
        "gendaibunen": (
            "In which emperor's reign was it? Among the many Consorts and Intimates serving at court, "
            "there was one who was not of especially high birth, yet she alone received the Emperor's fullest favor. "
            "The other ladies, who had prided themselves from the start, treated her as an eyesore "
            "and grew ever more spiteful. …"
        ),
    },
    "2": {
        "kobunen": (
            "On a night of early-summer rain, young nobles gathered where Genji kept night duty at the palace "
            "and held their famous “ranking of women on a rainy night.” …"
        ),
        "gendaibunen": (
            "One rainy night in early summer, young courtiers gather around Genji on night duty and debate "
            "the virtues of women. The next day, while away for ritual abstinence, Genji becomes involved "
            "with Utsusemi, wife of the Governor of Iyo. …"
        ),
    },
    "3": {
        "kobunen": (
            "Unable to sleep, he thought, “So this is how I am”—and his longing for the lady who had fled "
            "like a cicada leaving its shell only grew sharper. …"
        ),
        "gendaibunen": (
            "On a summer evening Genji spies Utsusemi and her stepdaughter playing go, and his desire deepens. "
            "When he slips into her chamber at night, she senses him, escapes, and leaves only a discarded robe—"
            "like a cicada's empty shell—in his arms. …"
        ),
    },
    "4": {
        "kobunen": (
            "In the days of his secret wanderings about the Sixth Avenue district, Genji came to know "
            "a fragile woman called Yūgao, living modestly near Gojō. …"
        ),
        "gendaibunen": (
            "While concealing his rank, Genji falls in love with Yūgao near Gojō—once the lost lover "
            "of his friend Tō no Chūjō. Their affair ends in terror when the living spirit of Lady Rokujō "
            "appears in jealousy during a rendezvous. …"
        ),
    },
    "5": {
        "kobunen": (
            "Suffering from ague in the spring of the following year, Genji went up to the northern hills "
            "for treatment—and there he glimpsed a beautiful little girl living with her grandmother, a nun. …"
        ),
        "gendaibunen": (
            "The next spring, still grieving, Genji seeks treatment in the northern hills and sees a lovely child "
            "raised by her grandmother. She is Fujitsubo's niece; Genji longs to bring her up himself, "
            "though the nun will not yet agree. …"
        ),
    },
    "6": {
        "kobunen": (
            "Word spread that a princess of Hitachi lived in quiet decline in a ruined mansion; "
            "Genji and Tō no Chūjō, drawn by the rumor, competed in their advances. …"
        ),
        "gendaibunen": (
            "Rumor says the Hitachi Princess lives alone in a decaying house. Genji and Tō no Chūjō both pursue her; "
            "when Genji first becomes intimate, he finds her far from the graceful beauty he imagined—"
            "and is dismayed by her long, hanging nose. …"
        ),
    },
    "7": {
        "kobunen": (
            "The Emperor held a maple-viewing celebration for the retired sovereign's longevity, "
            "and Genji danced—his figure so radiant that even the rehearsal at court left Fujitsubo "
            "and the great ladies in wonder. …"
        ),
        "gendaibunen": (
            "At a maple-viewing feast for the retired emperor's longevity, Genji's dance dazzles the court. "
            "The next spring Fujitsubo bears a son; the Emperor believes the child his own, "
            "though Genji knows the secret. …"
        ),
    },
    "8": {
        "kobunen": (
            "Past the twentieth of the Second Month, a cherry-blossom banquet was held at the Southern Hall; "
            "afterward Genji found himself drawn into an unexpected encounter with a certain lady. …"
        ),
        "gendaibunen": (
            "After a spring cherry-viewing banquet at court, Genji becomes involved with a young lady. "
            "Later, invited to a feast at the house of his political rivals, he learns she is Oborozukiyo—"
            "daughter of the Minister of the Right, soon to enter service at the palace. …"
        ),
    },
    "9": {
        "kobunen": (
            "After the world had changed, everything felt wearisome; two years on, the Kiritsubo Emperor "
            "had already abdicated, and Genji's elder brother reigned as Emperor Suzaku. …"
        ),
        "gendaibunen": (
            "Two years later the Kiritsubo Emperor has abdicated and Suzaku reigns. At the Kamo Festival "
            "a quarrel over carriage places humiliates Lady Rokujō before Aoi; her living spirit "
            "then torments the pregnant Aoi in childbed. …"
        ),
    },
    "10": {
        "kobunen": (
            "Terrified by the horror of her own living spirit, Lady Rokujō resolved to withdraw with her daughter, "
            "now chosen as Ise Priestess, and entered purification at the Field Palace in Sagano. …"
        ),
        "gendaibunen": (
            "Lady Rokujō, frightened by her own spirit's violence, decides to accompany her daughter—"
            "the new Ise Priestess—and enters ritual seclusion at the Field Palace. Late in autumn Genji "
            "visits to take leave; that winter the Kiritsubo Emperor dies. …"
        ),
    },
    "11": {
        "kobunen": (
            "In a break of the early-summer rains, Genji visited one of the late Kiritsubo Emperor's consorts "
            "at Reikeiden—a quiet house fragrant with old stories. …"
        ),
        "gendaibunen": (
            "Between showers of the rainy season, Genji visits a former consort of his late father "
            "at Reikeiden. In that quiet, nostalgic household he remembers the old reign; "
            "her sister, Hanachirusato, will later become one of his wives. …"
        ),
    },
    "12": {
        "kobunen": (
            "Sensing that punishment might soon fall, Genji took the initiative and withdrew into exile at Suma, "
            "bidding farewell to the women bound to him and fretting over Murasaki's fate as he left the capital. …"
        ),
        "gendaibunen": (
            "Foreseeing disgrace, Genji goes into exile at Suma of his own will. Parting from the women he loves "
            "and worrying for Murasaki, he leaves the capital in deep pathos. The next spring a storm rises "
            "as he performs a seaside purification. …"
        ),
    },
    "13": {
        "kobunen": (
            "Warned in a dream by his father the late Emperor, Genji left Suma; the Akashi Novice received him, "
            "and in time Genji became intimate with the Novice's daughter. …"
        ),
        "gendaibunen": (
            "After a dream-message from his father, Genji leaves Suma and is welcomed by the Akashi Novice. "
            "He becomes involved with the Novice's daughter, the Lady of Akashi, who soon shows signs of pregnancy. "
            "In the capital, Emperor Suzaku dreams of rebuke for Genji's unjust exile. …"
        ),
    },
    "14": {
        "kobunen": (
            "After his return, Genji rose again in politics and walked the path of glory; the year turned, "
            "and Emperor Suzaku abdicated. …"
        ),
        "gendaibunen": (
            "Back in the capital, Genji returns to power. Suzaku abdicates; Reizei—secretly Genji and Fujitsubo's son—"
            "ascends the throne. In autumn Genji makes pilgrimage to Sumiyoshi, grateful for protection "
            "during his wanderings at Suma and Akashi. …"
        ),
    },
    "15": {
        "kobunen": (
            "While Genji lay low in exile, Suetsumuhana, with no one else to rely on, waited for him alone "
            "and endured a life of ruinous poverty. …"
        ),
        "gendaibunen": (
            "During Genji's disgrace, Suetsumuhana has no other protector and waits for him through hardship. "
            "When he returns to the capital and visits her, her steadfast devotion moves him. …"
        ),
    },
    "16": {
        "kobunen": (
            "Utsusemi, who had gone down to Hitachi with her husband, was returning to the capital; "
            "on the road to Ishiyama Temple her procession crossed Genji's, and they could not help "
            "exchanging poems. …"
        ),
        "gendaibunen": (
            "Utsusemi returns from Hitachi with her husband. On a pilgrimage toward Ishiyamadera "
            "her party meets Genji's; before they know it they exchange poems. …"
        ),
    },
    "17": {
        "kobunen": (
            "In Emperor Reizei's court, the Ise Consort—daughter of Lady Rokujō—and the Kokiden Consort "
            "vied for favor, each backed by Genji and by Tō no Chūjō, once the closest of friends. …"
        ),
        "gendaibunen": (
            "At Reizei's court, the former Ise Priestess (Lady Rokujō's daughter) and the Kokiden Consort "
            "compete for favor, backed respectively by Genji and Tō no Chūjō. A picture contest at the palace "
            "becomes the stage for their rivalry. …"
        ),
    },
    "18": {
        "kobunen": (
            "Genji urged the Lady of Akashi to come up to the capital, yet ashamed of her birth she long refused; "
            "at last, by her father's counsel, she slipped north to a villa by the Ōi River. …"
        ),
        "gendaibunen": (
            "Genji presses the Lady of Akashi to move to the capital; shy of her status, she hesitates. "
            "Encouraged by her father, she finally comes quietly to a villa by the Ōi; Genji rejoices "
            "and is reunited with their little daughter. …"
        ),
    },
    "19": {
        "kobunen": (
            "The Akashi princess was taken into Genji's household, and at the Ōi villa a sorrowful parting "
            "of mother and child unfolded; the next spring Fujitsubo passed away, and Genji's grief knew no bounds. …"
        ),
        "gendaibunen": (
            "The Akashi daughter is brought to Genji; mother and child part in tears at the Ōi villa. "
            "The next spring Fujitsubo dies, and Genji's sorrow is endless. Reizei meanwhile learns "
            "the secret of his birth. …"
        ),
    },
    "20": {
        "kobunen": (
            "The Asagao Priestess, to whom Genji had once given his deepest thoughts, stepped down from office; "
            "rumors ran high, and though Murasaki could not hide her unease, Asagao refused Genji's suit to the end. …"
        ),
        "gendaibunen": (
            "The Asagao Priestess retires from her shrine. Worldly rumor troubles Murasaki, yet Asagao "
            "rejects Genji's proposals. That night Fujitsubo's spirit appears in Genji's dream, "
            "speaking of their sin. …"
        ),
    },
    "21": {
        "kobunen": (
            "Yūgiri, Genji's son by Aoi, came of age; Genji, with thoughts of his own, sent him to the university—"
            "a path a young noble found hard to bear with pride. …"
        ),
        "gendaibunen": (
            "Yūgiri, Genji's son by Aoi, comes of age. Genji has him study at the university, which the young noble "
            "finds humiliating. His childhood love Kumoinokari is daughter of Tō no Chūjō—now Minister of the Interior "
            "and Genji's rival. …"
        ),
    },
    "22": {
        "kobunen": (
            "After Yūgao's death, Tamakazura was taken by her nurse to Dazaifu and grew into beauty; "
            "wishing only to show her once to her father, they came to pray at Hatsuse—and there met "
            "an old companion of Yūgao's now serving Genji. …"
        ),
        "gendaibunen": (
            "After Yūgao's death, Tamakazura is raised in Dazaifu. Hoping to reunite her with her father, "
            "her nurse takes her to Hatsuse; by chance they meet Ukon, once Yūgao's attendant and now "
            "in Genji's service, and Genji takes Tamakazura into his care. …"
        ),
    },
    "23": {
        "kobunen": (
            "With the New Year, elegant scenes of early spring unfolded at Rokujō-in; yet the young nobles "
            "who came to offer greetings to Genji had their minds already elsewhere—on rumors of Tamakazura. …"
        ),
        "gendaibunen": (
            "At New Year the Rokujō mansion is filled with graceful spring scenes. Young nobles who come "
            "to pay Genji their respects can think of little but rumors of Tamakazura. …"
        ),
    },
    "24": {
        "kobunen": (
            "In the Third Month, timed with the autumn consort's return to her apartments, boat parties "
            "were held at Rokujō-in, and festivities continued; even Genji found himself confessing, "
            "half in jest, a feeling stirred by Tamakazura's charm. …"
        ),
        "gendaibunen": (
            "In the Third Month, boat parties and celebrations fill Rokujō-in when the autumn consort returns. "
            "Tamakazura's beauty so moves Genji that even he half-jokingly reveals an improper feeling. …"
        ),
    },
    "25": {
        "kobunen": (
            "Tamakazura took little pleasure in her days, while Genji amused himself by teasing the young nobles "
            "who admired her; when his brother the Minister of War visited, Genji released fireflies beneath "
            "the blinds to show him her beauty. …"
        ),
        "gendaibunen": (
            "Tamakazura is unhappy; Genji toys with her suitors. When his brother visits, Genji releases "
            "fireflies behind the blinds to display her beauty. In the rainy season, illustrated tales "
            "become the fashion at Rokujō-in. …"
        ),
    },
    "26": {
        "kobunen": (
            "On a summer day Genji invited Yūgiri and other young nobles, mocked the vulgar tastes of "
            "the Minister of the Interior's newly adopted daughter—the Lady of Ōmi—and afterward visited "
            "Tamakazura in halls bright with blooming pinks. …"
        ),
        "gendaibunen": (
            "One summer day Genji invites Yūgiri and young nobles, ridicules the tasteless Lady of Ōmi "
            "whom the Minister has recently taken in as a rival to Tamakazura, then visits Tamakazura "
            "among halls of blooming pinks (tokonatsu). …"
        ),
    },
    "27": {
        "kobunen": (
            "Early one autumn night Genji taught Tamakazura the koto and had brushwood fires lit in the garden "
            "as they lay side by side—yet they did not become lovers. …"
        ),
        "gendaibunen": (
            "Early in autumn Genji teaches Tamakazura the koto and has brushwood fires lit in the garden "
            "as they rest side by side—but they do not become lovers. …"
        ),
    },
    "28": {
        "kobunen": (
            "On the morning after a typhoon, Yūgiri went to Rokujō-in to inquire after Genji's ladies "
            "and by chance glimpsed Murasaki—his heart was stirred—and he also saw his father "
            "sporting with Tamakazura, which left him uneasy. …"
        ),
        "gendaibunen": (
            "The morning after a typhoon, Yūgiri visits Rokujō-in to check on Genji's ladies. "
            "He glimpses Murasaki and is drawn to her; seeing his father toy with Tamakazura "
            "also fills him with suspicion. …"
        ),
    },
    "29": {
        "kobunen": (
            "In winter, at the imperial progress to Ōhara-no, Tamakazura caught sight of Emperor Reizei—"
            "who longed for her—and did not find him unpleasing; Genji then spoke frankly with the Minister "
            "about presenting her at court. …"
        ),
        "gendaibunen": (
            "In winter, during an imperial outing to Ōhara-no, Tamakazura glimpses Emperor Reizei, "
            "who desires her, and does not dislike him. Genji tells the Minister the truth and discusses "
            "her coming-of-age rite before she enters palace service. …"
        ),
    },
    "30": {
        "kobunen": (
            "In autumn the Minister's mother, the Ōmiya, passed away; Yūgiri and Tamakazura, her grandchildren, "
            "went into mourning. As talk of Tamakazura's entry to court grew louder, suitors' hearts grew wild—"
            "and Yūgiri, learning her birth, set a spray of purple trousers in her blinds to declare himself. …"
        ),
        "gendaibunen": (
            "In autumn the Minister's mother dies; Yūgiri and Tamakazura mourn. Rumors of Tamakazura's "
            "palace entry agitate her suitors. Yūgiri, now knowing her parentage, places a branch of "
            "fujibakama in her blinds to reveal his feelings. …"
        ),
    },
    "31": {
        "kobunen": (
            "Late in autumn, Higekuro—who had long desired Tamakazura—forced his way to her with a gentlewoman's help; "
            "the disappointment of Genji and Emperor Reizei need hardly be told. …"
        ),
        "gendaibunen": (
            "Late in autumn Higekuro, long in love with Tamakazura, forces an intimacy with a lady-in-waiting's help. "
            "Genji and Reizei are crushed. Obsessed, Higekuro neglects his first wife and children "
            "until she leaves in anger, taking the children and the “true-wood pillar.” …"
        ),
    },
    "32": {
        "kobunen": (
            "As the Akashi princess's entry to court drew near, Genji prepared with every luxury; "
            "houses were called to blend famous incense, and one spring day of plum blossom "
            "an incense contest was held. …"
        ),
        "gendaibunen": (
            "As the Akashi daughter's entry to court approaches, Genji spares no expense. "
            "Houses are invited to blend fine incense; on a plum-blossom spring day an incense contest "
            "is held, and later her coming-of-age rite is celebrated in grandeur. …"
        ),
    },
    "33": {
        "kobunen": (
            "At last the Minister allowed Yūgiri to marry Kumoinokari; the Akashi princess entered "
            "the household of the Crown Prince, and learning that the next year would mark Genji's fortieth, "
            "Emperor Reizei announced he would raise Genji to quasi-retired-emperor rank. …"
        ),
        "gendaibunen": (
            "The Minister finally permits Yūgiri's marriage to Kumoinokari; the Akashi daughter enters "
            "the Crown Prince's household. Reizei, noting Genji's coming fortieth year, raises him "
            "toward the rank of a retired emperor; in winter the emperor visits Rokujō-in. …"
        ),
    },
    "34": {
        "kobunen": (
            "To celebrate Genji's fortieth year, Tamakazura presented young herbs at the New Year; "
            "meanwhile Retired Emperor Suzaku, about to take orders, fretted over his youngest daughter "
            "the Third Princess and gave her in marriage to Genji. …"
        ),
        "gendaibunen": (
            "At New Year Tamakazura offers young herbs for Genji's fortieth celebration. "
            "Retired Emperor Suzaku, preparing to take Buddhist vows, worries for his youngest—"
            "the Third Princess—and marries her to Genji. Murasaki's distress is great; "
            "Genji himself feels little true love for the girl. …"
        ),
    },
    "35": {
        "kobunen": (
            "For Suzaku's fiftieth celebration a concert of women's music was held, and Genji taught "
            "the Third Princess the koto; right afterward Murasaki fell ill—possessed, it seemed, "
            "by the dead spirit of Lady Rokujō—and Genji devoted himself to nursing her. …"
        ),
        "gendaibunen": (
            "At Suzaku's fiftieth celebration Genji teaches the Third Princess the koto. "
            "Soon after, Murasaki falls ill, haunted by Lady Rokujō's spirit; while Genji nurses her, "
            "Kashiwagi, guided by a waiting-woman, becomes intimate with the Third Princess. …"
        ),
    },
    "36": {
        "kobunen": (
            "As for the Third Princess, the talk of others was all the more ominous; "
            "even at the palace, he seemed to hear how things stood and would from time to time "
            "speak words of pity. …"
        ),
        "gendaibunen": (
            "Word of the Third Princess's illness was still more distressing in the world's gossip; "
            "even at the palace, he wondered how they had heard of it, and there were times "
            "when he offered words of sympathy, feeling for her. …"
        ),
    },
    "37": {
        "kobunen": (
            "In autumn the first anniversary of Kashiwagi was observed; Yūgiri, watching over the Fallen Leaves Princess, "
            "received Kashiwagi's treasured flute from her mother—and that night Kashiwagi appeared in a dream, "
            "saying the flute was meant for another. …"
        ),
        "gendaibunen": (
            "In autumn Kashiwagi's first anniversary is held. Yūgiri, guardian of the Fallen Leaves Princess, "
            "receives Kashiwagi's beloved flute from her mother; that night Kashiwagi appears in a dream "
            "and says the flute is meant for someone else—hinting at Kaoru. …"
        ),
    },
    "38": {
        "kobunen": (
            "In summer the consecration of the Third Princess's personal Buddha image was held after her tonsure; "
            "in autumn bell-crickets were released in her garden and Genji and others made a banquet. …"
        ),
        "gendaibunen": (
            "In summer a ceremony is held for the Third Princess's Buddhist image after she takes the tonsure. "
            "In autumn bell-crickets are released in her garden for a banquet. That night Akikonomu "
            "tells Genji she wishes to take orders to quiet her mother Rokujō's spirit—but Genji refuses. …"
        ),
    },
    "39": {
        "kobunen": (
            "In autumn Yūgiri, no longer able to restrain himself, slipped unseen to the Fallen Leaves Princess "
            "and declared his love; she would not accept him, yet worldly rumor rose high, "
            "and her mother the consort fell ill and died of the distress. …"
        ),
        "gendaibunen": (
            "In autumn Yūgiri can no longer hold back and secretly confesses to the Fallen Leaves Princess; "
            "she refuses, but rumor spreads and her mother dies of worry. The princess shuns him still more, "
            "yet Yūgiri's passion only deepens. …"
        ),
    },
    "40": {
        "kobunen": (
            "After the great illness of the Wakana years, Murasaki's strength never fully returned; "
            "again and again she asked to take orders, yet Genji would not permit it, "
            "and she sought at least to secure the next life through Buddhist rites. …"
        ),
        "gendaibunen": (
            "After her long illness, Murasaki never fully recovers. She repeatedly asks to take Buddhist vows; "
            "Genji refuses. From spring to autumn the last glory of Rokujō-in unfolds beside her decline; "
            "in autumn she dies, and Genji's grief is beyond measure. …"
        ),
    },
    "41": {
        "kobunen": (
            "After Murasaki's death, Genji's sorrow was told through the seasons; at year's end "
            "he resolved to leave the world and burned the letters of the women he had loved. …"
        ),
        "gendaibunen": (
            "After Murasaki's death, Genji's mourning is told through the year's seasons. "
            "At year's end he resolves to take Buddhist orders and burns the women's letters. …"
        ),
    },
    "42": {
        "kobunen": (
            "The tale resumes some years after Genji's death. The prosperity of his line stands firm "
            "around the Akashi Empress and the sons of the present emperor; among them the Third Prince, "
            "famed for love affairs, is celebrated alongside Kaoru—from whose body a natural fragrance rises. …"
        ),
        "gendaibunen": (
            "Years after Genji's death, his house still flourishes around the Akashi Empress and the emperor's sons. "
            "The Third Prince (Niou), noted for amorous charm, is paired in fame with Kaoru, "
            "from whose person a natural fragrance rises. …"
        ),
    },
    "43": {
        "kobunen": (
            "This is the tale of Tō no Chūjō's house after Kashiwagi's death: a marriage is plotted "
            "between his granddaughter Naka no Kimi and Prince Niou, yet Niou, drawn to other ladies, "
            "will not take the bait. …"
        ),
        "gendaibunen": (
            "After Kashiwagi's death, the story turns to Tō no Chūjō's family. A match is planned "
            "between his granddaughter and Niou, but Niou prefers other women and ignores it. "
            "(Often judged a later interpolation.) …"
        ),
    },
    "44": {
        "kobunen": (
            "This is the tale of Higekuro's house after his death: Tamakazura's two daughters—"
            "the elder married to Retired Emperor Reizei, the younger entering palace service—"
            "grow close to Yūgiri, who is warmly received by the family. …"
        ),
        "gendaibunen": (
            "After Higekuro's death, Tamakazura's two daughters find their paths: one marries Reizei, "
            "the other enters court service. Yūgiri grows close to the household and is well liked. "
            "(Often judged a later interpolation.) …"
        ),
    },
    "45": {
        "kobunen": (
            "In those days there was an aged prince whom the world scarcely counted among its number. "
            "Having lost his mother the princess, he withdrew with the young men known as the Middle Captain's sons "
            "to a mountain villa at Uji. …"
        ),
        "gendaibunen": (
            "In those days there was an old prince whom the world little regarded. "
            "After his mother the princess died, he took the young men called the Middle Captain's sons "
            "and shut himself away in a mountain villa at Uji. …"
        ),
    },
    "46": {
        "kobunen": (
            "In spring Prince Niou stopped at Uji and exchanged poems with the younger sister Naka no Kimi; "
            "in autumn the Eighth Prince died, and the two princesses were entrusted to Kaoru. …"
        ),
        "gendaibunen": (
            "In spring Niou visits Uji and exchanges poems with the younger sister. In autumn the Eighth Prince dies; "
            "the two sisters are entrusted to Kaoru. He plans to marry Naka no Kimi to Niou "
            "and confesses his love to the elder sister, who answers coldly—yet his longing only grows. …"
        ),
    },
    "47": {
        "kobunen": (
            "Again Kaoru spoke his love to the elder sister; she would not accept him, "
            "and rather wished him married to her younger sister. Late in autumn she left "
            "Kaoru and Naka no Kimi alone in one chamber—yet he would not touch her. …"
        ),
        "gendaibunen": (
            "Kaoru again courts the elder sister; she refuses and hopes he will marry the younger. "
            "Late in autumn she leaves Kaoru and Naka no Kimi alone together, but he will not touch her. "
            "As planned, Kaoru later brings Niou and Naka no Kimi together; the elder sister dies of illness. …"
        ),
    },
    "48": {
        "kobunen": (
            "The next year, when mourning for the elder sister ended, Naka no Kimi was taken into Niou's household; "
            "Kaoru served as her guardian, yet that very care made Niou suspicious. …"
        ),
        "gendaibunen": (
            "The next year, after mourning ends, Naka no Kimi is taken into Niou's household. "
            "Kaoru helps as her guardian—yet that very devotion makes Niou jealous. …"
        ),
    },
    "49": {
        "kobunen": (
            "Niou married Yūgiri's Sixth Daughter; Naka no Kimi, already with child, feared for her future. "
            "Comforting her, Kaoru began to feel desire, which distressed her—until she safely bore a son "
            "and her position grew secure. …"
        ),
        "gendaibunen": (
            "Niou marries Yūgiri's sixth daughter; pregnant Naka no Kimi fears for her future. "
            "While comforting her, Kaoru falls in love, to her dismay—until she bears a son and her standing stabilizes. "
            "Kaoru meanwhile marries the emperor's Second Princess, yet his heart remains unsettled. …"
        ),
    },
    "50": {
        "kobunen": (
            "Ukifune, raised as stepdaughter of a provincial governor after her mother's remarriage, "
            "had many suitors for her father's wealth; yet her mother wished a noble match "
            "and placed her in Naka no Kimi's care. …"
        ),
        "gendaibunen": (
            "Ukifune is raised as a provincial official's stepdaughter; suitors come for her father's wealth, "
            "but her mother wants a noble marriage and places her with Naka no Kimi. "
            "Her mother hopes for Kaoru—yet one night Niou finds Ukifune and forces himself upon her. …"
        ),
    },
    "51": {
        "kobunen": (
            "Niou, still obsessed with Ukifune, guessed her hiding place from a letter to Naka no Kimi, "
            "went to Uji disguised as Kaoru, and forced a relationship; in time Ukifune came "
            "not to hate him—while Kaoru, knowing nothing, prepared to move her to the capital. …"
        ),
        "gendaibunen": (
            "Still obsessed, Niou finds Ukifune at Uji by posing as Kaoru and forces an affair. "
            "Ukifune comes to care for him, while Kaoru—unaware—prepares to bring her to the capital. "
            "Torn between them, Ukifune falls into despair. …"
        ),
    },
    "52": {
        "kobunen": (
            "Ukifune vanished; the women left behind, believing she had thrown herself into the river, "
            "mourned yet hastily held a funeral to hide the truth—and Kaoru, learning of it, "
            "was also lost in grief. …"
        ),
        "gendaibunen": (
            "Ukifune disappears. The women left behind think she drowned herself; they grieve "
            "yet hold a hasty funeral to conceal the truth. Kaoru, hearing of it, is devastated. "
            "In summer his heart turns toward his wife's elder sister. …"
        ),
    },
    "53": {
        "kobunen": (
            "In fact Ukifune had been saved after her attempt to drown by the Bishop of Yokawa; "
            "when her strength returned, without giving her name, she told him of her wish "
            "to leave the world and had her hair cut. …"
        ),
        "gendaibunen": (
            "Ukifune was saved after her suicide attempt by the Bishop of Yokawa. "
            "Recovered, she keeps her name secret, declares her wish for the religious life, "
            "and has her hair cut. Later the bishop, serving the Akashi Empress, speaks of her—"
            "and Kaoru begins to suspect she lives. …"
        ),
    },
    "54": {
        "kobunen": (
            "Kaoru went to Yokawa and sought an audience with Ukifune; the bishop refused, "
            "and Kaoru entrusted her younger brother with a letter asking her to return to lay life—"
            "yet Ukifune rejected all, thinking only of the Buddha's path, and sent no answer. …"
        ),
        "gendaibunen": (
            "Kaoru goes to Yokawa and asks to see Ukifune; the bishop refuses. "
            "He sends a letter through her brother urging her to return to ordinary life, "
            "but Ukifune refuses everything, intent only on Buddhist practice, and gives no reply. "
            "Kaoru leaves Yokawa with his heart still bound to her. …"
        ),
    },
}


def main() -> None:
    data = json.loads(PATH.read_text(encoding="utf-8"))
    assert len(EN) == 54, len(EN)
    for e in data:
        ch = str(e["chapter_en"])
        if ch not in EN:
            raise SystemExit(f"missing EN for chapter {ch}")
        e["kobunen"] = EN[ch]["kobunen"]
        e["gendaibunen"] = EN[ch]["gendaibunen"]
        e.pop("desc", None)
        e.pop("descen", None)
        e.setdefault("kobun", e.get("kobun") or "")
        e.setdefault("gendaibun", e.get("gendaibun") or "")

    PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        "kobunen",
        sum(1 for e in data if (e.get("kobunen") or "").strip()),
        "gendaibunen",
        sum(1 for e in data if (e.get("gendaibunen") or "").strip()),
        "kobun",
        sum(1 for e in data if (e.get("kobun") or "").strip()),
        "gendaibun",
        sum(1 for e in data if (e.get("gendaibun") or "").strip()),
    )


if __name__ == "__main__":
    main()
