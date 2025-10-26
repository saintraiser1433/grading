"use client"

import { useState } from "react"
import { User } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Mail, MoreHorizontal, BookOpen } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { deleteUser } from "@/lib/actions/user.actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface FacultyTableProps {
  teachers: User[]
}

export function FacultyTable({ teachers }: FacultyTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const result = await deleteUser(deleteId)

    if (result.success) {
      toast({
        title: "Success",
        description: "Faculty member deleted successfully",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete faculty member",
        variant: "destructive",
      })
    }

    setIsDeleting(false)
    setDeleteId(null)
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const teacher = row.original
        return (
          <div className="font-medium">
            {teacher.firstName} {teacher.middleName ? teacher.middleName + " " : ""}{teacher.lastName}
          </div>
        )
      },
      filterFn: (row, id, value) => {
        const teacher = row.original
        const fullName = `${teacher.firstName} ${teacher.middleName || ""} ${teacher.lastName}`.toLowerCase()
        return fullName.includes(value.toLowerCase())
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
          {row.getValue("email")}
        </div>
      ),
    },
    {
      accessorKey: "employeeId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Employee ID" />
      ),
      cell: ({ row }) => row.getValue("employeeId") || "N/A",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const teacher = row.original

        return (
          <>
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
                  onClick={() => navigator.clipboard.writeText(teacher.email)}
                >
                  Copy email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push(`/admin/faculty/${teacher.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/admin/assign-subjects?teacher=${teacher.id}`)}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Assign Subjects
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteId(teacher.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )
      },
    },
  ]

  if (teachers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No faculty members found</p>
      </div>
    )
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={teachers}
        searchKey="name"
        searchPlaceholder="Search faculty by name..."
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the faculty member.
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

