"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DepartmentHeadsTable } from "@/components/admin/departmentheads-table"
import { DepartmentHeadForm } from "@/components/admin/departmenthead-form"
import { Users, Plus } from "lucide-react"
import { AdminEmptyState } from "@/components/ui/admin-empty-state"
import { Button } from "@/components/ui/button"

interface DepartmentHead {
  id: string
  name: string
  title: string | null
  email: string | null
  phone: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface DepartmentHeadsPageClientProps {
  departmentHeads: DepartmentHead[]
}

export function DepartmentHeadsPageClient({ departmentHeads }: DepartmentHeadsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Department Heads</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage department heads and their information
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department Head
        </Button>
      </div>

      {departmentHeads.length === 0 ? (
        <AdminEmptyState
          iconName="Users"
          title="No Department Heads Found"
          description="There are currently no department heads in the system. Add department heads to manage academic departments."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Department Heads</CardTitle>
          </CardHeader>
          <CardContent>
            <DepartmentHeadsTable departmentHeads={departmentHeads} />
          </CardContent>
        </Card>
      )}

      <DepartmentHeadForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

