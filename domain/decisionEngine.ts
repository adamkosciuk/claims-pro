
import { Claim } from '../types';
import { getSLALevel, BlockingReason, inferBlockingReason } from './claimEngine';

export enum ActionType {
  CALL_CLIENT = 'CALL_CLIENT',
  CALL_WORKSHOP = 'CALL_WORKSHOP',
  SEND_REMINDER = 'SEND_REMINDER',
  ESCALATE = 'ESCALATE',
  INTERNAL_CHASE = 'INTERNAL_CHASE',
  ASSIGN_TASK = 'ASSIGN_TASK',
  WAIT = 'WAIT'
}

export interface ActionRecommendation {
  type: ActionType;
  label: string;
  explanation: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface BusinessRule {
  name: string;
  predicate: (claim: Claim) => boolean;
  recommendation: (claim: Claim) => ActionRecommendation;
}

/**
 * DEFINICJA REGUŁ BIZNESOWYCH (Kolejność ma znaczenie - od góry najwyższy priorytet)
 */
const RULES: BusinessRule[] = [
  {
    name: 'Krytyczny Zastój Warsztatu',
    predicate: (c) => getSLALevel(c.inactivityDays) === 'HIGH' && inferBlockingReason(c) === BlockingReason.WORKSHOP,
    recommendation: () => ({
      type: ActionType.ESCALATE,
      label: 'Eskalacja do Kierownika Serwisu',
      explanation: 'Szkoda stoi w warsztacie powyżej 7 dni. Wymagana interwencja na szczeblu decyzyjnym.',
      priority: 'CRITICAL'
    })
  },
  {
    name: 'Krytyczny Brak Dokumentów Klienta',
    predicate: (c) => getSLALevel(c.inactivityDays) === 'HIGH' && inferBlockingReason(c) === BlockingReason.CLIENT,
    recommendation: () => ({
      type: ActionType.CALL_CLIENT,
      label: 'Telefon do Klienta (Finalny)',
      explanation: 'Klient nie dostarczył dokumentów od ponad tygodnia. Należy poinformować o ryzyku wstrzymania naprawy.',
      priority: 'CRITICAL'
    })
  },
  {
    name: 'Oczekiwanie na Decyzję (Red)',
    predicate: (c) => getSLALevel(c.inactivityDays) === 'HIGH' && inferBlockingReason(c) === BlockingReason.DECISION,
    recommendation: () => ({
      type: ActionType.INTERNAL_CHASE,
      label: 'Ponaglenie Likwidatora / Eksperta',
      explanation: 'Wycena lub kosztorys czekają na akceptację wewnętrzną zbyt długo.',
      priority: 'HIGH'
    })
  },
  {
    name: 'Nowe Zlecenie',
    predicate: (c) => inferBlockingReason(c) === BlockingReason.NEW,
    recommendation: () => ({
      type: ActionType.ASSIGN_TASK,
      label: 'Inicjalizacja Procesu',
      explanation: 'Nowa szkoda w systemie. Należy wykonać pierwsze połączenie i potwierdzić przyjęcie do naprawy.',
      priority: 'MEDIUM'
    })
  },
  {
    name: 'Standardowe Monitorowanie Warsztatu',
    predicate: (c) => getSLALevel(c.inactivityDays) === 'MEDIUM' && inferBlockingReason(c) === BlockingReason.WORKSHOP,
    recommendation: () => ({
      type: ActionType.CALL_WORKSHOP,
      label: 'Kontakt z Warsztatem',
      explanation: 'Szkoda w toku naprawy, brak aktualizacji od 3 dni. Potwierdź przewidywany termin zakończenia.',
      priority: 'MEDIUM'
    })
  },
  {
    name: 'Przypomnienie dla Klienta',
    predicate: (c) => getSLALevel(c.inactivityDays) === 'MEDIUM' && inferBlockingReason(c) === BlockingReason.CLIENT,
    recommendation: () => ({
      type: ActionType.SEND_REMINDER,
      label: 'Wyślij SMS / Email',
      explanation: 'Przypomnienie o brakujących upoważnieniach lub oświadczeniach.',
      priority: 'LOW'
    })
  },
  {
    name: 'Szkoda Prawidłowa',
    predicate: () => true, // Fallback rule
    recommendation: () => ({
      type: ActionType.WAIT,
      label: 'Dalszy Monitoring',
      explanation: 'Szkoda procesowana zgodnie z harmonogramem SLA. Brak wymaganych akcji dzisiaj.',
      priority: 'LOW'
    })
  }
];

export const getRecommendedAction = (claim: Claim): ActionRecommendation => {
  const rule = RULES.find(r => r.predicate(claim));
  return rule ? rule.recommendation(claim) : RULES[RULES.length - 1].recommendation(claim);
};
