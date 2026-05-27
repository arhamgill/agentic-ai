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

const eraOptions = [
  { value: "any", label: "Any era" },
  { value: "classic", label: "Classic (pre-1980)" },
  { value: "retro", label: "Retro (1980s-1990s)" },
  { value: "modern", label: "Modern (2000s-2010s)" },
  { value: "recent", label: "Recent (2020+)" },
];

const pacingOptions = [
  { value: "any", label: "Any pacing" },
  { value: "slow", label: "Slow-burn" },
  { value: "steady", label: "Steady" },
  { value: "fast", label: "Fast and kinetic" },
];

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openSelect, setOpenSelect] = useState<"era" | "pacing" | null>(null);
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
  const selectedEra =
    eraOptions.find((option) => option.value === form.era)?.label ||
    "Any era";
  const selectedPacing =
    pacingOptions.find((option) => option.value === form.pacing)?.label ||
    "Any pacing";

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

  const handleSelect = (name: "era" | "pacing", value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setOpenSelect(null);
  };

  return (
    <div className="flex-1">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-6 py-12 md:px-10 md:py-16">
        <header className="flex flex-col gap-3">
          <h1 className="text-balance text-4xl font-[var(--font-display)] font-semibold leading-tight text-[var(--foreground)] md:text-5xl">
            Movie recommendations, tuned to your mood.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--ink-muted)] md:text-base">
            Tell us the mood, genres, and constraints. Get a clean list of picks
            you can actually watch.
          </p>
        </header>

        <section className="grid gap-10">
          <form
            className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-[var(--surface)]/90 p-6 md:p-8"
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
                  className="h-11 rounded-xl border border-white/25 bg-black/40 px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--ink-muted)] focus:border-white focus:ring-2 focus:ring-[var(--ring)]"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Genre focus
                <input
                  name="genres"
                  value={form.genres}
                  onChange={handleChange}
                  placeholder="neo-noir, sci-fi, romance"
                  className="h-11 rounded-xl border border-white/25 bg-black/40 px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--ink-muted)] focus:border-white focus:ring-2 focus:ring-[var(--ring)]"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Vibe keywords
                <input
                  name="vibe"
                  value={form.vibe}
                  onChange={handleChange}
                  placeholder="rainy-night, hopeful, kinetic"
                  className="h-11 rounded-xl border border-white/25 bg-black/40 px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--ink-muted)] focus:border-white focus:ring-2 focus:ring-[var(--ring)]"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Similar movies
                <input
                  name="similar"
                  value={form.similar}
                  onChange={handleChange}
                  placeholder="Her, Arrival, Moonlight"
                  className="h-11 rounded-xl border border-white/25 bg-black/40 px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--ink-muted)] focus:border-white focus:ring-2 focus:ring-[var(--ring)]"
                />
              </label>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Era
                <div className="relative">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={openSelect === "era"}
                    onClick={() =>
                      setOpenSelect((prev) => (prev === "era" ? null : "era"))
                    }
                    className="flex h-11 w-full items-center justify-between rounded-xl border border-white/25 bg-black/40 px-4 text-left text-sm text-[var(--foreground)] transition hover:border-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    <span>{selectedEra}</span>
                    <span className="text-[var(--ink-muted)]">
                      <svg
                        aria-hidden="true"
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M5 7l5 5 5-5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                  {openSelect === "era" ? (
                    <div className="absolute z-10 mt-2 w-full rounded-xl border border-white/15 bg-black/95 p-1 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                      {eraOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={option.value === form.era}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleSelect("era", option.value);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-[var(--foreground)] transition hover:bg-white/5 focus:bg-white/10"
                        >
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Pacing
                <div className="relative">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={openSelect === "pacing"}
                    onClick={() =>
                      setOpenSelect((prev) =>
                        prev === "pacing" ? null : "pacing"
                      )
                    }
                    className="flex h-11 w-full items-center justify-between rounded-xl border border-white/25 bg-black/40 px-4 text-left text-sm text-[var(--foreground)] transition hover:border-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    <span>{selectedPacing}</span>
                    <span className="text-[var(--ink-muted)]">
                      <svg
                        aria-hidden="true"
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M5 7l5 5 5-5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                  {openSelect === "pacing" ? (
                    <div className="absolute z-10 mt-2 w-full rounded-xl border border-white/15 bg-black/95 p-1 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                      {pacingOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={option.value === form.pacing}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleSelect("pacing", option.value);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-[var(--foreground)] transition hover:bg-white/5 focus:bg-white/10"
                        >
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
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
                className="resize-none rounded-2xl border border-white/25 bg-black/40 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--ink-muted)] focus:border-white focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>
            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className="inline-flex h-12 items-center justify-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Summoning picks" : "Get recommendations"}
            </button>
          </form>
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
            <div className="rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              <p>{error}</p>
              {showErrorDetails && errorDetails ? (
                <p className="mt-2 whitespace-pre-wrap break-words text-xs text-red-300">
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
                  className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5"
                />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[var(--surface)]/80 px-6 py-12 text-center text-sm text-[var(--ink-muted)]">
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
                    className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-[var(--surface)]/90 p-5"
                  >
                    {poster ? (
                      <img
                        src={poster}
                        alt={`${movie.title ?? "Movie"} poster`}
                        className="h-64 w-full rounded-2xl object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/20 text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                        Poster needed
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-xl font-[var(--font-display)] font-semibold text-[var(--foreground)]">
                          {movie.title ?? "Untitled pick"}
                        </h3>
                        {movie.year ? (
                          <span className="rounded-full border border-white/10 bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--ink-muted)]">
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
