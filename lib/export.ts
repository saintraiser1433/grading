import * as XLSX from "xlsx"
import { Enrollment, User, GradingCriteria, Grade, GradeComponent } from "@prisma/client"

export function exportGradesToExcel(
  enrollments: (Enrollment & {
    student: User
    grades: (Grade & {
      components: (GradeComponent & {
        criteria: GradingCriteria
      })[]
    })[]
  })[],
  criteria: GradingCriteria[],
  className: string,
  subjectName: string,
  isMidterm: boolean
) {
  // Prepare data for Excel
  const headers = [
    "Student Name",
    ...criteria.map((c) => `${c.name} (${c.percentage}%)`),
    "Total Grade",
    "Weighted Equivalent",
    "Remarks",
  ]

  const rows = enrollments.map((enrollment) => {
    const grade = enrollment.grades.find((g) => g.isMidterm === isMidterm)
    const components = grade?.components || []

    const row: any = {
      "Student Name": `${enrollment.student.lastName}, ${enrollment.student.firstName} ${enrollment.student.middleName || ""}`.trim(),
    }

    let totalWeightedScore = 0

    criteria.forEach((criterion) => {
      const component = components.find((c) => c.criteriaId === criterion.id)
      if (component) {
        const percentage = (component.score / component.maxScore) * 100
        const weighted = (percentage * criterion.percentage) / 100
        totalWeightedScore += weighted
        row[`${criterion.name} (${criterion.percentage}%)`] =
          `${component.score}/${component.maxScore} (${percentage.toFixed(2)}%)`
      } else {
        row[`${criterion.name} (${criterion.percentage}%)`] = "—"
      }
    })

    row["Total Grade"] = totalWeightedScore.toFixed(2)
    row["Weighted Equivalent"] = totalWeightedScore >= 75 ? "1.0" : "0.0"
    row["Remarks"] = totalWeightedScore >= 75 ? "PASSED" : "FAILED"

    return row
  })

  // Create workbook
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers })

  // Set column widths
  const colWidths = headers.map((h) => ({ wch: Math.max(h.length, 15) }))
  worksheet["!cols"] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    `${isMidterm ? "Midterm" : "Final"} Grades`
  )

  // Generate filename
  const filename = `${className}_${subjectName}_${isMidterm ? "Midterm" : "Final"}_Grades_${new Date().toISOString().split("T")[0]}.xlsx`

  // Download file
  XLSX.writeFile(workbook, filename)

  return filename
}

export function printGradeSheet() {
  window.print()
}

