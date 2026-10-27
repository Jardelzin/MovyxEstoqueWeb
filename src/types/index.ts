export interface Product {
  id: number;
  category: string;
  model: string;
}

export interface Period {
  id: number;
  date: string;
  label: string;
  values?: Record<string, number>;
}