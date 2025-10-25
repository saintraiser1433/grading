"use client"

import { useState } from "react"
import { GradingCriteria } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Plus, Edit, Trash2, Percent, CheckCircle2, XCircle } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import {
  createGradingCriteria,
  updateGradingCriteria,
  deleteGradingCriteria,
} from "@/lib/actions/grade.actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface GradingCriteriaManagerProps {
  classId: string
  criteria: GradingCriteria[]
}

export function EnhancedGradingCriteriaManager({ classId, criteria }: GradingCriteriaManagerProps) {
  const [open, setOpen] = useState(false)
  const [editingCriteria, setEditingCriteria] = useState<GradingCriteria | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    percentage: 0,
    isMidterm: true,
    order: 0,
  })

  // Calculate total percentage for midterm and final separately
  const midtermCriteria = criteria.filter(c => c.isMidterm)
  const finalCriteria = criteria.filter(c => !c.isMidterm)
  
  const midtermTotal = midtermCriteria.reduce((sum, c) => sum + c.percentage, 0)
  const finalTotal = finalCriteria.reduce((sum, c) => sum + c.percentage, 0)
  
  const midtermValid = Math.abs(midtermTotal - 100) < 0.01
  const finalValid = Math.abs(finalTotal - 100) < 0.01

  const handleOpenDialog = (criteria?: GradingCriteria) => {
    if (criteria) {
      setEditingCriteria(criteria)
      setFormData({
        name: criteria.name,
        percentage: criteria.percentage,
        isMidterm: criteria.isMidterm,
        order: criteria.order,
      })
    } else {
      setEditingCriteria(null)
      setFormData({
        name: "",
        percentage: 0,
        isMidterm: true,
        order: criteria.length,
      })
    }
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Calculate what the total would be with this change
    const currentPeriodCriteria = formData.isMidterm ? midtermCriteria : finalCriteria
    const otherCriteria = currentPeriodCriteria.filter(c => c.id !== editingCriteria?.id)
    const newTotal = otherCriteria.reduce((sum, c) => sum + c.percentage, 0) + formData.percentage

    if (Math.abs(newTotal - 100) > 0.01 && formData.percentage > 0) {
      toast({
        title: "Invalid Percentage",
        description: `Total percentage for ${formData.isMidterm ? 'midterm' : 'final'} would be ${newTotal.toFixed(1)}%. Must equal 100%`,
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (editingCriteria) {
      const result = await updateGradingCriteria(editingCriteria.id, formData)
      if (result.success) {
        toast({
          title: "Success",
          description: "Grading criteria updated",
        })
        setOpen(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update",
          variant: "destructive",
        })
      }
    } else {
      const result = await createGradingCriteria({
        ...formData,
        classId,
      })
      if (result.success) {
        toast({
          title: "Success",
          description: "Grading criteria created",
        })
        setOpen(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create",
          variant: "destructive",
        })
      }
    }

    setIsLoading(false)
  }

  const handleDelete = async (id: string, isMidterm: boolean) => {
    if (!confirm("Are you sure you want to delete this criteria?")) return

    const result = await deleteGradingCriteria(id)

    if (result.success) {
      toast({
        title: "Success",
        description: "Grading criteria deleted",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Percentage Status */}
      <div className="grid md:grid-cols-2 gap-4">
        <Alert variant={midtermValid ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {midtermValid ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <AlertTitle>Midterm Criteria</AlertTitle>
          </div>
          <AlertDescription className="mt-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{midtermTotal.toFixed(1)}%</span>
              <span className="text-sm text-muted-foreground">/ 100%</span>
            </div>
            {!midtermValid && (
              <p className="text-sm mt-2">
                {midtermTotal > 100 ? "Exceeds" : "Below"} 100%. Adjust percentages to equal 100%.
              </p>
            )}
          </AlertDescription>
        </Alert>

        <Alert variant={finalValid ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {finalValid ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <AlertTitle>Final Criteria</AlertTitle>
          </div>
          <AlertDescription className="mt-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{finalTotal.toFixed(1)}%</span>
              <span className="text-sm text-muted-foreground">/ 100%</span>
            </div>
            {!finalValid && (
              <p className="text-sm mt-2">
                {finalTotal > 100 ? "Exceeds" : "Below"} 100%. Adjust percentages to equal 100%.
              </p>
            )}
          </AlertDescription>
        </Alert>
      </div>

      {/* Midterm Criteria */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            📝 Midterm Grading Criteria
            {midtermValid && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          </h3>
          <Dialog open={open && formData.isMidterm} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setFormData({ ...formData, isMidterm: true })
                handleOpenDialog()
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Midterm Criteria
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {midtermCriteria.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-muted/50">
            <p className="text-muted-foreground">No midterm criteria yet. Add your first one!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {midtermCriteria.map((criterion) => (
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
                    onClick={() => handleOpenDialog(criterion)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(criterion.id, true)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Final Criteria */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            📋 Final Grading Criteria
            {finalValid && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          </h3>
          <Dialog open={open && !formData.isMidterm} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setFormData({ ...formData, isMidterm: false })
                handleOpenDialog()
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Final Criteria
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {finalCriteria.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-muted/50">
            <p className="text-muted-foreground">No final criteria yet. Add your first one!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {finalCriteria.map((criterion) => (
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
                    onClick={() => handleOpenDialog(criterion)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(criterion.id, false)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog for Add/Edit */}
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCriteria ? "Edit" : "Add"} Grading Criteria
              </DialogTitle>
              <DialogDescription>
                Add a category like Quizzes, Class Standing, Projects, or Major Exam
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Criteria Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  value={formData.percentage || ""}
                  onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 40"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Total must equal 100%. Current {formData.isMidterm ? 'midterm' : 'final'}: {(formData.isMidterm ? midtermTotal : finalTotal).toFixed(1)}%
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isMidterm"
                  checked={formData.isMidterm}
                  onCheckedChange={(checked) => setFormData({ ...formData, isMidterm: checked })}
                />
                <Label htmlFor="isMidterm">
                  {formData.isMidterm ? "Midterm Period" : "Final Period"}
                </Label>
              </div>

              <div>
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Saving..." : editingCriteria ? "Update" : "Create"}
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

