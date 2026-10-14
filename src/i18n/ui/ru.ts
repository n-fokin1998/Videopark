/**
 * Russian UI strings — the source of truth for all keys. Other locales (`uk.ts`, `en.ts`) are typed as `Dictionary`
 * and must define every key. Tone: docs/editorial-guidelines.md §1 (metro voice — short, kind, slightly poetic).
 * Interpolation: `{name}` placeholders, filled by `t(key, { name })`.
 */
export const ru = {
  site: {
    name: 'Станция Видеопарк',
    description: 'Цифровой архив группы «Станция Видеопарк» и Жени Мычака: музыка, тексты, фото, видео и история.',
    titleTemplate: '{title} — Станция Видеопарк',
  },
  /** The two lines of the wordmark; together they read as `site.name`. */
  wordmark: {
    label: 'Станция',
    name: 'Видеопарк',
  },
  a11y: {
    skipToContent: 'К содержанию',
    skipToPlayer: 'К плееру',
    lineNav: 'Линия',
    stationAnnounce: 'Станция «{name}»',
    opensInNewTab: '(откроется в новой вкладке)',
  },
  map: {
    open: 'Схема',
    title: 'Схема линии',
    close: 'Закрыть схему',
    line: 'Линия',
    transfers: 'Пересадки',
    current: 'вы здесь',
    settings: 'Свет и звук',
    shortcuts: 'Клавиши',
  },
  /** Key caps in the shortcut list; physical keys, so the Russian layout letter is shown too. */
  keys: {
    lineMap: 'M (Ь)',
    close: 'Esc',
    playPause: 'Пробел',
    next: 'N (Т)',
    previous: 'P (З)',
    back: '←',
    forward: '→',
  },
  shortcuts: {
    lineMap: 'схема линии',
    close: 'закрыть схему или плеер',
    playPause: 'слушать / пауза',
    nextPrevious: 'следующая / предыдущая запись',
    seek: 'перемотка на 10 секунд в открытом плеере',
  },
  theme: {
    legend: 'Свет',
    auto: 'По времени суток',
    dawn: 'Рассвет',
    day: 'День',
    evening: 'Вечер',
    night: 'Ночь',
  },
  sound: {
    label: 'Звук',
    note: 'Тихие звуки интерфейса. Музыка включается только кнопкой «Слушать».',
  },
  line: {
    next: 'Следующая станция —',
    previous: 'Предыдущая',
    previousStation: 'Предыдущая — {name}',
    terminal: 'Конечная.',
    terminalNote: 'Поезд дальше не идёт.',
    transfer: 'Пересадка',
    transferTo: 'Пересадка — {name}',
    backToStart: 'В начало линии',
    backToLine: 'Вернуться на линию',
    stationsHeading: 'Станции линии',
    onward: 'Дальше по линии',
  },
  station: {
    platform: {
      name: 'Платформа',
      description: 'Станция Видеопарк — архив и музыка. Входите, слушайте, гуляйте между станциями.',
      tagline: 'Начало линии',
    },
    music: { name: 'Музыка', description: 'Релизы и записи «Станции Видеопарк».', tagline: 'Релизы и записи' },
    history: {
      name: 'История',
      description: 'Откуда название и путь «Станции Видеопарк» по годам.',
      tagline: 'Откуда название и путь по годам',
    },
    lyrics: {
      name: 'Тексты',
      description: 'Тексты песен «Станции Видеопарк», стихи и проза.',
      tagline: 'Песни, стихи и проза',
    },
    photos: { name: 'Фото', description: 'Фотографии из архива «Станции Видеопарк».', tagline: 'Кадры из архива' },
    video: {
      name: 'Видео',
      description: 'Клип, концерты и репетиции «Станции Видеопарк».',
      tagline: 'Клип, концерты, репетиции',
    },
    brovary: { name: 'Бровары', description: 'Бровары — конечная станция линии.', tagline: 'Конечная' },
    zhenya: { name: 'Женя', description: 'Женя Мычак — биография.', tagline: 'Биография' },
    about: {
      name: 'Об архиве',
      description: 'Об архиве: источники, благодарности, контакты.',
      tagline: 'Источники и благодарности',
    },
  },
  placeholder: {
    stationOpening: 'Станция готовится к открытию.',
  },
  platform: {
    arrivalLabel: 'Прибытие на станцию',
    enter: 'Войти на станцию',
    skip: 'Пропустить',
    lineHeading: 'Куда поедем',
    quoteHeading: 'Слова',
    photosHeading: 'Кадры',
    photosMore: 'Все фото',
    /** Camcorder-style date label on a photo. */
    rec: 'REC · {date}',
  },
  quote: {
    attribution: 'Женя Мычак',
  },
  /** Strings of the player islands (passed as props: `strings(locale, 'player')`). */
  player: {
    region: 'Плеер',
    play: 'Слушать',
    pause: 'Пауза',
    playTrack: 'Слушать «{title}»',
    pauseTrack: 'Пауза: «{title}»',
    next: 'Следующая запись',
    previous: 'Предыдущая запись',
    expand: 'Открыть плеер',
    collapse: 'Свернуть плеер',
    sheet: 'Плеер: очередь и волна',
    nowPlaying: 'Сейчас звучит',
    queue: 'Очередь',
    seek: 'Позиция в записи',
    position: '{position} из {duration}',
    volume: 'Громкость',
    loading: 'Загружается…',
    error: 'Не получилось загрузить запись.',
    listenOn: 'Слушать на {service}',
    source: 'Звучит через {service}',
    separateSongs: 'Отдельные песни',
    eveningLabel: 'Трек вечера',
    eveningNote: 'Каждый вечер — другая песня.',
  },
  notFound: {
    title: 'Станция закрыта',
    text: 'Поезд дальше не идёт.',
    description: 'Такой станции на линии нет.',
  },
};

export type Dictionary = typeof ru;
