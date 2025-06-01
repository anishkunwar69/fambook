"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import Container from "./Container";
import { Button } from "./ui/button";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const { signOut } = useClerk();
  const { user, isSignedIn } = useUser();
  console.log("logged in user", user);

  return (
    <nav className="border-b bg-white/50 backdrop-blur-md fixed w-full z-50">
      <Container>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between py-4"
        >
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Heart className="w-8 h-8 text-rose-500 transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
            </div>
            <span className="font-poppins font-bold text-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-transparent bg-clip-text">
              FamBook
            </span>
          </Link>

          {isSignedIn ? (
            // Authenticated Navigation
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>

              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.imageUrl}
                        alt={user.firstName || ''}
                      />
                      <AvatarFallback className="bg-rose-100 text-rose-500">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            // Public Navigation
            <div className="flex items-center gap-6">
              <Link
                href="/about"
                className="font-poppins text-gray-600 hover:text-gray-900 hover:scale-105 transition-all"
              >
                Our Story
              </Link>
              <Link
                href="/features"
                className="font-poppins text-gray-600 hover:text-gray-900 hover:scale-105 transition-all"
              >
                What We Offer
              </Link>
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  className="font-poppins hover:scale-105 transition-all"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-rose-500 hover:bg-rose-600 font-poppins shadow-lg hover:shadow-rose-200/50 hover:scale-105 transition-all">
                  Sign Up to FamBook
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </Container>
    </nav>
  );
}

export default Navbar;
