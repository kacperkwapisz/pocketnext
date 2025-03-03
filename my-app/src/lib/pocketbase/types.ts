/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Authorigins = "_authOrigins",
	Externalauths = "_externalAuths",
	Mfas = "_mfas",
	Otps = "_otps",
	Superusers = "_superusers",
	EpisodeTranslations = "episode_translations",
	Episodes = "episodes",
	Media = "media",
	MediaTranslations = "media_translations",
	SeasonTranslations = "season_translations",
	Seasons = "seasons",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

// System fields
export type BaseSystemFields<T = never> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
	expand?: T
}

export type AuthSystemFields<T = never> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AuthoriginsRecord = {
	collectionRef: string
	created?: IsoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated?: IsoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated?: IsoDateString
}

export type MfasRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	method: string
	recordRef: string
	updated?: IsoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated?: IsoDateString
}

export type SuperusersRecord = {
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

export type EpisodeTranslationsRecord = {
	created?: IsoDateString
	episode?: RecordIdString
	id: string
	language?: string
	name?: string
	overview?: string
	updated?: IsoDateString
}

export type EpisodesRecord<Tcrew = unknown, Tguest_stars = unknown, Tvideos = unknown> = {
	air_date?: string
	created?: IsoDateString
	crew?: null | Tcrew
	episode_number?: number
	guest_stars?: null | Tguest_stars
	id: string
	name?: string
	overview?: string
	runtime?: number
	season?: RecordIdString
	still_path?: string
	tmdb_id?: number
	updated?: IsoDateString
	videos?: null | Tvideos
	vote_average?: number
	vote_count?: number
}

export enum MediaMediaTypeOptions {
	"movie" = "movie",
	"tv" = "tv",
}
export type MediaRecord<Tcredits = unknown, Tgenre_ids = unknown, Tgenres = unknown, Tproduction_companies = unknown, Tproduction_countries = unknown, Tspoken_languages = unknown, Tvideos = unknown> = {
	backdrop_path?: string
	budget?: number
	created?: IsoDateString
	credits?: null | Tcredits
	genre_ids?: null | Tgenre_ids
	genres?: null | Tgenres
	homepage?: string
	id: string
	imdb_id?: string
	in_production?: number
	media_type: MediaMediaTypeOptions
	number_of_episodes?: number
	number_of_seasons?: number
	original_language: string
	original_title?: string
	overview?: string
	popularity?: number
	poster_path?: string
	production_companies?: null | Tproduction_companies
	production_countries?: null | Tproduction_countries
	release_date?: string
	revenue?: number
	runtime?: number
	spoken_languages?: null | Tspoken_languages
	status?: string
	tagline?: string
	title: string
	tmdb_id: number
	type?: string
	updated?: IsoDateString
	videos?: null | Tvideos
	vote_average?: number
	vote_count?: number
}

export type MediaTranslationsRecord = {
	created?: IsoDateString
	id: string
	language?: string
	media?: RecordIdString
	overview?: string
	tagline?: string
	title?: string
	updated?: IsoDateString
}

export type SeasonTranslationsRecord = {
	created?: IsoDateString
	id: string
	language?: string
	name?: string
	overview?: string
	season?: RecordIdString
	updated?: IsoDateString
}

export type SeasonsRecord<Tcredits = unknown, Tvideos = unknown> = {
	air_date?: string
	created?: IsoDateString
	credits?: null | Tcredits
	episode_count?: number
	id: string
	media?: RecordIdString
	name?: string
	overview?: string
	poster_path?: string
	season_number?: number
	tmdb_id?: number
	updated?: IsoDateString
	videos?: null | Tvideos
	vote_average?: number
}

export type UsersRecord = {
	avatar?: string
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	isApproved?: boolean
	name?: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type EpisodeTranslationsResponse<Texpand = unknown> = Required<EpisodeTranslationsRecord> & BaseSystemFields<Texpand>
export type EpisodesResponse<Tcrew = unknown, Tguest_stars = unknown, Tvideos = unknown, Texpand = unknown> = Required<EpisodesRecord<Tcrew, Tguest_stars, Tvideos>> & BaseSystemFields<Texpand>
export type MediaResponse<Tcredits = unknown, Tgenre_ids = unknown, Tgenres = unknown, Tproduction_companies = unknown, Tproduction_countries = unknown, Tspoken_languages = unknown, Tvideos = unknown, Texpand = unknown> = Required<MediaRecord<Tcredits, Tgenre_ids, Tgenres, Tproduction_companies, Tproduction_countries, Tspoken_languages, Tvideos>> & BaseSystemFields<Texpand>
export type MediaTranslationsResponse<Texpand = unknown> = Required<MediaTranslationsRecord> & BaseSystemFields<Texpand>
export type SeasonTranslationsResponse<Texpand = unknown> = Required<SeasonTranslationsRecord> & BaseSystemFields<Texpand>
export type SeasonsResponse<Tcredits = unknown, Tvideos = unknown, Texpand = unknown> = Required<SeasonsRecord<Tcredits, Tvideos>> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	episode_translations: EpisodeTranslationsRecord
	episodes: EpisodesRecord
	media: MediaRecord
	media_translations: MediaTranslationsRecord
	season_translations: SeasonTranslationsRecord
	seasons: SeasonsRecord
	users: UsersRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	episode_translations: EpisodeTranslationsResponse
	episodes: EpisodesResponse
	media: MediaResponse
	media_translations: MediaTranslationsResponse
	season_translations: SeasonTranslationsResponse
	seasons: SeasonsResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: '_authOrigins'): RecordService<AuthoriginsResponse>
	collection(idOrName: '_externalAuths'): RecordService<ExternalauthsResponse>
	collection(idOrName: '_mfas'): RecordService<MfasResponse>
	collection(idOrName: '_otps'): RecordService<OtpsResponse>
	collection(idOrName: '_superusers'): RecordService<SuperusersResponse>
	collection(idOrName: 'episode_translations'): RecordService<EpisodeTranslationsResponse>
	collection(idOrName: 'episodes'): RecordService<EpisodesResponse>
	collection(idOrName: 'media'): RecordService<MediaResponse>
	collection(idOrName: 'media_translations'): RecordService<MediaTranslationsResponse>
	collection(idOrName: 'season_translations'): RecordService<SeasonTranslationsResponse>
	collection(idOrName: 'seasons'): RecordService<SeasonsResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
