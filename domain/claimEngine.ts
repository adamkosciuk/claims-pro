
import { Claim, ComparisonStatus } from '../types';

export const SLA_THRESHOLDS = {
  WARNING: 3,
  CRITICAL: 7
};

export type SLALevel = 'LOW' | 'MEDIUM' | 'HIGH';

export enum BlockingReason {
  CLIENT = 'Oczekiwanie na Klienta',
  WORKSHOP = 'Oczekiwanie na Serwis',
  DECISION = 'Weryfikacja / Decyzja',
  EXTERNAL = 'Partner Zewnętrzny',
  INTERNAL = 'Zasoby Wewnętrzne',
  NEW = 'Nowe Zlecenie',
  UNKNOWN = 'Brak precyzyjnego powodu'
}

/**
 * Zwraca poziom SLA na podstawie dni bezruchu
 */
export const getSLALevel = (inactivityDays: number): SLALevel => {
  if (inactivityDays > SLA_THRESHOLDS.CRITICAL) return 'HIGH';
  if (inactivityDays >= SLA_THRESHOLDS.WARNING) return 'MEDIUM';
  return 'LOW';
};

/**
 * Heurystyka określająca powód zastoju na podstawie statusu i komentarza
 */
export const inferBlockingReason = (claim: Partial<Claim>): BlockingReason => {
  const text = `${claim.status} ${claim.lastComment}`.toLowerCase();
  
  if (text.includes('nowe')) return BlockingReason.NEW;
  
  // Słowa kluczowe dla serwisu
  if (/warsztat|serwis|blacharni|napraw|częśc|czesci|technolog/.test(text)) {
    return BlockingReason.WORKSHOP;
  }
  
  // Słowa kluczowe dla klienta
  if (/klient|poszkodowan|użytkownik|uzytkownik|dokument|upoważnien/.test(text)) {
    return BlockingReason.CLIENT;
  }
  
  // Słowa kluczowe dla decyzji
  if (/decyzj|akceptacj|zatwierdz|weryfikacj|kosztorys|wycen/.test(text)) {
    return BlockingReason.DECISION;
  }
  
  // Słowa kluczowe dla partnerów zewnętrznych (np. ubezpieczalnie)
  if (/pzu|warta|ergo|hestia|link4|ubezpieczyciel|tuwr/.test(text)) {
    return BlockingReason.EXTERNAL;
  }

  return BlockingReason.UNKNOWN;
};

/**
 * Oblicza priorytet operacyjny (0-100)
 */
export const calculateOperationalPriority = (claim: Claim): number => {
  let score = 0;
  // Dni bezruchu to główny czynnik
  score += Math.min(60, claim.inactivityDays * 5);
  // Wiek szkody dokłada wagę
  score += Math.min(20, claim.age / 10);
  // Specyficzne powody zastoju podbijają priorytet
  const reason = inferBlockingReason(claim);
  if (reason === BlockingReason.DECISION) score += 20;
  if (reason === BlockingReason.NEW) score += 15;
  
  return Math.min(100, score);
};
