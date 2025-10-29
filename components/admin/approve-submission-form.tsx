"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { CheckCircle, AlertCircle } from "lucide-react"
import { approveGradeSubmission, declineGradeSubmission } from "@/lib/actions/grade.actions"

interface ApproveSubmissionFormProps {
  submissionId: string
  approverId: string
  submission: any
}

export function ApproveSubmissionForm({ submissionId, approverId, submission }: ApproveSubmissionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [comments, setComments] = useState("")
  const [action, setAction] = useState<"approve" | "decline" | null>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleApproveClick = () => {
    setShowApproveDialog(true)
  }

  const handleApprove = async () => {
    setIsLoading(true)
    setAction("approve")
    setShowApproveDialog(false)
    
    try {
      const result = await approveGradeSubmission(submissionId, approverId, comments || undefined)
      
      if (result.success) {
        toast({
          title: "✅ Submission Approved Successfully",
          description: `Grade submission for ${submission.class?.subject?.name || 'Unknown Subject'} has been approved and grades are now visible to students.`,
          duration: 5000,
        })
        router.push("/admin/submissions")
      } else {
        toast({
          title: "❌ Approval Failed",
          description: result.error || "Failed to approve submission. Please try again.",
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      toast({
        title: "❌ Approval Error",
        description: "An unexpected error occurred while approving the submission. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
      setAction(null)
    }
  }

  const handleDeclineClick = () => {
    if (!comments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide a reason for declining this submission",
        variant: "destructive",
        duration: 5000,
      })
      return
    }
    setShowDeclineDialog(true)
  }

  const handleDecline = async () => {
    setIsLoading(true)
    setAction("decline")
    setShowDeclineDialog(false)
    
    try {
      const result = await declineGradeSubmission(submissionId, approverId, comments)
      
      if (result.success) {
        toast({
          title: "❌ Submission Declined Successfully",
          description: `Grade submission for ${submission.class?.subject?.name || 'Unknown Subject'} has been declined and returned to the teacher for revision.`,
          duration: 5000,
        })
        router.push("/admin/submissions")
      } else {
        toast({
          title: "❌ Decline Failed",
          description: result.error || "Failed to decline submission. Please try again.",
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      toast({
        title: "❌ Decline Error",
        description: "An unexpected error occurred while declining the submission. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
      setAction(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Approve Grade Submission
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">
                Ready to Approve
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Once approved, these grades will be visible to students and included in their grade calculations.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comments">Approval Comments (Optional)</Label>
          <Textarea
            id="comments"
            placeholder="Add any comments about this grade submission..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
          />
          <p className="text-sm text-gray-500">
            Comments will be visible to the teacher and included in the submission history.
          </p>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
            <AlertDialogTrigger asChild>
              <Button
                onClick={handleApproveClick}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isLoading && action === "approve" ? "Approving..." : "Approve Submission"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Approve Grade Submission
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  Are you sure you want to approve this grade submission?
                  <br /><br />
                  <span className="text-sm text-gray-600">
                    • This will make the grades visible to students
                    <br />
                    • Grades will be included in student grade calculations
                    <br />
                    • The teacher will be notified of the approval
                    <br />
                    • This action cannot be undone
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowApproveDialog(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isLoading ? "Approving..." : "Approve Submission"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                onClick={handleDeclineClick}
                disabled={isLoading}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                {isLoading && action === "decline" ? "Declining..." : "Decline Submission"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Decline Grade Submission
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  Are you sure you want to decline this grade submission?
                  <br /><br />
                  <span className="text-sm text-gray-600">
                    • This will return the submission to the teacher for revision
                    <br />
                    • The teacher will be notified and can resubmit after making changes
                    <br />
                    • Students will not see these grades until resubmitted and approved
                    <br />
                    • Your comments will be shared with the teacher
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeclineDialog(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDecline}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isLoading}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {isLoading ? "Declining..." : "Decline Submission"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {action === "decline" && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200">
                  Declining Submission
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  This will return the submission to the teacher for revision. The teacher will be notified and can resubmit after making changes.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
