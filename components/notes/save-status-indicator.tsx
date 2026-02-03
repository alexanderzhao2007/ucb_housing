import { AlertCircle, Check, Loader2 } from "lucide-react";
import type { SaveStatus } from "@/lib/hooks/use-auto-save";
import { Button } from "@/components/ui/button";

interface SaveStatusIndicatorProps {
	status: SaveStatus;
	error?: string | null;
	onRetry?: () => void;
}

/**
 * Displays the current save status with appropriate icons and styling.
 *
 * States:
 * - idle: Nothing shown (clean interface)
 * - saving: Spinner + "Saving..." text
 * - saved: Checkmark + "Saved" text (auto-hides after 2s)
 * - error: Error icon + "Failed to save" text + retry button
 */
export function SaveStatusIndicator({
	status,
	error,
	onRetry,
}: SaveStatusIndicatorProps) {
	if (status === "idle") {
		return null;
	}

	return (
		<div
			role="status"
			aria-live={status === "error" ? "assertive" : "polite"}
			className="flex items-center gap-2 text-sm"
		>
			{status === "saving" && (
				<>
					<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
					<span className="text-muted-foreground">Saving...</span>
				</>
			)}

			{status === "saved" && (
				<>
					<Check className="h-4 w-4 text-green-600 dark:text-green-500" />
					<span className="text-green-600 dark:text-green-500">Saved</span>
				</>
			)}

			{status === "error" && (
				<>
					<AlertCircle className="h-4 w-4 text-destructive" />
					<span className="text-destructive">{error || "Failed to save"}</span>
					{onRetry && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onRetry}
							className="h-6 px-2 text-xs"
						>
							Retry
						</Button>
					)}
				</>
			)}
		</div>
	);
}
