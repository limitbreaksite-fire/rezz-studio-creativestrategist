// Kamus bahasa untuk analisis SEO & keterbacaan (Indonesia + Inggris).
const set = (s) => new Set(s.split(/\s+/).filter(Boolean));

export const STOPWORDS = {
  id: set(`yang dan di ke dari untuk pada dengan dalam adalah ini itu atau juga akan dapat bisa sudah telah ada oleh sebagai karena agar supaya saat ketika jika maka tetapi tapi namun serta lebih sangat para saya aku gue gua kamu kita kami mereka anda dia ia nya lah kah pun hanya saja masih belum tidak tak bukan bagi antara tentang terhadap hingga sampai setelah sebelum sambil seperti yaitu yakni yaitu apa siapa kapan dimana mana bagaimana mengapa kenapa berapa sebuah suatu setiap semua seluruh beberapa banyak sedikit sini situ sana lalu kemudian lagi pernah sedang harus perlu mau ingin boleh`),
  en: set(`a an the and or but if then else of to in on at by for with about against between into through during before after above below from up down out off over under again further once here there when where why how all any both each few more most other some such no nor not only own same so than too very can will just should now is are was were be been being have has had do does did this that these those i you he she it we they what which who whom as its our your their my his her`),
};

export const TRANSITIONS = {
  id: [
    "namun", "tetapi", "tapi", "akan tetapi", "sebaliknya", "meskipun", "walaupun", "sementara itu", "di sisi lain",
    "selain itu", "lagipula", "bahkan", "juga", "serta", "kemudian", "lalu", "setelah itu", "selanjutnya", "pertama", "kedua", "ketiga",
    "terakhir", "akhirnya", "pada akhirnya", "sebelum itu", "sebelumnya", "sesudah itu", "sementara", "karena itu", "oleh karena itu", "oleh sebab itu",
    "karena", "sebab", "maka", "dengan demikian", "jadi", "akibatnya", "sehingga", "supaya", "agar", "misalnya", "contohnya", "contoh", "seperti",
    "yaitu", "yakni", "dengan kata lain", "singkatnya", "intinya", "kesimpulannya", "secara umum", "pada dasarnya", "terutama", "khususnya",
    "tentu saja", "tentunya", "sebenarnya", "faktanya", "ternyata", "pertama-tama", "sebagai contoh", "yang terpenting", "di samping itu", "selama", "ketika", "saat", "jika", "apabila", "kalau", "sebelum", "setelah", "begitu juga", "demikian pula",
  ],
  en: [
    "however", "but", "although", "though", "while", "whereas", "on the other hand", "in contrast", "instead", "nevertheless", "still", "yet",
    "also", "moreover", "furthermore", "in addition", "besides", "additionally", "as well", "and then", "then", "next", "first", "second", "third",
    "finally", "lastly", "afterward", "before", "after", "meanwhile", "because", "since", "therefore", "thus", "hence", "consequently", "as a result",
    "so", "so that", "for example", "for instance", "such as", "in other words", "in short", "in summary", "to sum up", "overall", "in conclusion",
    "especially", "particularly", "of course", "actually", "in fact", "indeed", "similarly", "likewise", "when", "once", "if", "unless", "until",
  ],
};

export const QUESTION_WORDS = {
  id: ["apa", "apakah", "siapa", "kapan", "dimana", "di mana", "mana", "bagaimana", "mengapa", "kenapa", "berapa", "kapankah", "bolehkah", "perlukah", "haruskah", "cara"],
  en: ["what", "why", "how", "when", "where", "who", "which", "can", "does", "do", "is", "are", "should", "will"],
};

export const BAD_LINK_TEXTS = ["klik di sini", "klik disini", "klik ini", "di sini", "disini", "selengkapnya", "baca selengkapnya", "click here", "here", "read more", "this link", "link", "tautan ini"];

export const EN_IRREGULAR_PARTICIPLES = set(`been begun broken brought built bought caught chosen done drawn driven eaten fallen felt found forgotten given gone grown heard held hidden kept known laid led left lost made met paid put read run said seen sent set shown sold spoken spent taken taught told thought thrown understood won worn written`);

export const GENERIC_SLUG_WORDS = set(`dan di ke dari untuk pada dengan yang the a an and of to in on for with`);
