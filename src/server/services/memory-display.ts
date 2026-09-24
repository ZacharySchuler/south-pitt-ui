import type { Memory } from "./memory-service";

export type MemoriesByYear = {
	year: number;
	memories: Memory[];
};

/** Group already year-desc-sorted memories into year sections. */
export function groupMemoriesByYear(memories: Memory[]): MemoriesByYear[] {
	const groups: MemoriesByYear[] = [];
	let current: MemoriesByYear | null = null;

	for (const memory of memories) {
		if (!current || current.year !== memory.year) {
			current = { year: memory.year, memories: [] };
			groups.push(current);
		}
		current.memories.push(memory);
	}

	return groups;
}

/** Format optional YYYY-MM-DD for display, e.g. "July 18, 2026". */
export function formatEventDate(eventDate: string | null): string | null {
	if (!eventDate) {
		return null;
	}

	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(eventDate);
	if (!match) {
		return eventDate;
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));

	if (Number.isNaN(date.getTime())) {
		return eventDate;
	}

	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC",
	}).format(date);
}
