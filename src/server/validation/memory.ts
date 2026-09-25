import type { CreateMemoryInput } from "../services/memory-service";
import { validatePhotos } from "./photos";

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

function validateMemoryFields(input: {
	year: unknown;
	caption: unknown;
	source: unknown;
	title?: unknown;
	eventDate?: unknown;
	submittedBy?: unknown;
}): ValidationResult<Omit<CreateMemoryInput, "photos">> {
	const year =
		typeof input.year === "string" && input.year.trim() !== ""
			? Number(input.year)
			: input.year;

	if (typeof year !== "number" || !Number.isInteger(year)) {
		return { ok: false, error: "year must be an integer" };
	}
	if (year < MIN_YEAR || year > MAX_YEAR) {
		return {
			ok: false,
			error: `year must be between ${MIN_YEAR} and ${MAX_YEAR}`,
		};
	}

	if (typeof input.caption !== "string") {
		return { ok: false, error: "caption must be a string" };
	}
	const caption = input.caption.trim();
	if (caption.length === 0) {
		return { ok: false, error: "caption is required" };
	}
	if (caption.length > MAX_CAPTION_LENGTH) {
		return {
			ok: false,
			error: `caption must be at most ${MAX_CAPTION_LENGTH} characters`,
		};
	}

	if (typeof input.source !== "string" || input.source.trim().length === 0) {
		return { ok: false, error: "source is required" };
	}
	const source = input.source.trim();
	if (!ALLOWED_SOURCES.has(source)) {
		return {
			ok: false,
			error: `source must be one of: ${[...ALLOWED_SOURCES].join(", ")}`,
		};
	}

	const titleResult = optionalTrimmedString(input.title, "title", MAX_TITLE_LENGTH);
	if (!titleResult.ok) {
		return titleResult;
	}

	const submittedByResult = optionalTrimmedString(
		input.submittedBy,
		"submittedBy",
		200,
	);
	if (!submittedByResult.ok) {
		return submittedByResult;
	}

	let eventDate: string | null = null;
	if (
		input.eventDate !== undefined &&
		input.eventDate !== null &&
		input.eventDate !== ""
	) {
		if (typeof input.eventDate !== "string") {
			return { ok: false, error: "eventDate must be a string (YYYY-MM-DD)" };
		}
		const trimmed = input.eventDate.trim();
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
			year,
			caption,
			source,
			title: titleResult.value,
			eventDate,
			submittedBy: submittedByResult.value,
		},
	};
}

/** Validate a JSON body for memory creation (optional empty photos array). */
export function validateCreateMemoryBody(
	body: unknown,
): ValidationResult<CreateMemoryInput> {
	if (!isPlainObject(body)) {
		return { ok: false, error: "Request body must be a JSON object" };
	}

	if (body.photos !== undefined) {
		if (!Array.isArray(body.photos)) {
			return { ok: false, error: "photos must be an array when provided in JSON" };
		}
		if (body.photos.length > 0) {
			return {
				ok: false,
				error:
					"JSON create does not accept photo binaries. Use multipart/form-data with photo files.",
			};
		}
	}

	const fields = validateMemoryFields({
		year: body.year,
		caption: body.caption,
		source: body.source,
		title: body.title,
		eventDate: body.eventDate,
		submittedBy: body.submittedBy,
	});
	if (!fields.ok) {
		return fields;
	}

	return { ok: true, value: fields.value };
}

/** Validate multipart form fields + photo files for memory creation. */
export function validateCreateMemoryForm(
	form: FormData,
): ValidationResult<CreateMemoryInput> {
	const photos = form
		.getAll("photos")
		.filter((value): value is File => value instanceof File && value.size > 0);

	const photoCheck = validatePhotos(photos);
	if (!photoCheck.ok) {
		return photoCheck;
	}

	const fields = validateMemoryFields({
		year: form.get("year"),
		caption: form.get("caption"),
		source: form.get("source") ?? "web",
		title: form.get("title"),
		eventDate: form.get("eventDate") ?? form.get("date"),
		submittedBy: form.get("submittedBy"),
	});
	if (!fields.ok) {
		return fields;
	}

	return {
		ok: true,
		value: {
			...fields.value,
			photos: photoCheck.value,
		},
	};
}
