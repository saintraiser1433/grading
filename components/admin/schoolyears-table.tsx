"use client"

import { useState } from "react"
import { SchoolYear } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, CheckCircle, MoreHorizontal } from "lucide-react"
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
import { deleteSchoolYear, updateSchoolYear } from "@/lib/actions/schoolyear.actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface SchoolYearsTableProps {
  schoolYears: SchoolYear[]
}

export function SchoolYearsTable({ schoolYears }: SchoolYearsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const result = await deleteSchoolYear(deleteId)

    if (result.success) {
      toast({
        title: "Success",
        description: "School year deleted successfully",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete school year",
        variant: "destructive",
      })
    }

    setIsDeleting(false)
    setDeleteId(null)
  }

  const setActive = async (id: string) => {
    const result = await updateSchoolYear({ id, isActive: true })

    if (result.success) {
      toast({
        title: "Success",
        description: "School year activated successfully",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to activate school year",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<SchoolYear>[] = [
    {
      accessorKey: "year",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Academic Year" />
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("year")}</div>,
    },
    {
      accessorKey: "semester",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Semester" />
      ),
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => format(new Date(row.getValue("startDate")), "MMM dd, yyyy"),
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="End Date" />
      ),
      cell: ({ row }) => format(new Date(row.getValue("endDate")), "MMM dd, yyyy"),
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean
        return isActive ? (
          <Badge className="bg-green-600">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const sy = row.original

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
                onClick={() => navigator.clipboard.writeText(sy.year)}
              >
                Copy year
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!sy.isActive && (
                <DropdownMenuItem onClick={() => setActive(sy.id)}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Set as Active
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => router.push(`/admin/school-years/${sy.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteId(sy.id)}
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

  if (schoolYears.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No school years found</p>
      </div>
    )
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={schoolYears}
        searchKey="year"
        searchPlaceholder="Search by year..."
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the school year.
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
