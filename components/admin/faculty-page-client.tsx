"use client"

import { User, Subject, SchoolYear, DepartmentHead, Department } from "@prisma/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FacultyTable } from "@/components/admin/faculty-table"
import { FacultySubjectAssignmentForm } from "@/components/admin/faculty-subject-assignment-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface FacultyPageClientProps {
  teachers: User[]
  subjects: (Subject & {
    assignedTeacher: User | null
    subjectAssignments: {
      teacher: User
    }[]
  })[]
  schoolYears: SchoolYear[]
  departmentHeads: DepartmentHead[]
  departments: Department[]
}

export function FacultyPageClient({
  teachers,
  subjects,
  schoolYears,
  departmentHeads,
  departments
}: FacultyPageClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Faculty Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage teachers and faculty members
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/faculty/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Faculty
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="faculty" className="space-y-4">
        <TabsList>
          <TabsTrigger value="faculty">
            <Users className="mr-2 h-4 w-4" />
            Faculty Members
          </TabsTrigger>
          <TabsTrigger value="assign-subjects">
            <BookOpen className="mr-2 h-4 w-4" />
            Assign Subjects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faculty">
          <Card>
            <CardHeader>
              <CardTitle>All Faculty Members</CardTitle>
              <CardDescription>
                View and manage all faculty members in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FacultyTable teachers={teachers} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assign-subjects">
          <Card>
            <CardHeader>
              <CardTitle>Assign Subjects to Faculty</CardTitle>
              <CardDescription>
                Assign subjects to teachers and manage their teaching assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FacultySubjectAssignmentForm
                teachers={teachers}
                subjects={subjects}
                schoolYears={schoolYears}
                departmentHeads={departmentHeads}
                departments={departments}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

