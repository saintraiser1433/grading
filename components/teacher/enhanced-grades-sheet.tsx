"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
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
  Clock,
  UserX,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { GradeDisplay } from "@/components/ui/grade-badge"
import { getGradeDescription } from "@/lib/grading-scale"
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
  submissionStatus?: 'PENDING' | 'APPROVED' | 'DECLINED' | null
  allSubmissionStatuses?: Map<string, { status: 'PENDING' | 'APPROVED' | 'DECLINED', id: string }>
  vpAcademicsGlobal?: string
  departmentHeadGlobal?: string
  registrarGlobal?: string
  showApprovalButtons?: boolean
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

// Convert percentage to 1.0-5.0 grade scale (Philippine grading system)
const percentageToGrade = (percentage: number): number => {
  if (percentage >= 97) return 1.0
  if (percentage >= 93) return 1.25
  if (percentage >= 89) return 1.5
  if (percentage >= 85) return 1.75
  if (percentage >= 81) return 2.0
  if (percentage >= 77) return 2.25
  if (percentage >= 73) return 2.5
  if (percentage >= 69) return 2.75
  if (percentage >= 65) return 3.0
  return 5.0 // Failed (below 65%)
}

// New function to convert raw score to grade directly
const rawScoreToGrade = (score: number, maxScore: number): number => {
  if (maxScore === 0) return 5.0
  const percentage = (score / maxScore) * 100
  return percentageToGrade(percentage)
}

// Function to round to the nearest valid grade in the grading scale
const roundToValidGrade = (grade: number): number => {
  const validGrades = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 5.0]
  
  // If grade is 5.0 or higher, return 5.0
  if (grade >= 5.0) return 5.0
  
  // Find the closest valid grade
  let closest = validGrades[0]
  let minDiff = Math.abs(grade - validGrades[0])
  
  for (let i = 1; i < validGrades.length; i++) {
    const diff = Math.abs(grade - validGrades[i])
    if (diff < minDiff) {
      minDiff = diff
      closest = validGrades[i]
    }
  }
  
  return closest
}

// Get grade details with color and icon - following the exact grading scale
const getGradeDetails = (grade: number) => {
  if (grade >= 1.0 && grade < 1.5) return { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950", icon: Trophy, label: "Excellent" }
  if (grade >= 1.5 && grade < 2.0) return { color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950", icon: Star, label: "Very Good" }
  if (grade >= 2.0 && grade < 2.5) return { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950", icon: Award, label: "Good" }
  if (grade >= 2.5 && grade < 3.0) return { color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950", icon: Sparkles, label: "Satisfactory" }
  if (grade >= 3.0 && grade < 5.0) return { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950", icon: CheckCircle, label: "Passing" }
  return { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950", icon: XCircle, label: "Failed" }
}

// Get grade description for PDF export
const getGradeDescriptionForPDF = (grade: number): string => {
  if (grade >= 1.0 && grade < 1.5) return "Excellent"
  if (grade >= 1.5 && grade < 2.0) return "Very Good"
  if (grade >= 2.0 && grade < 2.5) return "Good"
  if (grade >= 2.5 && grade < 3.0) return "Satisfactory"
  if (grade >= 3.0 && grade < 5.0) return "Passing"
  return "Failed"
}

// Get color coding for remarks based on grade
const getRemarksColor = (grade: number): { bg: string; text: string } => {
  if (grade >= 1.0 && grade < 1.5) return { bg: '#d4edda', text: '#155724' } // Excellent - Green
  if (grade >= 1.5 && grade < 2.0) return { bg: '#d1ecf1', text: '#0c5460' } // Very Good - Light Blue
  if (grade >= 2.0 && grade < 2.5) return { bg: '#cce5ff', text: '#004085' } // Good - Blue
  if (grade >= 2.5 && grade < 3.0) return { bg: '#e2e3e5', text: '#383d41' } // Satisfactory - Gray
  if (grade >= 3.0 && grade < 5.0) return { bg: '#fff3cd', text: '#856404' } // Passing - Yellow
  return { bg: '#f8d7da', text: '#721c24' } // Failed - Red
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
  adminId,
  submissionStatus = null,
  allSubmissionStatuses = new Map(),
  vpAcademicsGlobal,
  departmentHeadGlobal,
  registrarGlobal
}: GradesSheetProps) {
  // Filter to only include approved enrollments (safety check)
  const approvedEnrollments = enrollments.filter(
    (enrollment) => enrollment.status === "APPROVED"
  )
  
  // Sort enrollments by last name in ascending order
  const sortedEnrollments = useMemo(() => {
    return [...approvedEnrollments].sort((a, b) => {
      const lastNameA = (a.student.lastName || '').toLowerCase().trim()
      const lastNameB = (b.student.lastName || '').toLowerCase().trim()
      if (lastNameA < lastNameB) return -1
      if (lastNameA > lastNameB) return 1
      // If last names are equal, sort by first name
      const firstNameA = (a.student.firstName || '').toLowerCase().trim()
      const firstNameB = (b.student.firstName || '').toLowerCase().trim()
      if (firstNameA < firstNameB) return -1
      if (firstNameA > firstNameB) return 1
      return 0
    })
  }, [approvedEnrollments])
  const [components, setComponents] = useState<Map<string, Component[]>>(new Map())
  const [studentScores, setStudentScores] = useState<Map<string, Map<string, number>>>(new Map())
  const [existingGrades, setExistingGrades] = useState<Map<string, any>>(new Map())
  const [componentScores, setComponentScores] = useState<Map<string, Map<string, any>>>(new Map())
  // State for all grades across all grade types
  const [allExistingGrades, setAllExistingGrades] = useState<Map<string, any>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingGrades, setIsLoadingGrades] = useState(true)
  const [isLoadingComponents, setIsLoadingComponents] = useState(true)
  const [addComponentDialog, setAddComponentDialog] = useState<string | null>(null)
  const [newComponent, setNewComponent] = useState({ name: "", maxScore: 10 })
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false)
  const [studentStatus, setStudentStatus] = useState<Map<string, 'NORMAL' | 'INC' | 'DROPPED'>>(new Map())
  
  // Ref for PDF generation
  const gradingSheetRef = useRef<HTMLDivElement>(null)
  
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  // Show loading state if classData is not fully loaded
  if (!classData || !classData.schoolYear) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading grade sheet...</p>
        </div>
      </div>
    )
  }

  // Check if this is a final grade type - use special format
  // Only show final grade format for "Final" grade type, not for Prelims or Midterm
  const isFinalGradeType = gradeType?.name?.toLowerCase() === 'final'
  
  // Determine if the sheet should be disabled based on submission status
  // Check both the passed submissionStatus and the allSubmissionStatuses map
  const currentGradeTypeStatus = gradeType?.id ? allSubmissionStatuses.get(gradeType.id) : null
  const effectiveSubmissionStatus = submissionStatus || currentGradeTypeStatus?.status || null
  
  const isSubmissionDisabled = effectiveSubmissionStatus === 'PENDING' || effectiveSubmissionStatus === 'APPROVED'
  const isSubmissionEditable = effectiveSubmissionStatus === 'DECLINED' || effectiveSubmissionStatus === null
  
  // Final read-only state: either explicitly set as read-only OR submission is pending/approved
  const finalIsReadOnly: boolean = isReadOnly || isSubmissionDisabled
  
  // Debug logging - disabled for performance (uncomment for debugging)
  // console.log("=== GRADING SHEET STATUS DEBUG ===")
  // console.log("Grade type name:", gradeType?.name)
  // console.log("Grade type ID:", gradeType?.id)
  // console.log("Is final grade type:", isFinalGradeType)
  // console.log("Passed submission status:", submissionStatus)
  // console.log("Current grade type status from map:", currentGradeTypeStatus)
  // console.log("Effective submission status:", effectiveSubmissionStatus)
  // console.log("Submission ID:", submissionId)
  // console.log("Is submission disabled:", isSubmissionDisabled)
  // console.log("Is submission editable:", isSubmissionEditable)
  // console.log("Final is read-only:", finalIsReadOnly)
  // console.log("Should show only Export:", isSubmissionDisabled)
  // console.log("Should show all buttons:", !finalIsReadOnly && !isSubmissionDisabled)
  // console.log("All submission statuses:", Array.from(allSubmissionStatuses.entries()))
  // console.log("=== END DEBUG ===")

  // Load existing grades from database
  const loadExistingGrades = async () => {
    if (!gradeType) return
    
    try {
      setIsLoadingGrades(true)
      const response = await fetch(`/api/grades/load?classId=${classId}&gradeTypeId=${gradeType.id}`)
      const result = await response.json()
      
      if (result.success) {
        const gradesMap = new Map(Object.entries(result.grades))
        setExistingGrades(gradesMap)
        
        // Load status for each student from the grades
        // If a student is DROPPED in any grade type, show as DROPPED
        const statusMap = new Map<string, 'NORMAL' | 'INC' | 'DROPPED'>()
        
        // First, check all grade types to see if any student is DROPPED
        const checkAllStatuses = async () => {
          try {
            const allStatuses = new Map<string, 'NORMAL' | 'INC' | 'DROPPED'>()
            
            // Check all grade types for DROPPED status
            for (const gt of allGradeTypes) {
              const response = await fetch(`/api/grades/load?classId=${classId}&gradeTypeId=${gt.id}`)
              const result = await response.json()
              
              if (result.success) {
                Object.entries(result.grades).forEach(([studentId, gradeData]: [string, any]) => {
                  if (gradeData && gradeData.status) {
                    const existingStatus = allStatuses.get(studentId)
                    // If student is DROPPED in any grade type, set as DROPPED
                    if (gradeData.status === 'DROPPED' || existingStatus === 'DROPPED') {
                      allStatuses.set(studentId, 'DROPPED')
                    } else if (!existingStatus) {
                      allStatuses.set(studentId, gradeData.status)
                    }
                  }
                })
              }
            }
            
            // Merge with current grade type statuses, prioritizing DROPPED
            Object.entries(result.grades).forEach(([studentId, gradeData]: [string, any]) => {
              if (gradeData && gradeData.status) {
                const globalStatus = allStatuses.get(studentId)
                if (globalStatus === 'DROPPED') {
                  statusMap.set(studentId, 'DROPPED')
                } else {
                  statusMap.set(studentId, gradeData.status)
                }
              }
            })
            
            setStudentStatus(statusMap)
          } catch (error) {
            console.error("Error checking all statuses:", error)
            // Fallback to just current grade type
            Object.entries(result.grades).forEach(([studentId, gradeData]: [string, any]) => {
              if (gradeData && gradeData.status) {
                statusMap.set(studentId, gradeData.status)
              }
            })
            setStudentStatus(statusMap)
          }
        }
        
        checkAllStatuses()
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
      if (!gradeType) {
        return
      }
      
      try {
        setIsLoadingComponents(true)
        
        console.log("🔄 Loading component scores from database...")
        const response = await fetch(`/api/grades/load-component-scores?classId=${classId}&gradeTypeId=${gradeType.id}`)
        const result = await response.json()
        
        if (result.success) {
          console.log("✅ Component scores loaded from DB:", result.scores)
          
          const scoresMap = new Map()
          Object.entries(result.scores).forEach(([studentId, scores]) => {
            scoresMap.set(studentId, new Map(Object.entries(scores as Record<string, unknown>)))
          })
          
          setComponentScores(scoresMap)
          
          // IMPORTANT: Update studentScores to reflect what's in the database
          // This ensures the UI shows persisted data, not just in-memory changes
          const newStudentScores = new Map()
          Object.entries(result.scores).forEach(([studentId, scores]) => {
            const studentMap = new Map()
            Object.entries(scores as Record<string, unknown>).forEach(([componentId, scoreData]) => {
              studentMap.set(componentId, (scoreData as { score: number }).score)
            })
            newStudentScores.set(studentId, studentMap)
          })
          setStudentScores(newStudentScores) // Replace, don't merge
          
          console.log("✅ Component scores loaded successfully for", newStudentScores.size, "students")
        } else {
          console.error("❌ API returned error:", result.error)
        }
    } catch (error) {
      console.error("❌ Error loading component scores:", error)
    } finally {
      setIsLoadingComponents(false)
    }
  }

  // Load all grades for all grade types to calculate overall final grade
  const loadAllGrades = async () => {
    if (!allGradeTypes.length) return
    
    try {
      const allGrades = new Map()
      
      // Load grades for each grade type
      for (const gradeTypeItem of allGradeTypes) {
        const response = await fetch(`/api/grades/load?classId=${classId}&gradeTypeId=${gradeTypeItem.id}`)
        const result = await response.json()
        
        if (result.success) {
          Object.entries(result.grades).forEach(([studentId, grade]) => {
            const key = `${studentId}-${gradeTypeItem.id}`
            allGrades.set(key, grade)
          })
        }
      }
      
      setAllExistingGrades(allGrades)
    } catch (error) {
      console.error("Error loading all grades:", error)
    }
  }

  // Load existing grades and component scores when component mounts or gradeType changes
  useEffect(() => {
    if (gradeType?.id && classId) {
      loadExistingGrades()
      loadComponentScores()
      loadAllGrades()
      loadClassComponents()
    }
  }, [classId])

  // Load class-specific component definitions
  const loadClassComponents = async () => {
    if (!classId) return
    
    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/api/grades/class-components?classId=${classId}&t=${Date.now()}`)
      const result = await response.json()
      
      if (result.success) {
        
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
        console.log("✅ Components loaded successfully!")
        console.log("📋 Total components:", result.components.length)
        console.log("📋 Components by criteria:", Array.from(componentsByCriteria.entries()).map(([id, comps]) => ({
          criteriaId: id,
          count: comps.length,
          names: comps.map(c => c.name)
        })))
      } else {
        console.error("Failed to load components:", result.error)
      }
    } catch (error) {
      console.error("Error loading components:", error)
    }
  }

  // Initialize with class components - removed duplicate call
  // loadClassComponents is already called in the main useEffect

  const handleScoreChange = useCallback((studentId: string, componentId: string, value: string) => {
    // Prevent changes when sheet is disabled
    if (finalIsReadOnly) {
      return
    }
    
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
      const student = sortedEnrollments.find(e => e.student.id === studentId)?.student
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
  }, [enrollments, components, toast, finalIsReadOnly])

  const handleStatusChange = useCallback(async (studentId: string, status: 'NORMAL' | 'INC' | 'DROPPED') => {
    if (finalIsReadOnly) {
      return
    }
    
    // Update local state immediately for UI responsiveness
    setStudentStatus(prev => {
      const newStatus = new Map(prev)
      newStatus.set(studentId, status)
      return newStatus
    })

    // If status is DROPPED, propagate to all grade types immediately
    if (status === 'DROPPED') {
      try {
        const enrollment = sortedEnrollments.find(e => e.student.id === studentId)
        if (enrollment) {
          const response = await fetch('/api/grades/update-status-all', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentId,
              enrollmentId: enrollment.id,
              status: 'DROPPED',
              classId
            })
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              toast({
                title: "Status Updated",
                description: `Student marked as DROPPED across all grade types`,
              })
            }
          }
        }
      } catch (error) {
        console.error("Error propagating DROPPED status:", error)
        toast({
          title: "Warning",
          description: "Status updated locally but failed to propagate to all grade types",
          variant: "destructive",
        })
      }
    }
  }, [finalIsReadOnly, sortedEnrollments, classId, toast])

  const getStudentScore = useCallback((studentId: string, componentId: string): number | null => {
    // First check if we have local changes (user is editing)
    const localScore = studentScores.get(studentId)?.get(componentId)
    if (localScore !== undefined) {
      return localScore
    }
    
    // Fallback to loaded scores from database
    const studentComponentScores = componentScores.get(studentId)
    
    if (studentComponentScores) {
      const loadedScore = studentComponentScores.get(componentId)
      
      if (loadedScore) {
        return loadedScore.score || null
      }
    }
    
    // Return 0 instead of null to prevent 5.0 default
    return 0
  }, [studentScores, componentScores])

  const calculateCategoryGrade = useCallback((studentId: string, criteriaId: string) => {
    const comps = components.get(criteriaId) || []
    
    let totalScore = 0
    let maxScore = 0
    let hasAnyScore = false

    comps.forEach(comp => {
      const score = getStudentScore(studentId, comp.id)
      if (score !== null && score > 0) {
        totalScore += score
        hasAnyScore = true
      }
      maxScore += comp.maxScore
    })

    // Calculate percentage for display purposes only
    const percentage = hasAnyScore && maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const criterion = criteria.find(c => c.id === criteriaId)
    
    // Use the raw score directly instead of converting to percentage
    // If no scores at all, return 5.0 (failed)
    let ge = 5.0 // Default to failed
    
    if (hasAnyScore) {
      // Use the raw total score directly as the grade
      ge = rawScoreToGrade(totalScore, maxScore)
    }
    
    const we = ge * ((criterion?.percentage || 0) / 100)

    return { totalScore, maxScore, percentage, ge, we }
  }, [components, criteria, getStudentScore])

  const calculateFinalGrade = useCallback((studentId: string): number => {
    // Always calculate from current scores to reflect real-time changes
    let totalWE = 0
    criteria.forEach(criterion => {
      const { we } = calculateCategoryGrade(studentId, criterion.id)
      totalWE += we
    })

    // The totalWE is already the final grade (1.0-5.0 scale)
    // No need to round or convert - totalWE is already in the correct scale
    const calculatedGrade = totalWE
    
    return calculatedGrade || 5.0 // Return 5.0 if no grade calculated
  }, [criteria, calculateCategoryGrade])

  // Calculate weighted final grade across all grade types
  const calculateWeightedFinalGrade = useCallback((studentId: string): number => {
    if (!gradeType || !allGradeTypes.length) return 0
    
    // Use the same grade that's displayed in the UI (Final Term Grade)
    const currentGrade = calculateFinalGrade(studentId)
    
    // Calculate weighted contribution: Final Term Grade × (percentage / 100)
    const weightedContribution = currentGrade * (gradeType.percentage / 100)
    
    return weightedContribution
  }, [gradeType, allGradeTypes, calculateFinalGrade])


  // Calculate overall final grade across all grade types
  const calculateOverallFinalGrade = useCallback((studentId: string): number => {
    if (!allGradeTypes.length) return 0
    
    let totalWeightedGrade = 0
    
    // Calculate weighted grade for each grade type
    allGradeTypes.forEach(gradeTypeItem => {
      // Check if this is the current grade type - if so, calculate from current scores
      if (gradeTypeItem.id === gradeType?.id) {
        // For current grade type, calculate from current scores
        const currentGrade = calculateFinalGrade(studentId)
        const weightedContribution = currentGrade * (gradeTypeItem.percentage / 100)
        totalWeightedGrade += weightedContribution
      } else {
        // For other grade types, use existing grades from database
        const key = `${studentId}-${gradeTypeItem.id}`
        const existingGrade = allExistingGrades.get(key)
        
        if (existingGrade && existingGrade.grade) {
          // Use the weighted equivalent (WE) that's already calculated
          const weightedContribution = existingGrade.grade * (gradeTypeItem.percentage / 100)
          totalWeightedGrade += weightedContribution
        } else {
          // No grade found, add 5.0 (failed) weighted contribution
          const weightedContribution = 5.0 * (gradeTypeItem.percentage / 100)
          totalWeightedGrade += weightedContribution
        }
      }
    })
    
    // Round to nearest 0.25 increment (1.0, 1.25, 1.50, 1.75, 2.0, etc.)
    const roundedGrade = Math.round(totalWeightedGrade * 4) / 4
    
    return roundedGrade
  }, [allGradeTypes, gradeType, allExistingGrades, calculateFinalGrade])

  const handleAddComponent = async (criteriaId: string) => {
    if (!newComponent.name || newComponent.maxScore <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid component details",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("📤 Creating component:", { criteriaId, name: newComponent.name, maxScore: newComponent.maxScore, classId })
      
      const response = await fetch('/api/grades/class-components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          criteriaId,
          name: newComponent.name.toUpperCase(),
          maxScore: newComponent.maxScore,
          order: 0,
          classId // Include classId for validation
        })
      })

      const result = await response.json()
      console.log("📥 Component creation result:", result)

      if (result.success && result.data) {
        // Close dialog and reset form first
        setAddComponentDialog(null)
        setNewComponent({ name: "", maxScore: 10 })
        
        // Reload all components from database to get the persisted data
        console.log("🔄 Reloading components from database...")
        await loadClassComponents()
        
        toast({
          title: "✓ Component Added Successfully",
          description: `${result.data.name} has been saved to the database`,
        })
      } else {
        console.error("❌ Component creation failed:", result.error)
        toast({
          title: "Error",
          description: result.error || "Failed to add component",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error adding component:", error)
      toast({
        title: "Error",
        description: "Failed to add component. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveComponent = async (criteriaId: string, componentId: string) => {
    if (!confirm("Remove this component?")) return

    try {
      const response = await fetch(`/api/grades/class-components?componentId=${componentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        // Reload components from database
        await loadClassComponents()
        
        toast({
          title: "Component Removed",
          description: "Component has been removed",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove component",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing component:", error)
      toast({
        title: "Error",
        description: "Failed to remove component",
        variant: "destructive",
      })
    }
  }


  const handleExport = async (format: 'csv' | 'excel') => {
    if (!gradeType || !approvedEnrollments.length) {
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
          const visibleComps = comps.filter(c => c.name && c.name.trim() !== "")
          return [
            ...visibleComps.map(comp => comp.name),
            ...(visibleComps.length > 0 ? [
              `${criterion.name} TOT`,
              `${criterion.name} GE`,
              `${criterion.name} WE`
            ] : [])
          ]
        }),
        'Weighted Contribution',
        'Final Term Grade',
        'Remarks'
      ]

      const rows = sortedEnrollments.map((enrollment, index) => {
        const student = enrollment.student
        const currentGrade = calculateFinalGrade(student.id)
        const overallFinalGrade = calculateOverallFinalGrade(student.id)
        // Show current grade type's grade for prelims/midterm, overall grade for final
        const displayGrade = isFinalGradeType ? overallFinalGrade : currentGrade
        const weightedContribution = calculateWeightedFinalGrade(student.id)
        
        const row = [
          index + 1,
          student.lastName.toUpperCase(),
          student.firstName.toUpperCase(),
          student.middleName?.[0]?.toUpperCase() || "",
          ...criteria.flatMap(criterion => {
            const comps = components.get(criterion.id) || []
            const visibleComps = comps.filter(c => c.name && c.name.trim() !== "")
            const categoryGrade = calculateCategoryGrade(student.id, criterion.id)
            
            return [
              ...visibleComps.map(comp => {
                const score = getStudentScore(student.id, comp.id)
                return score === null ? "" : score
              }),
              ...(visibleComps.length > 0 ? [
                categoryGrade.totalScore,
                categoryGrade.ge,
                categoryGrade.we
              ] : [])
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
          `Subject: ${classData.subject?.name || 'N/A'}`,
          '',
          '',
          '',
          ...new Array(headers.length - 4).fill('')
        ]
        const semesterInfoRow = [
          `A.Y. ${classData.schoolYear?.year || 'N/A'} • ${classData.schoolYear?.semester || 'N/A'} SEMESTER`,
          '',
          '',
          '',
          ...new Array(headers.length - 4).fill('')
        ]
        const teacherInfoRow = [
          `Teacher: ${classData.teacher?.firstName || 'N/A'} ${classData.teacher?.lastName || 'N/A'}`,
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

  const handleExportPDF = async () => {
    if (!gradeType || !approvedEnrollments.length) {
      toast({
        title: "Error",
        description: "No grade type or students selected",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your PDF...",
      })

      // Calculate total columns to determine layout
      let totalColumns = 4 // #, First Name, Last Name, M.I.
      const componentCounts: number[] = []
      
      criteria.forEach(criterion => {
        const comps = components.get(criterion.id) || []
        const visibleComps = comps.filter(c => c.name && c.name.trim() !== '')
        const colsPerCriterion = visibleComps.length + (visibleComps.length > 0 ? 3 : 0) // components + TOT + GE + WE
        componentCounts.push(colsPerCriterion)
        totalColumns += colsPerCriterion
      })
      totalColumns += 2 // Grade + Remarks
      
      // Determine optimal layout based on column count
      const useLandscape = totalColumns > 25 // Switch to landscape if more than 25 columns
      const baseFontSize = useLandscape ? 7 : 8
      const componentFontSize = useLandscape ? 6 : 7
      const headerFontSize = useLandscape ? 7 : 8
      const containerWidth = useLandscape ? '1200px' : '800px'
      
      // Abbreviate component names if there are many columns
      const abbreviateNames = totalColumns > 30
      
      // Helper function to abbreviate component names
      const abbreviateName = (name: string): string => {
        if (!abbreviateNames) return name
        // Common abbreviations
        const abbrevMap: Record<string, string> = {
          'Quiz': 'Q',
          'QUIZ': 'Q',
          'Attendance': 'Att',
          'ATTENDANCE': 'Att',
          'Activity': 'Act',
          'ACTIVITY': 'Act',
          'Class Participation': 'CP',
          'CLASS PARTICIPATION': 'CP',
          'Lecture Exam': 'LE',
          'LECTURE EXAM': 'LE',
          'Final Exam': 'FE',
          'FINAL EXAM': 'FE',
          'Assignment': 'Asg',
          'ASSIGNMENT': 'Asg',
        }
        
        let abbrev = name
        for (const [full, short] of Object.entries(abbrevMap)) {
          if (name.includes(full)) {
            abbrev = name.replace(full, short).replace(/  +/g, ' ').trim()
            break
          }
        }
        
        // If still long, take first 3-4 chars
        if (abbrev.length > 8) {
          const parts = abbrev.split(/\s+/)
          if (parts.length > 1) {
            abbrev = parts.map(p => p.substring(0, 3)).join('')
          } else {
            abbrev = abbrev.substring(0, 6)
          }
        }
        
        return abbrev
      }

      // Create a dedicated PDF container with dynamic styling
      const pdfContainer = document.createElement('div')
      pdfContainer.style.position = 'absolute'
      pdfContainer.style.left = '-9999px'
      pdfContainer.style.top = '-9999px'
      pdfContainer.style.width = containerWidth
      pdfContainer.style.backgroundColor = 'white'
      pdfContainer.style.padding = '15px 5px'
      pdfContainer.style.fontFamily = 'Arial, sans-serif'
      pdfContainer.style.fontSize = `${baseFontSize}px`
      pdfContainer.style.lineHeight = '1.1'
      pdfContainer.style.color = '#000000'
      
      // Build the PDF content structure
      let pdfContent = `
        <div style="width: 100%; background: white; font-family: Arial, sans-serif; padding: 0 5px;">
          <!-- Header Section with Logo -->
          <div style="display: flex; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            <div style="flex: 0 0 auto; margin-right: 15px;">
              <img src="/app/assets/images/gitlogo.png" alt="GIT Logo" style="width: 60px; height: 60px; object-fit: contain;" />
            </div>
            <div style="flex: 1; text-align: center;">
              <h1 style="margin: 0; font-size: 16px; font-weight: bold;">GLAN INSTITUTE OF TECHNOLOGY</h1>
              <p style="margin: 2px 0; font-size: 10px;">Municipality of Glan, Province of Sarangani, Philippines 9517</p>
              <h2 style="margin: 5px 0; font-size: 14px; font-weight: bold;">GRADE SHEET - ${gradeType.name.toUpperCase()}</h2>
              <p style="margin: 2px 0; font-size: 10px;">A.Y. 2024-2025 • FIRST SEMESTER</p>
            </div>
          </div>

          <!-- Class Information -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 9px;">
            <div>
              <p style="margin: 1px 0;"><strong>Instructor:</strong> ${classData.teacher.firstName} ${classData.teacher.lastName}</p>
              <p style="margin: 1px 0;"><strong>Subject:</strong> ${classData.subject.code} - ${classData.subject.name}</p>
              <p style="margin: 1px 0;"><strong>Units:</strong> ${classData.subject.units}</p>
            </div>
            <div>
              <p style="margin: 1px 0;"><strong>Section:</strong> ${classData.subject.code} - ${classData.name}</p>
              <p style="margin: 1px 0;"><strong>Students:</strong> ${sortedEnrollments.length}</p>
            </div>
          </div>

          <!-- Grades Table -->
          <div style="overflow: visible; width: 100%;">
            <table style="width: 100%; border-collapse: collapse; font-size: ${baseFontSize}px; border: 0.25px solid #333; table-layout: ${useLandscape ? 'auto' : 'fixed'}; min-width: fit-content; vertical-align: middle;">
              <style>
                table, table td, table th { 
                  vertical-align: middle !important; 
                }
                table td, table th { 
                  display: table-cell !important;
                  text-align: center !important;
                }
              </style>
      `

      // Add table headers with dynamic sizing
      // Increase padding to prevent border overlap with text
      const headerPadding = useLandscape ? '4px' : '6px'
      const cellPadding = useLandscape ? '3px' : '4px'
      
      pdfContent += `
        <thead>
          <tr style="background: #333; color: white;">
            <th style="border: 0.25px solid #333; padding: ${headerPadding}; text-align: center; vertical-align: middle; font-weight: bold; font-size: ${headerFontSize}px; min-width: ${useLandscape ? '15px' : '20px'}; width: ${useLandscape ? '15px' : '20px'};">#</th>
            <th style="border: 0.25px solid #333; padding: ${headerPadding}; text-align: center; vertical-align: middle; font-weight: bold; font-size: ${headerFontSize}px; min-width: ${useLandscape ? '40px' : '60px'}; width: ${useLandscape ? '40px' : '60px'}; word-wrap: break-word;">First Name</th>
            <th style="border: 0.25px solid #333; padding: ${headerPadding}; text-align: center; vertical-align: middle; font-weight: bold; font-size: ${headerFontSize}px; min-width: ${useLandscape ? '50px' : '70px'}; width: ${useLandscape ? '50px' : '70px'}; word-wrap: break-word;">Last Name</th>
            <th style="border: 0.25px solid #333; padding: ${headerPadding}; text-align: center; vertical-align: middle; font-weight: bold; font-size: ${headerFontSize}px; min-width: ${useLandscape ? '15px' : '20px'}; width: ${useLandscape ? '15px' : '20px'};">M.I.</th>
      `

      // Add criteria headers with dynamic sizing
      criteria.forEach(criterion => {
        const comps = components.get(criterion.id) || []
        const visibleComps = comps.filter(c => c.name && c.name.trim() !== '')
        const colspan = visibleComps.length + (visibleComps.length > 0 ? 3 : 0)
        pdfContent += `
          <th style="border: 0.25px solid #333; padding: ${headerPadding}; text-align: center; vertical-align: middle; font-weight: bold; font-size: ${headerFontSize}px; word-wrap: break-word;" colspan="${colspan}">
            ${abbreviateNames ? criterion.name.replace(/Class Participation/gi, 'CP').replace(/Major Exam/gi, 'MajEx') : criterion.name} (${criterion.percentage}%)
          </th>
        `
      })

      pdfContent += `
            <th style="border: 0.25px solid #333; padding: ${headerPadding}; text-align: center; vertical-align: middle; font-weight: bold; background: #28a745; color: white; font-size: ${headerFontSize}px; min-width: ${useLandscape ? '35px' : '50px'}; word-wrap: break-word;">${gradeType.name.toUpperCase()} GRADE</th>
            <th style="border: 0.25px solid #333; padding: ${headerPadding}; text-align: center; vertical-align: middle; font-weight: bold; background: #6c757d; color: white; font-size: ${headerFontSize}px; min-width: ${useLandscape ? '30px' : '40px'};">REMARKS</th>
          </tr>
        </thead>
      `

      // Add component sub-headers with dynamic sizing
      pdfContent += `
        <tr style="background: #f8f9fa;">
          <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle;"></td>
          <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle;"></td>
          <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle;"></td>
          <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle;"></td>
      `

      criteria.forEach(criterion => {
        const comps = components.get(criterion.id) || []
        const visibleComps = comps.filter(c => c.name && c.name.trim() !== '')
        visibleComps.forEach(comp => {
          const compName = abbreviateName(comp.name)
          pdfContent += `<td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${componentFontSize}px; min-width: ${useLandscape ? '20px' : '30px'}; word-wrap: break-word;">${compName}<br/>max:${comp.maxScore}</td>`
        })
        if (visibleComps.length > 0) {
          pdfContent += `<td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${componentFontSize}px; min-width: ${useLandscape ? '20px' : '25px'};">TOT</td>`
          pdfContent += `<td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${componentFontSize}px; min-width: ${useLandscape ? '18px' : '25px'};">GE</td>`
          pdfContent += `<td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${componentFontSize}px; min-width: ${useLandscape ? '18px' : '25px'};">WE</td>`
        }
      })

      pdfContent += `
          <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle;"></td>
          <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle;"></td>
        </tr>
      `

      // Calculate page structure for separate PDF pages
      // Adjust students per page based on orientation
      const studentsPerPage = useLandscape ? 35 : 30
      const totalStudents = sortedEnrollments.length
      const totalPages = Math.ceil(totalStudents / studentsPerPage)

      // Create PDF with dynamic orientation
      const pdf = new jsPDF({
        orientation: useLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Fetch and convert logo to Base64
      let gitLogoBase64 = ''
      try {
        // Try multiple possible paths for the logo
        const possiblePaths = [
          '/gitlogo.png',
          '/app/assets/images/gitlogo.png',
          './gitlogo.png',
          window.location.origin + '/gitlogo.png',
          window.location.origin + '/app/assets/images/gitlogo.png'
        ]
        
        let logoResponse = null
        for (const path of possiblePaths) {
          try {
            logoResponse = await fetch(path)
            if (logoResponse.ok) {
              break
            }
          } catch (e) {
            continue
          }
        }
        
        if (!logoResponse || !logoResponse.ok) {
          throw new Error(`Failed to load logo from any path`)
        }
        
        const logoBlob = await logoResponse.blob()
        gitLogoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(logoBlob)
        })
        
        console.log("Logo loaded successfully:", gitLogoBase64.substring(0, 50) + "...")
      } catch (error) {
        console.error("Error loading GIT logo for PDF:", error)
        // Create a simple text-based logo as fallback
        const canvas = document.createElement('canvas')
        canvas.width = 60
        canvas.height = 60
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          // Draw a simple circular logo with text
          ctx.fillStyle = '#1e40af'
          ctx.beginPath()
          ctx.arc(30, 30, 28, 0, 2 * Math.PI)
          ctx.fill()
          
          ctx.fillStyle = 'white'
          ctx.font = 'bold 8px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('GIT', 30, 25)
          ctx.font = '6px Arial'
          ctx.fillText('LOGO', 30, 35)
        }
        
        gitLogoBase64 = canvas.toDataURL('image/png')
      }

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      // Calculate statistics once (for last page only)
      let droppedCountPDF = 0
      let incCountPDF = 0
      let passedCountPDF = 0
      let failedCountPDF = 0

      sortedEnrollments.forEach(enrollment => {
        const studentId = enrollment.student.id
        const studentStatusValue = studentStatus.get(studentId) || 'NORMAL'
        
        if (studentStatusValue === 'DROPPED') {
          droppedCountPDF++
        } else if (studentStatusValue === 'INC') {
          incCountPDF++
        } else {
          const currentGrade = calculateFinalGrade(studentId)
          const overallGrade = calculateOverallFinalGrade(studentId)
          const displayGrade = isFinalGradeType ? overallGrade : currentGrade
          
          if (displayGrade >= 1.0 && displayGrade <= 3.0) {
            passedCountPDF++
          } else {
            failedCountPDF++
          }
        }
      })

      const totalStudentsPDF = sortedEnrollments.length
      const droppedPercentagePDF = totalStudentsPDF > 0 ? ((droppedCountPDF / totalStudentsPDF) * 100).toFixed(2) : '0.00'
      const incPercentagePDF = totalStudentsPDF > 0 ? ((incCountPDF / totalStudentsPDF) * 100).toFixed(2) : '0.00'
      const passedPercentagePDF = totalStudentsPDF > 0 ? ((passedCountPDF / totalStudentsPDF) * 100).toFixed(2) : '0.00'
      const failedPercentagePDF = totalStudentsPDF > 0 ? ((failedCountPDF / totalStudentsPDF) * 100).toFixed(2) : '0.00'
      
      // Create separate pages for each group of 30 students
      
      for (let page = 0; page < totalPages; page++) {
        const isLastPage = page === totalPages - 1
        if (page > 0) {
          pdf.addPage()
        }
        
        // Calculate which students should be on this page
        const startIndex = page * studentsPerPage
        const endIndex = Math.min(startIndex + studentsPerPage, sortedEnrollments.length)
        const studentsOnThisPage = sortedEnrollments.slice(startIndex, endIndex)
        
        
        // Create a new HTML content for this specific page
        let pageContent = `
          <div style="width: 100%; background: white; font-family: Arial, sans-serif; padding: 0 5px;">
            <!-- Header Section with Logo -->
            <div style="display: flex; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px;">
              <div style="flex: 1; text-align: left;">
                <h1 style="margin: 0; font-size: 16px; font-weight: bold;">GLAN INSTITUTE OF TECHNOLOGY</h1>
                <p style="margin: 2px 0; font-size: 10px;">Municipality of Glan, Province of Sarangani, Philippines 9517</p>
                <h2 style="margin: 5px 0; font-size: 14px; font-weight: bold;">GRADE SHEET - ${gradeType.name.toUpperCase()}</h2>
                <p style="margin: 2px 0; font-size: 10px;">A.Y. 2024-2025 • FIRST SEMESTER</p>
              </div>
              <div style="flex: 0 0 auto; margin-left: 15px;">
                <img src="${gitLogoBase64}" alt="GIT Logo" style="width: 60px; height: 60px; object-fit: contain;" />
              </div>
            </div>

            <!-- Class Information -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 9px;">
              <div>
                <p style="margin: 1px 0;"><strong>Instructor:</strong> ${classData.teacher.firstName} ${classData.teacher.lastName}</p>
                <p style="margin: 1px 0;"><strong>Subject:</strong> ${classData.subject.code} - ${classData.subject.name}</p>
                <p style="margin: 1px 0;"><strong>Units:</strong> ${classData.subject.units}</p>
              </div>
              <div>
                <p style="margin: 1px 0;"><strong>Section:</strong> ${classData.subject.code} - ${classData.name}</p>
                <p style="margin: 1px 0;"><strong>Students:</strong> ${sortedEnrollments.length}</p>
              </div>
            </div>

            <!-- Grades Table -->
            <div style="overflow: visible; width: 100%;">
              <table style="width: 100%; border-collapse: collapse; font-size: ${baseFontSize}px; border: 0.25px solid #333; table-layout: ${useLandscape ? 'auto' : 'fixed'}; min-width: fit-content; vertical-align: middle;">
                <style>
                  table, table td, table th { 
                    vertical-align: middle !important; 
                  }
                  table td, table th { 
                    display: table-cell !important;
                    text-align: center !important;
                  }
                </style>
                <thead>
                  <tr style="background: #333; color: white;">
                    <th style="border: 0.25px solid #333; padding: ${headerPadding}; text-align: center; vertical-align: middle; font-weight: bold; font-size: ${headerFontSize}px; min-width: ${useLandscape ? '15px' : '20px'}; width: ${useLandscape ? '15px' : '20px'};">#</th>
                    <th style="border: 0.25px solid #333; padding: ${headerPadding}; text-align: center; vertical-align: middle; font-weight: bold; font-size: ${headerFontSize}px; min-width: ${useLandscape ? '40px' : '60px'}; width: ${useLandscape ? '40px' : '60px'}; word-wrap: break-word;">First Name</th>
                    <th style="border: 0.25px solid #333; padding: ${headerPadding}; text-align: center; vertical-align: middle; font-weight: bold; font-size: ${headerFontSize}px; min-width: ${useLandscape ? '50px' : '70px'}; width: ${useLandscape ? '50px' : '70px'}; word-wrap: break-word;">Last Name</th>
                    <th style="border: 0.25px solid #333; padding: ${headerPadding}; text-align: center; vertical-align: middle; font-weight: bold; font-size: ${headerFontSize}px; min-width: ${useLandscape ? '15px' : '20px'}; width: ${useLandscape ? '15px' : '20px'};">M.I.</th>
        `

        // Add criteria headers with dynamic sizing
        criteria.forEach(criterion => {
          const comps = components.get(criterion.id) || []
          const visibleComps = comps.filter(c => c.name && c.name.trim() !== '')
          const colspan = visibleComps.length + (visibleComps.length > 0 ? 3 : 0)
          pageContent += `
            <th style="border: 0.25px solid #333; padding: ${headerPadding}; text-align: center; vertical-align: middle; font-weight: bold; font-size: ${headerFontSize}px; word-wrap: break-word;" colspan="${colspan}">
              ${abbreviateNames ? criterion.name.replace(/Class Participation/gi, 'CP').replace(/Major Exam/gi, 'MajEx') : criterion.name} (${criterion.percentage}%)
            </th>
          `
        })

        pageContent += `
                    <th style="border: 0.25px solid #333; padding: ${headerPadding}; text-align: center; vertical-align: middle; font-weight: bold; background: #28a745; color: white; font-size: ${headerFontSize}px; min-width: ${useLandscape ? '35px' : '50px'}; word-wrap: break-word;">${gradeType.name.toUpperCase()} GRADE</th>
                    <th style="border: 0.25px solid #333; padding: ${headerPadding}; text-align: center; vertical-align: middle; font-weight: bold; background: #6c757d; color: white; font-size: ${headerFontSize}px; min-width: ${useLandscape ? '30px' : '40px'};">REMARKS</th>
                  </tr>
                </thead>
        `

        // Add component sub-headers with dynamic sizing
        pageContent += `
          <tr style="background: #f8f9fa;">
            <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle;"></td>
            <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle;"></td>
            <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle;"></td>
            <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle;"></td>
        `

        criteria.forEach(criterion => {
          const comps = components.get(criterion.id) || []
          const visibleComps = comps.filter(c => c.name && c.name.trim() !== '')
          visibleComps.forEach(comp => {
            const compName = abbreviateName(comp.name)
            pageContent += `<td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${componentFontSize}px; min-width: ${useLandscape ? '20px' : '30px'}; word-wrap: break-word;">${compName}<br/>max:${comp.maxScore}</td>`
          })
          if (visibleComps.length > 0) {
            pageContent += `<td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${componentFontSize}px; min-width: ${useLandscape ? '20px' : '25px'};">TOT</td>`
            pageContent += `<td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${componentFontSize}px; min-width: ${useLandscape ? '18px' : '25px'};">GE</td>`
            pageContent += `<td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${componentFontSize}px; min-width: ${useLandscape ? '18px' : '25px'};">WE</td>`
          }
        })

        pageContent += `
            <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle;"></td>
            <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle;"></td>
          </tr>
        `

        // Add students for this page
        studentsOnThisPage.forEach((enrollment, localIndex) => {
          const globalIndex = startIndex + localIndex
          const student = enrollment.student
          const currentGrade = calculateFinalGrade(student.id)
          const overallGrade = calculateOverallFinalGrade(student.id)
          const displayGrade = isFinalGradeType ? overallGrade : currentGrade

          const studentStatusValue = studentStatus.get(student.id) || 'NORMAL'
          const statusDisplay = studentStatusValue === 'NORMAL' ? 'Normal' : studentStatusValue
          const statusBgColor = studentStatusValue === 'INC' ? '#ffeaa7' : studentStatusValue === 'DROPPED' ? '#fab1a0' : '#f8f9fa'
          
          pageContent += `
            <tr style="background: ${studentStatusValue === 'INC' || studentStatusValue === 'DROPPED' ? '#fff3cd' : 'transparent'};">
              <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${baseFontSize}px;">${globalIndex + 1}</td>
              <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${baseFontSize}px; word-wrap: break-word;">${student.firstName.toUpperCase()}</td>
              <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${baseFontSize}px; word-wrap: break-word;">${student.lastName.toUpperCase()}</td>
              <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${baseFontSize}px;">${student.middleName?.[0]?.toUpperCase() || ""}</td>
          `

          // Add criteria data with dynamic sizing
          criteria.forEach(criterion => {
            const comps = components.get(criterion.id) || []
            let totalScore = 0
            let maxScore = 0
            let hasAnyScore = false

            comps.forEach(comp => {
              const score = getStudentScore(student.id, comp.id)
              if (score !== null && score > 0) {
                totalScore += score
                hasAnyScore = true
              }
              maxScore += comp.maxScore
              pageContent += `<td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${componentFontSize}px;">${score || 0}</td>`
            })

            const { ge, we } = calculateCategoryGrade(student.id, criterion.id)
            pageContent += `<td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${componentFontSize}px;">${totalScore}</td>`
            pageContent += `<td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${componentFontSize}px;">${ge.toFixed(2)}</td>`
            pageContent += `<td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-size: ${componentFontSize}px;">${we.toFixed(2)}</td>`
          })

          // Handle special statuses
          let finalGradeDisplay, remarksDisplay, remarksColor
          if (studentStatusValue === 'INC') {
            finalGradeDisplay = 'INC'
            remarksDisplay = 'INC'
            remarksColor = { bg: '#ffeaa7', text: '#856404' }
          } else if (studentStatusValue === 'DROPPED') {
            finalGradeDisplay = 'DROPPED'
            remarksDisplay = 'DROPPED'
            remarksColor = { bg: '#fab1a0', text: '#8b4513' }
          } else {
            finalGradeDisplay = roundToValidGrade(displayGrade).toFixed(2)
            if (displayGrade >= 1.0 && displayGrade <= 3.0) {
              remarksDisplay = 'PASSED'
              remarksColor = { bg: '#d4edda', text: '#155724' }
            } else {
              remarksDisplay = 'FAILED'
              remarksColor = { bg: '#f8d7da', text: '#721c24' }
            }
          }
          
          pageContent += `
              <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-weight: bold; background: ${displayGrade >= 1.0 && displayGrade <= 3.0 ? '#d4edda' : '#f8d7da'}; color: ${displayGrade >= 1.0 && displayGrade <= 3.0 ? '#155724' : '#721c24'}; font-size: ${baseFontSize}px;">
                ${finalGradeDisplay}
              </td>
              <td style="border: 0.25px solid #333; padding: ${cellPadding}; text-align: center; vertical-align: middle; font-weight: bold; background: ${remarksColor.bg}; color: ${remarksColor.text}; font-size: ${baseFontSize}px;">${remarksDisplay}</td>
            </tr>
          `
        })

        pageContent += `
              </table>
            </div>
        `

        // Only add signature section on the last page
        if (isLastPage) {
          pageContent += `
            <!-- Signature Section -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
                <!-- Instructor -->
                <div style="text-align: center; width: 45%;">
                  <div style="border-bottom: 1px solid #333; margin: 0 auto 6px auto; height: 42px; width: 90%;"></div>
                  <p style="margin: 0; font-size: 10px;">INSTRUCTOR</p>
                  <p style="margin: 2px 0; font-size: 9px; font-weight: bold;">${classData.teacher.firstName} ${classData.teacher.lastName}</p>
                </div>
                <!-- Department Head (from class assignment) -->
                <div style="text-align: center; width: 45%;">
                  <div style="border-bottom: 1px solid #333; margin: 0 auto 6px auto; height: 42px; width: 90%;"></div>
                  <p style="margin: 0; font-size: 10px;">DEPARTMENT HEAD</p>
                  <p style="margin: 2px 0; font-size: 9px; font-weight: bold;">${classData.departmentHead || departmentHeadGlobal || ''}</p>
                </div>
              </div>
              <!-- VP for Academics (from class assignment/global setting) -->
              <div style="text-align: center; margin-top: 6px;">
                <div style="border-bottom: 1px solid #333; margin: 0 auto 6px auto; width: 65%; height: 42px;"></div>
                <p style="margin: 0; font-size: 10px;">VICE PRESIDENT FOR ACADEMICS</p>
                <p style="margin: 2px 0; font-size: 9px; font-weight: bold;">${vpAcademicsGlobal || classData.vpAcademics || ''}</p>
              </div>
              <!-- Registrar (from global setting) -->
              <div style="text-align: center; margin-top: 6px;">
                <div style="border-bottom: 1px solid #333; margin: 0 auto 6px auto; width: 65%; height: 42px;"></div>
                <p style="margin: 0; font-size: 10px;">REGISTRAR</p>
                <p style="margin: 2px 0; font-size: 9px; font-weight: bold;">${registrarGlobal || ''}</p>
              </div>
            </div>
          `
        }

        // Close the main div
        pageContent += `
          </div>
        `

        // Create a separate container for this page
        const pageContainer = document.createElement('div')
        pageContainer.style.position = 'absolute'
        pageContainer.style.left = '-9999px'
        pageContainer.style.top = '-9999px'
        pageContainer.style.width = containerWidth
        pageContainer.style.minWidth = containerWidth
        pageContainer.style.maxWidth = 'none'
        pageContainer.style.overflow = 'visible'
        pageContainer.style.backgroundColor = 'white'
        pageContainer.style.padding = '15px 5px'
        pageContainer.style.fontFamily = 'Arial, sans-serif'
        pageContainer.style.fontSize = `${baseFontSize}px`
        pageContainer.style.lineHeight = '1.1'
        pageContainer.style.color = '#000000'
        pageContainer.innerHTML = pageContent
        
        document.body.appendChild(pageContainer)

        // Wait for rendering to ensure all content is laid out
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Get the actual width of the table to ensure we capture all content
        // Look for the table element inside the container
        const table = pageContainer.querySelector('table') as HTMLTableElement
        let actualWidth = useLandscape ? 1200 : 800
        
        if (table) {
          // Use table scrollWidth to get the actual content width
          actualWidth = Math.max(
            table.scrollWidth,
            table.offsetWidth,
            pageContainer.scrollWidth,
            useLandscape ? 1200 : 800
          )
        } else {
          // Fallback to container width
          actualWidth = Math.max(
            pageContainer.scrollWidth,
            pageContainer.offsetWidth,
            useLandscape ? 1200 : 800
          )
        }

        // Generate canvas for this page - use scrollWidth to capture all content
        const pageCanvas = await html2canvas(pageContainer, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: actualWidth,
          height: pageContainer.scrollHeight,
          windowWidth: actualWidth,
          logging: false,
          onclone: (clonedDoc) => {
            // Ensure the cloned document has the correct width
            const clonedContainer = clonedDoc.querySelector('div') as HTMLElement
            if (clonedContainer) {
              clonedContainer.style.width = `${actualWidth}px`
              clonedContainer.style.overflow = 'visible'
            }
          }
        })

        // Clean up
        document.body.removeChild(pageContainer)

        // Add to PDF
        const pageImgData = pageCanvas.toDataURL('image/png')
        const pageImgWidth = pageCanvas.width
        const pageImgHeight = pageCanvas.height
        
        const pageRatio = Math.min((pdfWidth - 20) / pageImgWidth, (pdfHeight - 20) / pageImgHeight)
        const pageScaledWidth = pageImgWidth * pageRatio
        const pageScaledHeight = pageImgHeight * pageRatio
        
        const pageX = (pdfWidth - pageScaledWidth) / 2
        const pageY = (pdfHeight - pageScaledHeight) / 2

        pdf.addImage(pageImgData, 'PNG', pageX, pageY, pageScaledWidth, pageScaledHeight)
      }
      
      const fileName = `${gradeType.name}_Grades_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

      toast({
        title: "PDF Export Successful",
        description: `${gradeType.name} grades exported as PDF`,
      })
    } catch (error) {
      console.error("PDF Export error:", error)
      toast({
        title: "PDF Export Failed",
        description: "Failed to generate PDF. Please try again.",
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
        const student = sortedEnrollments.find(e => e.student.id === studentId)?.student
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
      if (sortedEnrollments.length > 0) {
        console.log("Saving grades for all students:", sortedEnrollments.length)
        
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
        
        console.log("📊 All component scores to save:", allComponentScores)
        console.log("📊 Total students with scores:", Object.keys(allComponentScores).length)
        
        // Debug: Check if we have any scores at all
        const totalScoresCount = Object.values(allComponentScores).reduce((sum, scores) => sum + Object.keys(scores).length, 0)
        console.log("📊 Total component scores across all students:", totalScoresCount)
        
        // Save grades for all students
        let successCount = 0
        let errorCount = 0
        
        for (const enrollment of sortedEnrollments) {
          try {
            const finalGrade = calculateFinalGrade(enrollment.studentId)
            const remarks = getGradeDetails(finalGrade).label
            const studentStatusValue = studentStatus.get(enrollment.student.id) || 'NORMAL'

            console.log(`Saving grade for student ${enrollment.studentId}:`, {
              enrollmentId: enrollment.id,
              classId,
              studentId: enrollment.studentId,
              gradeTypeId: gradeType.id,
              finalGrade,
              remarks,
              status: studentStatusValue,
              allComponentScores
            })

            // If status is DROPPED, propagate to all grade types before saving
            if (studentStatusValue === 'DROPPED') {
              try {
                await fetch('/api/grades/update-status-all', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    studentId: enrollment.student.id,
                    enrollmentId: enrollment.id,
                    status: 'DROPPED',
                    classId
                  })
                })
              } catch (error) {
                console.error("Error propagating DROPPED status:", error)
              }
            }

            const requestPayload = {
              enrollmentId: enrollment.id,
              classId,
              studentId: enrollment.student.id,
              gradeTypeId: gradeType.id,
              finalGrade,
              remarks,
              status: studentStatusValue,
              allComponentScores
            }
            
            console.log(`📤 Sending save request for student ${enrollment.studentId}:`, {
              ...requestPayload,
              componentScoresCount: allComponentScores[enrollment.student.id] ? Object.keys(allComponentScores[enrollment.student.id]).length : 0
            })

            const response = await fetch('/api/real-save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestPayload)
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
            description: `Successfully saved grades for ${successCount} students to the database`,
          })
          // Reload existing grades and component scores to verify database persistence
          console.log("🔄 Reloading data from database to verify save...")
          await loadExistingGrades()
          await loadComponentScores()
          await loadClassComponents()
          router.refresh()
          console.log("✅ Data reloaded from database after save")
        } else if (successCount > 0 && errorCount > 0) {
          toast({
            title: "⚠️ Partial Success",
            description: `Saved grades for ${successCount} students, failed for ${errorCount} students`,
            variant: "destructive",
          })
          // Still reload to show what was saved
          console.log("🔄 Reloading data from database...")
          await loadExistingGrades()
          await loadComponentScores()
          await loadClassComponents()
          router.refresh()
        } else {
          toast({
            title: "❌ Save Failed",
            description: `Failed to save grades for all ${sortedEnrollments.length} students`,
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

  const handleSubmit = () => {
    setShowSubmitConfirmation(true)
  }

  const confirmSubmit = async () => {
    setIsLoading(true)
    setShowSubmitConfirmation(false)
    
    try {
      // First save all grades
      await handleSaveAll()
      
      // Get school year from first enrollment
      const schoolYearId = sortedEnrollments[0]?.schoolYearId
      
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
          title: "✅ Grades Submitted Successfully",
          description: `Your ${gradeType?.name || 'grade'} submission has been sent to the Program Head for approval. The grading sheet is now in view-only mode.`,
          duration: 5000,
        })
        
        // Refresh the current page data to show the updated submission status
        router.refresh()
        
        // Optional: Redirect to submissions page after a longer delay
        // setTimeout(() => {
        //   router.push("/teacher/submissions")
        // }, 2000)
      } else {
        toast({
          title: "❌ Submission Failed",
          description: result.error || "Failed to submit grades. Please try again.",
          variant: "destructive",
          duration: 5000,
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

  if (sortedEnrollments.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No students enrolled in this class yet
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoadingGrades || isLoadingComponents) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading grades and component scores...</p>
      </div>
    )
  }

  // Debug: Check if component scores are loaded
  console.log("🔍 Component scores loaded:", componentScores.size > 0)
  console.log("🔍 Student scores loaded:", studentScores.size > 0)
  console.log("🔍 Components loaded:", components.size > 0)
  
  // Debug: Show detailed component scores info
  if (componentScores.size > 0) {
    console.log("📊 Component scores details:")
    componentScores.forEach((studentScores, studentId) => {
      console.log(`  Student ${studentId}:`, studentScores.size, "scores")
      studentScores.forEach((score, componentId) => {
        console.log(`    Component ${componentId}:`, score)
      })
    })
  } else {
    console.log("❌ NO COMPONENT SCORES LOADED!")
    console.log("This is why the grade is showing as 5.0 (failed)")
  }
  
  // Debug: Check if criteria are loaded
  console.log("🔍 Criteria loaded:", criteria.length)
  criteria.forEach(criterion => {
    console.log(`  - ${criterion.name} (${criterion.percentage}%): ${criterion.id}`)
  })
  
  // Debug: Check if components are loaded
  console.log("🔍 Components loaded:", components.size)
  components.forEach((comps, criteriaId) => {
    console.log(`  - Criteria ${criteriaId}: ${comps.length} components`)
    comps.forEach(comp => {
      console.log(`    - ${comp.name} (max: ${comp.maxScore}): ${comp.id}`)
    })
  })

  return (
    <div className="space-y-6">
      {/* Export Button - Always visible and fully opaque */}
      {isSubmissionDisabled && (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExportPDF()}>
                <FileDown className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div ref={gradingSheetRef} className={`space-y-6 ${isSubmissionDisabled ? 'opacity-60' : ''}`}>
      {/* Status Banner */}
      {isSubmissionDisabled && (
        <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse"></div>
            <span className="font-bold text-lg text-yellow-800">
              {effectiveSubmissionStatus === 'PENDING' 
                ? `⏳ ${gradeType?.name?.toUpperCase() || 'GRADE SHEET'} SUBMITTED - VIEW ONLY MODE`
                : `✅ ${gradeType?.name?.toUpperCase() || 'GRADE SHEET'} APPROVED - VIEW ONLY MODE`
              }
            </span>
          </div>
          <p className="text-base text-yellow-700 mt-2 font-medium">
            🔒 All input fields are disabled. You can only export the grades.
          </p>
          <p className="text-sm text-yellow-600 mt-1">
            To edit grades: Wait for admin rejection or delete the submission from your submissions page.
          </p>
        </div>
      )}
      
      {isSubmissionEditable && effectiveSubmissionStatus === 'DECLINED' && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500"></div>
            <span className="font-semibold text-red-800">
              ❌ {gradeType?.name?.toUpperCase() || 'Grade sheet'} was rejected - Edit mode enabled
            </span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            You can now edit the grades and resubmit for approval.
          </p>
        </div>
      )}

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
              A.Y. {classData.schoolYear?.year || 'Loading...'} • {classData.schoolYear?.semester || 'Loading...'} SEMESTER
            </p>
            {submissionStatus && (
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={submissionStatus === 'APPROVED' ? 'default' : 
                          submissionStatus === 'DECLINED' ? 'destructive' : 
                          'secondary'}
                  className="text-xs"
                >
                  {submissionStatus === 'PENDING' && '⏳ Submitted - Sheet Disabled'}
                  {submissionStatus === 'APPROVED' && '✅ Approved - Sheet Disabled'}
                  {submissionStatus === 'DECLINED' && '❌ Rejected - Sheet Editable'}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!finalIsReadOnly ? (
              // Teacher view - normal buttons (when not submitted)
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
                    <DropdownMenuItem onClick={() => handleExportPDF()}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" onClick={handleSaveAll} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Saving..." : "Save"}
                </Button>
                <AlertDialog open={showSubmitConfirmation} onOpenChange={setShowSubmitConfirmation}>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="default">
                      <Send className="mr-2 h-4 w-4" />
                      Submit
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        Submit Grades for Approval
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-base">
                        Are you sure you want to submit these grades for approval?
                        <br /><br />
                        <span className="text-sm text-gray-600">
                          • This will send your grades to the Program Head for review
                          <br />
                          • You will not be able to edit these grades until they are approved or declined
                          <br />
                          • Students will only see these grades after approval
                        </span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setShowSubmitConfirmation(false)}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={confirmSubmit}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {isLoading ? "Submitting..." : "Submit for Approval"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : null}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm bg-background/50 rounded-lg p-4">
          <div className="space-y-1">
            <p><strong>Instructor:</strong> {classData.teacher?.firstName || 'N/A'} {classData.teacher?.lastName || 'N/A'}</p>
            <p><strong>Subject:</strong> {classData.subject?.code || 'N/A'} - {classData.subject?.name || 'N/A'}</p>
            <p><strong>Units:</strong> {classData.subject?.units || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p><strong>Section:</strong> {classData.name || 'N/A'} - {classData.section || 'N/A'}</p>
            <p><strong>Students:</strong> {sortedEnrollments.length}</p>
          </div>
        </div>
      </div>

      {/* Beautified Grading Scale */}
      <div className="rounded-xl border p-6 bg-gradient-to-br from-background to-muted/20 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-primary" />
          <h4 className="font-bold text-lg">Grading Scale (1.0 - 5.0)</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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
            { grade: "INC", range: "Incomplete", label: "Incomplete", icon: Clock, color: "yellow" },
            { grade: "DROPPED", range: "Dropped", label: "Dropped", icon: UserX, color: "orange" },
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
      {!finalIsReadOnly && (
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
                {!finalIsReadOnly && (
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
                          onChange={(e) => {
                            const value = e.target.value
                            setNewComponent(prev => ({ ...prev, name: value }))
                          }}
                        />
                      </div>
                      <div>
                        <Label>Max Score</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newComponent.maxScore}
                          onChange={(e) => {
                            const value = e.target.value
                            const numValue = value === '' ? 10 : parseFloat(value) || 10
                            setNewComponent({ ...newComponent, maxScore: numValue })
                          }}
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
                    {!finalIsReadOnly && (
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
      <div className={`rounded-lg border overflow-x-auto shadow-sm ${isSubmissionDisabled ? 'pointer-events-none' : ''}`}>
        <table className={`w-full border-collapse text-xs min-w-max ${isSubmissionDisabled ? 'opacity-60' : ''}`}>
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th rowSpan={2} className="border border-primary-foreground/20 p-1 min-w-[30px]">#</th>
              <th rowSpan={2} className="border border-primary-foreground/20 p-1 min-w-[80px]">LASTNAME</th>
              <th rowSpan={2} className="border border-primary-foreground/20 p-1 min-w-[80px]">FIRSTNAME</th>
              <th rowSpan={2} className="border border-primary-foreground/20 p-1 min-w-[30px]">MI</th>
              <th rowSpan={2} className="border border-primary-foreground/20 p-1 min-w-[70px]">STATUS</th>
              {criteria.map(criterion => {
                const comps = components.get(criterion.id) || []
                const visibleComps = comps.filter(c => c.name && c.name.trim() !== "")
                const colSpan = visibleComps.length + 3
                return (
                  <th
                    key={criterion.id}
                    colSpan={colSpan}
                    className="border border-primary-foreground/20 p-2"
                  >
                    {criterion.name} ({criterion.percentage}%)
                  </th>
                )
              })}
              {gradeType && (
                <th rowSpan={2} className="border border-primary-foreground/20 p-1 min-w-[70px] bg-blue-600">
                  WEIGHTED<br/>CONTRIBUTION
                  <div className="text-[9px] text-blue-100">({gradeType.percentage}%)</div>
                </th>
              )}
              {isFinalGradeType && (
                <>
                  <th rowSpan={2} className="border border-primary-foreground/20 p-1 min-w-[70px]">
                    TOTAL PERCENTAGE<br/>SCORE
                  </th>
                  <th rowSpan={2} className="border border-primary-foreground/20 p-1 min-w-[70px]">
                    {gradeType?.name?.toUpperCase() || "FINAL"}<br/>TERM GRADE
                  </th>
                </>
              )}
              {/* Add FINAL TERM GRADE column for all grade types */}
                  <th rowSpan={2} className="border border-primary-foreground/20 p-1 min-w-[70px] bg-gradient-to-br from-green-600 to-green-700 text-white">
                    {gradeType?.name?.toUpperCase() || "FINAL"}<br/>GRADE
                    <div className="text-[9px] text-green-100">(1.0-5.0)</div>
                  </th>
              <th rowSpan={2} className="border border-primary-foreground/20 p-1 min-w-[70px] bg-gradient-to-br from-green-600 to-green-700 text-white">
                REMARKS
                <div className="text-[9px] text-green-100">(PASS/FAIL)</div>
              </th>
            </tr>
            <tr className="bg-primary text-primary-foreground">
              {/* <td className="border border-primary-foreground/20 p-1"></td>
              <td className="border border-primary-foreground/20 p-1"></td>
              <td className="border border-primary-foreground/20 p-1"></td>
              <td className="border border-primary-foreground/20 p-1"></td>
              <td className="border border-primary-foreground/20 p-1"></td> */}
              {criteria.map(criterion => {
                const comps = components.get(criterion.id) || []
                const visibleComps = comps.filter(c => c.name && c.name.trim() !== "")
                return (
                  <>
                    {visibleComps.map(comp => (
                      <th key={comp.id} className="border border-primary-foreground/20 p-1 min-w-[45px]">
                        <div className="text-center text-[9px]">
                          <div className="font-semibold">{comp.name}</div>
                          <div className="text-primary-foreground/70">max:{comp.maxScore}</div>
                        </div>
                      </th>
                    ))}
                    <th className="border border-primary-foreground/20 p-1 min-w-[40px] bg-primary/80 text-[9px] text-center">TOT</th>
                    <th className="border border-primary-foreground/20 p-1 min-w-[35px] bg-primary/80 text-[9px] text-center">GE</th>
                    <th className="border border-primary-foreground/20 p-1 min-w-[35px] bg-primary/80 text-[9px] text-center">WE</th>
                  </>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedEnrollments.map((enrollment, index) => {
              const student = enrollment.student
              const currentGrade = calculateFinalGrade(student.id)
              const overallFinalGrade = calculateOverallFinalGrade(student.id)
              // Show current grade type's grade for prelims/midterm, overall grade for final
              const displayGrade = isFinalGradeType ? calculateOverallFinalGrade(student.id) : currentGrade
              const gradeDetails = getGradeDetails(displayGrade)

              const studentStatusValue = studentStatus.get(student.id) || 'NORMAL'
              const isHighlighted = studentStatusValue === 'INC' || studentStatusValue === 'DROPPED'
              
              return (
                <tr key={enrollment.id} className={`hover:bg-muted/30 transition-colors ${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900/20' : ''}`}>
                  <td className="border p-1 text-center font-medium">{index + 1}</td>
                  <td className="border p-1 font-medium text-[10px]">{student.lastName.toUpperCase()}</td>
                  <td className="border p-1 text-[10px]">{student.firstName.toUpperCase()}</td>
                  <td className="border p-1 text-center">{student.middleName?.[0]?.toUpperCase() || ""}</td>
                  <td className="border p-1 text-center">
                    {!finalIsReadOnly ? (
                      <select
                        value={studentStatusValue}
                        onChange={(e) => handleStatusChange(student.id, e.target.value as 'NORMAL' | 'INC' | 'DROPPED')}
                        className="w-full text-[9px] border rounded px-1 py-0.5"
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="INC">INC</option>
                        <option value="DROPPED">Dropped</option>
                      </select>
                    ) : (
                      <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${
                        studentStatusValue === 'INC' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        studentStatusValue === 'DROPPED' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {studentStatusValue === 'NORMAL' ? 'Normal' : studentStatusValue}
                      </span>
                    )}
                  </td>

                  {criteria.map(criterion => {
                    const comps = components.get(criterion.id) || []
                    const visibleComps = comps.filter(c => c.name && c.name.trim() !== "")
                    const { totalScore, maxScore, ge, we } = calculateCategoryGrade(student.id, criterion.id)

                    return (
                      <>
                        {visibleComps.map(comp => {
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
                                  "h-6 text-[9px] text-center border-0 focus-visible:ring-1 bg-transparent w-12",
                                  isInvalid && "text-red-600 dark:text-red-400 ring-1 ring-red-500",
                                  isEmpty && "border-red-300 dark:border-red-700",
                                  finalIsReadOnly && "bg-muted/50 cursor-not-allowed opacity-50"
                                )}
                                placeholder=""
                                min="0"
                                max={comp.maxScore}
                                value={score === null ? "" : score}
                                onChange={finalIsReadOnly ? undefined : (e) => handleScoreChange(student.id, comp.id, e.target.value)}
                                onFocus={finalIsReadOnly ? (e) => e.target.blur() : undefined}
                                onClick={finalIsReadOnly ? (e) => e.preventDefault() : undefined}
                                readOnly={finalIsReadOnly}
                                disabled={finalIsReadOnly}
                                style={finalIsReadOnly ? { pointerEvents: 'none' } : {}}
                              />
                            </td>
                          )
                        })}
                        <td className="border p-1 text-center font-semibold bg-muted/50 text-[9px]">{totalScore}</td>
                        <td className="border p-1 text-center bg-muted/50 text-[9px]">{ge.toFixed(1)}</td>
                        <td className="border p-1 text-center bg-muted/50 text-[9px]">{we.toFixed(2)}</td>
                      </>
                    )
                  })}

                  {gradeType && (
                    <td className="border p-1 text-center font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[9px]">
                      <div className="flex items-center justify-center gap-1">
                        <Calculator className="h-2 w-2" />
                        {calculateWeightedFinalGrade(student.id).toFixed(2)}
                      </div>
                    </td>
                  )}
                  {isFinalGradeType && (
                    <>
                      {/* TOTAL PERCENTAGE SCORE */}
                      <td className="border p-1 text-center font-bold text-[9px]">
                        {currentGrade.toFixed(2)}
                      </td>
                      {/* FINAL TERM GRADE */}
                      <td className="border p-1 text-center font-bold text-[9px]">
                        {currentGrade.toFixed(1)}
                      </td>
                    </>
                  )}
                  {/* FINAL TERM GRADE column for all grade types */}
                  <td className={cn(
                    "border p-1 text-center font-bold text-[9px]",
                    studentStatusValue === "INC"
                      ? "bg-yellow-100 text-yellow-800"
                      : studentStatusValue === "DROPPED"
                        ? "bg-orange-100 text-orange-800"
                        : (displayGrade >= 1.0 && displayGrade <= 3.0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800")
                  )}>
                    {studentStatusValue === "INC"
                      ? "INC"
                      : studentStatusValue === "DROPPED"
                        ? "DROPPED"
                        : roundToValidGrade(displayGrade).toFixed(2)}
                  </td>
                  {/* REMARKS column for all grade types */}
                  <td className={cn(
                    "border p-1 text-center font-bold text-[9px]",
                    studentStatusValue === "INC"
                      ? "bg-yellow-100 text-yellow-800"
                      : studentStatusValue === "DROPPED"
                        ? "bg-orange-100 text-orange-800"
                        : (displayGrade >= 1.0 && displayGrade <= 3.0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800")
                  )}>
                    {studentStatusValue === "INC"
                      ? "INC"
                      : studentStatusValue === "DROPPED"
                        ? "DROPPED"
                        : (displayGrade >= 1.0 && displayGrade <= 3.0
                            ? "PASSED"
                            : "FAILED")}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Statistics Summary */}
      {(() => {
        const totalStudents = sortedEnrollments.length
        let droppedCount = 0
        let incCount = 0
        let passedCount = 0
        let failedCount = 0

        sortedEnrollments.forEach(enrollment => {
          const studentId = enrollment.student.id
          const studentStatusValue = studentStatus.get(studentId) || 'NORMAL'
          
          if (studentStatusValue === 'DROPPED') {
            droppedCount++
          } else if (studentStatusValue === 'INC') {
            incCount++
          } else {
            const currentGrade = calculateFinalGrade(studentId)
            const overallGrade = calculateOverallFinalGrade(studentId)
            const displayGrade = isFinalGradeType ? overallGrade : currentGrade
            
            if (displayGrade >= 1.0 && displayGrade <= 3.0) {
              passedCount++
            } else {
              failedCount++
            }
          }
        })

        const droppedPercentage = totalStudents > 0 ? ((droppedCount / totalStudents) * 100).toFixed(2) : '0.00'
        const incPercentage = totalStudents > 0 ? ((incCount / totalStudents) * 100).toFixed(2) : '0.00'
        const passedPercentage = totalStudents > 0 ? ((passedCount / totalStudents) * 100).toFixed(2) : '0.00'
        const failedPercentage = totalStudents > 0 ? ((failedCount / totalStudents) * 100).toFixed(2) : '0.00'

        return (
          <div className="mt-6 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-center">Class Statistics Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-white border-2 border-orange-300">
                <div className="text-2xl font-bold text-orange-700">{droppedCount}</div>
                <div className="text-sm text-gray-600">Dropped</div>
                <div className="text-xs font-semibold text-orange-600 mt-1">{droppedPercentage}%</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-white border-2 border-yellow-300">
                <div className="text-2xl font-bold text-yellow-700">{incCount}</div>
                <div className="text-sm text-gray-600">INC</div>
                <div className="text-xs font-semibold text-yellow-600 mt-1">{incPercentage}%</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-white border-2 border-green-300">
                <div className="text-2xl font-bold text-green-700">{passedCount}</div>
                <div className="text-sm text-gray-600">Passed</div>
                <div className="text-xs font-semibold text-green-600 mt-1">{passedPercentage}%</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-white border-2 border-red-300">
                <div className="text-2xl font-bold text-red-700">{failedCount}</div>
                <div className="text-sm text-gray-600">Failed</div>
                <div className="text-xs font-semibold text-red-600 mt-1">{failedPercentage}%</div>
              </div>
            </div>
            <div className="text-center mt-3 text-sm text-gray-600">
              Total Students: <span className="font-bold">{totalStudents}</span>
            </div>
          </div>
        )
      })()}

      {/* INC & DROPPED Summary Table */}
      {enrollments.some(enrollment => {
        const studentId = enrollment.student.id
        const status = studentStatus.get(studentId) || 'NORMAL'
        return status === 'INC' || status === 'DROPPED'
      }) && (
        <div className="mt-8">
          <h3 className="font-bold text-lg mb-2">INC & DROPPED Students</h3>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full border-collapse text-xs min-w-max">
              <thead>
                <tr className="bg-red-100">
                  <th className="border p-2">#</th>
                  <th className="border p-2">LASTNAME</th>
                  <th className="border p-2">FIRSTNAME</th>
                  <th className="border p-2">MI</th>
                  <th className="border p-2">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {enrollments
                  .filter((enrollment) => {
                    const studentId = enrollment.student.id
                    const status = studentStatus.get(studentId) || 'NORMAL'
                    return status === 'INC' || status === 'DROPPED'
                  })
                  .map((enrollment, i) => {
                    const studentId = enrollment.student.id
                    const status = studentStatus.get(studentId) || 'NORMAL'
                    return (
                      <tr
                        key={studentId}
                        className={status === 'INC' ? 'bg-yellow-50' : (status === 'DROPPED' ? 'bg-orange-50' : '')}
                      >
                        <td className="border p-2 text-center">{i + 1}</td>
                        <td className="border p-2">{enrollment.student.lastName.toUpperCase()}</td>
                        <td className="border p-2">{enrollment.student.firstName.toUpperCase()}</td>
                        <td className="border p-2 text-center">{enrollment.student.middleName?.[0]?.toUpperCase() || ""}</td>
                        <td className="border p-2 font-bold text-center">
                          <span className={status === 'INC' ? 'text-yellow-800' : 'text-orange-800'}>{status}</span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </div>
    </div>
  )
}
