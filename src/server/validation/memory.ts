import type { CreateMemoryInput } from "../services/memory-service";

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const MAX_CAPTION_LENGTH = 4000;
const MAX_TITLE_LENGTH = 200;
const ALLOWED_SOURCES = new Set(["web", "discord"]);

export type ValidationSuccess<T> = { ok: true; value: T };
export type ValidationFailure = { ok: false; error: string };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalTrimmedString(
	value: unknown,
	field: string,
	maxLength: number,
): ValidationResult<string | null> {
	if (value === undefined || value === null || value === "") {
		return { ok: true, value: null };
	}
	if (typeof value !== "string") {
		return { ok: false, error: `${field} must be a string` };
	}
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return { ok: true, value: null };
	}
	if (trimmed.length > maxLength) {
		return {
			ok: false,
			error: `${field} must be at most ${maxLength} characters`,
		};
	}
	return { ok: true, value: trimmed };
}

function isValidEventDate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}
	const date = new Date(`${value}T00:00:00.000Z`);
	if (Number.isNaN(date.getTime())) {
		return false;
	}
	return date.toISOString().slice(0, 10) === value;
}

/**
 * Validate a JSON body for text-only memory creation (Steps 4–5).
 * Photo uploads are rejected until later steps.
 */
export function validateCreateMemoryBody(
	body: unknown,
): ValidationResult<CreateMemoryInput> {
	if (!isPlainObject(body)) {
		return { ok: false, error: "Request body must be a JSON object" };
	}

	if (body.photos !== undefined) {
		const photos = body.photos;
		if (!Array.isArray(photos) || photos.length > 0) {
			return {
				ok: false,
				error:
					"Photo uploads are not supported yet. Omit photos or send an empty array.",
			};
		}
	}

	if (typeof body.year !== "number" || !Number.isInteger(body.year)) {
		return { ok: false, error: "year must be an integer" };
	}
	if (body.year < MIN_YEAR || body.year > MAX_YEAR) {
		return {
			ok: false,
			error: `year must be between ${MIN_YEAR} and ${MAX_YEAR}`,
		};
	}

	if (typeof body.caption !== "string") {
		return { ok: false, error: "caption must be a string" };
	}
	const caption = body.caption.trim();
	if (caption.length === 0) {
		return { ok: false, error: "caption is required" };
	}
	if (caption.length > MAX_CAPTION_LENGTH) {
		return {
			ok: false,
			error: `caption must be at most ${MAX_CAPTION_LENGTH} characters`,
		};
	}

	if (typeof body.source !== "string" || body.source.trim().length === 0) {
		return { ok: false, error: "source is required" };
	}
	const source = body.source.trim();
	if (!ALLOWED_SOURCES.has(source)) {
		return {
			ok: false,
			error: `source must be one of: ${[...ALLOWED_SOURCES].join(", ")}`,
		};
	}

	const titleResult = optionalTrimmedString(body.title, "title", MAX_TITLE_LENGTH);
	if (!titleResult.ok) {
		return titleResult;
	}

	const submittedByResult = optionalTrimmedString(
		body.submittedBy,
		"submittedBy",
		200,
	);
	if (!submittedByResult.ok) {
		return submittedByResult;
	}

	let eventDate: string | null = null;
	if (body.eventDate !== undefined && body.eventDate !== null && body.eventDate !== "") {
		if (typeof body.eventDate !== "string") {
			return { ok: false, error: "eventDate must be a string (YYYY-MM-DD)" };
		}
		const trimmed = body.eventDate.trim();
		if (!isValidEventDate(trimmed)) {
			return {
				ok: false,
				error: "eventDate must be a valid calendar date in YYYY-MM-DD format",
			};
		}
		eventDate = trimmed;
	}

	return {
		ok: true,
		value: {
			year: body.year,
			caption,
			source,
			title: titleResult.value,
			eventDate,
			submittedBy: submittedByResult.value,
		},
	};
}
