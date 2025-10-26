"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  GraduationCap,
  ClipboardList,
  FileCheck,
  LogOut,
  Menu,
  X,
  Settings,
  ChevronDown,
  Percent,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

const adminNavigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Faculty", href: "/admin/faculty", icon: Users },
  { name: "Subjects", href: "/admin/subjects", icon: BookOpen },
  { name: "School Years", href: "/admin/school-years", icon: Calendar },
  { name: "Grading Criteria", href: "/admin/grading-criteria", icon: Percent },
  { name: "Grade Submissions", href: "/admin/submissions", icon: FileCheck },
]

const teacherNavigation = [
  { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { name: "My Classes", href: "/teacher/classes", icon: BookOpen },
  { name: "Grading Components", href: "/teacher/grading-components", icon: Settings },
  { name: "Grade Submissions", href: "/teacher/submissions", icon: FileCheck },
]

const studentNavigation = [
  { name: "Dashboard", href: "/student", icon: LayoutDashboard },
  { name: "Enroll Subjects", href: "/student/enroll", icon: BookOpen },
  { name: "My Grades", href: "/student/grades", icon: ClipboardList },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState))
    }
  }, [])

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  const navigation =
    session?.user.role === "ADMIN"
      ? adminNavigation
      : session?.user.role === "TEACHER"
      ? teacherNavigation
      : studentNavigation

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform bg-background border-r shadow-lg transition-all duration-300 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <div className="flex items-center gap-3">
              <Image
                src="/gitlogo.png"
                alt="GIT Logo"
                width={40}
                height={40}
                className="rounded-full"
              />
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold">GGS</h1>
                  <p className="text-xs text-muted-foreground">Grading System</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              // For dashboard pages, only match exact path
              // For other pages, match if pathname starts with the href
              const isDashboard = item.href === "/admin" || item.href === "/teacher" || item.href === "/student"
              const isActive = isDashboard 
                ? pathname === item.href 
                : pathname === item.href || pathname.startsWith(item.href + "/")
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    sidebarCollapsed ? "justify-center" : ""
                  )}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  {!sidebarCollapsed && item.name}
                </Link>
              )
            })}
          </nav>

          {/* User menu */}
          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full gap-3 hover:bg-accent",
                    sidebarCollapsed ? "justify-center" : "justify-start"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {session?.user.name ? getInitials(session.user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{session?.user.name}</p>
                        <p className="text-xs text-muted-foreground">{session?.user.role}</p>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-0" : "lg:ml-0"
      )}>
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

