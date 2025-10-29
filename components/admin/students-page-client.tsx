"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GraduationCap, Users, CheckCircle, XCircle, Clock } from "lucide-react"
import { StudentsTable } from "@/components/admin/students-table"
import { AdminEmptyState } from "@/components/ui/admin-empty-state"

interface Student {
  id: string
  email: string
  firstName: string
  lastName: string
  middleName: string | null
  studentId: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  approvedBy: string | null
  approvedAt: Date | null
  rejectionReason: string | null
  createdAt: Date
  enrollmentDocuments: {
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number
    documentType: string
    uploadedAt: Date
  }[]
}

interface StudentsPageClientProps {
  pendingStudents: Student[]
  approvedStudents: Student[]
  rejectedStudents: Student[]
  onApprove: (studentId: string) => Promise<void>
  onReject: (studentId: string, reason: string) => Promise<void>
}

export function StudentsPageClient({ 
  pendingStudents, 
  approvedStudents, 
  rejectedStudents, 
  onApprove, 
  onReject 
}: StudentsPageClientProps) {
  const [activeTab, setActiveTab] = useState("pending")

  // Calculate stats
  const stats = {
    totalPending: pendingStudents.length,
    totalApproved: approvedStudents.length,
    totalRejected: rejectedStudents.length,
    totalStudents: pendingStudents.length + approvedStudents.length + rejectedStudents.length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
        <p className="text-muted-foreground">
          Manage student registrations and enrollment approvals
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalApproved}</div>
            <p className="text-xs text-muted-foreground">
              Active students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalRejected}</div>
            <p className="text-xs text-muted-foreground">
              Rejected applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              All time registrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({stats.totalPending})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({stats.totalApproved})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({stats.totalRejected})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingStudents.length === 0 ? (
            <AdminEmptyState
              iconName="Clock"
              title="No Pending Students"
              description="There are currently no student registrations awaiting approval. New student registrations will appear here for review."
            />
          ) : (
            <StudentsTable
              students={pendingStudents}
              onApprove={onApprove}
              onReject={onReject}
              showActions={true}
            />
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedStudents.length === 0 ? (
            <AdminEmptyState
              iconName="CheckCircle"
              title="No Approved Students"
              description="There are currently no approved students in the system. Approved students will appear here."
            />
          ) : (
            <StudentsTable
              students={approvedStudents}
              onApprove={onApprove}
              onReject={onReject}
              showActions={false}
            />
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedStudents.length === 0 ? (
            <AdminEmptyState
              iconName="XCircle"
              title="No Rejected Students"
              description="There are currently no rejected student registrations. Rejected applications will appear here."
            />
          ) : (
            <StudentsTable
              students={rejectedStudents}
              onApprove={onApprove}
              onReject={onReject}
              showActions={false}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

