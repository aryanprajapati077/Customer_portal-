"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Menu, X, User, LogIn, FileSpreadsheet, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import Image from "next/image"
import { syncGoogleSheetToNeon } from "@/app/actions/sync-actions"
import { useToast } from "@/hooks/use-toast"

const navLinks = [
  { name: "Impact", href: "#impact" },
  { name: "Process", href: "#process" },
  { name: "ESG Value", href: "#esg" },
  { name: "Reports", href: "#reports" },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const { customer } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const result = await syncGoogleSheetToNeon()
      if (result.success) {
        toast({
          title: "Sync Successful",
          description: "Data has been updated from Google Sheets.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Sync Failed",
          description: result.error || "An unexpected error occurred.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Failed to connect to the sync service.",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled ? "glass-strong shadow-lg shadow-foreground/5 py-3" : "bg-transparent py-6",
      )}
    >
      <div className="container mx-auto px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-40 h-14 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Image
                  src="/logo.svg"
                  alt="Buffindia Logo"
                  width={140}
                  height={46}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 leading-3 text-6xl" />
            </div>
            
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 relative group"
              >
                {link.name}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary rounded-full group-hover:w-1/2 transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
              {isSyncing ? "Syncing..." : "Sync Sheets"}
            </Button>

            {customer ? (
              <Link href="/dashboard">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 rounded-full px-6">
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 rounded-full px-6">
                  <LogIn className="w-4 h-4 mr-2" />
                  Customer Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </nav>

        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border/50 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <Link
                href="/setup"
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Google Sheets Setup
              </Link>
              <div className="flex flex-col gap-2 mt-4 px-4">
                <Button variant="outline" className="w-full justify-center bg-transparent">
                  Contact
                </Button>
                {customer ? (
                  <Link href="/dashboard" className="w-full">
                    <Button className="w-full justify-center bg-primary text-primary-foreground">
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login" className="w-full">
                    <Button className="w-full justify-center bg-primary text-primary-foreground">
                      <LogIn className="w-4 h-4 mr-2" />
                      Customer Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
