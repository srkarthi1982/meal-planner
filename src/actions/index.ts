import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { and, db, eq, MealPlanEntries, MealPlans, Recipes } from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

async function assertMealPlanOwnership(mealPlanId: string, userId: string) {
  const mealPlan = await db
    .select()
    .from(MealPlans)
    .where(and(eq(MealPlans.id, mealPlanId), eq(MealPlans.userId, userId)))
    .get();

  if (!mealPlan) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Meal plan not found.",
    });
  }

  return mealPlan;
}

export const server = {
  createRecipe: defineAction({
    input: z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      cuisine: z.string().optional(),
      mealType: z.string().optional(),
      tags: z.string().optional(),
      ingredients: z.string().optional(),
      instructions: z.string().optional(),
      calories: z.number().int().positive().optional(),
      proteinGrams: z.number().int().nonnegative().optional(),
      carbsGrams: z.number().int().nonnegative().optional(),
      fatGrams: z.number().int().nonnegative().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();

      const recipe = {
        id: crypto.randomUUID(),
        userId: user.id,
        title: input.title,
        description: input.description,
        cuisine: input.cuisine,
        mealType: input.mealType,
        tags: input.tags,
        ingredients: input.ingredients,
        instructions: input.instructions,
        calories: input.calories,
        proteinGrams: input.proteinGrams,
        carbsGrams: input.carbsGrams,
        fatGrams: input.fatGrams,
        createdAt: now,
        updatedAt: now,
      } as const;

      await db.insert(Recipes).values(recipe);

      return {
        success: true,
        data: { recipe },
      };
    },
  }),

  updateRecipe: defineAction({
    input: z
      .object({
        id: z.string().min(1),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        cuisine: z.string().optional(),
        mealType: z.string().optional(),
        tags: z.string().optional(),
        ingredients: z.string().optional(),
        instructions: z.string().optional(),
        calories: z.number().int().positive().optional(),
        proteinGrams: z.number().int().nonnegative().optional(),
        carbsGrams: z.number().int().nonnegative().optional(),
        fatGrams: z.number().int().nonnegative().optional(),
      })
      .refine(
        (value) =>
          value.title !== undefined ||
          value.description !== undefined ||
          value.cuisine !== undefined ||
          value.mealType !== undefined ||
          value.tags !== undefined ||
          value.ingredients !== undefined ||
          value.instructions !== undefined ||
          value.calories !== undefined ||
          value.proteinGrams !== undefined ||
          value.carbsGrams !== undefined ||
          value.fatGrams !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);
      const existing = await db
        .select()
        .from(Recipes)
        .where(and(eq(Recipes.id, input.id), eq(Recipes.userId, user.id)))
        .get();

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Recipe not found.",
        });
      }

      const now = new Date();
      const updateData = {
        title: input.title,
        description: input.description,
        cuisine: input.cuisine,
        mealType: input.mealType,
        tags: input.tags,
        ingredients: input.ingredients,
        instructions: input.instructions,
        calories: input.calories,
        proteinGrams: input.proteinGrams,
        carbsGrams: input.carbsGrams,
        fatGrams: input.fatGrams,
        updatedAt: now,
      };

      await db
        .update(Recipes)
        .set(updateData)
        .where(and(eq(Recipes.id, input.id), eq(Recipes.userId, user.id)));

      return {
        success: true,
        data: {
          recipe: { ...existing, ...updateData },
        },
      };
    },
  }),

  deleteRecipe: defineAction({
    input: z.object({ id: z.string().min(1) }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const recipe = await db
        .select()
        .from(Recipes)
        .where(and(eq(Recipes.id, input.id), eq(Recipes.userId, user.id)))
        .get();

      if (!recipe) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Recipe not found.",
        });
      }

      await db
        .delete(Recipes)
        .where(and(eq(Recipes.id, input.id), eq(Recipes.userId, user.id)));

      return {
        success: true,
        data: { id: input.id },
      };
    },
  }),

  listRecipes: defineAction({
    input: z.object({}).optional(),
    handler: async (_input, context) => {
      const user = requireUser(context);

      const recipes = await db
        .select()
        .from(Recipes)
        .where(eq(Recipes.userId, user.id));

      return {
        success: true,
        data: {
          items: recipes,
          total: recipes.length,
        },
      };
    },
  }),

  createMealPlan: defineAction({
    input: z.object({
      name: z.string().min(1).optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();

      const mealPlan = {
        id: crypto.randomUUID(),
        userId: user.id,
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        createdAt: now,
        updatedAt: now,
      } as const;

      await db.insert(MealPlans).values(mealPlan);

      return {
        success: true,
        data: { mealPlan },
      };
    },
  }),

  updateMealPlan: defineAction({
    input: z
      .object({
        id: z.string().min(1),
        name: z.string().min(1).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      })
      .refine(
        (value) =>
          value.name !== undefined ||
          value.startDate !== undefined ||
          value.endDate !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);
      const mealPlan = await assertMealPlanOwnership(input.id, user.id);
      const now = new Date();

      const updateData = {
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        updatedAt: now,
      };

      await db
        .update(MealPlans)
        .set(updateData)
        .where(and(eq(MealPlans.id, input.id), eq(MealPlans.userId, user.id)));

      return {
        success: true,
        data: {
          mealPlan: { ...mealPlan, ...updateData },
        },
      };
    },
  }),

  deleteMealPlan: defineAction({
    input: z.object({ id: z.string().min(1) }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await assertMealPlanOwnership(input.id, user.id);

      await db
        .delete(MealPlans)
        .where(and(eq(MealPlans.id, input.id), eq(MealPlans.userId, user.id)));

      return {
        success: true,
        data: { id: input.id },
      };
    },
  }),

  listMealPlans: defineAction({
    input: z.object({}).optional(),
    handler: async (_input, context) => {
      const user = requireUser(context);

      const mealPlans = await db
        .select()
        .from(MealPlans)
        .where(eq(MealPlans.userId, user.id));

      return {
        success: true,
        data: {
          items: mealPlans,
          total: mealPlans.length,
        },
      };
    },
  }),

  upsertMealPlanEntry: defineAction({
    input: z.object({
      id: z.string().min(1).optional(),
      mealPlanId: z.string().min(1),
      date: z.coerce.date(),
      mealSlot: z.string().min(1),
      recipeId: z.string().min(1).optional(),
      customTitle: z.string().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await assertMealPlanOwnership(input.mealPlanId, user.id);

      const entryBase = {
        mealPlanId: input.mealPlanId,
        userId: user.id,
        date: input.date,
        mealSlot: input.mealSlot,
        recipeId: input.recipeId,
        customTitle: input.customTitle,
        notes: input.notes,
      };

      if (input.id) {
        const existing = await db
          .select()
          .from(MealPlanEntries)
          .where(
            and(
              eq(MealPlanEntries.id, input.id),
              eq(MealPlanEntries.userId, user.id)
            )
          )
          .get();

        if (!existing) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Meal plan entry not found.",
          });
        }

        await db
          .update(MealPlanEntries)
          .set(entryBase)
          .where(
            and(
              eq(MealPlanEntries.id, input.id),
              eq(MealPlanEntries.userId, user.id)
            )
          );

        return {
          success: true,
          data: {
            mealPlanEntry: { ...existing, ...entryBase },
          },
        };
      }

      const mealPlanEntry = {
        id: crypto.randomUUID(),
        ...entryBase,
        createdAt: new Date(),
      } as const;

      await db.insert(MealPlanEntries).values(mealPlanEntry);

      return {
        success: true,
        data: { mealPlanEntry },
      };
    },
  }),

  deleteMealPlanEntry: defineAction({
    input: z.object({ id: z.string().min(1) }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const entry = await db
        .select()
        .from(MealPlanEntries)
        .where(
          and(eq(MealPlanEntries.id, input.id), eq(MealPlanEntries.userId, user.id))
        )
        .get();

      if (!entry) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Meal plan entry not found.",
        });
      }

      await db
        .delete(MealPlanEntries)
        .where(
          and(eq(MealPlanEntries.id, input.id), eq(MealPlanEntries.userId, user.id))
        );

      return {
        success: true,
        data: { id: input.id },
      };
    },
  }),

  listMealPlanEntries: defineAction({
    input: z.object({ mealPlanId: z.string().min(1) }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await assertMealPlanOwnership(input.mealPlanId, user.id);

      const entries = await db
        .select()
        .from(MealPlanEntries)
        .where(
          and(
            eq(MealPlanEntries.mealPlanId, input.mealPlanId),
            eq(MealPlanEntries.userId, user.id)
          )
        );

      return {
        success: true,
        data: {
          items: entries,
          total: entries.length,
        },
      };
    },
  }),
};
