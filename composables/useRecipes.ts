export interface RecipeSummary {
  slug: string
  title: string
  image: string
  prepTime: number
  cookTime: number
  difficulty: string
  updatedAt: string
}

export function useRecipes() {
  const { getSitemapSlugs, getPage } = useCms()

  async function getLatestRecipes(limit = 6): Promise<RecipeSummary[]> {
    const slugs = await getSitemapSlugs()
    const pages = await Promise.all(
      slugs.map((slug) => getPage(slug).catch(() => null))
    )

    const recipes: RecipeSummary[] = []
    for (const page of pages) {
      if (!page) continue
      const recipeBlock = page.body.find((block) => block._type === 'recept')
      if (!recipeBlock) continue
      recipes.push({
        slug: page.slug,
        title: String(recipeBlock.title ?? page.title),
        image: String(recipeBlock.image ?? ''),
        prepTime: Number(recipeBlock.prep_time ?? 0),
        cookTime: Number(recipeBlock.cook_time ?? 0),
        difficulty: String(recipeBlock.difficulty ?? ''),
        updatedAt: page.updatedAt
      })
    }

    return recipes
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit)
  }

  return { getLatestRecipes }
}
