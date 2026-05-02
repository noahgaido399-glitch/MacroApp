import { MacroFormValues } from '../components/MacroForm';

type OpenFoodFactsResponse = {
  product?: {
    brands?: string;
    product_name?: string;
    product_name_en?: string;
    serving_quantity?: string | number;
    serving_size?: string;
    nutriments?: {
      carbohydrates?: number;
      carbohydrates_100g?: number;
      carbohydrates_serving?: number;
      'energy-kcal'?: number;
      'energy-kcal_100g'?: number;
      'energy-kcal_serving'?: number;
      fat?: number;
      fat_100g?: number;
      fat_serving?: number;
      proteins?: number;
      proteins_100g?: number;
      proteins_serving?: number;
    };
  };
  status?: number;
  status_verbose?: string;
};

export type FoodLookupResult = {
  barcode: string;
  values: MacroFormValues;
  source: string;
};

function firstNumber(...values: Array<number | string | undefined>) {
  for (const value of values) {
    const parsed = typeof value === 'string' ? Number(value) : value;
    if (typeof parsed === 'number' && Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function rounded(value: number) {
  return String(Math.round(value * 10) / 10);
}

export async function lookupFoodByBarcode(barcode: string): Promise<FoodLookupResult> {
  const trimmedBarcode = barcode.trim();
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(trimmedBarcode)}.json`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'MacroStreak/1.0 (local-mvp)',
    },
  });

  if (!response.ok) {
    throw new Error('Food lookup failed. Check your connection and try again.');
  }

  const data = (await response.json()) as OpenFoodFactsResponse;
  if (data.status !== 1 || !data.product) {
    throw new Error('No food found for this barcode.');
  }

  const product = data.product;
  const nutriments = product.nutriments ?? {};
  const name = product.product_name_en || product.product_name || product.brands || `Barcode ${trimmedBarcode}`;
  const servingAmount = product.serving_size || (product.serving_quantity ? `${product.serving_quantity} g` : '1 serving');

  return {
    barcode: trimmedBarcode,
    source: 'Open Food Facts',
    values: {
      name,
      calories: rounded(firstNumber(nutriments['energy-kcal_serving'], nutriments['energy-kcal'], nutriments['energy-kcal_100g'])),
      protein: rounded(firstNumber(nutriments.proteins_serving, nutriments.proteins, nutriments.proteins_100g)),
      carbs: rounded(firstNumber(nutriments.carbohydrates_serving, nutriments.carbohydrates, nutriments.carbohydrates_100g)),
      fats: rounded(firstNumber(nutriments.fat_serving, nutriments.fat, nutriments.fat_100g)),
      servingAmount,
      mealCategory: 'snack',
    },
  };
}
