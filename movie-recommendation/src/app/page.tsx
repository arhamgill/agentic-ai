"use client";

import { useMemo, useState } from "react";

type Rating = {
  source?: string;
  value?: string;
};

type MovieRecommendation = {
  title?: string;
  year?: number;
  synopsis?: string;
  posterUrl?: string;
  rating?: Rating;
  ratings?: Rating[];
  vibeTags?: string[];
  genres?: string[];
  why?: string;
  runtimeMinutes?: number;
  director?: string;
};

type RecommendationResponse = {
  querySummary?: string;
  recommendations?: MovieRecommendation[];
};

const initialForm = {
  mood: "",
  genres: "",
  vibe: "",
  similar: "",
  extras: "",
  era: "any",
  pacing: "any",
};

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const showErrorDetails = process.env.NODE_ENV !== "production";

  const canSubmit = useMemo(() => {
    const hasCore = [
      form.mood,
      form.genres,
      form.vibe,
      form.similar,
      form.extras,
    ].some((value) => value.trim().length > 0);

    return hasCore || form.era !== "any" || form.pacing !== "any";
  }, [form]);

  const recommendations = Array.isArray(data?.recommendations)
    ? data?.recommendations
    : [];

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    setData(null);

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as RecommendationResponse & {
        error?: string;
        details?: string;
        availableModels?: string[];
      };

      if (!response.ok) {
        setError(payload?.error || "The recommendation engine hit a snag.");
        if (payload?.availableModels?.length) {
          setErrorDetails(
            [
              payload?.details || "",
              "Available models:",
              ...payload.availableModels,
            ]
              .filter(Boolean)
              .join("\n")
          );
        } else {
          setErrorDetails(payload?.details || null);
        }
        return;
      }

      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setErrorDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12 md:px-10 md:py-16">
        <header className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-[var(--surface)]/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-muted)] shadow-sm">
              VibeReel
            </div>
            <h1 className="text-balance text-4xl font-[var(--font-display)] font-semibold leading-tight text-[var(--foreground)] md:text-5xl">
              Tell us the mood. We will build the perfect movie night.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[var(--ink-muted)]">
              Drop in the vibe, favorite genres, or similar films. Gemini
              returns a structured list with posters, synopses, and ratings so
              you can pick instantly.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent-ink)]">
              <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1">
                Mood to movies
              </span>
              <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1">
                Poster links
              </span>
              <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1">
                Structured output
              </span>
            </div>
          </div>
          <div className="rounded-3xl border border-black/10 bg-[var(--surface)]/90 p-6 shadow-[0_20px_60px_rgba(27,26,23,0.12)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              How it works
            </h2>
            <ol className="mt-4 flex flex-col gap-4 text-sm text-[var(--ink-muted)]">
              <li className="rounded-2xl border border-black/10 bg-white/70 p-4">
                1. Share your vibe, mood, and must-haves.
              </li>
              <li className="rounded-2xl border border-black/10 bg-white/70 p-4">
                2. Gemini responds with movie picks + poster links.
              </li>
              <li className="rounded-2xl border border-black/10 bg-white/70 p-4">
                3. Choose one and press play.
              </li>
            </ol>
            <div className="mt-6 rounded-2xl border border-black/10 bg-[var(--surface-strong)]/80 p-4 text-xs text-[var(--ink-muted)]">
              Tip: Add "avoid gore" or "under two hours" for tighter results.
            </div>
          </div>
        </header>

        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <form
            className="flex flex-col gap-6 rounded-3xl border border-black/10 bg-[var(--surface)]/85 p-6 shadow-[0_20px_50px_rgba(27,26,23,0.12)]"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Mood
                <input
                  name="mood"
                  value={form.mood}
                  onChange={handleChange}
                  placeholder="cozy, cathartic, nostalgic"
                  className="h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-sm text-[var(--foreground)] shadow-sm outline-none transition focus:border-black/40 focus:ring-2 focus:ring-[var(--ring)]"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Genre focus
                <input
                  name="genres"
                  value={form.genres}
                  onChange={handleChange}
                  placeholder="neo-noir, sci-fi, romance"
                  className="h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-sm text-[var(--foreground)] shadow-sm outline-none transition focus:border-black/40 focus:ring-2 focus:ring-[var(--ring)]"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Vibe keywords
                <input
                  name="vibe"
                  value={form.vibe}
                  onChange={handleChange}
                  placeholder="rainy-night, hopeful, kinetic"
                  className="h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-sm text-[var(--foreground)] shadow-sm outline-none transition focus:border-black/40 focus:ring-2 focus:ring-[var(--ring)]"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Similar movies
                <input
                  name="similar"
                  value={form.similar}
                  onChange={handleChange}
                  placeholder="Her, Arrival, Moonlight"
                  className="h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-sm text-[var(--foreground)] shadow-sm outline-none transition focus:border-black/40 focus:ring-2 focus:ring-[var(--ring)]"
                />
              </label>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Era
                <select
                  name="era"
                  value={form.era}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-sm text-[var(--foreground)] shadow-sm outline-none transition focus:border-black/40 focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="any">Any era</option>
                  <option value="classic">Classic (pre-1980)</option>
                  <option value="retro">Retro (1980s-1990s)</option>
                  <option value="modern">Modern (2000s-2010s)</option>
                  <option value="recent">Recent (2020+)</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Pacing
                <select
                  name="pacing"
                  value={form.pacing}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-sm text-[var(--foreground)] shadow-sm outline-none transition focus:border-black/40 focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="any">Any pacing</option>
                  <option value="slow">Slow-burn</option>
                  <option value="steady">Steady</option>
                  <option value="fast">Fast and kinetic</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
              Must-haves or avoid
              <textarea
                name="extras"
                value={form.extras}
                onChange={handleChange}
                placeholder="No gore, under 2 hours, strong female lead"
                rows={3}
                className="resize-none rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-[var(--foreground)] shadow-sm outline-none transition focus:border-black/40 focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>
            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className="inline-flex h-12 items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-6 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-[rgba(255,107,61,0.3)] transition hover:-translate-y-0.5 hover:shadow-[rgba(255,107,61,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Summoning picks" : "Get recommendations"}
            </button>
          </form>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-black/10 bg-[var(--surface)]/85 p-6">
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                Example prompts
              </h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--ink-muted)]">
                <p>
                  "Hopeful sci-fi with a slow burn, like Arrival, nothing too
                  bleak."
                </p>
                <p>
                  "Stylish crime thrillers, modern pacing, similar to Drive or
                  Nightcrawler."
                </p>
                <p>
                  "Cozy, funny, feel-good for a rainy night, under two hours."
                </p>
              </div>
            </div>
            <div className="rounded-3xl border border-black/10 bg-[var(--surface-strong)]/90 p-6 text-sm text-[var(--ink-muted)]">
              Gemini will return posters from the public web, so results depend
              on availability. If a poster looks off, rerun with a different
              example movie.
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-[var(--font-display)] font-semibold text-[var(--foreground)]">
                Your recommendations
              </h2>
              {data?.querySummary ? (
                <p className="text-sm text-[var(--ink-muted)]">
                  {data.querySummary}
                </p>
              ) : null}
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              {recommendations.length} picks
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{error}</p>
              {showErrorDetails && errorDetails ? (
                <p className="mt-2 whitespace-pre-wrap break-words text-xs text-red-600">
                  {errorDetails}
                </p>
              ) : null}
            </div>
          ) : null}

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`loading-${index}`}
                  className="h-72 animate-pulse rounded-3xl border border-black/10 bg-white/70"
                />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-3xl border border-black/10 bg-[var(--surface)]/80 px-6 py-12 text-center text-sm text-[var(--ink-muted)]">
              Drop in your vibe above to see recommendations.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {recommendations.map((movie, index) => {
                const rating = movie.rating || movie.ratings?.[0];
                const poster = movie.posterUrl || "";
                const genres = movie.genres?.join(" | ");

                return (
                  <article
                    key={`${movie.title ?? "movie"}-${index}`}
                    className="flex h-full flex-col gap-4 rounded-3xl border border-black/10 bg-[var(--surface)]/90 p-5 shadow-[0_15px_40px_rgba(27,26,23,0.12)]"
                  >
                    {poster ? (
                      <img
                        src={poster}
                        alt={`${movie.title ?? "Movie"} poster`}
                        className="h-64 w-full rounded-2xl object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-black/20 text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                        Poster needed
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-xl font-[var(--font-display)] font-semibold text-[var(--foreground)]">
                          {movie.title ?? "Untitled pick"}
                        </h3>
                        {movie.year ? (
                          <span className="rounded-full border border-black/10 bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--ink-muted)]">
                            {movie.year}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-muted)]">
                        {genres ? <span>{genres}</span> : null}
                        {movie.runtimeMinutes ? (
                          <span>{movie.runtimeMinutes} min</span>
                        ) : null}
                        {rating?.value ? (
                          <span>
                            {rating.source ? `${rating.source}: ` : ""}
                            {rating.value}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-sm leading-6 text-[var(--foreground)] opacity-90">
                        {movie.synopsis ?? "Synopsis not available yet."}
                      </p>

                      {movie.vibeTags?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {movie.vibeTags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {movie.why ? (
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                          Why this fits
                        </p>
                      ) : null}
                      {movie.why ? (
                        <p className="text-sm leading-6 text-[var(--ink-muted)]">
                          {movie.why}
                        </p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
