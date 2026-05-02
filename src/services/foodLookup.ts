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

type UsdaSearchResponse = {
  foods?: UsdaFood[];
  totalHits?: number;
};

type UsdaFood = {
  brandName?: string;
  brandOwner?: string;
  description?: string;
  foodNutrients?: Array<{
    nutrientId?: number;
    nutrientName?: string;
    unitName?: string;
    value?: number;
  }>;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
};

type UpcItemDbResponse = {
  code?: string;
  items?: Array<{
    brand?: string;
    description?: string;
    ean?: string;
    title?: string;
    upc?: string;
  }>;
  total?: number;
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

function barcodeVariants(barcode: string) {
  const variants = new Set([barcode]);
  if (barcode.length === 13 && barcode.startsWith('0')) {
    variants.add(barcode.slice(1));
  }
  if (barcode.length === 12) {
    variants.add(`0${barcode}`);
  }
  return [...variants];
}

function nutrient(food: UsdaFood, nutrientId: number) {
  return food.foodNutrients?.find((item) => item.nutrientId === nutrientId)?.value ?? 0;
}

function servingScale(food: UsdaFood) {
  const unit = food.servingSizeUnit?.toLowerCase();
  if (!food.servingSize || !unit) {
    return 1;
  }
  if (['g', 'grm', 'ml', 'mlt'].includes(unit)) {
    return food.servingSize / 100;
  }
  return 1;
}

function resultFromUsdaFood(food: UsdaFood, barcode: string, source: string): FoodLookupResult | null {
  if (!food.description) {
    return null;
  }

  const scale = servingScale(food);
  const servingAmount = food.servingSize && food.servingSizeUnit ? `${food.servingSize} ${food.servingSizeUnit.toLowerCase()}` : '1 serving';

  return {
    barcode,
    source,
    values: {
      name: food.description,
      calories: rounded(nutrient(food, 1008) * scale),
      protein: rounded(nutrient(food, 1003) * scale),
      carbs: rounded(nutrient(food, 1005) * scale),
      fats: rounded(nutrient(food, 1004) * scale),
      servingAmount,
      mealCategory: 'snack',
    },
  };
}

async function lookupOpenFoodFacts(barcode: string): Promise<FoodLookupResult | null> {
  for (const variant of barcodeVariants(barcode)) {
    const urls = [
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(variant)}.json`,
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(variant)}.json`,
    ];

    for (const url of urls) {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as OpenFoodFactsResponse;
      if (data.status !== 1 || !data.product) {
        continue;
      }

      const product = data.product;
      const nutriments = product.nutriments ?? {};
      const name = product.product_name_en || product.product_name || product.brands || `Barcode ${variant}`;
      const servingAmount = product.serving_size || (product.serving_quantity ? `${product.serving_quantity} g` : '1 serving');

      return {
        barcode: variant,
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
  }

  return null;
}

async function searchUsda(query: string, barcode: string, source: string) {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(
    query,
  )}&dataType=Branded&pageSize=5`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as UsdaSearchResponse;
  const food = data.foods?.[0];
  return food ? resultFromUsdaFood(food, barcode, source) : null;
}

async function lookupUsdaByBarcode(barcode: string) {
  for (const variant of barcodeVariants(barcode)) {
    const result = await searchUsda(variant, variant, 'USDA FoodData Central');
    if (result) {
      return result;
    }
  }
  return null;
}

async function lookupUpcItemDbThenUsda(barcode: string) {
  for (const variant of barcodeVariants(barcode)) {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(variant)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      continue;
    }

    const data = (await response.json()) as UpcItemDbResponse;
    const item = data.items?.[0];
    const query = item?.title || item?.description;
    if (!query) {
      continue;
    }

    const usdaResult = await searchUsda(query, item.upc || item.ean || variant, 'UPCitemdb + USDA FoodData Central');
    if (usdaResult) {
      return usdaResult;
    }

    const calorieMatch = item.description?.match(/(\d+(?:\.\d+)?)\s*(?:calories?|cal|kcal)/i);
    return {
      barcode: item.upc || item.ean || variant,
      source: 'UPCitemdb',
      values: {
        name: query,
        calories: calorieMatch?.[1] ?? '0',
        protein: '0',
        carbs: item.description?.match(/zero sugar/i) ? '0' : '0',
        fats: '0',
        servingAmount: '1 serving',
        mealCategory: 'snack' as const,
      },
    };
  }
  return null;
}

export async function lookupFoodByBarcode(barcode: string): Promise<FoodLookupResult> {
  const trimmedBarcode = barcode.replace(/\D/g, '');
  let networkError: unknown = null;

  for (const lookup of [lookupOpenFoodFacts, lookupUsdaByBarcode, lookupUpcItemDbThenUsda]) {
    try {
      const result = await lookup(trimmedBarcode);
      if (result) {
        return result;
      }
    } catch (error) {
      networkError = error;
    }
  }

  if (networkError) {
    throw new Error('Food lookup could not reach Open Food Facts. Check your connection and try again.');
  }

  throw new Error('No food found for this barcode in Open Food Facts, USDA, or UPCitemdb.');
}
