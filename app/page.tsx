import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";

export default function HomePage() {
	return (
		<div className="min-h-screen flex flex-col">
			<header className="border-b">
				<div className="container flex h-14 items-center justify-between">
					<div className="flex items-center gap-2 font-bold">
						<FileText className="h-5 w-5" />
						<span>Notes</span>
					</div>
					<nav className="flex items-center gap-2">
						<Link href="/login">
							<Button variant="ghost">Log in</Button>
						</Link>
						<Link href="/signup">
							<Button>Sign up</Button>
						</Link>
					</nav>
				</div>
			</header>

			<main className="flex-1 flex items-center justify-center">
				<div className="container flex flex-col items-center text-center gap-8">
					<div className="space-y-4 max-w-2xl">
						<h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
							Your notes,
							<br />
							<span className="text-primary">simple and secure</span>
						</h1>
						<p className="text-lg text-muted-foreground max-w-lg mx-auto">
							A simple notes app to capture your thoughts. Sign up to get
							started and keep your notes synced across all your devices.
						</p>
					</div>

					<div className="flex flex-col sm:flex-row gap-4">
						<Link href="/signup">
							<Button size="lg" className="gap-2">
								Get started
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
						<Link href="/login">
							<Button size="lg" variant="outline">
								I have an account
							</Button>
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
