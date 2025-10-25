# 📊 Grade Sheet Implementation - Excel Format

## Overview

This document outlines the implementation to match the Glan Institute of Technology grade sheet format based on the Excel file provided.

---

## 🎯 Key Requirements

### 1. Class Information (Header)
When creating a class, include:
- ✅ **Instructor** - Teacher's name
- ✅ **Department Head** - Name of department head
- ✅ **VP for Academics** - Name of VP for Academics  
- ✅ **Subject Code** - e.g., "CS THESIS 1"
- ✅ **Description** - e.g., "CS THESIS WRITING 1"
- ✅ **Units** - e.g., 3
- ✅ **Course & Section** - e.g., "BSCS 4 - SECTION A"
- ✅ **Day & Time** - e.g., "TUE - THU (11:30 - 2:30 PM | C201)"
- ✅ **Size** - Number of students (e.g., 39)
- ✅ **Academic Year** - e.g., "2025-2026"
- ✅ **Semester** - e.g., "1ST SEMESTER"
- ✅ **Department Name** - e.g., "COMPUTER STUDIES DEPARTMENT"

### 2. Grading Structure

#### **Three Main Categories:**

1. **QUIZZES (40%)**
   - Dynamic components: Quiz 1, Quiz 2, Quiz 3, Quiz 4...
   - Each with its own max score (10, 10, 10, 15, etc.)
   - Calculates: TOTAL → GE (Grade Equivalent) → WE (Weighted Equivalent)

2. **CLASS STANDING (20%)**
   - Dynamic components: Attendance, Activity 1, Activity 2...
   - Each with its own max score (20, 10, 15, etc.)
   - Calculates: TOTAL → GE → WE

3. **MAJOR EXAM (40%)**
   - Written exam component
   - Max score (e.g., 60)
   - Calculates: TOTAL → GE → WE

#### **Final Grade Calculation:**
- Sum all WE (Weighted Equivalents)
- Convert to **1.0 - 5.0 scale** (Filipino grading system)
- **1.0 = Highest**, **5.0 = Lowest/Failed**
- **Passing grade**: Usually 3.0 or better

---

## 📐 Grading Scale (1.0 - 5.0)

```
1.0   = 98-100%  (Excellent)
1.25  = 95-97%   (Excellent)
1.5   = 92-94%   (Very Good)
1.75  = 89-91%   (Very Good)
2.0   = 86-88%   (Good)
2.25  = 83-85%   (Good)
2.5   = 80-82%   (Satisfactory)
2.75  = 77-79%   (Satisfactory)
3.0   = 75-76%   (Passing)
5.0   = Below 75% (Failed)
INC   = Incomplete
DRP   = Dropped
```

---

## 🗄️ Database Schema Changes

### New Models:

1. **Department**
   - Code, Name, Description
   - Links to Subjects and Classes

2. **ComponentDefinition** (New)
   - Defines each gradable item (Quiz 1, Activity 2, etc.)
   - Belongs to a GradingCriteria
   - Has name, maxScore, order

3. **ComponentScore** (New)
   - Individual student scores for each component
   - Links Grade to ComponentDefinition
   - Stores the actual score

### Updated Models:

4. **Class**
   - Added: dayAndTime, room, classSize
   - Added: departmentHead, vpAcademics
   - Added: departmentId relation

5. **Subject**
   - Added: departmentId relation

6. **GradingCriteria**
   - Now has many ComponentDefinitions

---

## 🔄 Data Flow

### Setting up a Class:

```
1. Admin/Teacher creates Class
   └─> Fill in all class information (instructor, dept head, schedule, etc.)

2. Teacher defines Grading Criteria
   └─> Create: QUIZZES (40%), CLASS STANDING (20%), MAJOR EXAM (40%)

3. For each Criteria, add Components
   QUIZZES (40%):
     └─> Add: Quiz 1 (max: 10)
     └─> Add: Quiz 2 (max: 10)
     └─> Add: Quiz 3 (max: 10)
     └─> Add: Quiz 4 (max: 15)
   
   CLASS STANDING (20%):
     └─> Add: Attendance (max: 20)
     └─> Add: Activity 1 (max: 10)
     └─> Add: Activity 2 (max: 15)
   
   MAJOR EXAM (40%):
     └─> Add: Written (max: 60)

4. Students enroll in the class

5. Teacher enters scores for each component
   └─> For each student, enter score for each component
   └─> System automatically calculates:
       - Category totals
       - Grade Equivalents (GE)
       - Weighted Equivalents (WE)
       - Final grade (1.0 - 5.0 scale)
```

---

## 🎨 UI Components Needed

### 1. Enhanced Class Form
- All metadata fields (dept head, VP, schedule, room, etc.)
- Department selection
- Class size input

### 2. Dynamic Grading Criteria Manager
- Add/remove grading categories
- Set percentage for each category
- Add/remove components within each category
- Set max score for each component
- Drag-and-drop to reorder

### 3. Grade Entry Spreadsheet
- Table view matching Excel format
- Columns: Student info → Category 1 components → Category 2 components → etc.
- Auto-calculate totals, GE, WE
- Show final grade in 1.0-5.0 scale
- Color coding for pass/fail

### 4. Grade Calculation Display
```
Example for one student:

QUIZZES (40%):
  Quiz 1: 10/10
  Quiz 2: 5/10
  Quiz 3: 10/10
  Quiz 4: 5/15
  TOTAL: 30/45 = 66.67%
  GE: 2.7
  WE: 2.7 × 0.4 = 1.08

CLASS STANDING (20%):
  Attendance: 15/20
  Activity 1: 10/10
  Activity 2: 10/15
  TOTAL: 35/45 = 77.78%
  GE: 1.2
  WE: 1.2 × 0.2 = 0.24

MAJOR EXAM (40%):
  Written: 50/60 = 83.33%
  GE: 0.4
  WE: 0.4 × 0.4 = 0.16

MIDTERM GRADE: 1.08 + 0.24 + 0.16 = 1.48 (rounded to 1.5)
```

---

## 🔢 Grade Calculation Functions

### 1. Calculate Percentage
```typescript
function calculatePercentage(score: number, maxScore: number): number {
  return (score / maxScore) * 100
}
```

### 2. Convert Percentage to Grade Equivalent (1.0-5.0)
```typescript
function percentageToGrade(percentage: number): number {
  if (percentage >= 98) return 1.0
  if (percentage >= 95) return 1.25
  if (percentage >= 92) return 1.5
  if (percentage >= 89) return 1.75
  if (percentage >= 86) return 2.0
  if (percentage >= 83) return 2.25
  if (percentage >= 80) return 2.5
  if (percentage >= 77) return 2.75
  if (percentage >= 75) return 3.0
  return 5.0 // Failed
}
```

### 3. Calculate Category Grade
```typescript
function calculateCategoryGrade(
  componentScores: Array<{ score: number; maxScore: number }>,
  categoryPercentage: number
): { total: number; ge: number; we: number } {
  const totalScore = componentScores.reduce((sum, c) => sum + c.score, 0)
  const totalMax = componentScores.reduce((sum, c) => sum + c.maxScore, 0)
  const percentage = (totalScore / totalMax) * 100
  const ge = percentageToGrade(percentage)
  const we = ge * (categoryPercentage / 100)
  
  return { total: totalScore, ge, we }
}
```

### 4. Calculate Final Grade
```typescript
function calculateFinalGrade(
  categories: Array<{ we: number }>
): { grade: number; remarks: string } {
  const totalWE = categories.reduce((sum, cat) => sum + cat.we, 0)
  const grade = Math.round(totalWE * 4) / 4 // Round to nearest 0.25
  const remarks = grade <= 3.0 ? "PASSED" : "FAILED"
  
  return { grade, remarks }
}
```

---

## 📋 Implementation Steps

### Phase 1: Database Migration ✅
- [x] Create new schema with Department, ComponentDefinition, ComponentScore
- [ ] Backup existing database
- [ ] Run migration
- [ ] Test with sample data

### Phase 2: Server Actions
- [ ] Create department.actions.ts
- [ ] Update class.actions.ts (add new fields)
- [ ] Create componentDefinition.actions.ts
- [ ] Create componentScore.actions.ts
- [ ] Update grade.actions.ts (new calculation logic)

### Phase 3: UI Components
- [ ] Enhanced Class Form with all metadata
- [ ] Department management pages
- [ ] Dynamic Grading Criteria Manager
- [ ] Dynamic Component Manager (add/remove quizzes, activities)
- [ ] Grade Entry Spreadsheet (Excel-like interface)
- [ ] Grade calculation display

### Phase 4: Grade Entry System
- [ ] Spreadsheet-style grade entry
- [ ] Auto-calculation as scores are entered
- [ ] Save individual component scores
- [ ] Real-time grade computation
- [ ] Export to Excel matching original format

### Phase 5: Reporting
- [ ] Generate grade sheets matching Excel format
- [ ] Export with proper headers and formatting
- [ ] Print-ready PDF generation
- [ ] Grade summary reports

---

## 🎯 Next Steps

1. **Review and approve the new schema**
2. **Backup database**
3. **Run migration**: `npm run db:push`
4. **Create department management interface**
5. **Update class creation form**
6. **Build dynamic grading criteria manager**
7. **Implement grade entry spreadsheet**
8. **Test with real data**

---

## 📝 Notes

- Grade scale is 1.0-5.0 (not 0-100)
- Lower is better (1.0 = highest)
- Each category can have unlimited components
- Components can be added even after grading starts
- System auto-calculates all totals and equivalents
- Export format must exactly match the Excel template

---

**Ready to implement! Let me know when to proceed with each phase.** 🚀

