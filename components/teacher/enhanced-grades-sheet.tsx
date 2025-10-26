"use client"

import { useState, useEffect } from "react"
import { Enrollment, GradingCriteria, User, Subject, Class, SchoolYear } from "@prisma/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Save,
  FileDown,
  Send,
  Plus,
  Trash2,
  Award,
  Trophy,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  GraduationCap,
  BookOpen,
  Calculator,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
// Removed server action import - using API route instead

type ClassData = Class & {
  subject: Subject
  schoolYear: SchoolYear
  teacher: User
}

interface GradesSheetProps {
  classId: string
  isMidterm: boolean
  enrollments: (Enrollment & { student: User })[]
  criteria: GradingCriteria[]
  classData: ClassData
  gradeType?: any
  allGradeTypes?: any[]
  isReadOnly?: boolean
  submissionId?: string
  adminId?: string
}

interface Component {
  id: string
  name: string
  maxScore: number
  criteriaId: string
}

interface StudentScore {
  componentId: string
  score: number
}

// Convert percentage to 1.0-5.0 grade scale
const percentageToGrade = (percentage: number): number => {
  if (percentage >= 98) return 1.0
  if (percentage >= 95) return 1.25
  if (percentage >= 92) return 1.5
  if (percentage >= 89) return 1.75
  if (percentage >= 86) return 2.0
  if (percentage >= 83) return 2.25
  if (percentage >= 80) return 2.5
  if (percentage >= 77) return 2.75
  if (percentage >= 75) return 3.0
  return 5.0 // Failed
}

// Get grade details with color and icon
const getGradeDetails = (grade: number) => {
  if (grade === 1.0) return { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950", icon: Trophy, label: "Excellent" }
  if (grade <= 1.5) return { color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950", icon: Star, label: "Very Good" }
  if (grade <= 2.0) return { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950", icon: Award, label: "Good" }
  if (grade <= 2.5) return { color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950", icon: Sparkles, label: "Satisfactory" }
  if (grade <= 3.0) return { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950", icon: CheckCircle, label: "Passing" }
  return { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950", icon: XCircle, label: "Failed" }
}

export function EnhancedGradesSheet({ 
  classId, 
  isMidterm, 
  enrollments, 
  criteria,
  classData,
  gradeType,
  allGradeTypes = [],
  isReadOnly = false,
  submissionId,
  adminId
}: GradesSheetProps) {
  const [components, setComponents] = useState<Map<string, Component[]>>(new Map())
  const [studentScores, setStudentScores] = useState<Map<string, Map<string, number>>>(new Map())
  const [existingGrades, setExistingGrades] = useState<Map<string, any>>(new Map())
  const [componentScores, setComponentScores] = useState<Map<string, Map<string, any>>>(new Map())
  // State for all grades across all grade types
  const [allExistingGrades, setAllExistingGrades] = useState<Map<string, any>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingGrades, setIsLoadingGrades] = useState(true)
  const [addComponentDialog, setAddComponentDialog] = useState<string | null>(null)
  const [newComponent, setNewComponent] = useState({ name: "", maxScore: 10 })
  
  // Admin approval state
  const [approvalDialog, setApprovalDialog] = useState<"approve" | "decline" | null>(null)
  const [approvalComments, setApprovalComments] = useState("")
  const [isProcessingApproval, setIsProcessingApproval] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  // Check if this is a final grade type - use special format
  // Only show final grade format for "Final" grade type, not for Prelims or Midterm
  const isFinalGradeType = gradeType?.name?.toLowerCase() === 'final'
  
  // Debug logging
  console.log("Grade type name:", gradeType?.name)
  console.log("Is final grade type:", isFinalGradeType)

  // Load existing grades from database
  const loadExistingGrades = async () => {
    if (!gradeType) return
    
    try {
      setIsLoadingGrades(true)
      console.log("Loading existing grades for gradeType:", gradeType.id)
      
      const response = await fetch(`/api/grades/load?classId=${classId}&gradeTypeId=${gradeType.id}`)
      const result = await response.json()
      
      if (result.success) {
        console.log("Loaded existing grades:", result.grades)
        const gradesMap = new Map(Object.entries(result.grades))
        setExistingGrades(gradesMap)
      } else {
        console.error("Failed to load grades:", result.error)
      }
    } catch (error) {
      console.error("Error loading grades:", error)
    } finally {
      setIsLoadingGrades(false)
    }
  }

  // Load component scores from database
  const loadComponentScores = async () => {
    if (!gradeType) return
    
    try {
      console.log("Loading component scores for gradeType:", gradeType.id)
      
      const response = await fetch(`/api/grades/load-component-scores?classId=${classId}&gradeTypeId=${gradeType.id}`)
      const result = await response.json()
      
        if (result.success) {
          console.log("Loaded component scores:", result.scores)
          const scoresMap = new Map()
          Object.entries(result.scores).forEach(([studentId, scores]) => {
            scoresMap.set(studentId, new Map(Object.entries(scores as Record<string, unknown>)))
          })
          setComponentScores(scoresMap)
          
          // Also update local studentScores state so UI can display them
          setStudentScores(prev => {
            const newScores = new Map(prev)
            Object.entries(result.scores).forEach(([studentId, scores]) => {
              const studentMap = new Map()
              Object.entries(scores as Record<string, unknown>).forEach(([componentId, scoreData]) => {
                studentMap.set(componentId, (scoreData as { score: number }).score)
              })
              newScores.set(studentId, studentMap)
            })
            return newScores
          })
        } else {
          console.error("Failed to load component scores:", result.error)
        }
    } catch (error) {
      console.error("Error loading component scores:", error)
    }
  }

  // Load all grades for all grade types to calculate overall final grade
  const loadAllGrades = async () => {
    if (!allGradeTypes.length) return
    
    try {
      console.log("Loading all grades for all grade types")
      const allGrades = new Map()
      
      // Load grades for each grade type
      for (const gradeTypeItem of allGradeTypes) {
        const response = await fetch(`/api/grades/load?classId=${classId}&gradeTypeId=${gradeTypeItem.id}`)
        const result = await response.json()
        
        if (result.success) {
          console.log(`Loaded grades for ${gradeTypeItem.name}:`, result.grades)
          Object.entries(result.grades).forEach(([studentId, grade]) => {
            const key = `${studentId}-${gradeTypeItem.id}`
            allGrades.set(key, grade)
          })
        }
      }
      
      setAllExistingGrades(allGrades)
      console.log("All grades loaded:", allGrades.size)
    } catch (error) {
      console.error("Error loading all grades:", error)
    }
  }

  // Load existing grades and component scores when component mounts or gradeType changes
  useEffect(() => {
    loadExistingGrades()
    loadComponentScores()
    loadAllGrades()
  }, [gradeType?.id, classId])

  // Load global component definitions for the current grade type
  const loadGlobalComponents = async () => {
    if (!gradeType) return
    
    try {
      console.log("Loading global components for gradeType:", gradeType.id)
      
      const response = await fetch(`/api/grades/global-components?gradeTypeId=${gradeType.id}`)
      const result = await response.json()
      
      if (result.success) {
        console.log("Loaded global components:", result.components)
        
        // Group components by criteria
        const componentsByCriteria = new Map<string, Component[]>()
        result.components.forEach((comp: any) => {
          if (!componentsByCriteria.has(comp.criteriaId)) {
            componentsByCriteria.set(comp.criteriaId, [])
          }
          componentsByCriteria.get(comp.criteriaId)!.push({
            id: comp.id,
            name: comp.name,
            maxScore: comp.maxScore,
            criteriaId: comp.criteriaId
          })
        })
        
        setComponents(componentsByCriteria)
      } else {
        console.error("Failed to load global components:", result.error)
      }
    } catch (error) {
      console.error("Error loading global components:", error)
    }
  }

  // Initialize with global components
  useEffect(() => {
    loadGlobalComponents()
  }, [gradeType?.id])

  const handleScoreChange = (studentId: string, componentId: string, value: string) => {
    // Handle empty values - if empty string, set to null
    if (value === "" || value === null || value === undefined) {
    setStudentScores(prev => {
      const newScores = new Map(prev)
      const studentMap = newScores.get(studentId) || new Map()
        studentMap.delete(componentId) // Remove the score to make it null
      newScores.set(studentId, studentMap)
      return newScores
    })
      return
    }
    
    const numericScore = parseFloat(value)
    
    // Find the component definition to get max score
    let maxScore = 100 // Default max score
    for (const [criteriaId, comps] of components.entries()) {
      const comp = comps.find(c => c.id === componentId)
      if (comp) {
        maxScore = comp.maxScore
        break
      }
    }
    
    // Check if score exceeds maximum
    if (numericScore > maxScore) {
      const student = enrollments.find(e => e.student.id === studentId)?.student
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'Student'
      toast({
        title: "Invalid Score",
        description: `${studentName}: Score ${numericScore} exceeds maximum ${maxScore}`,
        variant: "destructive",
      })
      return // Don't update the score
    }
    
    // Update local state only - no automatic saving
    setStudentScores(prev => {
      const newScores = new Map(prev)
      const studentMap = newScores.get(studentId) || new Map()
      studentMap.set(componentId, numericScore)
      newScores.set(studentId, studentMap)
      return newScores
    })
  }

  const getStudentScore = (studentId: string, componentId: string): number | null => {
    // First check if we have local changes (user is editing)
    const localScore = studentScores.get(studentId)?.get(componentId)
    if (localScore !== undefined) {
      console.log("Using local score for student:", studentId, "component:", componentId, "score:", localScore)
      return localScore
    }
    
    // Fallback to loaded scores from database
    const loadedScore = componentScores.get(studentId)?.get(componentId)
    if (loadedScore) {
      console.log("Using loaded score for student:", studentId, "component:", componentId, "score:", loadedScore.score)
      return loadedScore.score || null
    }
    
    // Return null for empty scores instead of 0
    console.log("No score found for student:", studentId, "component:", componentId, "returning null")
    return null
  }

  const calculateCategoryGrade = (studentId: string, criteriaId: string) => {
    const comps = components.get(criteriaId) || []
    let totalScore = 0
    let maxScore = 0
    let hasAnyScore = false

    comps.forEach(comp => {
      const score = getStudentScore(studentId, comp.id)
      if (score !== null) {
        totalScore += score
        hasAnyScore = true
      }
      maxScore += comp.maxScore
      console.log(`Category ${criteriaId}, Component ${comp.id}: score=${score}, maxScore=${comp.maxScore}`)
    })

    // Only calculate if there's at least one score
    const percentage = hasAnyScore && maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const criterion = criteria.find(c => c.id === criteriaId)
    
    // If no scores at all, return 5.0 (failed)
    const ge = hasAnyScore ? percentageToGrade(percentage) : 5.0
    const we = ge * ((criterion?.percentage || 0) / 100)

    console.log(`Category ${criteriaId} calculation: totalScore=${totalScore}, maxScore=${maxScore}, percentage=${percentage}, ge=${ge}, we=${we}`)
    return { totalScore, maxScore, percentage, ge, we }
  }

  const calculateFinalGrade = (studentId: string): number => {
    // Always calculate from current scores to reflect real-time changes
    let totalWE = 0
    criteria.forEach(criterion => {
      const { we } = calculateCategoryGrade(studentId, criterion.id)
      totalWE += we
    })

    // Round to nearest 0.25 increment
    const calculatedGrade = Math.round(totalWE * 4) / 4
    console.log("Calculated final grade for student:", studentId, "totalWE:", totalWE, "calculatedGrade:", calculatedGrade)
    console.log("Criteria breakdown:")
    criteria.forEach(criterion => {
      const { we } = calculateCategoryGrade(studentId, criterion.id)
      console.log(`- ${criterion.name}: WE = ${we}`)
    })
    return calculatedGrade
  }

  // Calculate weighted final grade across all grade types
  const calculateWeightedFinalGrade = (studentId: string): number => {
    if (!gradeType || !allGradeTypes.length) return 0
    
    // Use the same grade that's displayed in the UI (Final Term Grade)
    const currentGrade = calculateFinalGrade(studentId)
    
    console.log(`Weighted contribution calculation for ${gradeType.name}:`)
    console.log(`- Student ID: ${studentId}`)
    console.log(`- Final Term Grade (currentGrade): ${currentGrade}`)
    console.log(`- Grade type percentage: ${gradeType.percentage}%`)
    
    // Calculate weighted contribution: Final Term Grade × (percentage / 100)
    const weightedContribution = currentGrade * (gradeType.percentage / 100)
    
    console.log(`- Weighted contribution: ${currentGrade} × ${gradeType.percentage}% = ${weightedContribution}`)
    
    // No rounding needed for weighted contributions - return exact value
    console.log(`- Final weighted contribution: ${weightedContribution}`)
    
    return weightedContribution
  }


  // Calculate overall final grade across all grade types
  const calculateOverallFinalGrade = (studentId: string): number => {
    if (!allGradeTypes.length) return 0
    
    let totalWeightedGrade = 0
    
    console.log(`Calculating overall final grade for student ${studentId}`)
    console.log(`All grade types:`, allGradeTypes.map(gt => ({ name: gt.name, id: gt.id, percentage: gt.percentage })))
    console.log(`All existing grades:`, Array.from(allExistingGrades.entries()))
    
    // Calculate weighted grade for each grade type
    allGradeTypes.forEach(gradeTypeItem => {
      // Check if this is the current grade type - if so, calculate from current scores
      if (gradeTypeItem.id === gradeType?.id) {
        // For current grade type, calculate from current scores
        const currentGrade = calculateFinalGrade(studentId)
        const weightedContribution = currentGrade * (gradeTypeItem.percentage / 100)
        totalWeightedGrade += weightedContribution
        console.log(`Current grade type ${gradeTypeItem.name}: calculated grade=${currentGrade}, percentage=${gradeTypeItem.percentage}, weighted=${weightedContribution}`)
      } else {
        // For other grade types, use existing grades from database
        const key = `${studentId}-${gradeTypeItem.id}`
        const existingGrade = allExistingGrades.get(key)
        
        console.log(`Other grade type ${gradeTypeItem.name} (${gradeTypeItem.id}): key=${key}, existingGrade=`, existingGrade)
        
        if (existingGrade && existingGrade.grade) {
          // Use the weighted equivalent (WE) that's already calculated
          const weightedContribution = existingGrade.grade * (gradeTypeItem.percentage / 100)
          totalWeightedGrade += weightedContribution
          console.log(`Grade type ${gradeTypeItem.name}: grade=${existingGrade.grade}, percentage=${gradeTypeItem.percentage}, weighted=${weightedContribution}`)
        } else {
          // No grade found, add 5.0 (failed) weighted contribution
          const weightedContribution = 5.0 * (gradeTypeItem.percentage / 100)
          totalWeightedGrade += weightedContribution
          console.log(`Grade type ${gradeTypeItem.name}: no grade, using 5.0, percentage=${gradeTypeItem.percentage}, weighted=${weightedContribution}`)
        }
      }
    })
    
    // Round DOWN to nearest 0.25 increment (1.0, 1.25, 1.50, 1.75, 2.0, etc.)
    const roundedGrade = Math.floor(totalWeightedGrade * 4) / 4
    
    console.log(`=== OVERALL FINAL GRADE CALCULATION ===`)
    console.log(`Student ID: ${studentId}`)
    console.log(`Total weighted grade: ${totalWeightedGrade}`)
    console.log(`Expected: 0.30 + 0.38 + 0.50 = 1.18`)
    console.log(`Actual total: ${totalWeightedGrade}`)
    console.log(`Rounding calculation: ${totalWeightedGrade} × 4 = ${totalWeightedGrade * 4}`)
    console.log(`Math.floor(${totalWeightedGrade * 4}) = ${Math.floor(totalWeightedGrade * 4)}`)
    console.log(`${Math.floor(totalWeightedGrade * 4)} ÷ 4 = ${roundedGrade}`)
    console.log(`Final result: ${roundedGrade}`)
    console.log(`Expected result: 1.0`)
    console.log(`Match: ${roundedGrade === 1.0 ? 'YES' : 'NO'}`)
    
    return roundedGrade
  }

  const handleAddComponent = (criteriaId: string) => {
    if (!newComponent.name || newComponent.maxScore <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid component details",
        variant: "destructive",
      })
      return
    }

    const comps = components.get(criteriaId) || []
    const newComp: Component = {
      id: `${criteriaId}-${Date.now()}`,
      name: newComponent.name.toUpperCase(),
      maxScore: newComponent.maxScore,
      criteriaId,
    }

    setComponents(prev => {
      const newComponents = new Map(prev)
      newComponents.set(criteriaId, [...comps, newComp])
      return newComponents
    })

    setAddComponentDialog(null)
    setNewComponent({ name: "", maxScore: 10 })
    
    toast({
      title: "✓ Component Added",
      description: `Added ${newComponent.name}`,
    })
  }

  const handleRemoveComponent = (criteriaId: string, componentId: string) => {
    if (!confirm("Remove this component?")) return

    setComponents(prev => {
      const newComponents = new Map(prev)
      const comps = newComponents.get(criteriaId) || []
      newComponents.set(criteriaId, comps.filter(c => c.id !== componentId))
      return newComponents
    })

    toast({
      title: "Component Removed",
      description: "Component has been removed",
    })
  }

  // Admin approval functions
  const handleApproval = async (action: "approve" | "decline") => {
    if (!submissionId || !adminId) return

    setIsProcessingApproval(true)

    try {
      const response = await fetch('/api/grades/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          adminId,
          action,
          comments: approvalComments
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Submission ${action === "approve" ? "approved" : "declined"}`,
        })
        setApprovalDialog(null)
        setApprovalComments("")
        router.push("/admin/submissions")
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${action} submission`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Approval error:", error)
      toast({
        title: "Error",
        description: `Failed to ${action} submission`,
        variant: "destructive",
      })
    }

    setIsProcessingApproval(false)
  }

  const handleExport = async (format: 'csv' | 'excel') => {
    if (!gradeType || !enrollments.length) {
      toast({
        title: "Error",
        description: "No grade type or students selected",
        variant: "destructive",
      })
      return
    }

    try {
      // Create data structure
      const headers = [
        '#',
        'Last Name',
        'First Name',
        'MI',
        ...criteria.flatMap(criterion => {
          const comps = components.get(criterion.id) || []
          return [
            ...comps.map(comp => comp.name),
            `${criterion.name} TOT`,
            `${criterion.name} GE`,
            `${criterion.name} WE`
          ]
        }),
        'Weighted Contribution',
        'Final Term Grade',
        'Remarks'
      ]

      const rows = enrollments.map((enrollment, index) => {
        const student = enrollment.student
        const currentGrade = calculateFinalGrade(student.id)
        const overallFinalGrade = calculateOverallFinalGrade(student.id)
        const displayGrade = isFinalGradeType ? overallFinalGrade : currentGrade
        const weightedContribution = calculateWeightedFinalGrade(student.id)
        
        const row = [
          index + 1,
          student.lastName,
          student.firstName,
          student.middleName?.[0] || "",
          ...criteria.flatMap(criterion => {
            const comps = components.get(criterion.id) || []
            const categoryGrade = calculateCategoryGrade(student.id, criterion.id)
            
            return [
              ...comps.map(comp => {
                const score = getStudentScore(student.id, comp.id)
                return score === null ? "" : score
              }),
              categoryGrade.totalScore,
              categoryGrade.ge,
              categoryGrade.we
            ]
          }),
          weightedContribution.toFixed(2),
          displayGrade.toFixed(1),
          displayGrade >= 1.0 && displayGrade <= 3.0 ? 'PASSED' : 'FAILED'
        ]
        
        return row
      })

      const data = [headers, ...rows]
      const fileName = `${gradeType.name}_Grades_${new Date().toISOString().split('T')[0]}`

      if (format === 'csv') {
        // CSV Export
        const csvContent = data
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${fileName}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // Excel Export with UI-like formatting
        const worksheet = XLSX.utils.aoa_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        
        // Define cell ranges for styling
        const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
        const lastRow = headerRange.e.r
        const lastCol = headerRange.e.c
        
        // Style the worksheet
        const wscols = []
        const wsrows = []
        
        // Set column widths
        for (let col = 0; col <= lastCol; col++) {
          const maxLength = Math.max(
            ...data.map(row => String(row[col] || '').length)
          )
          wscols.push({ wch: Math.min(maxLength + 2, 50) })
        }
        worksheet['!cols'] = wscols
        
        // Set row heights
        for (let row = 0; row <= lastRow; row++) {
          wsrows.push({ hpt: 20 })
        }
        worksheet['!rows'] = wsrows
        
        // Apply styling to cells
        for (let row = 0; row <= lastRow; row++) {
          for (let col = 0; col <= lastCol; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
            if (!worksheet[cellAddress]) continue
            
            const cell = worksheet[cellAddress]
            
            // Header row styling (dark blue background, white text, bold)
            if (row === 0) {
              cell.s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "1E40AF" } }, // Blue-800
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                  top: { style: "thin", color: { rgb: "000000" } },
                  bottom: { style: "thin", color: { rgb: "000000" } },
                  left: { style: "thin", color: { rgb: "000000" } },
                  right: { style: "thin", color: { rgb: "000000" } }
                }
              }
            } else {
              // Data row styling with alternating colors
              const isEvenRow = row % 2 === 0
              cell.s = {
                alignment: { horizontal: "center", vertical: "center" },
                fill: { fgColor: { rgb: isEvenRow ? "FFFFFF" : "F8FAFC" } }, // White or gray-50
                border: {
                  top: { style: "thin", color: { rgb: "E5E7EB" } },
                  bottom: { style: "thin", color: { rgb: "E5E7EB" } },
                  left: { style: "thin", color: { rgb: "E5E7EB" } },
                  right: { style: "thin", color: { rgb: "E5E7EB" } }
                }
              }
              
              // Style specific columns
              const cellValue = cell.v
              
              // Style FINAL TERM GRADE column (green background for PASSED, red for FAILED)
              if (col === headers.length - 2) { // Second to last column
                const grade = parseFloat(cellValue)
                if (grade >= 1.0 && grade <= 3.0) {
                  cell.s.fill = { fgColor: { rgb: "DCFCE7" } } // Green-100
                  cell.s.font = { color: { rgb: "166534" }, bold: true } // Green-800
                } else {
                  cell.s.fill = { fgColor: { rgb: "FEE2E2" } } // Red-100
                  cell.s.font = { color: { rgb: "DC2626" }, bold: true } // Red-600
                }
              }
              
              // Style REMARKS column (green background for PASSED, red for FAILED)
              if (col === headers.length - 1) { // Last column
                if (cellValue === 'PASSED') {
                  cell.s.fill = { fgColor: { rgb: "DCFCE7" } } // Green-100
                  cell.s.font = { color: { rgb: "166534" }, bold: true } // Green-800
                } else if (cellValue === 'FAILED') {
                  cell.s.fill = { fgColor: { rgb: "FEE2E2" } } // Red-100
                  cell.s.font = { color: { rgb: "DC2626" }, bold: true } // Red-600
                }
              }
            }
          }
        }
        
        // Add title and class information
        const titleRow = [
          `${gradeType.name.toUpperCase()} GRADING SHEET`,
          '',
          '',
          '',
          ...new Array(headers.length - 4).fill('')
        ]
        const classInfoRow = [
          `Subject: ${classData.subject.name}`,
          '',
          '',
          '',
          ...new Array(headers.length - 4).fill('')
        ]
        const semesterInfoRow = [
          `A.Y. ${classData.schoolYear.year} • ${classData.schoolYear.semester} SEMESTER`,
          '',
          '',
          '',
          ...new Array(headers.length - 4).fill('')
        ]
        const teacherInfoRow = [
          `Teacher: ${classData.teacher.firstName} ${classData.teacher.lastName}`,
          '',
          '',
          '',
          ...new Array(headers.length - 4).fill('')
        ]
        const exportDateRow = [
          `Exported on: ${new Date().toLocaleDateString()}`,
          '',
          '',
          '',
          ...new Array(headers.length - 4).fill('')
        ]
        
        XLSX.utils.sheet_add_aoa(worksheet, [titleRow, classInfoRow, semesterInfoRow, teacherInfoRow, exportDateRow], { origin: -1 })
        
        // Style title row
        const titleCell = worksheet['A1']
        if (titleCell) {
          titleCell.s = {
            font: { bold: true, size: 16, color: { rgb: "1E40AF" } },
            alignment: { horizontal: "center", vertical: "center" },
            fill: { fgColor: { rgb: "F8FAFC" } }
          }
        }
        
        // Merge title and info cells
        if (lastCol > 0) {
          worksheet['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } }, // Title
            { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } }, // Class info
            { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } }, // Semester info
            { s: { r: 3, c: 0 }, e: { r: 3, c: lastCol } }, // Teacher info
            { s: { r: 4, c: 0 }, e: { r: 4, c: lastCol } }  // Export date
          ]
        }
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Grades')
        XLSX.writeFile(workbook, `${fileName}.xlsx`)
      }

      toast({
        title: "Export Successful",
        description: `${gradeType.name} grades exported as ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export grades",
        variant: "destructive",
      })
    }
  }

  const handleSaveAll = async () => {
    setIsLoading(true)
    
    try {
      console.log("Starting save process...")
      console.log("Grade type:", gradeType)
      console.log("Enrollments:", enrollments.length)
      
      if (!gradeType) {
      toast({
          title: "Error",
          description: "No grade type selected",
          variant: "destructive",
      })
      setIsLoading(false)
        return
      }

      // Validate all scores before saving
      const validationErrors: string[] = []
      
      studentScores.forEach((studentScoresMap, studentId) => {
        const student = enrollments.find(e => e.student.id === studentId)?.student
        if (!student) return
        
        studentScoresMap.forEach((score, componentId) => {
          // Find the component definition to get max score
          let maxScore = 100 // Default max score
          for (const [criteriaId, comps] of components.entries()) {
            const comp = comps.find(c => c.id === componentId)
            if (comp) {
              maxScore = comp.maxScore
              break
            }
          }
          
          if (score > maxScore) {
            validationErrors.push(`${student.firstName} ${student.lastName}: Score ${score} exceeds maximum ${maxScore}`)
          }
        })
      })
      
      if (validationErrors.length > 0) {
        toast({
          title: "Validation Error",
          description: validationErrors[0],
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
      
      // Save grades for all students
      if (enrollments.length > 0) {
        console.log("Saving grades for all students:", enrollments.length)
        
        // Test API connectivity first
        console.log("Testing API connectivity...")
        try {
          const testResponse = await fetch('/api/test', { method: 'GET' })
          const testResult = await testResponse.json()
          console.log("Test API response:", testResult)
        } catch (testError) {
          console.error("Test API failed:", testError)
        }
        
        // Test database functionality
        console.log("Testing database functionality...")
        try {
          const debugResponse = await fetch('/api/debug', { method: 'GET' })
          const debugResult = await debugResponse.json()
          console.log("Debug API response:", debugResult)
          
          if (!debugResult.success) {
            toast({
              title: "❌ Database Issue",
              description: `Database test failed: ${debugResult.error}`,
              variant: "destructive",
            })
            setIsLoading(false)
            return
          }
        } catch (debugError) {
          console.error("Debug API failed:", debugError)
          toast({
            title: "❌ Database Test Failed",
            description: "Could not test database functionality",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
        
        // Test simple save functionality
        console.log("Testing simple save...")
        try {
          const simpleResponse = await fetch('/api/simple-save', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
          })
          const simpleResult = await simpleResponse.json()
          console.log("Simple save response:", simpleResult)
          
          if (simpleResult.success) {
            toast({
              title: "✅ Simple Save Works",
              description: "Database save functionality is working",
            })
          } else {
            toast({
              title: "❌ Simple Save Failed",
              description: `Simple save failed: ${simpleResult.error}`,
              variant: "destructive",
            })
            setIsLoading(false)
            return
          }
        } catch (simpleError) {
          console.error("Simple save failed:", simpleError)
          toast({
            title: "❌ Simple Save Error",
            description: "Could not test simple save",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
        
        // Collect all component scores for ALL students
        const allComponentScores: Record<string, Record<string, number>> = {}
        
        // Collect component scores for each student
        studentScores.forEach((studentScoresMap, studentId) => {
          const studentComponentScores: Record<string, number> = {}
          studentScoresMap.forEach((score, componentId) => {
            studentComponentScores[componentId] = score
          })
          allComponentScores[studentId] = studentComponentScores
        })
        
        console.log("All component scores:", allComponentScores)
        
        // Save grades for all students
        let successCount = 0
        let errorCount = 0
        
        for (const enrollment of enrollments) {
          try {
            const finalGrade = calculateFinalGrade(enrollment.studentId)
            const remarks = getGradeDetails(finalGrade).label
            
            console.log(`Saving grade for student ${enrollment.studentId}:`, {
              enrollmentId: enrollment.id,
              classId,
              studentId: enrollment.studentId,
              gradeTypeId: gradeType.id,
              finalGrade,
              remarks
            })
            
            const response = await fetch('/api/real-save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                enrollmentId: enrollment.id,
                classId,
                studentId: enrollment.studentId,
                gradeTypeId: gradeType.id,
                finalGrade,
                remarks,
                allComponentScores
              })
            })
            
            if (!response.ok) {
              const errorText = await response.text()
              console.error(`API Error for student ${enrollment.studentId}:`, errorText)
              errorCount++
              continue
            }
            
            const result = await response.json()
            console.log(`Save result for student ${enrollment.studentId}:`, result)
            
            if (result.success) {
              successCount++
            } else {
              console.error(`Failed to save grade for student ${enrollment.studentId}:`, result.error)
              errorCount++
            }
          } catch (studentError) {
            console.error(`Error saving grade for student ${enrollment.studentId}:`, studentError)
            errorCount++
          }
        }
        
        // Show appropriate success/error message
        if (successCount > 0 && errorCount === 0) {
          toast({
            title: "✓ All Grades Saved Successfully",
            description: `Successfully saved grades for ${successCount} students`,
          })
          // Reload existing grades and component scores to show the updated data
          await loadExistingGrades()
          await loadComponentScores()
          router.refresh()
        } else if (successCount > 0 && errorCount > 0) {
          toast({
            title: "⚠️ Partial Success",
            description: `Saved grades for ${successCount} students, failed for ${errorCount} students`,
            variant: "destructive",
          })
          // Still reload to show what was saved
          await loadExistingGrades()
          await loadComponentScores()
          router.refresh()
        } else {
          toast({
            title: "❌ Save Failed",
            description: `Failed to save grades for all ${enrollments.length} students`,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "No students found",
          variant: "destructive",
        })
      }
      
    } catch (error) {
      console.error("Error saving grades:", error)
      
      let errorMessage = "Failed to save grades. Please try again."
      
      if (error instanceof Error && error.name === 'AbortError') {
        errorMessage = "Request timed out. Please try again."
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
    
    setIsLoading(false)
  }

  const handleSubmit = async () => {
    if (!confirm("Submit these grades for approval?")) return
    
    setIsLoading(true)
    
    try {
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
        setIsLoading(false)
        return
      }
      
      // Create grade submission
      const response = await fetch('/api/grades/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId,
          teacherId: session?.user.id,
          schoolYearId,
          gradeTypeId: gradeType?.id
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Submission API Error:", errorText)
        throw new Error(`Submission failed: ${response.status} ${errorText}`)
      }
      
      const result = await response.json()
      console.log("Submission result:", result)
      
      if (result.success) {
        toast({
          title: "✓ Grades Submitted",
          description: "Grades sent to Program Head for approval",
        })
        router.push("/teacher/submissions")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit grades",
          variant: "destructive",
        })
      }
      
    } catch (error) {
      console.error("Error submitting grades:", error)
      
      let errorMessage = "Failed to submit grades. Please try again."
      
      if (error instanceof Error && error.name === 'AbortError') {
        errorMessage = "Request timed out. Please try again."
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
    
    setIsLoading(false)
  }

  // For final grade type, we'll add a final grade cell to the existing format
  // No need to use the special format - just add the final grade column

  if (criteria.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please set up grading criteria first in the "Grading Criteria" tab
        </AlertDescription>
      </Alert>
    )
  }

  if (enrollments.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No students enrolled in this class yet
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoadingGrades) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading existing grades...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Class Header */}
      <div className="rounded-xl border bg-gradient-to-br from-background to-muted/20 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Glan Institute of Technology</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Municipality of Glan, Province of Sarangani, Philippines 9517
            </p>
            <div className="flex items-center gap-2 mt-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">
                GRADE SHEET - {gradeType?.name?.toUpperCase() || "GRADES"}
              </h3>
            </div>
            <p className="text-sm font-medium">
              A.Y. {classData.schoolYear.year} • {classData.schoolYear.semester} SEMESTER
            </p>
          </div>
          <div className="flex gap-2">
            {isReadOnly ? (
              // Admin view - only approve/decline buttons
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setApprovalDialog("decline")}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </Button>
                <Button 
                  size="sm" 
                  variant="default" 
                  onClick={() => setApprovalDialog("approve")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            ) : (
              // Teacher view - normal buttons
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isLoading}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Export as Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" onClick={handleSaveAll} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="default" onClick={handleSubmit}>
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm bg-background/50 rounded-lg p-4">
          <div className="space-y-1">
            <p><strong>Instructor:</strong> {classData.teacher.firstName} {classData.teacher.lastName}</p>
            <p><strong>Subject:</strong> {classData.subject.code} - {classData.subject.name}</p>
            <p><strong>Units:</strong> {classData.subject.units}</p>
          </div>
          <div className="space-y-1">
            <p><strong>Section:</strong> {classData.name} - {classData.section}</p>
            <p><strong>Students:</strong> {enrollments.length}</p>
          </div>
        </div>
      </div>

      {/* Beautified Grading Scale */}
      <div className="rounded-xl border p-6 bg-gradient-to-br from-background to-muted/20 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-primary" />
          <h4 className="font-bold text-lg">Grading Scale (1.0 - 5.0)</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { grade: "1.0", range: "98-100%", label: "Excellent", icon: Trophy, color: "emerald" },
            { grade: "1.25", range: "95-97%", label: "Excellent", icon: Trophy, color: "emerald" },
            { grade: "1.5", range: "92-94%", label: "Very Good", icon: Star, color: "green" },
            { grade: "1.75", range: "89-91%", label: "Very Good", icon: Star, color: "green" },
            { grade: "2.0", range: "86-88%", label: "Good", icon: Award, color: "blue" },
            { grade: "2.25", range: "83-85%", label: "Good", icon: Award, color: "blue" },
            { grade: "2.5", range: "80-82%", label: "Satisfactory", icon: Sparkles, color: "cyan" },
            { grade: "2.75", range: "77-79%", label: "Satisfactory", icon: Sparkles, color: "cyan" },
            { grade: "3.0", range: "75-76%", label: "Passing", icon: CheckCircle, color: "amber" },
            { grade: "5.0", range: "Below 75%", label: "Failed", icon: XCircle, color: "red" },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all hover:scale-105",
                  `border-${item.color}-200 dark:border-${item.color}-800`,
                  `bg-${item.color}-50/50 dark:bg-${item.color}-950/50`
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("h-4 w-4", `text-${item.color}-600 dark:text-${item.color}-400`)} />
                  <span className={cn("font-bold text-lg", `text-${item.color}-700 dark:text-${item.color}-300`)}>
                    {item.grade}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{item.range}</div>
                <div className={cn("text-xs font-medium mt-1", `text-${item.color}-600 dark:text-${item.color}-400`)}>
                  {item.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Grading Components Manager - Hidden in read-only mode */}
      {!isReadOnly && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">Grading Components</h3>
          </div>
        {criteria.map(criterion => {
          const comps = components.get(criterion.id) || []
          return (
            <div key={criterion.id} className="border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold">
                    {criterion.name}
                  </h4>
                  <Badge variant="secondary" className="font-semibold">
                    {criterion.percentage}%
                  </Badge>
                </div>
                {!isReadOnly && (
                  <Dialog 
                    open={addComponentDialog === criterion.id} 
                    onOpenChange={(open) => setAddComponentDialog(open ? criterion.id : null)}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Component</DialogTitle>
                      <DialogDescription>
                        Add a new component to {criterion.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          placeholder="e.g., Quiz 5, Activity 3"
                          value={newComponent.name}
                          onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Max Score</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newComponent.maxScore}
                          onChange={(e) => setNewComponent({ ...newComponent, maxScore: parseInt(e.target.value) || 10 })}
                        />
                      </div>
                      <Button onClick={() => handleAddComponent(criterion.id)} className="w-full">
                        Add Component
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {comps.map(comp => (
                  <div key={comp.id} className="group relative">
                    <Badge variant="outline" className="pr-8">
                      {comp.name} ({comp.maxScore})
                    </Badge>
                    {!isReadOnly && (
                      <button
                        onClick={() => handleRemoveComponent(criterion.id, comp.id)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        </div>
      )}

      {/* Grade Entry Table */}
      <div className="rounded-lg border overflow-x-auto shadow-sm">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th rowSpan={2} className="border border-primary-foreground/20 p-2 min-w-[40px]">#</th>
              <th rowSpan={2} className="border border-primary-foreground/20 p-2 min-w-[120px]">LASTNAME</th>
              <th rowSpan={2} className="border border-primary-foreground/20 p-2 min-w-[120px]">FIRSTNAME</th>
              <th rowSpan={2} className="border border-primary-foreground/20 p-2 min-w-[40px]">MI</th>
              {criteria.map(criterion => {
                const comps = components.get(criterion.id) || []
                return (
                  <th
                    key={criterion.id}
                    colSpan={comps.length + 4}
                    className="border border-primary-foreground/20 p-2"
                  >
                    {criterion.name} ({criterion.percentage}%)
                  </th>
                )
              })}
              {gradeType && (
                <th rowSpan={2} className="border border-primary-foreground/20 p-2 min-w-[100px] bg-blue-600">
                  WEIGHTED<br/>CONTRIBUTION
                  <div className="text-xs text-blue-100">({gradeType.percentage}%)</div>
                </th>
              )}
              {isFinalGradeType && (
                <>
                  <th rowSpan={2} className="border border-primary-foreground/20 p-2 min-w-[100px]">
                    TOTAL PERCENTAGE<br/>SCORE
                  </th>
                  <th rowSpan={2} className="border border-primary-foreground/20 p-2 min-w-[100px]">
                    {gradeType?.name?.toUpperCase() || "FINAL"}<br/>TERM GRADE
                  </th>
                </>
              )}
              {/* Add FINAL TERM GRADE column for all grade types */}
              <th rowSpan={2} className="border border-primary-foreground/20 p-2 min-w-[100px] bg-gradient-to-br from-green-600 to-green-700 text-white">
                {gradeType?.name?.toUpperCase() || "FINAL"}<br/>TERM GRADE
                <div className="text-xs text-green-100">(1.0-5.0)</div>
              </th>
              <th rowSpan={2} className="border border-primary-foreground/20 p-2 min-w-[100px] bg-gradient-to-br from-green-600 to-green-700 text-white">
                REMARKS
                <div className="text-xs text-green-100">(PASS/FAIL)</div>
              </th>
            </tr>
            <tr className="bg-primary text-primary-foreground">
              {criteria.map(criterion => {
                const comps = components.get(criterion.id) || []
                return (
                  <>
                    {comps.map(comp => (
                      <th key={comp.id} className="border border-primary-foreground/20 p-2 min-w-[60px]">
                        <div className="text-center text-[10px]">
                          <div className="font-semibold">{comp.name}</div>
                          <div className="text-primary-foreground/70">max:{comp.maxScore}</div>
                        </div>
                      </th>
                    ))}
                    <th className="border border-primary-foreground/20 p-2 min-w-[60px] bg-primary/80">TOT</th>
                    <th className="border border-primary-foreground/20 p-2 min-w-[50px] bg-primary/80">GE</th>
                    <th className="border border-primary-foreground/20 p-2 min-w-[50px] bg-primary/80">WE</th>
                    <th className="border-r-2 border-primary-foreground w-0"></th>
                  </>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment, index) => {
              const student = enrollment.student
              const currentGrade = calculateFinalGrade(student.id)
              const overallFinalGrade = calculateOverallFinalGrade(student.id)
              // Show current grade type's grade for prelims/midterm, overall grade for final
              const displayGrade = isFinalGradeType ? overallFinalGrade : currentGrade
              const gradeDetails = getGradeDetails(displayGrade)

              return (
                <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                  <td className="border p-2 text-center font-medium">{index + 1}</td>
                  <td className="border p-2 font-medium">{student.lastName}</td>
                  <td className="border p-2">{student.firstName}</td>
                  <td className="border p-2 text-center">{student.middleName?.[0] || ""}</td>

                  {criteria.map(criterion => {
                    const comps = components.get(criterion.id) || []
                    const { totalScore, maxScore, ge, we } = calculateCategoryGrade(student.id, criterion.id)

                    return (
                      <>
                        {comps.map(comp => {
                          const score = getStudentScore(student.id, comp.id)
                          const isInvalid = score !== null && score > comp.maxScore
                          const isEmpty = score === null

                          return (
                            <td 
                              key={comp.id} 
                              className={cn(
                                "border p-1",
                                isEmpty && "bg-red-100 dark:bg-red-950/50",
                                isInvalid && "bg-red-200 dark:bg-red-950"
                              )}
                            >
                              <Input
                                type="number"
                                className={cn(
                                  "h-7 text-xs text-center border-0 focus-visible:ring-1 bg-transparent",
                                  isInvalid && "text-red-600 dark:text-red-400 ring-1 ring-red-500",
                                  isEmpty && "border-red-300 dark:border-red-700",
                                  isReadOnly && "bg-muted/50 cursor-not-allowed"
                                )}
                                placeholder=""
                                min="0"
                                max={comp.maxScore}
                                value={score === null ? "" : score}
                                onChange={(e) => handleScoreChange(student.id, comp.id, e.target.value)}
                                readOnly={isReadOnly}
                                disabled={isReadOnly}
                              />
                            </td>
                          )
                        })}
                        <td className="border p-2 text-center font-semibold bg-muted/50">{totalScore}</td>
                        <td className="border p-2 text-center bg-muted/50">{ge.toFixed(1)}</td>
                        <td className="border p-2 text-center bg-muted/50">{we.toFixed(2)}</td>
                        <td className="border-r-2 border-border w-0"></td>
                      </>
                    )
                  })}

                  {gradeType && (
                    <td className="border p-2 text-center font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      <div className="flex items-center justify-center gap-1">
                        <Calculator className="h-3 w-3" />
                        {calculateWeightedFinalGrade(student.id).toFixed(2)}
                      </div>
                    </td>
                  )}
                  {isFinalGradeType && (
                    <>
                      {/* TOTAL PERCENTAGE SCORE */}
                      <td className="border p-2 text-center font-bold">
                        {currentGrade.toFixed(2)}
                      </td>
                      {/* FINAL TERM GRADE */}
                      <td className="border p-2 text-center font-bold">
                        {currentGrade.toFixed(1)}
                      </td>
                    </>
                  )}
                  {/* FINAL TERM GRADE column for all grade types */}
                  <td className={cn(
                    "border p-3 text-center font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl",
                    displayGrade >= 1.0 && displayGrade <= 3.0
                      ? "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" 
                      : "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  )}>
                    <div className="flex items-center justify-center gap-2">
                      {displayGrade >= 1.0 && displayGrade <= 3.0 ? (
                        <Trophy className="h-5 w-5 text-yellow-200" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-200" />
                      )}
                      <span className="text-lg">{displayGrade.toFixed(1)}</span>
                    </div>
                  </td>
                  {/* REMARKS column for all grade types */}
                  <td className={cn(
                    "border p-3 text-center font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl",
                    displayGrade >= 1.0 && displayGrade <= 3.0
                      ? "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" 
                      : "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  )}>
                    <div className="flex items-center justify-center gap-2">
                      {displayGrade >= 1.0 && displayGrade <= 3.0 ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-200" />
                          <span className="text-lg font-extrabold tracking-wide">PASSED</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-200" />
                          <span className="text-lg font-extrabold tracking-wide">FAILED</span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Approval Dialog */}
      {isReadOnly && (
        <Dialog open={approvalDialog !== null} onOpenChange={() => setApprovalDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {approvalDialog === "approve" ? "Approve Submission" : "Decline Submission"}
              </DialogTitle>
              <DialogDescription>
                {approvalDialog === "approve" 
                  ? "Are you sure you want to approve this grade submission?" 
                  : "Are you sure you want to decline this grade submission?"
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="comments">Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Add any comments about this submission..."
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setApprovalDialog(null)}
                  disabled={isProcessingApproval}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleApproval(approvalDialog!)}
                  disabled={isProcessingApproval}
                  className={approvalDialog === "approve" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                  }
                >
                  {isProcessingApproval ? "Processing..." : 
                   approvalDialog === "approve" ? "Approve" : "Decline"
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
