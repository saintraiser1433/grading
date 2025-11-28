"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import { SubmissionActionModal } from "./submission-action-modal"

interface SubmissionActionButtonsProps {
  submissionId: string
  approverId: string
  submission: any
}

export function SubmissionActionButtons({
  submissionId,
  approverId,
  submission,
}: SubmissionActionButtonsProps) {
  const [approveOpen, setApproveOpen] = useState(false)
  const [declineOpen, setDeclineOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-4">
        <Button onClick={() => setApproveOpen(true)} className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="mr-2 h-4 w-4" />
          Approve Submission
        </Button>
        <Button
          variant="outline"
          onClick={() => setDeclineOpen(true)}
          className="text-red-600 border-red-600 hover:bg-red-50"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Decline Submission
        </Button>
      </div>

      <SubmissionActionModal
        submissionId={submissionId}
        approverId={approverId}
        submission={submission}
        action="approve"
        open={approveOpen}
        onOpenChange={setApproveOpen}
      />

      <SubmissionActionModal
        submissionId={submissionId}
        approverId={approverId}
        submission={submission}
        action="decline"
        open={declineOpen}
        onOpenChange={setDeclineOpen}
      />
    </>
  )
}

