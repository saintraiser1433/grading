"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SchoolYearsTable } from "@/components/admin/schoolyears-table"
import { SchoolYearFormModal } from "@/components/admin/schoolyear-form-modal"
import { Calendar, Plus } from "lucide-react"
import { AdminEmptyState } from "@/components/ui/admin-empty-state"
import { Button } from "@/components/ui/button"

interface SchoolYear {
  id: string
  year: string
  semester: string
  isActive: boolean
  startDate: Date
  endDate: Date
  createdAt: Date
  updatedAt: Date
}

interface SchoolYearsPageClientProps {
  schoolYears: SchoolYear[]
}

export function SchoolYearsPageClient({ schoolYears }: SchoolYearsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAdd = () => {
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleSuccess = () => {
    // Refresh the page to show updated data
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">School Years</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage academic years and semesters
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add School Year
        </Button>
      </div>

      {schoolYears.length === 0 ? (
        <AdminEmptyState
          iconName="Calendar"
          title="No School Years Found"
          description="There are currently no school years in the system. Create your first academic year to get started with semester management."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All School Years</CardTitle>
          </CardHeader>
          <CardContent>
            <SchoolYearsTable schoolYears={schoolYears} />
          </CardContent>
        </Card>
      )}

      <SchoolYearFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

