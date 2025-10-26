"use client"

import { useState } from "react"
import { GlobalGradingCriteria } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Settings, BookOpen } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createComponent,
  updateComponent,
  deleteComponent,
} from "@/lib/actions/teacher-grading.actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface GradingComponentsManagerProps {
  globalCriteria: (GlobalGradingCriteria & {
    gradeType: any
    componentDefinitions: any[]
  })[]
}

export function GradingComponentsManager({ globalCriteria }: GradingComponentsManagerProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [open, setOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const [componentForm, setComponentForm] = useState({
    name: "",
    maxScore: 0,
    criteriaId: "",
    order: 0,
  })

  const handleOpenDialog = (component?: any, criteriaId?: string) => {
    if (component) {
      setEditingComponent(component)
      setComponentForm({
        name: component.name,
        maxScore: component.maxScore,
        criteriaId: component.criteriaId,
        order: component.order,
      })
    } else {
      setEditingComponent(null)
      setComponentForm({
        name: "",
        maxScore: 0,
        criteriaId: criteriaId || "",
        order: 0,
      })
    }
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = editingComponent 
        ? await updateComponent(editingComponent.id, componentForm)
        : await createComponent(componentForm)
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Component ${editingComponent ? 'updated' : 'created'}`,
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
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this component?")) return

    try {
      const result = await deleteComponent(id)

      if (result.success) {
        toast({
          title: "Success",
          description: "Component deleted",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete",
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Grading Components Overview
              </CardTitle>
              <CardDescription>
                View and manage grading components within global criteria set by administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {globalCriteria.map((criteria) => (
                  <div key={criteria.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">
                        {criteria.name} ({criteria.percentage}%) - {criteria.gradeType.name}
                      </h4>
                      <Badge variant="outline">
                        {criteria.componentDefinitions.length} components
                      </Badge>
                    </div>
                    {criteria.componentDefinitions.length === 0 ? (
                      <p className="text-sm text-muted-foreground ml-4">No components added yet</p>
                    ) : (
                      <div className="grid gap-2 ml-4">
                        {criteria.componentDefinitions.map((component) => (
                          <div
                            key={component.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Settings className="h-4 w-4 text-primary" />
                              <div>
                                <p className="font-medium">{component.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Max Score: {component.maxScore} | Order: {component.order}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(component)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(component.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Add Grading Components
              </CardTitle>
              <CardDescription>
                Add specific components like Quiz 1, Activity 2, Attendance, etc. within the global criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {globalCriteria.map((criteria) => (
                  <div key={criteria.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">
                        {criteria.name} ({criteria.percentage}%) - {criteria.gradeType.name}
                      </h4>
                      <Dialog open={open && componentForm.criteriaId === criteria.id} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={() => handleOpenDialog(undefined, criteria.id)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Component
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>
                    {criteria.componentDefinitions.length === 0 ? (
                      <p className="text-sm text-muted-foreground ml-4">No components added yet</p>
                    ) : (
                      <div className="grid gap-2 ml-4">
                        {criteria.componentDefinitions.map((component) => (
                          <div
                            key={component.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Settings className="h-4 w-4 text-primary" />
                              <div>
                                <p className="font-medium">{component.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Max Score: {component.maxScore} | Order: {component.order}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(component)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(component.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Add/Edit Component */}
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingComponent ? "Edit" : "Add"} Component
              </DialogTitle>
              <DialogDescription>
                Add a specific component like Quiz 1, Activity 2, or Attendance within the selected criteria
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Component Name</Label>
                <Input
                  id="name"
                  value={componentForm.name}
                  onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                  placeholder="e.g., Quiz 1, Activity 2, Attendance"
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxScore">Maximum Score</Label>
                <Input
                  id="maxScore"
                  type="number"
                  min="0"
                  step="0.1"
                  value={componentForm.maxScore || ""}
                  onChange={(e) => setComponentForm({ ...componentForm, maxScore: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 10, 15, 20"
                  required
                />
              </div>
              <div>
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={componentForm.order}
                  onChange={(e) => setComponentForm({ ...componentForm, order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Saving..." : editingComponent ? "Update" : "Create"}
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

