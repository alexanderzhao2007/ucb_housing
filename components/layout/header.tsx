"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/auth/logout-button";
import { FileText, User } from "lucide-react";

interface HeaderProps {
	userEmail?: string;
}

export function Header({ userEmail }: HeaderProps) {
	// Get the first letter of the email for the avatar
	const avatarLetter = userEmail?.charAt(0).toUpperCase() || "U";

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center">
				<Link href="/dashboard" className="flex items-center gap-2 font-bold">
					<FileText className="h-5 w-5" />
					<span>Notes</span>
				</Link>

				<nav className="ml-auto flex items-center gap-4">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="relative h-8 w-8 rounded-full">
								<Avatar className="h-8 w-8">
									<AvatarFallback>{avatarLetter}</AvatarFallback>
								</Avatar>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56" align="end" forceMount>
							<div className="flex flex-col gap-2 px-2 py-1.5">
								<div className="flex items-center gap-2">
									<User className="h-4 w-4" />
									<span className="font-medium text-sm">Account</span>
								</div>
								<p className="text-xs text-muted-foreground">{userEmail}</p>
							</div>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<LogoutButton />
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</nav>
			</div>
		</header>
	);
}
