"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClerk, useUser } from "@clerk/nextjs";
import { AnimatePresence } from "framer-motion";
import { Heart, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Container from "./Container";
import NotificationBell from "./NotificationBell";
import { Button } from "./ui/button";

function Navbar() {
  const { signOut } = useClerk();
  const { user, isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  console.log("logged in user", user);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="border-b bg-white/50 backdrop-blur-md fixed w-full z-50">
      <Container>
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Heart className="w-8 h-8 text-rose-500 transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
            </div>
            <span className="font-poppins font-bold text-xl sm:text-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-transparent bg-clip-text">
              FamBook
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center">
            {isSignedIn ? (
              // Authenticated Navigation
              <div className="flex items-center gap-6">
                <Link href="/dashboard">
                  <Button className="bg-rose-500 hover:bg-rose-600 text-white px-4">
                    Dashboard
                  </Button>
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
                          alt={user.firstName || ""}
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
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // Public Navigation
              <div className="flex items-center gap-6">
                <Link
                  href="#features"
                  className="font-poppins text-gray-600 hover:text-gray-900 hover:scale-105 transition-all"
                >
                  Features
                </Link>
                <Link
                  href="#comparisons"
                  className="font-poppins text-gray-600 hover:text-gray-900 hover:scale-105 transition-all"
                >
                  Why Us
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
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center gap-4">
            {isSignedIn && <NotificationBell />}
            {isSignedIn ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="p-0 rounded-full h-9 w-9"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.imageUrl} alt={user.firstName || ""} />
                  <AvatarFallback className="bg-rose-100 text-rose-500 text-xs">
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
              <div className="py-4 space-y-2">
                {isSignedIn ? (
                  // Authenticated Mobile Navigation
                  <>
                    <div className="flex items-center gap-3 px-4 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.imageUrl}
                          alt={user.firstName || ""}
                        />
                        <AvatarFallback className="bg-rose-100 text-rose-500 text-sm">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-poppins font-medium text-gray-700">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-2 font-poppins text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      Dashboard
                    </Link>

                    <button
                      onClick={() => {
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 font-poppins text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  // Public Mobile Navigation
                  <>
                    <div className="px-4 py-2 space-y-2 flex flex-col gap-2">
                      <Link
                        href="/sign-up"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Button
                          className="w-full text-rose-500 border border-rose-500 font-poppins"
                          variant="outline"
                        >
                          Sign In
                        </Button>
                      </Link>
                      <Link
                        href="/sign-up"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Button className="w-full bg-rose-500 hover:bg-rose-600 font-poppins shadow-lg">
                          Sign Up to FamBook
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </AnimatePresence>
      </Container>
    </nav>
  );
}

export default Navbar;
