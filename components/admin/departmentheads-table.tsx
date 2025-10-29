"use client"

import { useState } from "react"
import { DepartmentHead } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { DepartmentHeadForm } from "./departmenthead-form"
import { deleteDepartmentHead } from "@/lib/actions/departmenthead.actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface DepartmentHeadsTableProps {
  departmentHeads: DepartmentHead[]
}

export function DepartmentHeadsTable({ departmentHeads }: DepartmentHeadsTableProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDepartmentHead, setEditingDepartmentHead] = useState<DepartmentHead | null>(null)

  const handleEdit = (departmentHead: DepartmentHead) => {
    setEditingDepartmentHead(departmentHead)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department head?")) return

    const result = await deleteDepartmentHead(id)
    if (result.success) {
      toast({
        title: "Success",
        description: "Department head deleted successfully",
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
    setEditingDepartmentHead(null)
    router.refresh()
  }

  const columns: ColumnDef<DepartmentHead>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const title = row.getValue("title") as string
        return title ? <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div> : "-"
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string
        return email ? <div className="text-sm">{email}</div> : "-"
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string
        return phone ? <div className="text-sm">{phone}</div> : "-"
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const departmentHead = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(departmentHead)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(departmentHead.id)}
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
        data={departmentHeads} 
        searchKey="name"
        searchPlaceholder="Search department heads..."
      />

      <DepartmentHeadForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        departmentHead={editingDepartmentHead}
      />
    </>
  )
}


