/**
 * Meal Planner - plan meals across days & track recipes.
 *
 * Design goals:
 * - Simple weekly/daily meal slots.
 * - Recipes library which can be reused in planning.
 * - Room for macros or tags later.
 */

import { defineTable, column, NOW } from "astro:db";

export const Recipes = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),

    title: column.text(),                         // "Oats Upma", "Grilled Chicken"
    description: column.text({ optional: true }),
    cuisine: column.text({ optional: true }),     // "Indian", "Italian"
    mealType: column.text({ optional: true }),    // "breakfast", "lunch", "dinner", "snack"
    tags: column.text({ optional: true }),        // comma-separated or JSON

    ingredients: column.text({ optional: true }), // free-text or markdown list
    instructions: column.text({ optional: true }),// steps

    calories: column.number({ optional: true }),
    proteinGrams: column.number({ optional: true }),
    carbsGrams: column.number({ optional: true }),
    fatGrams: column.number({ optional: true }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const MealPlans = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),

    name: column.text({ optional: true }),        // "Week 1 Clean Eating"
    startDate: column.date({ optional: true }),
    endDate: column.date({ optional: true }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const MealPlanEntries = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    mealPlanId: column.text({
      references: () => MealPlans.columns.id,
    }),
    userId: column.text(),

    date: column.date(),                          // specific day
    mealSlot: column.text(),                      // "breakfast", "lunch", "dinner", "snack"

    recipeId: column.text({
      references: () => Recipes.columns.id,
      optional: true,
    }),
    customTitle: column.text({ optional: true }), // e.g. "Hotel food", "Order outside"
    notes: column.text({ optional: true }),

    createdAt: column.date({ default: NOW }),
  },
});

export const tables = {
  Recipes,
  MealPlans,
  MealPlanEntries,
} as const;
