import { z } from "zod"

// User Schemas
export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
  studentId: z.string().optional(),
  employeeId: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
})

export const UpdateUserSchema = CreateUserSchema.partial().extend({
  id: z.string(),
})

export const StudentRegistrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  studentId: z.string().min(1, "Student ID is required"),
})

export const ApproveUserSchema = z.object({
  id: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type StudentRegistrationInput = z.infer<typeof StudentRegistrationSchema>
export type ApproveUserInput = z.infer<typeof ApproveUserSchema>

// Enrollment Document Schemas
export const CreateEnrollmentDocumentSchema = z.object({
  userId: z.string(),
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().min(1, "File URL is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().min(1, "File size must be greater than 0"),
  documentType: z.enum(["ENROLLMENT_FORM", "ID_PHOTO", "TRANSCRIPT", "BIRTH_CERTIFICATE", "OTHER"]),
})

export type CreateEnrollmentDocumentInput = z.infer<typeof CreateEnrollmentDocumentSchema>

// Subject Schemas
export const CreateSubjectSchema = z.object({
  code: z.string().min(1, "Subject code is required"),
  name: z.string().min(1, "Subject name is required"),
  description: z.string().optional(),
  units: z.number().min(1).max(5).default(3),
  isOpen: z.boolean().default(false),
  schoolYearId: z.string().optional(),
})

export const UpdateSubjectSchema = CreateSubjectSchema.partial().extend({
  id: z.string(),
})

export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>
export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>

// School Year Schemas
export const CreateSchoolYearSchema = z.object({
  year: z.string().min(1, "Year is required"),
  semester: z.enum(["FIRST", "SECOND", "SUMMER"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(false),
})

export const UpdateSchoolYearSchema = CreateSchoolYearSchema.partial().extend({
  id: z.string(),
})

export type CreateSchoolYearInput = z.infer<typeof CreateSchoolYearSchema>
export type UpdateSchoolYearInput = z.infer<typeof UpdateSchoolYearSchema>

// Class Schemas
export const CreateClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  section: z.string().min(1, "Section is required"),
  isIrregular: z.boolean().default(false),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  schoolYearId: z.string().min(1, "School year is required"),
})

export const UpdateClassSchema = CreateClassSchema.partial().extend({
  id: z.string(),
})

export type CreateClassInput = z.infer<typeof CreateClassSchema>
export type UpdateClassInput = z.infer<typeof UpdateClassSchema>

// Component Definition Schemas
export const CreateComponentDefinitionSchema = z.object({
  criteriaId: z.string().min(1, "Criteria ID is required"),
  name: z.string().min(1, "Component name is required"),
  maxScore: z.number().min(1, "Max score must be at least 1"),
  order: z.number().default(0),
})

export const UpdateComponentDefinitionSchema = CreateComponentDefinitionSchema.partial().extend({
  id: z.string(),
})

export type CreateComponentDefinitionInput = z.infer<typeof CreateComponentDefinitionSchema>
export type UpdateComponentDefinitionInput = z.infer<typeof UpdateComponentDefinitionSchema>

// Enrollment Schemas
export const CreateEnrollmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  subjectId: z.string().min(1, "Subject is required"),
  classId: z.string().min(1, "Class is required"),
  schoolYearId: z.string().min(1, "School year is required"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
})

export type CreateEnrollmentInput = z.infer<typeof CreateEnrollmentSchema>

// Grading Schemas
export const CreateGradingCriteriaSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  name: z.string().min(1, "Criteria name is required"),
  percentage: z.number().min(0).max(100),
  isMidterm: z.boolean().default(true),
  order: z.number().default(0),
})

export const UpdateGradeComponentSchema = z.object({
  gradeId: z.string(),
  criteriaId: z.string(),
  score: z.number().min(0),
  maxScore: z.number().min(1),
})

export type CreateGradingCriteriaInput = z.infer<typeof CreateGradingCriteriaSchema>
export type UpdateGradeComponentInput = z.infer<typeof UpdateGradeComponentSchema>

// DepartmentHead Schemas
export const CreateDepartmentHeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const UpdateDepartmentHeadSchema = CreateDepartmentHeadSchema.partial().extend({
  id: z.string(),
})

export type CreateDepartmentHeadInput = z.infer<typeof CreateDepartmentHeadSchema>
export type UpdateDepartmentHeadInput = z.infer<typeof UpdateDepartmentHeadSchema>

// Department Schemas
export const CreateDepartmentSchema = z.object({
  code: z.string().min(1, "Department code is required"),
  name: z.string().min(1, "Department name is required"),
  description: z.string().optional(),
})

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial().extend({
  id: z.string(),
})

export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>

