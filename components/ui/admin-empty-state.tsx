"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BookOpen, Users, Award, Calendar, Building2, FileText, GraduationCap, FileCheck } from "lucide-react"
import { useRouter } from "next/navigation"

interface AdminEmptyStateProps {
  iconName: string
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  className?: string
}

const iconMap = {
  BookOpen,
  Users,
  Award,
  Calendar,
  Building2,
  FileText,
  GraduationCap,
  FileCheck,
}

export function AdminEmptyState({
  iconName,
  title,
  description,
  actionLabel,
  actionHref,
  className = ""
}: AdminEmptyStateProps) {
  const router = useRouter()
  const Icon = iconMap[iconName as keyof typeof iconMap] || BookOpen

  const handleAction = () => {
    if (actionHref) {
      router.push(actionHref)
    }
  }

  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {description}
        </p>
        {actionLabel && actionHref && (
          <Button onClick={handleAction} className="gap-2">
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
