"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Eye, FileText, Calendar, User, Mail, Phone, MapPin, GraduationCap } from "lucide-react";
import { format } from "date-fns";

interface PendingStudent {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
  address?: string;
  studentId?: string;
  createdAt: Date;
  enrollmentDocuments: {
    id: string;
    fileName: string;
    fileType: string;
    documentType: string;
    uploadedAt: Date;
  }[];
}

interface PendingStudentsTableProps {
  students: PendingStudent[];
  onApprove: (studentId: string) => void;
  onReject: (studentId: string, reason: string) => void;
}

export function PendingStudentsTable({ students, onApprove, onReject }: PendingStudentsTableProps) {
  const [selectedStudent, setSelectedStudent] = useState<PendingStudent | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = (studentId: string) => {
    onApprove(studentId);
  };

  const handleReject = (studentId: string) => {
    if (rejectionReason.trim()) {
      onReject(studentId, rejectionReason);
      setRejectionReason("");
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ENROLLMENT_FORM: "Enrollment Form",
      ID_PHOTO: "ID Photo",
      TRANSCRIPT: "Transcript",
      BIRTH_CERTIFICATE: "Birth Certificate",
      OTHER: "Other"
    };
    return labels[type] || type;
  };

  const getInitials = (firstName: string, lastName: string, middleName?: string) => {
    return `${firstName.charAt(0)}${middleName?.charAt(0) || ''}${lastName.charAt(0)}`.toUpperCase();
  };

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pending Students</h3>
          <p className="text-muted-foreground text-center">
            All student registrations have been processed. New registrations will appear here for review.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Pending Student Registrations
          </CardTitle>
          <CardDescription>
            Review and approve student registration requests. Students must provide enrollment documents for approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="" />
                          <AvatarFallback>
                            {getInitials(student.firstName, student.lastName, student.middleName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {student.firstName} {student.middleName} {student.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {student.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            {student.phone}
                          </div>
                        )}
                        {student.address && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {student.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.studentId ? (
                        <Badge variant="secondary">{student.studentId}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">
                          {student.enrollmentDocuments.length} document{student.enrollmentDocuments.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(student.createdAt), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedStudent(student)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Student Registration Review</DialogTitle>
                              <DialogDescription>
                                Review student information and enrollment documents
                              </DialogDescription>
                            </DialogHeader>
                            {selectedStudent && (
                              <div className="space-y-6">
                                {/* Student Information */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">Student Information</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                      <p className="text-sm">
                                        {selectedStudent.firstName} {selectedStudent.middleName} {selectedStudent.lastName}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                                      <p className="text-sm">{selectedStudent.email}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                                      <p className="text-sm">{selectedStudent.phone || "Not provided"}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Student ID</label>
                                      <p className="text-sm">{selectedStudent.studentId || "Not assigned"}</p>
                                    </div>
                                  </div>
                                  {selectedStudent.address && (
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Address</label>
                                      <p className="text-sm">{selectedStudent.address}</p>
                                    </div>
                                  )}
                                </div>

                                <Separator />

                                {/* Enrollment Documents */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">Enrollment Documents</h3>
                                  {selectedStudent.enrollmentDocuments.length > 0 ? (
                                    <div className="space-y-3">
                                      {selectedStudent.enrollmentDocuments.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                                          <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                              <p className="font-medium">{doc.fileName}</p>
                                              <p className="text-sm text-muted-foreground">
                                                {getDocumentTypeLabel(doc.documentType)} • {doc.fileType}
                                              </p>
                                            </div>
                                          </div>
                                          <Button variant="outline" size="sm">
                                            View
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">No documents uploaded</p>
                                  )}
                                </div>

                                <Separator />

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3">
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleReject(selectedStudent.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button
                                    onClick={() => handleApprove(selectedStudent.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

