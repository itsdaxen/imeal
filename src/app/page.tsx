export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16 sm:px-10 lg:px-16">
      <section aria-labelledby="page-title" className="max-w-2xl">
        <p className="mb-5 text-sm font-semibold tracking-[0.18em] text-muted uppercase">
          iMeal
        </p>
        <h1
          id="page-title"
          className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
        >
          Meal planning, from recipe to shopping list.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted sm:text-xl">
          iMeal will connect the recipes you trust with a realistic weekly plan
          and the groceries needed to cook it.
        </p>
      </section>
    </main>
  );
}
