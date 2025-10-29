"use client"

import { GradeSubmission, Class, Subject, SchoolYear, User } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { AdminEmptyState } from "@/components/ui/admin-empty-state"
import { format } from "date-fns"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

type SubmissionWithDetails = GradeSubmission & {
  class: Class & { subject: Subject }
  schoolYear: SchoolYear
  approver: User | null
  gradeType: { name: string } | null
}

interface SubmissionsTableProps {
  submissions: SubmissionWithDetails[]
}

export function TeacherSubmissionsTable({ submissions }: SubmissionsTableProps) {
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDeleteSubmission = async (submissionId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/grades/delete-submission`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ submissionId }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "✅ Submission Deleted",
          description: "The grade submission has been successfully deleted.",
        })
        setDeleteDialog(null)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete submission",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete submission error:", error)
      toast({
        title: "Error",
        description: "Failed to delete submission",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }
  const columns: ColumnDef<SubmissionWithDetails>[] = [
    {
      accessorKey: "subject",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Subject" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.class.subject.code}</div>
      ),
      filterFn: (row, id, value) => {
        return row.original.class.subject.code.toLowerCase().includes(value.toLowerCase()) ||
               row.original.class.subject.name.toLowerCase().includes(value.toLowerCase())
      },
    },
    {
      accessorKey: "class",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Class" />
      ),
      cell: ({ row }) => {
        const cls = row.original.class
        return `${cls.name} - ${cls.section}`
      },
    },
    {
      accessorKey: "gradeType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Grade Type" />
      ),
      cell: ({ row }) => {
        const gradeType = row.original.gradeType
        return (
          <Badge variant="outline">
            {gradeType?.name || "Unknown"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "schoolYear",
      header: "School Year",
      cell: ({ row }) => {
        const sy = row.original.schoolYear
        return `${sy.year} - ${sy.semester}`
      },
    },
    {
      accessorKey: "submittedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Submitted" />
      ),
      cell: ({ row }) => format(new Date(row.getValue("submittedAt")), "MMM dd, yyyy"),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <>
            {status === "PENDING" && <Badge className="bg-yellow-600">Pending</Badge>}
            {status === "APPROVED" && <Badge className="bg-green-600">Approved</Badge>}
            {status === "DECLINED" && <Badge className="bg-red-600">Declined</Badge>}
          </>
        )
      },
    },
    {
      accessorKey: "comments",
      header: "Comments",
      cell: ({ row }) => {
        const comments = row.getValue("comments") as string | null
        return comments || "—"
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const submission = row.original

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
                onClick={() => navigator.clipboard.writeText(submission.id)}
              >
                Copy submission ID
              </DropdownMenuItem>
              {submission.approver && (
                <DropdownMenuItem
                  onClick={() => {
                    alert(`Reviewed by: ${submission.approver?.firstName} ${submission.approver?.lastName}`)
                  }}
                >
                  View Approver
                </DropdownMenuItem>
              )}
              {submission.status === 'PENDING' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialog(submission.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Submission
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (submissions.length === 0) {
    return (
      <AdminEmptyState
        iconName="FileCheck"
        title="No Grade Submissions Yet"
        description="You haven't submitted any grades for approval. Once you submit grades from your classes, they will appear here."
      />
    )
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={submissions}
        searchKey="subject"
        searchPlaceholder="Search by subject or class..."
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Grade Submission
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this grade submission? This action cannot be undone.
              <br /><br />
              <span className="text-sm text-gray-600">
                • The submission will be permanently removed
                <br />
                • You can resubmit grades after making changes
                <br />
                • This only works for PENDING submissions
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog && handleDeleteSubmission(deleteDialog)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Submission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

