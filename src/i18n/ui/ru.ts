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
  a11y: {
    skipToContent: 'К содержанию',
    skipToPlayer: 'К плееру',
    lineNav: 'Линия',
    stationAnnounce: 'Станция «{name}»',
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
    },
    music: { name: 'Музыка', description: 'Релизы и записи «Станции Видеопарк».' },
    history: { name: 'История', description: 'Откуда название и путь «Станции Видеопарк» по годам.' },
    lyrics: { name: 'Тексты', description: 'Тексты песен «Станции Видеопарк», стихи и проза.' },
    photos: { name: 'Фото', description: 'Фотографии из архива «Станции Видеопарк».' },
    video: { name: 'Видео', description: 'Клип, концерты и репетиции «Станции Видеопарк».' },
    brovary: { name: 'Бровары', description: 'Бровары — конечная станция линии.' },
    zhenya: { name: 'Женя', description: 'Женя Мычак — биография.' },
    about: { name: 'Об архиве', description: 'Об архиве: источники, благодарности, контакты.' },
  },
  placeholder: {
    stationOpening: 'Станция готовится к открытию.',
  },
  notFound: {
    title: 'Станция закрыта',
    text: 'Поезд дальше не идёт.',
    description: 'Такой станции на линии нет.',
  },
};

export type Dictionary = typeof ru;
