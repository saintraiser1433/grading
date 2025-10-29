"use client"

import { useState } from "react"
import { Enrollment, User } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, MoreHorizontal, Mail, CheckCircle, XCircle, Clock, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { removeStudentFromClass, approveEnrollment, rejectEnrollment } from "@/lib/actions/class.actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

type EnrollmentWithStudent = Enrollment & { student: User }

interface ClassStudentsProps {
  classId: string
  enrollments: EnrollmentWithStudent[]
}

export function ClassStudents({ classId, enrollments }: ClassStudentsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleApproveEnrollment = async (enrollmentId: string) => {
    setIsLoading(true)
    const result = await approveEnrollment(enrollmentId)

    if (result.success) {
      toast({
        title: "Success",
        description: "Student enrollment approved",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to approve enrollment",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  const handleRejectEnrollment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectId) return

    setIsLoading(true)
    const result = await rejectEnrollment(rejectId, rejectReason)

    if (result.success) {
      toast({
        title: "Success",
        description: "Student enrollment rejected",
      })
      setRejectId(null)
      setRejectReason("")
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to reject enrollment",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  const handleRemoveStudent = async (enrollmentId: string) => {
    if (!confirm("Are you sure you want to remove this student?")) return

    const result = await removeStudentFromClass(enrollmentId)

    if (result.success) {
      toast({
        title: "Success",
        description: "Student removed from class",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to remove student",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        )
    }
  }

  const columns: ColumnDef<EnrollmentWithStudent>[] = [
    {
      accessorKey: "studentId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student ID" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.student.studentId || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const student = row.original.student
        return `${student.firstName} ${student.middleName ? student.middleName + " " : ""}${student.lastName}`
      },
      filterFn: (row, id, value) => {
        const student = row.original.student
        const fullName = `${student.firstName} ${student.middleName || ""} ${student.lastName}`.toLowerCase()
        return fullName.includes(value.toLowerCase()) || 
               (student.studentId?.toLowerCase().includes(value.toLowerCase()) || false)
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {row.original.student.email}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        return getStatusBadge(row.original.status)
      },
    },
    {
      accessorKey: "enrolledAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Enrolled" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("enrolledAt"))
        return <div className="text-sm">{date.toLocaleDateString()}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const enrollment = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(enrollment.student.email)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {enrollment.status === "PENDING" && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleApproveEnrollment(enrollment.id)}
                    disabled={isLoading}
                    className="text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Enrollment
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setRejectId(enrollment.id)}
                    disabled={isLoading}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Enrollment
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => handleRemoveStudent(enrollment.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove from Class
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (enrollments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Students Enrolled Yet</h3>
          <p className="text-muted-foreground">
            Students will appear here once they request enrollment in this class.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={enrollments}
        searchKey="name"
        searchPlaceholder="Search by name or student ID..."
      />

      {/* Reject Enrollment Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Student Enrollment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this student's enrollment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRejectEnrollment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason for Rejection</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                required
                disabled={isLoading}
                rows={3}
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading || !rejectReason.trim()}>
                {isLoading ? "Rejecting..." : "Reject Enrollment"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRejectId(null)
                  setRejectReason("")
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}