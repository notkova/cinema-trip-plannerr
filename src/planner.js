// Чиста логика за планирање — без DOM, за да може да се тестира со Node.

export const TRANSPORT = {
  walk: { label: 'Пешки', perPerson: false },
  bus: { label: 'Автобус', perPerson: true },
  taxi: { label: 'Такси', perPerson: false },
  car: { label: 'Автомобил', perPerson: false },
};

export function parseTime(hhmm) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm).trim());
  if (!match) throw new Error(`Невалидно време: ${hhmm}`);
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) throw new Error(`Невалидно време: ${hhmm}`);
  return h * 60 + m;
}

export function formatTime(totalMinutes) {
  const day = 24 * 60;
  const t = ((Math.round(totalMinutes) % day) + day) % day;
  const h = String(Math.floor(t / 60)).padStart(2, '0');
  const m = String(t % 60).padStart(2, '0');
  return `${h}:${m}`;
}

// Кога да се тргне од дома: почеток на проекцијата − патување − резерва.
export function departureTime(showtime, travelMinutes, bufferMinutes = 15) {
  return formatTime(parseTime(showtime) - toNonNegative(travelMinutes) - toNonNegative(bufferMinutes));
}

// Кога завршува филмот (реклами + траење) и кога ќе се стигне дома.
export function schedule({ showtime, durationMinutes, travelMinutes, bufferMinutes = 15, adsMinutes = 15 }) {
  const start = parseTime(showtime);
  const end = start + adsMinutes + toNonNegative(durationMinutes);
  return {
    leave: departureTime(showtime, travelMinutes, bufferMinutes),
    start: formatTime(start),
    end: formatTime(end),
    home: formatTime(end + toNonNegative(travelMinutes)),
  };
}

// Пресметка на трошоци. Цените на превозот се за повратно патување.
export function costs({ people, ticketPrice, snackPrice = 0, transport = 'walk', transportPrice = 0 }) {
  const n = Math.max(1, Math.floor(Number(people) || 1));
  const tickets = n * toNonNegative(ticketPrice);
  const snacks = n * toNonNegative(snackPrice);
  const mode = TRANSPORT[transport] ?? TRANSPORT.walk;
  const travel = transport === 'walk' ? 0 : toNonNegative(transportPrice) * (mode.perPerson ? n : 1);
  const total = tickets + snacks + travel;
  return { people: n, tickets, snacks, travel, total, perPerson: Math.ceil(total / n) };
}

export function parseFriends(text) {
  return String(text ?? '')
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function planSummary(plan) {
  const lines = [
    `🎬 ${plan.movieTitle}`,
    `📍 ${plan.cinemaName}`,
    `📅 ${plan.date} во ${plan.schedule.start}`,
    `🚶 Тргнуваме во ${plan.schedule.leave} (${TRANSPORT[plan.transport]?.label ?? ''})`,
    `🏁 Филмот завршува околу ${plan.schedule.end}, дома сме околу ${plan.schedule.home}`,
    `💰 Вкупно ${plan.costs.total} ден. — ${plan.costs.perPerson} ден. по човек`,
  ];
  if (plan.friends.length) lines.push(`👥 Со: ${plan.friends.join(', ')}`);
  if (plan.notes) lines.push(`📝 ${plan.notes}`);
  return lines.join('\n');
}

function toNonNegative(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
