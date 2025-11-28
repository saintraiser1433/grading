"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, FileText, User, Calendar, CheckCircle } from "lucide-react"
import Link from "next/link"
import { AdminEmptyState } from "@/components/ui/admin-empty-state"

type Submission = {
  id: string
  class: {
    subject: {
      code: string
      name: string
      units: number
    }
    teacher: {
      firstName: string
      lastName: string
    }
    name: string
    section: string
  }
  gradeType: {
    name: string
  } | null
  schoolYear: {
    year: string
    semester: string
  }
  submittedAt: Date
  approvedAt?: Date | null
  approver?: {
    firstName: string
    lastName: string
  } | null
}

interface SubmissionsTabsProps {
  pendingSubmissions: Submission[]
  approvedSubmissions: Submission[]
}

export function SubmissionsTabs({ pendingSubmissions, approvedSubmissions }: SubmissionsTabsProps) {
  const [activeTab, setActiveTab] = useState("pending")

  const renderSubmissionCard = (submission: Submission, isPending: boolean) => (
    <Card key={submission.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {submission.class.subject.code} - {submission.class.subject.name}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{submission.class.teacher.firstName} {submission.class.teacher.lastName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{submission.schoolYear.year} - {submission.schoolYear.semester}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{submission.gradeType?.name || 'Unknown Grade Type'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`flex items-center gap-1 ${isPending ? '' : 'bg-green-50 text-green-700 border-green-200'}`}
            >
              {isPending ? (
                <>
                  <Clock className="h-3 w-3" />
                  PENDING
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3" />
                  APPROVED
                </>
              )}
            </Badge>
            <span className="text-sm text-gray-500">
              {isPending 
                ? new Date(submission.submittedAt).toLocaleDateString()
                : submission.approvedAt 
                  ? new Date(submission.approvedAt).toLocaleDateString()
                  : new Date(submission.submittedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Class:</span> {submission.class.name} - {submission.class.section}
            </div>
            <div>
              <span className="font-medium">Units:</span> {submission.class.subject.units}
            </div>
            {!isPending && submission.approver && (
              <div className="col-span-2">
                <span className="font-medium">Approved by:</span> {submission.approver.firstName} {submission.approver.lastName}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" asChild>
              <Link href={`/admin/submissions/${submission.id}`}>
                <FileText className="mr-2 h-4 w-4" />
                Review Grades
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="pending" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Pending ({pendingSubmissions.length})
        </TabsTrigger>
        <TabsTrigger value="approved" className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Approved ({approvedSubmissions.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="mt-6">
        {pendingSubmissions.length > 0 ? (
          <div className="grid gap-4">
            {pendingSubmissions.map((submission) => renderSubmissionCard(submission, true))}
          </div>
        ) : (
          <AdminEmptyState
            iconName="FileText"
            title="No Pending Submissions"
            description="There are no pending grade submissions to review at this time."
          />
        )}
      </TabsContent>

      <TabsContent value="approved" className="mt-6">
        {approvedSubmissions.length > 0 ? (
          <div className="grid gap-4">
            {approvedSubmissions.map((submission) => renderSubmissionCard(submission, false))}
          </div>
        ) : (
          <AdminEmptyState
            iconName="CheckCircle"
            title="No Approved Submissions"
            description="There are no approved grade submissions yet."
          />
        )}
      </TabsContent>
    </Tabs>
  )
}

