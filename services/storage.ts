const STORAGE_KEY = 'cashflow_app_v1';

export const loadState = <T>(initialState: T): T => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return initialState;
    }
    const parsed = JSON.parse(serializedState);
    // Revive dates
    if (parsed.transactions) {
      parsed.transactions = parsed.transactions.map((t: any) => ({
        ...t,
        date: new Date(t.date),
      }));
    }
    // Merge to ensure new fields like currency/hasOnboarded exist if loading old state
    return { ...initialState, ...parsed };
  } catch (err) {
    console.error("Could not load state", err);
    return initialState;
  }
};

export const saveState = (state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    console.error("Could not save state", err);
  }
};

export const clearState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Could not clear state", err);
  }
};