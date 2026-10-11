import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTime, formatTime, departureTime, schedule, costs, parseFriends, planSummary } from '../src/planner.js';

test('parseTime и formatTime', () => {
  assert.equal(parseTime('19:30'), 1170);
  assert.equal(formatTime(1170), '19:30');
  assert.equal(formatTime(-30), '23:30');
  assert.equal(formatTime(24 * 60 + 5), '00:05');
  assert.throws(() => parseTime('25:00'));
  assert.throws(() => parseTime('abc'));
});

test('departureTime одзема патување и резерва', () => {
  assert.equal(departureTime('20:00', 25, 15), '19:20');
  assert.equal(departureTime('00:10', 20, 15), '23:35');
  assert.equal(departureTime('20:00', -5, 0), '20:00');
});

test('schedule пресметува крај и враќање дома', () => {
  const s = schedule({ showtime: '21:00', durationMinutes: 148, travelMinutes: 20 });
  assert.deepEqual(s, { leave: '20:25', start: '21:00', end: '23:43', home: '00:03' });
});

test('costs: автобус е по човек, такси е заедничко', () => {
  const bus = costs({ people: 3, ticketPrice: 300, snackPrice: 250, transport: 'bus', transportPrice: 80 });
  assert.deepEqual(bus, { people: 3, tickets: 900, snacks: 750, travel: 240, total: 1890, perPerson: 630 });

  const taxi = costs({ people: 4, ticketPrice: 300, transport: 'taxi', transportPrice: 500 });
  assert.equal(taxi.travel, 500);
  assert.equal(taxi.perPerson, 425);

  const walk = costs({ people: 2, ticketPrice: 150, transport: 'walk', transportPrice: 999 });
  assert.equal(walk.travel, 0);
});

test('costs заокружува нагоре и бара барем еден човек', () => {
  const c = costs({ people: 0, ticketPrice: 100, transport: 'taxi', transportPrice: 101 });
  assert.equal(c.people, 1);
  assert.equal(costs({ people: 3, ticketPrice: 100, transport: 'taxi', transportPrice: 100 }).perPerson, 134);
});

test('parseFriends', () => {
  assert.deepEqual(parseFriends(' Ана, Марко ,,\nЕлена '), ['Ана', 'Марко', 'Елена']);
  assert.deepEqual(parseFriends(''), []);
});

test('planSummary содржи клучни информации', () => {
  const text = planSummary({
    movieTitle: 'Филм',
    cinemaName: 'Кино',
    date: '2026-10-11',
    transport: 'bus',
    friends: ['Ана'],
    notes: '',
    schedule: { leave: '18:00', start: '18:30', end: '20:30', home: '21:00' },
    costs: { total: 900, perPerson: 450 },
  });
  assert.match(text, /Тргнуваме во 18:00 \(Автобус\)/);
  assert.match(text, /450 ден\. по човек/);
  assert.match(text, /Со: Ана/);
});
