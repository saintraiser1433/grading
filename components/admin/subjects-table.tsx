"use client"

import { useState } from "react"
import { Subject, SchoolYear, User } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, MoreHorizontal } from "lucide-react"
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
import { deleteSubject, updateSubject } from "@/lib/actions/subject.actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"

interface SubjectsTableProps {
  subjects: (Subject & {
    schoolYear: SchoolYear | null
    subjectAssignments: {
      teacher: User
    }[]
    _count: {
      classes: number
      enrollments: number
    }
  })[]
  onEdit?: (subject: Subject) => void
}

export function SubjectsTable({ subjects, onEdit }: SubjectsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const result = await deleteSubject(deleteId)

    if (result.success) {
      toast({
        title: "Success",
        description: "Subject deleted successfully",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete subject",
        variant: "destructive",
      })
    }

    setIsDeleting(false)
    setDeleteId(null)
  }

  const toggleOpen = async (id: string, currentState: boolean) => {
    const result = await updateSubject({ id, isOpen: !currentState })

    if (result.success) {
      toast({
        title: "Success",
        description: `Subject ${!currentState ? "opened" : "closed"} successfully`,
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update subject",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<typeof subjects[0]>[] = [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Code" />
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("code")}</div>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
    },
    {
      accessorKey: "units",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Units" />
      ),
    },
    {
      accessorKey: "assignedTeachers",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assigned Teachers" />
      ),
      cell: ({ row }) => {
        const assignments = row.original.subjectAssignments
        return assignments.length > 0 ? (
          <div className="space-y-1">
            {assignments.map((assignment) => (
              <div key={assignment.teacher.id} className="text-sm">
                <div className="font-medium">{assignment.teacher.firstName} {assignment.teacher.lastName}</div>
                <div className="text-gray-500">{assignment.teacher.email}</div>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 italic">Not assigned</span>
        )
      },
    },
    {
      accessorKey: "isOpen",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const subject = row.original
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={subject.isOpen}
              onCheckedChange={() => toggleOpen(subject.id, subject.isOpen)}
            />
            <Badge variant={subject.isOpen ? "default" : "secondary"}>
              {subject.isOpen ? "Open" : "Closed"}
            </Badge>
          </div>
        )
      },
    },
    {
      id: "classes",
      header: "Classes",
      cell: ({ row }) => row.original._count.classes,
    },
    {
      id: "enrollments",
      header: "Enrollments",
      cell: ({ row }) => row.original._count.enrollments,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const subject = row.original

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
                onClick={() => navigator.clipboard.writeText(subject.code)}
              >
                Copy subject code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onEdit ? onEdit(subject) : router.push(`/admin/subjects/${subject.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteId(subject.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (subjects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No subjects found</p>
      </div>
    )
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={subjects}
        searchKey="name"
        searchPlaceholder="Search subjects by name or code..."
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subject and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

