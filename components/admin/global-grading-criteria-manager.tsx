"use client"

import { useState } from "react"
import { GradeType, GlobalGradingCriteria } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Plus, Edit, Trash2, Percent, CheckCircle2, XCircle, Settings, ToggleLeft, ToggleRight, BookOpen, Target } from "lucide-react"
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
  AlertTitle,
} from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createGradeType,
  updateGradeType,
  deleteGradeType,
  createGlobalCriteria,
  updateGlobalCriteria,
  deleteGlobalCriteria,
  createGlobalComponent,
  updateGlobalComponent,
  deleteGlobalComponent,
} from "@/lib/actions/global-grading.actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/ui/empty-state"

interface GlobalGradingCriteriaManagerProps {
  gradeTypes: GradeType[]
  globalCriteria: (GlobalGradingCriteria & {
    gradeType: GradeType
    componentDefinitions: any[]
  })[]
  schoolYears: SchoolYear[]
  activeSchoolYear: SchoolYear | null
  selectedSchoolYearId: string
}

export function GlobalGradingCriteriaManager({ 
  gradeTypes, 
  globalCriteria,
  schoolYears,
  activeSchoolYear,
  selectedSchoolYearId
}: GlobalGradingCriteriaManagerProps) {
  const [activeTab, setActiveTab] = useState("grade-types")
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSchoolYearChange = (schoolYearId: string) => {
    const params = new URLSearchParams(window.location.search)
    if (schoolYearId === "all") {
      params.delete("schoolYearId")
    } else {
      params.set("schoolYearId", schoolYearId)
    }
    router.push(`/admin/grading-criteria?${params.toString()}`)
  }

  const [gradeTypeForm, setGradeTypeForm] = useState({
    name: "",
    description: "",
    percentage: 0,
    order: 0,
    schoolYearId: "",
  })

  const [criteriaForm, setCriteriaForm] = useState({
    name: "",
    percentage: 0,
    gradeTypeId: "",
    order: 0,
    schoolYearId: "",
  })

  const [componentForm, setComponentForm] = useState({
    name: "",
    maxScore: 0,
    criteriaId: "",
    order: 0,
  })

  // Calculate totals for each grade type
  const gradeTypeTotals = gradeTypes.map(gt => {
    const criteria = globalCriteria.filter(c => c.gradeTypeId === gt.id)
    const total = criteria.reduce((sum, c) => sum + c.percentage, 0)
    return { gradeType: gt, total, isValid: Math.abs(total - 100) < 0.01 }
  })

  const handleOpenDialog = (type: string, item?: any) => {
    setEditingItem(item)
    
    // Determine the school year to use: selected filter or active school year
    const targetSchoolYearId = selectedSchoolYearId !== "all" 
      ? selectedSchoolYearId 
      : (activeSchoolYear?.id || "")
    
    if (type === "grade-type") {
      if (item) {
        setGradeTypeForm({
          name: item.name,
          description: item.description || "",
          order: item.order,
          schoolYearId: item.schoolYearId || targetSchoolYearId,
        })
      } else {
        setGradeTypeForm({
          name: "",
          description: "",
          order: gradeTypes.length,
          schoolYearId: targetSchoolYearId,
        })
      }
    } else if (type === "criteria") {
      if (item) {
        setCriteriaForm({
          name: item.name,
          percentage: item.percentage,
          gradeTypeId: item.gradeTypeId,
          order: item.order,
          schoolYearId: item.schoolYearId || targetSchoolYearId,
        })
      } else {
        setCriteriaForm({
          name: "",
          percentage: 0,
          gradeTypeId: gradeTypes[0]?.id || "",
          order: 0,
          schoolYearId: targetSchoolYearId,
        })
      }
    } else if (type === "component") {
      if (item) {
        setComponentForm({
          name: item.name,
          maxScore: item.maxScore,
          criteriaId: item.criteriaId,
          order: item.order,
        })
      } else {
        setComponentForm({
          name: "",
          maxScore: 0,
          criteriaId: "",
          order: 0,
        })
      }
    }
    
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent, type: string) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (type === "grade-type") {
        // Ensure schoolYearId is set: use form value, selected filter, or active school year
        let targetSchoolYearId = gradeTypeForm.schoolYearId
        if (!targetSchoolYearId || targetSchoolYearId === "") {
          if (selectedSchoolYearId !== "all") {
            targetSchoolYearId = selectedSchoolYearId
          } else if (activeSchoolYear?.id) {
            targetSchoolYearId = activeSchoolYear.id
          } else {
            targetSchoolYearId = ""
          }
        }
        
        const formData = {
          ...gradeTypeForm,
          schoolYearId: targetSchoolYearId || undefined,
        }
        
        const result = editingItem 
          ? await updateGradeType(editingItem.id, formData)
          : await createGradeType(formData)
        
        if (result.success) {
          toast({
            title: "Success",
            description: `Grade type ${editingItem ? 'updated' : 'created'}`,
          })
          setOpen(false)
          router.refresh()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to save",
            variant: "destructive",
          })
        }
      } else if (type === "criteria") {
        // Ensure schoolYearId is set: use form value, selected filter, or active school year
        let targetSchoolYearId = criteriaForm.schoolYearId
        if (!targetSchoolYearId || targetSchoolYearId === "") {
          if (selectedSchoolYearId !== "all") {
            targetSchoolYearId = selectedSchoolYearId
          } else if (activeSchoolYear?.id) {
            targetSchoolYearId = activeSchoolYear.id
          } else {
            targetSchoolYearId = ""
          }
        }
        
        const formData = {
          ...criteriaForm,
          schoolYearId: targetSchoolYearId || undefined,
        }
        
        const result = editingItem 
          ? await updateGlobalCriteria(editingItem.id, formData)
          : await createGlobalCriteria(formData)
        
        if (result.success) {
          toast({
            title: "Success",
            description: `Criteria ${editingItem ? 'updated' : 'created'}`,
          })
          setOpen(false)
          router.refresh()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to save",
            variant: "destructive",
          })
        }
      } else if (type === "component") {
        const result = editingItem 
          ? await updateGlobalComponent(editingItem.id, componentForm)
          : await createGlobalComponent(componentForm)
        
        if (result.success) {
          toast({
            title: "Success",
            description: `Component ${editingItem ? 'updated' : 'created'}`,
          })
          setOpen(false)
          router.refresh()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to save",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const handleToggleActive = async (gradeTypeId: string, currentStatus: boolean) => {
    try {
      const result = await updateGradeType(gradeTypeId, { isActive: !currentStatus })
      
      if (result?.success) {
        toast({
          title: "Success",
          description: `Grade type ${!currentStatus ? 'enabled' : 'disabled'}`,
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result?.error || "Failed to update",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      let result
      if (type === "grade-type") {
        result = await deleteGradeType(id)
      } else if (type === "criteria") {
        result = await deleteGlobalCriteria(id)
      } else if (type === "component") {
        result = await deleteGlobalComponent(id)
      }

      if (result?.success) {
        toast({
          title: "Success",
          description: "Item deleted",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result?.error || "Failed to delete",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* School Year Filter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Label htmlFor="schoolYearFilter">Filter by School Year:</Label>
          <Select
            value={selectedSchoolYearId}
            onValueChange={handleSchoolYearChange}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select school year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All School Years</SelectItem>
              {schoolYears.map((sy) => (
                <SelectItem key={sy.id} value={sy.id}>
                  {sy.year} - {sy.semester}
                  {sy.isActive && " (Active)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grade-types">Grade Types</TabsTrigger>
          <TabsTrigger value="criteria">Grading Criteria</TabsTrigger>
        </TabsList>

        {/* Grade Types Tab */}
        <TabsContent value="grade-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Grade Types
              </CardTitle>
              <CardDescription>
                Define the different types of grades (Midterm, Final, Prelims, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Available Grade Types</h3>
                <Dialog open={open && !editingItem} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog("grade-type")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Grade Type
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>

              {gradeTypes.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No Grade Types"
                  description={`No grade types found for the selected school year. Create your first grade type to get started with grading criteria management.`}
                  action={
                    <Button onClick={() => handleOpenDialog("grade-type")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Grade Type
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-3">
                  {gradeTypes.map((gradeType) => (
                    <div
                      key={gradeType.id}
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                        !gradeType.isActive ? 'opacity-60 bg-muted/30' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{gradeType.name}</p>
                          <Badge variant="outline">{gradeType.percentage}%</Badge>
                          <Badge variant={gradeType.isActive ? "default" : "secondary"}>
                            {gradeType.isActive ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                        {gradeType.description && (
                          <p className="text-sm text-muted-foreground">{gradeType.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Order: {gradeType.order}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(gradeType.id, gradeType.isActive)}
                          title={gradeType.isActive ? "Disable" : "Enable"}
                        >
                          {gradeType.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog("grade-type", gradeType)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete("grade-type", gradeType.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grading Criteria Tab */}
        <TabsContent value="criteria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Global Grading Criteria
              </CardTitle>
              <CardDescription>
                Set grading criteria that apply to all subjects for each grade type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Percentage Status */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {gradeTypeTotals.map(({ gradeType, total, isValid }) => (
                  <Alert key={gradeType.id} variant={isValid ? "default" : "destructive"}>
                    <div className="flex items-center gap-2">
                      {isValid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      <AlertTitle>{gradeType.name}</AlertTitle>
                    </div>
                    <AlertDescription className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{total.toFixed(1)}%</span>
                        <span className="text-sm text-muted-foreground">/ 100%</span>
                      </div>
                      {!isValid && (
                        <p className="text-sm mt-2">
                          {total > 100 ? "Exceeds" : "Below"} 100%. Adjust percentages to equal 100%.
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Grading Criteria by Type</h3>
                <Dialog open={open && !editingItem} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog("criteria")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Criteria
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>

              {globalCriteria.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="No Grading Criteria"
                  description="Set up grading criteria for different grade types to define how grades are calculated."
                  action={
                    <Button onClick={() => setOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Criteria
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {gradeTypes.map((gradeType) => {
                    const typeCriteria = globalCriteria.filter(c => c.gradeTypeId === gradeType.id)
                    return (
                      <div key={gradeType.id} className="space-y-2">
                        <h4 className="font-semibold text-lg">{gradeType.name}</h4>
                        {typeCriteria.length === 0 ? (
                          <p className="text-sm text-muted-foreground ml-4">No criteria for this type</p>
                        ) : (
                          <div className="grid gap-3 ml-4">
                            {typeCriteria.map((criterion) => (
                              <div
                                key={criterion.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Percent className="h-5 w-5 text-primary" />
                                  <div>
                                    <p className="font-medium">{criterion.name}</p>
                                    <p className="text-sm text-muted-foreground">Order: {criterion.order}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="text-base font-semibold">
                                    {criterion.percentage}%
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenDialog("criteria", criterion)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete("criteria", criterion.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Dialog for Add/Edit */}
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit" : "Add"} {activeTab === "grade-types" ? "Grade Type" : "Grading Criteria"}
              </DialogTitle>
              <DialogDescription>
                {activeTab === "grade-types" 
                  ? "Define a new grade type like Midterm, Final, or Prelims"
                  : "Add a category like Quizzes, Class Standing, Projects, or Major Exam"
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => handleSubmit(e, activeTab === "grade-types" ? "grade-type" : "criteria")} className="space-y-4">
              {activeTab === "grade-types" && (
                <>
                  <div>
                    <Label htmlFor="name">Grade Type Name</Label>
                    <Input
                      id="name"
                      value={gradeTypeForm.name}
                      onChange={(e) => setGradeTypeForm({ ...gradeTypeForm, name: e.target.value })}
                      placeholder="e.g., Midterm, Final, Prelims"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={gradeTypeForm.description}
                      onChange={(e) => setGradeTypeForm({ ...gradeTypeForm, description: e.target.value })}
                      placeholder="Brief description of this grade type"
                    />
                  </div>
                  <div>
                    <Label htmlFor="percentage">Weight Percentage</Label>
                    <Input
                      id="percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={gradeTypeForm.percentage}
                      onChange={(e) => setGradeTypeForm({ ...gradeTypeForm, percentage: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g., 20, 30, 50"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Percentage weight for final grade calculation (e.g., Prelims 20%, Midterm 30%, Final 50%)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      min="0"
                      value={gradeTypeForm.order}
                      onChange={(e) => setGradeTypeForm({ ...gradeTypeForm, order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="schoolYear">School Year</Label>
                    <Select
                      value={gradeTypeForm.schoolYearId || "auto"}
                      onValueChange={(value) => setGradeTypeForm({ ...gradeTypeForm, schoolYearId: value === "auto" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select school year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Use Active School Year (Auto)</SelectItem>
                        {schoolYears.map((sy) => (
                          <SelectItem key={sy.id} value={sy.id}>
                            {sy.year} - {sy.semester}
                            {sy.isActive && " (Active)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedSchoolYearId !== "all" 
                        ? `Currently filtered by: ${schoolYears.find(sy => sy.id === selectedSchoolYearId)?.year} - ${schoolYears.find(sy => sy.id === selectedSchoolYearId)?.semester}. New grade type will be assigned to this school year.`
                        : "Will use active school year if 'Auto' is selected"}
                    </p>
                  </div>
                </>
              )}

              {activeTab === "criteria" && (
                <>
                  <div>
                    <Label htmlFor="name">Criteria Name</Label>
                    <Input
                      id="name"
                      value={criteriaForm.name}
                      onChange={(e) => setCriteriaForm({ ...criteriaForm, name: e.target.value })}
                      placeholder="e.g., Quizzes, Projects, Major Exam"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="percentage">Percentage (%)</Label>
                    <Input
                      id="percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={criteriaForm.percentage || ""}
                      onChange={(e) => setCriteriaForm({ ...criteriaForm, percentage: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g., 40"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gradeTypeId">Grade Type</Label>
                    <select
                      id="gradeTypeId"
                      value={criteriaForm.gradeTypeId}
                      onChange={(e) => setCriteriaForm({ ...criteriaForm, gradeTypeId: e.target.value })}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      required
                    >
                      <option value="">Select Grade Type</option>
                      {gradeTypes.map((gt) => (
                        <option key={gt.id} value={gt.id}>{gt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      min="0"
                      value={criteriaForm.order}
                      onChange={(e) => setCriteriaForm({ ...criteriaForm, order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </>
              )}


              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Saving..." : editingItem ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
