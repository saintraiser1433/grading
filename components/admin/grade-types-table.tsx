"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import { useToast } from "@/hooks/use-toast"

interface GradeType {
  id: string
  name: string
  description: string | null
  percentage: number
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface GradeTypesTableProps {
  gradeTypes: GradeType[]
  onEdit?: (gradeType: GradeType) => void
}

export function GradeTypesTable({ gradeTypes, onEdit }: GradeTypesTableProps) {
  const { toast } = useToast()

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this grade type?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/grade-types/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Grade type deleted successfully",
        })
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete grade type",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<GradeType>[] = [
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
        const description = row.getValue("description") as string | null
        return (
          <div className="text-sm text-muted-foreground">
            {description || "No description"}
          </div>
        )
      },
    },
    {
      accessorKey: "percentage",
      header: "Percentage",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.getValue("percentage")}%
        </Badge>
      ),
    },
    {
      accessorKey: "order",
      header: "Order",
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("order")}</div>
      ),
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
      header: "Actions",
      cell: ({ row }) => {
        const gradeType = row.original

        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onEdit ? onEdit(gradeType) : window.location.href = `/admin/grade-types/${gradeType.id}/edit`}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(gradeType.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={gradeTypes}
      searchKey="name"
      searchPlaceholder="Search grade types..."
    />
  )
}
