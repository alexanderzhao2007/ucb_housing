import { useEffect, useState } from "react";

/**
 * Debounces a value by delaying its update until after the specified delay
 * has elapsed since the last change.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // This will only run 500ms after the user stops typing
 *   performSearch(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 */
export function useDebounce<T>(value: T, delay = 500): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		// Set up a timer to update the debounced value after the delay
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		// Clean up the timer if the value changes before the delay expires
		// or if the component unmounts
		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
}
