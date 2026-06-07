import type { FoodItem } from "@/types";

export type NutritionGoalTone = "build_muscle" | "fat_loss" | "balanced" | "recovery";

export type NutritionRecipe = {
  id: string;
  title: string;
  calories: number;
  protein: number;
  prepMinutes: number;
  description: string;
  badge: string;
  ingredients: string[];
  steps: string[];
  whyItFits: string;
  primaryCta: string;
  secondaryCta: string;
  partnerKey: NutritionPartnerKey;
};

export type NutritionPartnerKey =
  | "hungryroot"
  | "hellofresh"
  | "thrive_market"
  | "daily_harvest";

export type ConvenienceCard = {
  title: string;
  description: string;
  cta: string;
  accent: string;
  partnerKey: NutritionPartnerKey;
};

export type PantryCard = {
  title: string;
  description: string;
  cta: string;
  partnerKey: NutritionPartnerKey;
};

export const NUTRITION_PARTNERS: Record<
  NutritionPartnerKey,
  { name: string; url: string; category: string }
> = {
  hungryroot: {
    name: "Hungryroot",
    url: "https://www.hungryroot.com/",
    category: "Ingredient Delivery",
  },
  hellofresh: {
    name: "HelloFresh",
    url: "https://www.hellofresh.com/",
    category: "Meal Kit",
  },
  thrive_market: {
    name: "Thrive Market",
    url: "https://thrivemarket.com/",
    category: "Pantry",
  },
  daily_harvest: {
    name: "Daily Harvest",
    url: "https://www.daily-harvest.com/",
    category: "Quick Recovery",
  },
};

const RECIPES: Record<string, NutritionRecipe> = {
  chicken_rice_power_bowl: {
    id: "chicken_rice_power_bowl",
    title: "Chicken Rice Power Bowl",
    calories: 690,
    protein: 49,
    prepMinutes: 25,
    description: "A strong post-workout option with steady carbs and high protein.",
    badge: "Post-Workout",
    ingredients: ["6 oz chicken breast", "1 cup cooked rice", "1 cup broccoli", "1/2 avocado", "Lemon garlic dressing"],
    steps: [
      "Cook the chicken until fully done.",
      "Prepare rice and roast or steam the broccoli.",
      "Plate everything together and finish with avocado and dressing.",
    ],
    whyItFits: "Best after strength sessions when you want recovery without overcomplicating dinner.",
    primaryCta: "View Recipe",
    secondaryCta: "Get Ingredients",
    partnerKey: "hungryroot",
  },
  salmon_recovery_bowl: {
    id: "salmon_recovery_bowl",
    title: "Salmon Recovery Bowl",
    calories: 540,
    protein: 38,
    prepMinutes: 20,
    description: "Best after harder training days when recovery matters most.",
    badge: "Recovery",
    ingredients: ["5 oz salmon", "3/4 cup rice or quinoa", "Asparagus", "Cucumber", "Lemon herb dressing"],
    steps: [
      "Bake or pan-sear the salmon.",
      "Cook the grain and prep the vegetables.",
      "Assemble the bowl and finish with lemon herb dressing.",
    ],
    whyItFits: "Protein plus healthy fats make this one of the strongest recovery meals in the system.",
    primaryCta: "View Recipe",
    secondaryCta: "Get Ingredients",
    partnerKey: "hellofresh",
  },
  greek_yogurt_power_bowl: {
    id: "greek_yogurt_power_bowl",
    title: "Greek Yogurt Power Bowl",
    calories: 410,
    protein: 33,
    prepMinutes: 5,
    description: "Fast protein support for mornings or late post-lift recovery.",
    badge: "Fast Breakfast",
    ingredients: ["1 cup Greek yogurt", "1 scoop protein powder", "Frozen berries", "Chia seeds", "Granola or oats"],
    steps: [
      "Mix yogurt and protein powder until smooth.",
      "Top with berries, chia, and granola or oats.",
      "Serve immediately or chill for a few minutes.",
    ],
    whyItFits: "Easy protein without much prep, especially when time is tight.",
    primaryCta: "Make Now",
    secondaryCta: "Shop Ingredients",
    partnerKey: "thrive_market",
  },
  turkey_taco_salad: {
    id: "turkey_taco_salad",
    title: "Turkey Taco Salad",
    calories: 470,
    protein: 41,
    prepMinutes: 18,
    description: "High satiety, lighter feel, and easy to fit into a fat-loss plan.",
    badge: "High Satiety",
    ingredients: ["5 oz lean ground turkey", "Romaine", "Black beans", "Pico de gallo", "Avocado", "Greek yogurt dressing"],
    steps: [
      "Cook the turkey with taco seasoning.",
      "Assemble romaine, beans, pico, and avocado.",
      "Top with turkey and Greek yogurt dressing.",
    ],
    whyItFits: "High protein and lower calorie density make it ideal when cutting without feeling deprived.",
    primaryCta: "View Recipe",
    secondaryCta: "Quick Grocery Option",
    partnerKey: "hungryroot",
  },
  salmon_cauli_bowl: {
    id: "salmon_cauli_bowl",
    title: "Salmon Cauli Bowl",
    calories: 430,
    protein: 35,
    prepMinutes: 18,
    description: "A leaner recovery dinner with strong protein and lighter carbs.",
    badge: "Lean Recovery",
    ingredients: ["5 oz salmon", "Cauliflower rice", "Asparagus", "Spinach", "Lemon pepper seasoning"],
    steps: [
      "Cook the salmon until flaky.",
      "Heat cauliflower rice and prep the vegetables.",
      "Assemble in a bowl with lemon pepper seasoning.",
    ],
    whyItFits: "A lighter option for fat-loss phases that still supports workout recovery.",
    primaryCta: "View Recipe",
    secondaryCta: "Get Ingredients",
    partnerKey: "hellofresh",
  },
  berry_protein_smoothie: {
    id: "berry_protein_smoothie",
    title: "Berry Protein Smoothie",
    calories: 390,
    protein: 32,
    prepMinutes: 5,
    description: "Easy recovery fuel when you’re short on time.",
    badge: "Quick Recovery",
    ingredients: ["Protein powder or Greek yogurt", "Frozen berries", "Banana", "Spinach", "Chia seeds", "Almond milk"],
    steps: [
      "Add all ingredients to a blender.",
      "Blend until smooth.",
      "Serve immediately.",
    ],
    whyItFits: "Fast recovery with protein and fruit when you need something useful right away.",
    primaryCta: "Make Now",
    secondaryCta: "Shop Ingredients",
    partnerKey: "daily_harvest",
  },
  greek_yogurt_recovery_bowl: {
    id: "greek_yogurt_recovery_bowl",
    title: "Greek Yogurt Recovery Bowl",
    calories: 320,
    protein: 28,
    prepMinutes: 4,
    description: "Simple, high-protein, and great after morning workouts.",
    badge: "Fast Protein",
    ingredients: ["1 cup Greek yogurt", "Honey", "Blueberries", "Walnuts", "Cinnamon"],
    steps: [
      "Add yogurt to a bowl.",
      "Top with berries, walnuts, and cinnamon.",
      "Finish with a small drizzle of honey if wanted.",
    ],
    whyItFits: "Low effort and protein-forward when you want recovery support without cooking.",
    primaryCta: "Make Now",
    secondaryCta: "Quick Healthy Option",
    partnerKey: "daily_harvest",
  },
};

const GOAL_RECIPE_MAP: Record<NutritionGoalTone, NutritionRecipe[]> = {
  build_muscle: [
    RECIPES.chicken_rice_power_bowl,
    RECIPES.salmon_recovery_bowl,
    RECIPES.greek_yogurt_power_bowl,
  ],
  fat_loss: [
    RECIPES.turkey_taco_salad,
    RECIPES.salmon_cauli_bowl,
    RECIPES.berry_protein_smoothie,
  ],
  balanced: [
    RECIPES.chicken_rice_power_bowl,
    RECIPES.turkey_taco_salad,
    RECIPES.berry_protein_smoothie,
  ],
  recovery: [
    RECIPES.salmon_recovery_bowl,
    RECIPES.berry_protein_smoothie,
    RECIPES.greek_yogurt_recovery_bowl,
  ],
};

export const QUICK_RECOVERY_RECIPES: NutritionRecipe[] = [
  RECIPES.berry_protein_smoothie,
  RECIPES.greek_yogurt_recovery_bowl,
];

export const CONVENIENCE_CARDS: ConvenienceCard[] = [
  {
    title: "Ingredient Delivery",
    description: "Cook high-protein meals with less planning and less friction.",
    cta: "Get Ingredients",
    accent: "border-blue-400/20 bg-blue-500/10 text-blue-100",
    partnerKey: "hungryroot",
  },
  {
    title: "Meal Kit Option",
    description: "A simple way to stay consistent through the week when life gets busy.",
    cta: "Try a Meal Kit",
    accent: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100",
    partnerKey: "hellofresh",
  },
  {
    title: "Fast Recovery Picks",
    description: "Good for busy days when convenience matters more than prep.",
    cta: "Explore Quick Options",
    accent: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
    partnerKey: "daily_harvest",
  },
];

export const PANTRY_CARDS: PantryCard[] = [
  {
    title: "Protein Staples",
    description: "Greek yogurt, tuna, chicken, eggs, whey, cottage cheese",
    cta: "Restock Basics",
    partnerKey: "thrive_market",
  },
  {
    title: "Smart Carbs",
    description: "Rice, oats, potatoes, quinoa, wraps, fruit",
    cta: "Shop Staples",
    partnerKey: "thrive_market",
  },
  {
    title: "Healthy Add-Ons",
    description: "Avocado, olive oil, nuts, chia, frozen berries",
    cta: "Build Cart",
    partnerKey: "thrive_market",
  },
];

export function inferNutritionGoal(activityGoal?: string | null): NutritionGoalTone {
  const goalText = (activityGoal ?? "").toLowerCase();
  if (goalText.includes("fat") || goalText.includes("lose")) return "fat_loss";
  if (goalText.includes("recover") || goalText.includes("mobility")) return "recovery";
  if (goalText.includes("muscle") || goalText.includes("performance")) return "build_muscle";
  return "balanced";
}

export function getNutritionRecipesForGoal(goal: NutritionGoalTone): NutritionRecipe[] {
  return GOAL_RECIPE_MAP[goal];
}

export function openNutritionPartner(partnerKey: NutritionPartnerKey): void {
  if (typeof window === "undefined") return;
  window.open(NUTRITION_PARTNERS[partnerKey].url, "_blank", "noopener,noreferrer");
}

export function buildRecipeAsFoodItem(recipe: NutritionRecipe): FoodItem {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${recipe.id}-${Date.now()}`,
    name: recipe.title,
    calories: recipe.calories,
    protein: recipe.protein,
    carbs: Math.round(recipe.calories * 0.35 / 4),
    fats: Math.round(recipe.calories * 0.25 / 9),
    servingSize: "1 serving",
    timestamp: new Date().toISOString(),
  };
}
