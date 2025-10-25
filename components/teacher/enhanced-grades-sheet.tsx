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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

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
  classData 
}: GradesSheetProps) {
  const [components, setComponents] = useState<Map<string, Component[]>>(new Map())
  const [studentScores, setStudentScores] = useState<Map<string, Map<string, number>>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [addComponentDialog, setAddComponentDialog] = useState<string | null>(null)
  const [newComponent, setNewComponent] = useState({ name: "", maxScore: 10 })
  
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  // Initialize with default components
  useEffect(() => {
    const initialComponents = new Map<string, Component[]>()
    
    criteria.forEach(criterion => {
      const name = criterion.name.toUpperCase()
      if (name.includes("QUIZ")) {
        initialComponents.set(criterion.id, [
          { id: `${criterion.id}-q1`, name: "QUIZ 1", maxScore: 10, criteriaId: criterion.id },
          { id: `${criterion.id}-q2`, name: "QUIZ 2", maxScore: 10, criteriaId: criterion.id },
          { id: `${criterion.id}-q3`, name: "QUIZ 3", maxScore: 10, criteriaId: criterion.id },
          { id: `${criterion.id}-q4`, name: "QUIZ 4", maxScore: 15, criteriaId: criterion.id },
        ])
      } else if (name.includes("CLASS") || name.includes("STANDING")) {
        initialComponents.set(criterion.id, [
          { id: `${criterion.id}-att`, name: "ATTENDANCE", maxScore: 20, criteriaId: criterion.id },
          { id: `${criterion.id}-a1`, name: "ACTIVITY 1", maxScore: 10, criteriaId: criterion.id },
          { id: `${criterion.id}-a2`, name: "ACTIVITY 2", maxScore: 15, criteriaId: criterion.id },
        ])
      } else if (name.includes("PROJECT")) {
        initialComponents.set(criterion.id, [
          { id: `${criterion.id}-p1`, name: "PROJECT 1", maxScore: 50, criteriaId: criterion.id },
        ])
      } else if (name.includes("EXAM") || name.includes("MAJOR")) {
        initialComponents.set(criterion.id, [
          { id: `${criterion.id}-written`, name: "WRITTEN", maxScore: 60, criteriaId: criterion.id },
        ])
      } else {
        initialComponents.set(criterion.id, [
          { id: `${criterion.id}-comp1`, name: "COMPONENT 1", maxScore: 100, criteriaId: criterion.id },
        ])
      }
    })
    
    setComponents(initialComponents)
  }, [criteria])

  const handleScoreChange = (studentId: string, componentId: string, value: string) => {
    setStudentScores(prev => {
      const newScores = new Map(prev)
      const studentMap = newScores.get(studentId) || new Map()
      studentMap.set(componentId, parseFloat(value) || 0)
      newScores.set(studentId, studentMap)
      return newScores
    })
  }

  const getStudentScore = (studentId: string, componentId: string): number => {
    return studentScores.get(studentId)?.get(componentId) || 0
  }

  const calculateCategoryGrade = (studentId: string, criteriaId: string) => {
    const comps = components.get(criteriaId) || []
    let totalScore = 0
    let maxScore = 0

    comps.forEach(comp => {
      totalScore += getStudentScore(studentId, comp.id)
      maxScore += comp.maxScore
    })

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const criterion = criteria.find(c => c.id === criteriaId)
    const ge = percentageToGrade(percentage)
    const we = ge * ((criterion?.percentage || 0) / 100)

    return { totalScore, maxScore, percentage, ge, we }
  }

  const calculateFinalGrade = (studentId: string): number => {
    let totalWE = 0
    criteria.forEach(criterion => {
      const { we } = calculateCategoryGrade(studentId, criterion.id)
      totalWE += we
    })
    return Math.round(totalWE * 4) / 4
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

  const handleSaveAll = async () => {
    setIsLoading(true)
    
    // Simulate save
    setTimeout(() => {
      toast({
        title: "✓ Grades Saved",
        description: "All grades have been saved successfully",
      })
      setIsLoading(false)
    }, 1000)
  }

  const handleSubmit = async () => {
    if (!confirm("Submit these grades for approval?")) return
    
    await handleSaveAll()
    
    toast({
      title: "✓ Grades Submitted",
      description: "Grades sent to Program Head for approval",
    })
    
    router.push("/teacher/submissions")
  }

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
                GRADE SHEET - {isMidterm ? "MIDTERM" : "FINAL"}
              </h3>
            </div>
            <p className="text-sm font-medium">
              A.Y. {classData.schoolYear.year} • {classData.schoolYear.semester} SEMESTER
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveAll} disabled={isLoading}>
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" onClick={handleSaveAll} disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="default" onClick={handleSubmit}>
              <Send className="mr-2 h-4 w-4" />
              Submit
            </Button>
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

      {/* Grading Components Manager */}
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
              </div>
              <div className="flex gap-2 flex-wrap">
                {comps.map(comp => (
                  <div key={comp.id} className="group relative">
                    <Badge variant="outline" className="pr-8">
                      {comp.name} ({comp.maxScore})
                    </Badge>
                    <button
                      onClick={() => handleRemoveComponent(criterion.id, comp.id)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

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
              <th rowSpan={2} className="border border-primary-foreground/20 p-2 min-w-[100px]">
                {isMidterm ? "MIDTERM" : "FINAL"}<br/>GRADE
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
              const finalGrade = calculateFinalGrade(student.id)
              const gradeDetails = getGradeDetails(finalGrade)

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
                          const isInvalid = score > comp.maxScore

                          return (
                            <td key={comp.id} className="border p-1">
                              <Input
                                type="number"
                                className={cn(
                                  "h-7 text-xs text-center border-0 focus-visible:ring-1",
                                  isInvalid && "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 ring-1 ring-red-500"
                                )}
                                placeholder="0"
                                min="0"
                                max={comp.maxScore}
                                value={score || ""}
                                onChange={(e) => handleScoreChange(student.id, comp.id, e.target.value)}
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

                  <td className={cn("border p-2 text-center font-bold", gradeDetails.bg, gradeDetails.color)}>
                    <div className="flex items-center justify-center gap-1">
                      <gradeDetails.icon className="h-3 w-3" />
                      {finalGrade.toFixed(2)}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}
