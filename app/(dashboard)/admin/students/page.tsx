import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { StudentsPageClient } from "@/components/admin/students-page-client";
import { getPendingStudents, getApprovedStudents, getRejectedStudents, approveStudent, rejectStudent } from "@/lib/actions/student-registration.actions";

export default async function AdminStudentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch real data from database
  const pendingStudentsResult = await getPendingStudents();
  const approvedStudentsResult = await getApprovedStudents();
  const rejectedStudentsResult = await getRejectedStudents();

  const pendingStudents = pendingStudentsResult.success ? pendingStudentsResult.data || [] : [];
  const approvedStudents = approvedStudentsResult.success ? approvedStudentsResult.data || [] : [];
  const rejectedStudents = rejectedStudentsResult.success ? rejectedStudentsResult.data || [] : [];


  const handleApprove = async (studentId: string) => {
    "use server";
    try {
      const result = await approveStudent(studentId, session.user.id);
      if (result.success) {
        console.log("Student approved successfully:", studentId);
      } else {
        console.error("Failed to approve student:", result.error);
      }
    } catch (error) {
      console.error("Error approving student:", error);
    }
  };

  const handleReject = async (studentId: string, reason: string) => {
    "use server";
    try {
      const result = await rejectStudent(studentId, reason, session.user.id);
      if (result.success) {
        console.log("Student rejected successfully:", studentId);
      } else {
        console.error("Failed to reject student:", result.error);
      }
    } catch (error) {
      console.error("Error rejecting student:", error);
    }
  };

  return (
    <StudentsPageClient
      pendingStudents={pendingStudents}
      approvedStudents={approvedStudents}
      rejectedStudents={rejectedStudents}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}