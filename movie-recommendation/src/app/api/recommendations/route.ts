import Groq from "groq-sdk";

type RecommendationRequest = {
  mood?: string;
  genres?: string;
  vibe?: string;
  similar?: string;
  extras?: string;
  era?: string;
  pacing?: string;
};

type MovieRecommendation = {
  title?: string;
  year?: number;
  synopsis?: string;
  posterUrl?: string;
  genres?: string[];
  vibeTags?: string[];
  runtimeMinutes?: number;
  rating?: { source?: string; value?: string };
  why?: string;
};

const fetchOmdbPoster = async (
  title: string | undefined,
  year: number | undefined,
  apiKey: string
) => {
  if (!title) {
    return null;
  }

  const params = new URLSearchParams({
    t: title,
    apikey: apiKey,
  });

  if (year) {
    params.set("y", String(year));
  }

  const response = await fetch(
    `https://www.omdbapi.com/?${params.toString()}`
  );
  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const poster = data?.Poster;
  if (!poster || poster === "N/A") {
    return null;
  }

  return poster as string;
};

const trimInput = (value?: string, maxLength = 300) => {
  const cleaned = value?.trim().replace(/\s+/g, " ") ?? "";
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return `${cleaned.slice(0, maxLength)}...`;
};

const stripCodeFences = (text: string) => {
  const withoutFences = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return withoutFences.slice(start, end + 1);
  }

  return withoutFences;
};

const buildPrompt = (input: RecommendationRequest) => {
  const lines = [
    `Mood: ${trimInput(input.mood) || "none"}`,
    `Genres: ${trimInput(input.genres) || "none"}`,
    `Vibe keywords: ${trimInput(input.vibe) || "none"}`,
    `Similar movies: ${trimInput(input.similar) || "none"}`,
    `Constraints: ${trimInput(input.extras) || "none"}`,
    `Era preference: ${trimInput(input.era) || "any"}`,
    `Pacing: ${trimInput(input.pacing) || "any"}`,
  ];

  const system = [
    "You are a movie recommendation engine.",
    "Return ONLY valid JSON. Do not wrap in markdown or code fences.",
    "Provide 4 to 6 recommendations that match the input.",
    "Each recommendation must include a real movie poster URL from the public internet.",
    "Poster URLs must be direct image links (jpg, png, or webp) to actual posters, not AI-generated art.",
    "If unsure about a poster, pick a different movie with a reliable poster URL.",
    "Output schema:",
    "{",
    "  \"querySummary\": string,",
    "  \"recommendations\": [",
    "    {",
    "      \"title\": string,",
    "      \"year\": number,",
    "      \"synopsis\": string,",
    "      \"posterUrl\": string,",
    "      \"genres\": string[],",
    "      \"vibeTags\": string[],",
    "      \"runtimeMinutes\": number,",
    "      \"rating\": { \"source\": string, \"value\": string },",
    "      \"why\": string",
    "    }",
    "  ]",
    "}",
  ].join("\n");

  const user = ["User preferences:", ...lines].join("\n");

  return { system, user };
};

const DEFAULT_MODEL = "llama-3.1-8b-instant";

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Missing GROQ_API_KEY in environment." },
      { status: 500 }
    );
  }

  let body: RecommendationRequest;
  try {
    body = (await request.json()) as RecommendationRequest;
  } catch (error) {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const hasSignal = [
    body.mood,
    body.genres,
    body.vibe,
    body.similar,
    body.extras,
    body.era !== "any" ? body.era : "",
    body.pacing !== "any" ? body.pacing : "",
  ].some((value) => (value ?? "").toString().trim().length > 0);

  if (!hasSignal) {
    return Response.json(
      { error: "Share at least one preference to get recommendations." },
      { status: 400 }
    );
  }

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const { system, user } = buildPrompt(body);

  const client = new Groq({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: 1200,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const rawText = completion.choices?.[0]?.message?.content ?? "";

    if (!rawText) {
      console.error("Groq response empty", { model });
      return Response.json(
        { error: "Groq returned an empty response." },
        { status: 502 }
      );
    }

    const cleaned = stripCodeFences(rawText);
    const data = JSON.parse(cleaned);

    if (!Array.isArray(data?.recommendations)) {
      console.error("Groq response missing recommendations", {
        model,
        snippet: cleaned.slice(0, 500),
      });
      return Response.json(
        { error: "Groq response missing recommendations array." },
        { status: 502 }
      );
    }

    const omdbKey = process.env.OMDB_API_KEY;
    if (omdbKey) {
      const enriched = await Promise.all(
        (data.recommendations as MovieRecommendation[]).map(async (movie) => {
          const posterUrl = await fetchOmdbPoster(
            movie.title,
            movie.year,
            omdbKey
          );
          if (posterUrl) {
            return { ...movie, posterUrl };
          }
          return movie;
        })
      );

      return Response.json({ ...data, recommendations: enriched });
    }

    return Response.json(data);
  } catch (error) {
    const err = error as {
      message?: string;
      error?: { message?: string };
      status?: number;
    };
    const details = err?.error?.message || err?.message || "Groq request failed.";
    let availableModels: string[] | undefined;

    if (details.toLowerCase().includes("model")) {
      try {
        const modelsResponse = await fetch("https://api.groq.com/openai/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
        if (modelsResponse.ok) {
          const modelsPayload = await modelsResponse.json();
          const models = Array.isArray(modelsPayload?.data)
            ? modelsPayload.data
            : [];
          availableModels = models
            .map((modelItem: { id?: string }) => modelItem?.id)
            .filter(Boolean)
            .slice(0, 20);
        }
      } catch (listError) {
        availableModels = undefined;
      }
    }

    console.error("Groq API error", {
      status: err?.status,
      model,
      details: details.slice(0, 500),
    });

    return Response.json(
      {
        error: "Groq request failed.",
        details: details.slice(0, 500),
        availableModels,
      },
      { status: 502 }
    );
  }
}
