"use client"

import { useState } from "react"
import { GradeSubmission, Class, Subject, User, SchoolYear } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Eye, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { approveGradeSubmission, declineGradeSubmission } from "@/lib/actions/grade.actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
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
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionType | null>(null)
  const [actionType, setActionType] = useState<"approve" | "decline" | null>(null)
  const [comments, setComments] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleAction = async () => {
    if (!selectedSubmission || !actionType) return

    setIsLoading(true)

    const result =
      actionType === "approve"
        ? await approveGradeSubmission(selectedSubmission.id, adminId, comments)
        : await declineGradeSubmission(selectedSubmission.id, adminId, comments)

    if (result.success) {
      toast({
        title: "Success",
        description: `Submission ${actionType === "approve" ? "approved" : "declined"}`,
      })
      setSelectedSubmission(null)
      setActionType(null)
      setComments("")
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || `Failed to ${actionType} submission`,
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const openDialog = (submission: SubmissionType, action: "approve" | "decline") => {
    setSelectedSubmission(submission)
    setActionType(action)
    setComments("")
  }

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
              {submission.status === "PENDING" && (
                <>
                  <DropdownMenuItem onClick={() => openDialog(submission, "approve")}>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openDialog(submission, "decline")}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Decline
                  </DropdownMenuItem>
                </>
              )}
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
    <>
      <DataTable
        columns={columns}
        data={submissions}
        searchKey="subject"
        searchPlaceholder="Search by subject or teacher..."
      />

      <Dialog
        open={!!selectedSubmission}
        onOpenChange={() => {
          setSelectedSubmission(null)
          setActionType(null)
          setComments("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Decline"} Grade Submission
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission &&
                `${selectedSubmission.class.subject.code} - ${selectedSubmission.class.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comments">
                Comments {actionType === "decline" && "*"}
              </Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add comments..."
                required={actionType === "decline"}
                disabled={isLoading}
                rows={4}
              />
            </div>
            <div className="flex gap-4">
              <Button
                onClick={handleAction}
                disabled={isLoading || (actionType === "decline" && !comments)}
                className={
                  actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {isLoading ? "Processing..." : actionType === "approve" ? "Approve" : "Decline"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSubmission(null)
                  setActionType(null)
                  setComments("")
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
