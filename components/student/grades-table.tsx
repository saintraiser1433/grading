"use client"

import { Enrollment, Subject, Class, User, Grade } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { GradeDisplay } from "@/components/ui/grade-badge"

type EnrollmentWithDetails = Enrollment & {
  subject: Subject
  class: (Class & { teacher: User }) | null
  grades: (Grade & { gradeType: { name: string; percentage: number } | null })[]
}

interface GradesTableProps {
  enrollments: EnrollmentWithDetails[]
  availableGradeTypes?: Array<{ name: string; percentage: number }>
}

export function GradesTable({ enrollments, availableGradeTypes = [] }: GradesTableProps) {
  // Get all unique grade types from all enrollments
  const allGradeTypes = new Map()
  enrollments.forEach(enrollment => {
    enrollment.grades.forEach(grade => {
      if (grade.gradeType) {
        allGradeTypes.set(grade.gradeType.name, {
          name: grade.gradeType.name,
          percentage: grade.gradeType.percentage
        })
      }
    })
  })

  // If no grade types found in data, use the available grade types from props
  // This handles cases where no grades have been submitted yet
  let gradeTypesArray = Array.from(allGradeTypes.values())
  
  // If no grade types found in data, use the provided available grade types
  if (gradeTypesArray.length === 0 && availableGradeTypes.length > 0) {
    gradeTypesArray = availableGradeTypes
  }
  
  // If still no grade types found, show a helpful message
  if (gradeTypesArray.length === 0) {
  }

  // Helper function to calculate overall grade
  const calculateOverallGrade = (grades: any[]) => {
    let totalWeightedScore = 0
    let totalWeight = 0
    let hasAllGrades = true
    
    // Group grades by grade type
    const gradesByType = new Map()
    grades.forEach(grade => {
      if (grade.gradeType) {
        gradesByType.set(grade.gradeType.name, {
          grade: grade.grade,
          percentage: grade.gradeType.percentage
        })
      }
    })
    
    // Calculate weighted average using all available grade types
    gradeTypesArray.forEach(gradeType => {
      const gradeData = gradesByType.get(gradeType.name)
      if (gradeData && gradeData.grade !== null && gradeData.grade !== undefined) {
        totalWeightedScore += (gradeData.grade * gradeData.percentage) / 100
        totalWeight += gradeData.percentage
      } else {
        hasAllGrades = false
      }
    })
    
    // Only calculate overall if we have all grades and total weight is 100%
    return (hasAllGrades && totalWeight === 100) ? totalWeightedScore : null
  }

  const columns: ColumnDef<EnrollmentWithDetails>[] = [
    {
      accessorKey: "subjectCode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Subject Code" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.subject.code}</div>
      ),
      filterFn: (row, id, value) => {
        return row.original.subject.code.toLowerCase().includes(value.toLowerCase()) ||
               row.original.subject.name.toLowerCase().includes(value.toLowerCase())
      },
    },
    {
      accessorKey: "subjectName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Subject Name" />
      ),
      cell: ({ row }) => row.original.subject.name,
    },
    {
      accessorKey: "class",
      header: "Class",
      cell: ({ row }) => {
        const cls = row.original.class
        return cls ? `${cls.name} - ${cls.section}` : "—"
      },
    },
    {
      accessorKey: "teacher",
      header: "Teacher",
      cell: ({ row }) => {
        const teacher = row.original.class?.teacher
        return teacher ? `${teacher.firstName} ${teacher.lastName}` : "—"
      },
    },
    // Dynamically generate columns for each grade type
    ...gradeTypesArray.map(gradeType => ({
      accessorKey: gradeType.name.toLowerCase(),
      header: ({ column }: { column: any }) => (
        <div className="text-center">
          <DataTableColumnHeader column={column} title={gradeType.name} />
        </div>
      ),
      cell: ({ row }: { row: any }) => {
        const grade = row.original.grades.find((g: any) => g.gradeType?.name === gradeType.name)
        return (
          <div className="text-center">
            {grade?.grade ? (
              <GradeDisplay 
                grade={grade.grade} 
                showPercentage={false}
                showNumericalValue={true}
                showDescription={true}
                className="justify-center"
              />
            ) : (
              "—"
            )}
          </div>
        )
      },
    })),
    {
      accessorKey: "overall",
      header: ({ column }) => (
        <div className="text-center">
          <DataTableColumnHeader column={column} title="Overall" />
        </div>
      ),
      cell: ({ row }) => {
        const overallGrade = calculateOverallGrade(row.original.grades)
        return (
          <div className="text-center">
            {overallGrade ? (
              <GradeDisplay 
                grade={overallGrade} 
                showPercentage={false}
                showNumericalValue={true}
                showDescription={true}
                className="justify-center font-semibold"
              />
            ) : (
              "—"
            )}
          </div>
        )
      },
    },
  ]

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No enrollments found</p>
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={enrollments}
      searchKey="subjectCode"
      searchPlaceholder="Search by subject code or name..."
    />
  )
}

