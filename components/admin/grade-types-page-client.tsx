"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GradeTypesTable } from "@/components/admin/grade-types-table"
import { GradeTypeFormModal } from "@/components/admin/grade-type-form-modal"
import { Award, Plus } from "lucide-react"
import { AdminEmptyState } from "@/components/ui/admin-empty-state"
import { Button } from "@/components/ui/button"

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

interface GradeTypesPageClientProps {
  gradeTypes: GradeType[]
}

export function GradeTypesPageClient({ gradeTypes }: GradeTypesPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGradeType, setEditingGradeType] = useState<GradeType | null>(null)

  const handleAdd = () => {
    setEditingGradeType(null)
    setIsModalOpen(true)
  }

  const handleEdit = (gradeType: GradeType) => {
    setEditingGradeType(gradeType)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingGradeType(null)
  }

  const handleSuccess = () => {
    // Refresh the page to show updated data
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grade Types</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage grade types and their order
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Grade Type
        </Button>
      </div>

      {gradeTypes.length === 0 ? (
        <AdminEmptyState
          iconName="Award"
          title="No Grade Types Found"
          description="There are currently no grade types in the system. Create your first grade type to get started with grading criteria."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Grade Types</CardTitle>
          </CardHeader>
          <CardContent>
            <GradeTypesTable 
              gradeTypes={gradeTypes} 
              onEdit={handleEdit}
            />
          </CardContent>
        </Card>
      )}

      <GradeTypeFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        gradeType={editingGradeType}
      />
    </div>
  )
}

