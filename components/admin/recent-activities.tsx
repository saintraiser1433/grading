"use client"

import { GradeSubmission, Class, Subject, User } from "@prisma/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, FileCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface RecentActivitiesProps {
  submissions: (GradeSubmission & {
    class: Class & { subject: Subject }
    teacher: User
  })[]
}

export function RecentActivities({ submissions }: RecentActivitiesProps) {
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileCheck className="h-12 w-12 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No recent activities</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div key={submission.id} className="flex items-start gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs">
              {submission.teacher.firstName[0]}
              {submission.teacher.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">
                {submission.teacher.firstName} {submission.teacher.lastName}
              </p>
              <Badge
                variant={
                  submission.status === "PENDING"
                    ? "secondary"
                    : submission.status === "APPROVED"
                    ? "default"
                    : "destructive"
                }
                className="text-xs"
              >
                {submission.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Submitted {submission.isMidterm ? "midterm" : "final"} grades for{" "}
              <span className="font-medium text-foreground">
                {submission.class.subject.code}
              </span>
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(submission.submittedAt), {
                addSuffix: true,
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

