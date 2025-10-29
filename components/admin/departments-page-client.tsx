"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DepartmentsTable } from "@/components/admin/departments-table"
import { DepartmentForm } from "@/components/admin/department-form"
import { Building2, Plus } from "lucide-react"
import { AdminEmptyState } from "@/components/ui/admin-empty-state"
import { Button } from "@/components/ui/button"

interface Department {
  id: string
  code: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

interface DepartmentsPageClientProps {
  departments: Department[]
}

export function DepartmentsPageClient({ departments }: DepartmentsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Departments</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage academic departments and their information
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <AdminEmptyState
          iconName="Building2"
          title="No Departments Found"
          description="There are currently no departments in the system. Create your first department to organize subjects and faculty."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <DepartmentsTable departments={departments} />
          </CardContent>
        </Card>
      )}

      <DepartmentForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

