"use client"

import { Enrollment, Subject, Class, User, Grade } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"

type EnrollmentWithDetails = Enrollment & {
  subject: Subject
  class: (Class & { teacher: User }) | null
  grades: Grade[]
}

interface GradesTableProps {
  enrollments: EnrollmentWithDetails[]
}

export function GradesTable({ enrollments }: GradesTableProps) {
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
    {
      accessorKey: "midterm",
      header: ({ column }) => (
        <div className="text-center">
          <DataTableColumnHeader column={column} title="Midterm" />
        </div>
      ),
      cell: ({ row }) => {
        const midtermGrade = row.original.grades.find((g) => g.isMidterm)
        return (
          <div className="text-center">
            {midtermGrade?.midtermGrade
              ? midtermGrade.midtermGrade.toFixed(2)
              : "—"}
          </div>
        )
      },
    },
    {
      accessorKey: "final",
      header: ({ column }) => (
        <div className="text-center">
          <DataTableColumnHeader column={column} title="Final" />
        </div>
      ),
      cell: ({ row }) => {
        const finalGrade = row.original.grades.find((g) => !g.isMidterm)
        return (
          <div className="text-center">
            {finalGrade?.finalGrade ? finalGrade.finalGrade.toFixed(2) : "—"}
          </div>
        )
      },
    },
    {
      accessorKey: "overall",
      header: ({ column }) => (
        <div className="text-center">
          <DataTableColumnHeader column={column} title="Overall" />
        </div>
      ),
      cell: ({ row }) => {
        const finalGrade = row.original.grades.find((g) => !g.isMidterm)
        return (
          <div className="text-center font-semibold">
            {finalGrade?.overallGrade
              ? finalGrade.overallGrade.toFixed(2)
              : "—"}
          </div>
        )
      },
    },
    {
      accessorKey: "remarks",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Remarks" />
      ),
      cell: ({ row }) => {
        const finalGrade = row.original.grades.find((g) => !g.isMidterm)
        return finalGrade?.remarks ? (
          <Badge
            variant={
              finalGrade.remarks === "PASSED" ? "default" : "destructive"
            }
          >
            {finalGrade.remarks}
          </Badge>
        ) : (
          "—"
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

