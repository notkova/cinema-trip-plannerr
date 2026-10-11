// Примерни податоци. Проекциите и цените се измислени — сменете ги со вистинските
// од распоредот на вашето кино, или додадете свои филмови преку апликацијата.

export const MOVIES = [
  { id: 'm1', title: 'Ѕвездена патека', genre: 'Научна фантастика', duration: 148, rating: '12+', emoji: '🚀' },
  { id: 'm2', title: 'Смеа до солзи', genre: 'Комедија', duration: 102, rating: 'Б.О.', emoji: '😂' },
  { id: 'm3', title: 'Сенки во ноќта', genre: 'Хорор', duration: 115, rating: '16+', emoji: '👻' },
  { id: 'm4', title: 'Малиот змеј', genre: 'Анимиран', duration: 94, rating: 'Б.О.', emoji: '🐉' },
  { id: 'm5', title: 'Последниот потег', genre: 'Трилер', duration: 127, rating: '14+', emoji: '♟️' },
  { id: 'm6', title: 'Летна љубов', genre: 'Романса', duration: 110, rating: '12+', emoji: '💞' },
];

export const CINEMAS = [
  { id: 'c1', name: 'Кино Центар', ticketPrice: 300, travelMinutes: 20, showtimes: ['16:00', '18:30', '21:00'] },
  { id: 'c2', name: 'Кино Мол', ticketPrice: 350, travelMinutes: 30, showtimes: ['15:30', '17:45', '20:15', '22:30'] },
  { id: 'c3', name: 'Кинотека (летно кино)', ticketPrice: 150, travelMinutes: 15, showtimes: ['20:30', '22:45'] },
];

export const SNACK_PRICE = 250;
