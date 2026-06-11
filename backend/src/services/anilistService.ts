import axios from "axios";
import type { AniListAnime, AniListResponse, AniListSingleResponse, AnimeCard, AnimeDetail, AniListExternalLink } from "../types/anime.js";

const ANILIST_URL = "https://graphql.anilist.co";

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  coverImage { large extraLarge }
  bannerImage
  description(asHtml: false)
  status
  episodes
  genres
  studios(isMain: true) { nodes { name } }
  season
  seasonYear
  averageScore
  trailer { id site }
  nextAiringEpisode { episode airingAt }
  externalLinks { url site icon color type }
`;

function getStreamingLinks(links: AniListExternalLink[]): AniListExternalLink[] {
  return links.filter((link) => link.type === "STREAMING");
}

function toAnimeCard(anime: AniListAnime): AnimeCard {
  return {
    id: anime.id,
    title: anime.title.english || anime.title.romaji,
    coverImage: anime.coverImage.extraLarge || anime.coverImage.large,
    status: anime.status,
    episodes: anime.episodes,
    averageScore: anime.averageScore,
    season: anime.season,
    seasonYear: anime.seasonYear,
    genres: anime.genres,
    nextAiringEpisode: anime.nextAiringEpisode,
    streamingLinks: getStreamingLinks(anime.externalLinks || []),
  };
}

function toAnimeDetail(anime: AniListAnime): AnimeDetail {
  return {
    ...toAnimeCard(anime),
    bannerImage: anime.bannerImage,
    description: anime.description,
    studios: anime.studios.nodes.map((s) => s.name),
    trailer: anime.trailer,
    externalLinks: anime.externalLinks || [],
  };
}

export function getCurrentSeason(): { season: string; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (month >= 1 && month <= 3) return { season: "WINTER", year };
  if (month >= 4 && month <= 6) return { season: "SPRING", year };
  if (month >= 7 && month <= 9) return { season: "SUMMER", year };
  return { season: "FALL", year };
}

function getNextSeason(): { season: string; year: number } {
  const current = getCurrentSeason();
  const seasons = ["WINTER", "SPRING", "SUMMER", "FALL"];
  const currentIndex = seasons.indexOf(current.season);
  const nextIndex = (currentIndex + 1) % 4;
  const nextYear = nextIndex === 0 ? current.year + 1 : current.year;
  return { season: seasons[nextIndex], year: nextYear };
}

async function queryAniList<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await axios.post<T>(ANILIST_URL, { query, variables });
  return response.data;
}

export async function fetchSeasonAnimes(season: string, year: number, page = 1, perPage = 20): Promise<{ animes: AnimeCard[]; pageInfo: AniListResponse["data"]["Page"]["pageInfo"] }> {

  const query = `
    query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await queryAniList<AniListResponse>(query, { page, perPage, season, seasonYear: year });
  return {
    animes: data.data.Page.media.map(toAnimeCard),
    pageInfo: data.data.Page.pageInfo,
  };
}

export async function fetchPopularAnimes(page = 1, perPage = 20): Promise<{ animes: AnimeCard[]; pageInfo: AniListResponse["data"]["Page"]["pageInfo"] }> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(type: ANIME, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await queryAniList<AniListResponse>(query, { page, perPage });
  return {
    animes: data.data.Page.media.map(toAnimeCard),
    pageInfo: data.data.Page.pageInfo,
  };
}

export async function searchAnimes(searchQuery: string, page = 1, perPage = 20): Promise<{ animes: AnimeCard[]; pageInfo: AniListResponse["data"]["Page"]["pageInfo"] }> {
  const query = `
    query ($page: Int, $perPage: Int, $search: String) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await queryAniList<AniListResponse>(query, { page, perPage, search: searchQuery });
  return {
    animes: data.data.Page.media.map(toAnimeCard),
    pageInfo: data.data.Page.pageInfo,
  };
}

export async function fetchAnimesByIds(ids: number[]): Promise<AnimeCard[]> {
  if (ids.length === 0) return [];

  const query = `
    query ($ids: [Int], $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(id_in: $ids, type: ANIME) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const chunkSize = 50;
  const results: AnimeCard[] = [];

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const data = await queryAniList<AniListResponse>(query, { ids: chunk, page: 1, perPage: chunkSize });
    results.push(...data.data.Page.media.map(toAnimeCard));
  }

  return results;
}

export async function fetchAnimeById(id: number): Promise<AnimeDetail> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FIELDS}
        stats {
          scoreDistribution {
            amount
          }
        }
      }
    }
  `;

  const data = await queryAniList<AniListSingleResponse>(query, { id });
  const anime = data.data.Media;
  const total = anime.stats?.scoreDistribution?.reduce((acc, curr) => acc + curr.amount, 0);
  const ratingCount = total !== undefined && total > 0 ? total : undefined;

  return {
    ...toAnimeDetail(anime),
    ratingCount,
  };
}
