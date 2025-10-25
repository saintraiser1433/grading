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
})

export const UpdateUserSchema = CreateUserSchema.partial().extend({
  id: z.string(),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

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

// Enrollment Schemas
export const CreateEnrollmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  subjectId: z.string().min(1, "Subject is required"),
  classId: z.string().optional(),
  schoolYearId: z.string().min(1, "School year is required"),
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

