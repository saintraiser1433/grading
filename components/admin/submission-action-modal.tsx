"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, AlertCircle } from "lucide-react"
import { approveGradeSubmission, declineGradeSubmission } from "@/lib/actions/grade.actions"

interface SubmissionActionModalProps {
  submissionId: string
  approverId: string
  submission: any
  action: "approve" | "decline"
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubmissionActionModal({
  submissionId,
  approverId,
  submission,
  action,
  open,
  onOpenChange,
}: SubmissionActionModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [comments, setComments] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const isDecline = action === "decline"

  const handleSubmit = async () => {
    // Validate comments for decline
    if (isDecline && !comments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide a reason for declining this submission",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    setIsLoading(true)

    try {
      const result = isDecline
        ? await declineGradeSubmission(submissionId, approverId, comments)
        : await approveGradeSubmission(submissionId, approverId, comments || undefined)

      if (result.success) {
        toast({
          title: isDecline ? "❌ Submission Declined Successfully" : "✅ Submission Approved Successfully",
          description: isDecline
            ? `Grade submission for ${submission.class?.subject?.name || 'Unknown Subject'} has been declined and returned to the teacher for revision.`
            : `Grade submission for ${submission.class?.subject?.name || 'Unknown Subject'} has been approved and grades are now visible to students.`,
          duration: 5000,
        })
        onOpenChange(false)
        setComments("")
        router.refresh()
      } else {
        toast({
          title: isDecline ? "❌ Decline Failed" : "❌ Approval Failed",
          description: result.error || `Failed to ${action} submission. Please try again.`,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      toast({
        title: isDecline ? "❌ Decline Error" : "❌ Approval Error",
        description: `An unexpected error occurred while ${action === "decline" ? "declining" : "approving"} the submission. Please try again.`,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      setComments("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDecline ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                Decline Grade Submission
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Approve Grade Submission
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {isDecline ? (
              <>
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
              </>
            ) : (
              <>
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
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comments">
              {isDecline ? "Decline Comments" : "Approval Comments"} {isDecline && "*"}
            </Label>
            <Textarea
              id="comments"
              placeholder={isDecline ? "Please provide a reason for declining this submission..." : "Add any comments about this grade submission (optional)..."}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              required={isDecline}
            />
            <p className="text-sm text-gray-500">
              {isDecline
                ? "Comments are required when declining a submission. These will be shared with the teacher."
                : "Comments will be visible to the teacher and included in the submission history."}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (isDecline && !comments.trim())}
            className={isDecline ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            {isLoading ? (
              <>
                {isDecline ? "Declining..." : "Approving..."}
              </>
            ) : (
              <>
                {isDecline ? (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Decline Submission
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Submission
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

