"use client"

import { GradeSubmission, Class, Subject, User, SchoolYear } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Eye, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { format } from "date-fns"

type SubmissionType = GradeSubmission & {
  class: Class & { subject: Subject }
  teacher: User
  schoolYear: SchoolYear
  approver: User | null
}

interface SubmissionsTableProps {
  submissions: SubmissionType[]
  adminId: string
}

export function SubmissionsTable({ submissions, adminId }: SubmissionsTableProps) {
  const columns: ColumnDef<SubmissionType>[] = [
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
      accessorKey: "teacher",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Teacher" />
      ),
      cell: ({ row }) => {
        const teacher = row.original.teacher
        return `${teacher.firstName} ${teacher.lastName}`
      },
    },
    {
      accessorKey: "isMidterm",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Period" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.getValue("isMidterm") ? "Midterm" : "Final"}
        </Badge>
      ),
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => window.open(`/admin/submissions/${submission.id}/view`, '_blank')}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Grades
              </DropdownMenuItem>
              {submission.status !== "PENDING" && submission.comments && (
                <DropdownMenuItem
                  onClick={() => {
                    alert(`Comments: ${submission.comments}`)
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Comments
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No grade submissions found</p>
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={submissions}
      searchKey="subject"
      searchPlaceholder="Search by subject or teacher..."
    />
  )
}
