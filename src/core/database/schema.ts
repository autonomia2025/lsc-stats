import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const leagues = pgTable('leagues', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const seasons = pgTable('seasons', {
  id: serial('id').primaryKey(),
  leagueId: integer('league_id').references(() => leagues.id).notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  seasonId: integer('season_id').references(() => seasons.id).notNull(),
  homeTeamId: integer('home_team_id').references(() => teams.id).notNull(),
  awayTeamId: integer('away_team_id').references(() => teams.id).notNull(),
  status: text('status').notNull().default('SCHEDULED'),
  scheduledDate: timestamp('scheduled_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const matchEvents = pgTable('match_events', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id').references(() => matches.id).notNull(),
  type: text('type').notNull(),
  period: text('period'),
  clock: text('clock'),
  primaryPlayerId: integer('primary_player_id').references(() => players.id),
  secondaryPlayerId: integer('secondary_player_id').references(() => players.id),
  payload: jsonb('payload'),
  timestamp: timestamp('timestamp').defaultNow(),
});
