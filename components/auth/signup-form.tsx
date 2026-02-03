"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SignupForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsLoading(true);

		const formData = new FormData(event.currentTarget);
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		try {
			const response = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				toast.error(data.error || "Failed to create account");
				return;
			}

			setIsSuccess(true);
			toast.success("Check your email to confirm your account!");
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	if (isSuccess) {
		return (
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold">Check your email</CardTitle>
					<CardDescription>
						We&apos;ve sent you a confirmation link. Click the link in your
						email to activate your account.
					</CardDescription>
				</CardHeader>
				<CardFooter>
					<Link href="/login" className="w-full">
						<Button variant="outline" className="w-full">
							Back to login
						</Button>
					</Link>
				</CardFooter>
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl font-bold">Create an account</CardTitle>
				<CardDescription>
					Enter your email and create a password to get started
				</CardDescription>
			</CardHeader>
			<form onSubmit={onSubmit}>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="you@example.com"
							required
							disabled={isLoading}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							name="password"
							type="password"
							placeholder="Create a password (min. 8 characters)"
							minLength={8}
							required
							disabled={isLoading}
						/>
					</div>
				</CardContent>
				<CardFooter className="flex flex-col space-y-4 pt-2">
					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Create account
					</Button>
					<p className="text-sm text-muted-foreground text-center">
						Already have an account?{" "}
						<Link href="/login" className="text-primary hover:underline">
							Sign in
						</Link>
					</p>
				</CardFooter>
			</form>
		</Card>
	);
}
