"use client"

import { useState, useEffect } from "react"
import { Enrollment, GradingCriteria, User } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, FileDown, Send } from "lucide-react"
import { updateGradeComponent, getOrCreateGrade, submitGrades } from "@/lib/actions/grade.actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

interface GradesSheetProps {
  classId: string
  isMidterm: boolean
  enrollments: (Enrollment & { student: User })[]
  criteria: GradingCriteria[]
}

interface GradeEntry {
  studentId: string
  criteriaId: string
  score: number
  maxScore: number
}

export function GradesSheet({ classId, isMidterm, enrollments, criteria }: GradesSheetProps) {
  const [grades, setGrades] = useState<Map<string, GradeEntry>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  const getKey = (studentId: string, criteriaId: string) => `${studentId}-${criteriaId}`

  const handleScoreChange = (studentId: string, criteriaId: string, score: string, maxScore: string) => {
    const key = getKey(studentId, criteriaId)
    setGrades((prev) => {
      const newGrades = new Map(prev)
      newGrades.set(key, {
        studentId,
        criteriaId,
        score: parseFloat(score) || 0,
        maxScore: parseFloat(maxScore) || 100,
      })
      return newGrades
    })
  }

  const handleSaveAll = async () => {
    setIsLoading(true)

    try {
      for (const enrollment of enrollments) {
        // Get or create grade record
        const gradeResult = await getOrCreateGrade(
          enrollment.id,
          classId,
          enrollment.studentId,
          isMidterm
        )

        if (!gradeResult.success || !gradeResult.data) continue

        const gradeId = gradeResult.data.id

        // Update each grade component
        for (const criterion of criteria) {
          const key = getKey(enrollment.studentId, criterion.id)
          const gradeEntry = grades.get(key)

          if (gradeEntry) {
            await updateGradeComponent({
              gradeId,
              criteriaId: criterion.id,
              score: gradeEntry.score,
              maxScore: gradeEntry.maxScore,
            })
          }
        }
      }

      toast({
        title: "Success",
        description: "All grades saved successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save some grades",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const handleSubmit = async () => {
    if (!session?.user.id) return
    
    if (!confirm("Are you sure you want to submit these grades for approval?")) return

    setIsSubmitting(true)

    // First save all grades
    await handleSaveAll()

    // Get school year from first enrollment
    const schoolYearId = enrollments[0]?.schoolYearId

    if (!schoolYearId) {
      toast({
        title: "Error",
        description: "School year not found",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Then submit
    const result = await submitGrades(classId, session.user.id, schoolYearId, isMidterm)

    if (result.success) {
      toast({
        title: "Success",
        description: "Grades submitted for approval",
      })
      router.push("/teacher/submissions")
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to submit grades",
        variant: "destructive",
      })
    }

    setIsSubmitting(false)
  }

  const handleExport = () => {
    // Will implement export functionality
    toast({
      title: "Coming Soon",
      description: "Export functionality will be available soon",
    })
  }

  if (criteria.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Please set up grading criteria first before entering grades
        </p>
      </div>
    )
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No students enrolled in this class</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleExport}>
          <FileDown className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button onClick={handleSaveAll} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : "Save All"}
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? "Submitting..." : "Submit for Approval"}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Student Name</TableHead>
              {criteria.map((criterion) => (
                <TableHead key={criterion.id} className="text-center min-w-[150px]">
                  <div>
                    <div>{criterion.name}</div>
                    <div className="text-xs text-gray-500">({criterion.percentage}%)</div>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-center bg-gray-50">Grade</TableHead>
              <TableHead className="text-center bg-gray-50">WE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((enrollment) => {
              let totalWeightedScore = 0

              criteria.forEach((criterion) => {
                const key = getKey(enrollment.studentId, criterion.id)
                const gradeEntry = grades.get(key)

                if (gradeEntry && gradeEntry.maxScore > 0) {
                  const percentage = (gradeEntry.score / gradeEntry.maxScore) * 100
                  const weighted = (percentage * criterion.percentage) / 100
                  totalWeightedScore += weighted
                }
              })

              return (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">
                    {enrollment.student.lastName}, {enrollment.student.firstName} {enrollment.student.middleName}
                  </TableCell>
                  {criteria.map((criterion) => {
                    const key = getKey(enrollment.studentId, criterion.id)
                    const gradeEntry = grades.get(key)

                    return (
                      <TableCell key={criterion.id}>
                        <div className="flex gap-1 items-center justify-center">
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            className="w-16 text-center"
                            placeholder="0"
                            value={gradeEntry?.score || ""}
                            onChange={(e) =>
                              handleScoreChange(
                                enrollment.studentId,
                                criterion.id,
                                e.target.value,
                                gradeEntry?.maxScore?.toString() || "100"
                              )
                            }
                          />
                          <span className="text-gray-500">/</span>
                          <Input
                            type="number"
                            min="1"
                            step="0.1"
                            className="w-16 text-center"
                            placeholder="100"
                            value={gradeEntry?.maxScore || ""}
                            onChange={(e) =>
                              handleScoreChange(
                                enrollment.studentId,
                                criterion.id,
                                gradeEntry?.score?.toString() || "0",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-center font-semibold bg-gray-50">
                    {totalWeightedScore.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center font-semibold bg-gray-50">
                    {totalWeightedScore >= 75 ? (
                      <span className="text-green-600">1.0</span>
                    ) : (
                      <span className="text-red-600">0.0</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500">
        <p>* Enter score and maximum possible score for each criterion</p>
        <p>* Grade is calculated automatically based on weighted percentage</p>
        <p>* WE (Weighted Equivalent): 1.0 = Passed, 0.0 = Failed (75% passing)</p>
      </div>
    </div>
  )
}

