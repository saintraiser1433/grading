"use client"

import { useState } from "react"
import { SchoolYear } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SubjectsTable } from "@/components/admin/subjects-table"
import { SubjectFormModal } from "@/components/admin/subject-form-modal"
import { BookOpen, Plus } from "lucide-react"
import { AdminEmptyState } from "@/components/ui/admin-empty-state"
import { Button } from "@/components/ui/button"

interface Subject {
  id: string
  code: string
  name: string
  description: string | null
  units: number
  isOpen: boolean
  schoolYearId: string | null
  departmentId: string | null
  assignedTeacherId: string | null
  createdAt: Date
  updatedAt: Date
  schoolYear?: SchoolYear | null
  subjectAssignments?: {
    id: string
    teacherId: string
    teacher: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }[]
}

interface SubjectsPageClientProps {
  subjects: Subject[]
  schoolYears: SchoolYear[]
}

export function SubjectsPageClient({ subjects, schoolYears }: SubjectsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)

  const handleAdd = () => {
    setEditingSubject(null)
    setIsModalOpen(true)
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingSubject(null)
  }

  const handleSuccess = () => {
    // Refresh the page to show updated data
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subjects Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage subjects and course offerings
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {subjects.length === 0 ? (
        <AdminEmptyState
          iconName="BookOpen"
          title="No Subjects Found"
          description="There are currently no subjects in the system. Create your first subject to get started with course management."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <SubjectsTable subjects={subjects} onEdit={handleEdit} />
          </CardContent>
        </Card>
      )}

      <SubjectFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        subject={editingSubject}
        schoolYears={schoolYears}
      />
    </div>
  )
}
