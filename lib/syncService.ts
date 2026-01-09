
import { Claim } from '../types';

const STORAGE_KEY = 'claims_pro_shared_v1';

export const syncService = {
  /**
   * Pobiera wszystkie szkody z centralnej bazy
   */
  async fetchAllClaims(): Promise<Claim[]> {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  },

  /**
   * Inteligentnie optymalizuje dane przed zapisem
   */
  optimizeData(claims: Claim[]): Claim[] {
    const availableDates = Array.from(new Set(claims.map(c => c.importDate))).sort().reverse();
    
    // Zatrzymujemy pełne dane tylko dla 3 najnowszych dat
    const keepFullDataFor = availableDates.slice(0, 3);

    return claims.map(claim => {
      if (keepFullDataFor.includes(claim.importDate)) {
        return claim; // Zostawiamy pełny rekord
      }
      
      // Dla starszych rekordów usuwamy ciężkie pola tekstowe
      const { lastComment, ...lightClaim } = claim;
      return lightClaim as Claim;
    });
  },

  /**
   * Zapisuje nowe szkody z automatyczną optymalizacją
   */
  async saveClaims(claims: Claim[]): Promise<{ success: boolean; error?: string; savedCount: number }> {
    try {
      // 1. Optymalizujemy stare dane przed zapisem
      const optimized = this.optimizeData(claims);
      const data = JSON.stringify(optimized);
      
      localStorage.setItem(STORAGE_KEY, data);
      
      // Dispatch eventu
      window.dispatchEvent(new CustomEvent('claims_updated', { detail: optimized }));
      
      return { 
        success: true, 
        savedCount: optimized.length 
      };
    } catch (e: any) {
      console.error("Storage Error:", e);
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        return { 
          success: false, 
          savedCount: 0,
          error: "Baza danych jest pełna. System nie może już bardziej zoptymalizować danych. Usuń najstarsze miesiące." 
        };
      }
      return { success: false, savedCount: 0, error: "Błąd zapisu danych." };
    }
  },

  /**
   * Zwraca szacunkowe zużycie pamięci w procentach
   */
  getStorageUsage(): number {
    const saved = localStorage.getItem(STORAGE_KEY) || "";
    const bytes = saved.length * 2; // UTF-16
    const limit = 5 * 1024 * 1024; // 5MB
    return Math.min(100, Math.round((bytes / limit) * 100));
  },

  /**
   * Czyści centralną bazę
   */
  async clearAllData(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('claims_updated', { detail: [] }));
  }
};
