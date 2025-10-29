"use client"

import { useState } from "react"
import { Department } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { DepartmentForm } from "./department-form"
import { deleteDepartment } from "@/lib/actions/department.actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface DepartmentsTableProps {
  departments: Department[]
}

export function DepartmentsTable({ departments }: DepartmentsTableProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  const handleEdit = (department: Department) => {
    setEditingDepartment(department)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return

    const result = await deleteDepartment(id)
    if (result.success) {
      toast({
        title: "Success",
        description: "Department deleted successfully",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingDepartment(null)
    router.refresh()
  }

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("code")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string
        return description ? (
          <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
            {description}
          </div>
        ) : (
          "-"
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const department = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(department)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(department.id)}
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

  return (
    <>
      <DataTable 
        columns={columns} 
        data={departments} 
        searchKey="name"
        searchPlaceholder="Search departments..."
      />

      <DepartmentForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        department={editingDepartment}
      />
    </>
  )
}


