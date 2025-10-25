# 📚 Grade Entry Workflow - Complete Guide

## 🎯 Understanding the System

### The Three Main Components:

1. **My Classes** - Where you manage your classes and access grade entry
2. **Midterm Grade** - First semester grades (40-50% of final)
3. **Final Grade** - Second semester grades (50-60% of final)

---

## 📋 Complete Workflow

### STEP 1: Create/View Classes (My Classes Page)

**Purpose**: Manage all your teaching assignments

**Location**: `/teacher/classes`

**What you see**:
```
┌─────────────────────────────────────────┐
│ [+ Create Class]                        │
├─────────────────────────────────────────┤
│ CS THESIS 1                             │
│ CS THESIS WRITING 1                     │
│ BSCS 4 - Section A                      │
│ 📅 2025-2026 - 1st Semester            │
│ 👥 39 students                          │
│ [View Class Details] [Enter Grades]    │
└─────────────────────────────────────────┘
```

**Actions**:
- View all your classes
- Click a class to see details
- Click "Enter Grades" to go to grade entry

---

### STEP 2: Class Details Page

**Location**: `/teacher/classes/[classId]`

**What you see**:
1. **Class Information**
   - Subject, Section, Schedule
   - Student list
   - Grading criteria

2. **Setup Grading Criteria** (One-time setup)
   ```
   MIDTERM:
   ├─ QUIZZES (40%)
   │  ├─ Add Quiz 1 (max: 10)
   │  ├─ Add Quiz 2 (max: 10)
   │  └─ Add Quiz 3 (max: 15)
   ├─ CLASS STANDING (20%)
   │  ├─ Add Attendance (max: 20)
   │  └─ Add Activity 1 (max: 10)
   └─ MAJOR EXAM (40%)
      └─ Add Written (max: 60)

   FINAL:
   ├─ QUIZZES (40%)
   │  ├─ Add Quiz 1 (max: 10)
   │  └─ Add Quiz 2 (max: 15)
   ├─ CLASS STANDING (20%)
   └─ MAJOR EXAM (40%)
   ```

3. **Tabs**:
   - Student List
   - **Midterm Grades** ← Enter midterm scores
   - **Final Grades** ← Enter final scores
   - Grade Submissions

---

### STEP 3A: Enter Midterm Grades

**Location**: `/teacher/classes/[classId]/grades?period=midterm`

**Purpose**: Record student performance for the first half of the semester

**Grade Entry Table**:
```
┌─────────────────────────────────────────────────────────────────┐
│          QUIZZES (40%)        │ CLASS STANDING (20%)│ EXAM (40%)│
│ Student    │Q1│Q2│Q3│TOT│GE│WE│ATT│A1│TOT│GE│WE│WRI│TOT│GE│WE│GRADE│
├────────────┼──┼──┼──┼───┼──┼──┼───┼──┼───┼──┼──┼───┼───┼──┼──┼─────┤
│ Alampay    │10│5 │10│25 │2.7│1.1│15│10│25│1.2│0.2│50│50│0.4│0.16│2.2│
│ Algarme    │  │  │  │   │  │  │  │  │  │  │  │  │  │  │   │ - │
└────────────┴──┴──┴──┴───┴──┴──┴───┴──┴───┴──┴──┴───┴───┴──┴──┴─────┘
```

**How to Add/Edit Grades**:
1. Click on any score cell
2. Type the score (e.g., "10" for Quiz 1)
3. Press Enter or Tab to move to next cell
4. System automatically calculates:
   - TOTAL (sum of all scores)
   - GE (Grade Equivalent in 1.0-5.0 scale)
   - WE (Weighted Equivalent)
   - MIDTERM GRADE (final grade)

**Actions**:
- `[Save]` - Save current grades (auto-saves as you type)
- `[Export Excel]` - Download as Excel file
- `[Submit for Approval]` - Send to Program Head/Admin

**Result**: Each student gets a **MIDTERM GRADE** (1.0 - 5.0)

---

### STEP 3B: Enter Final Grades

**Location**: `/teacher/classes/[classId]/grades?period=final`

**Purpose**: Record student performance for the second half of the semester

**Same process as midterm**, but for final period activities:
- Different quizzes (Quiz 4, Quiz 5, etc.)
- Different activities (Activity 3, Activity 4, etc.)
- Final exam

**Result**: Each student gets a **FINAL GRADE** (1.0 - 5.0)

---

## 🎓 Understanding Midterm vs Final Grades

### Midterm Grade (First Half)
- **When**: Middle of semester
- **Coverage**: Week 1 - Week 9
- **Components**:
  - Quizzes given in first half
  - Activities done in first half
  - Midterm exam
- **Weight**: Usually 40-50% of overall semester grade
- **Purpose**: 
  ✅ Track early performance
  ✅ Identify struggling students
  ✅ Allow intervention before finals

### Final Grade (Second Half)
- **When**: End of semester
- **Coverage**: Week 10 - Week 18
- **Components**:
  - Quizzes given in second half
  - Activities done in second half
  - Final exam
- **Weight**: Usually 50-60% of overall semester grade
- **Purpose**:
  ✅ Complete assessment
  ✅ Determine final standing

### Overall/Semester Grade
**Calculation**:
```
Overall Grade = (Midterm × 0.4) + (Final × 0.6)

Example:
Midterm: 2.2
Final: 1.8
Overall: (2.2 × 0.4) + (1.8 × 0.6) = 0.88 + 1.08 = 1.96 ≈ 2.0

Remarks: 2.0 ≤ 3.0 → PASSED
```

---

## 🔧 How to Add/Edit Grades (Technical)

### Current State (Preview)
The grade entry spreadsheet you see is a **PREVIEW**. It shows:
- ✅ The interface design
- ✅ Sample data
- ✅ How calculations work
- ❌ NOT connected to database yet

### When Fully Implemented:

#### To ADD grades:
1. Go to "My Classes"
2. Click on a class
3. Click "Midterm Grades" or "Final Grades" tab
4. See the spreadsheet
5. Click any empty cell
6. Type the score
7. Press Enter
8. System saves automatically

#### To EDIT grades:
1. Same as above
2. Click on a cell with existing score
3. Change the value
4. Press Enter
5. System updates and recalculates

#### Dynamic Components:
**Add more quizzes/activities**:
1. Click `[+ Add Component]` button
2. Select category (Quizzes, Class Standing, Exam)
3. Enter name (e.g., "Quiz 4")
4. Enter max score (e.g., 15)
5. Click Save
6. New column appears in spreadsheet

---

## 📊 Example: Complete Semester Flow

### Week 1-9 (MIDTERM PERIOD)

**Week 2**: Give Quiz 1
```
Teacher enters scores:
- Alampay: 8/10
- Algarme: 9/10
```

**Week 4**: Give Quiz 2
```
Teacher enters scores:
- Alampay: 7/10
- Algarme: 8/10
```

**Week 6**: Record Attendance
```
Teacher enters:
- Alampay: 18/20
- Algarme: 20/20
```

**Week 9**: Midterm Exam
```
Teacher enters:
- Alampay: 50/60
- Algarme: 55/60
```

**System calculates**:
```
Alampay: MIDTERM GRADE = 2.2
Algarme: MIDTERM GRADE = 1.8
```

**Teacher submits midterm grades to Admin**

---

### Week 10-18 (FINAL PERIOD)

**Week 11**: Give Quiz 3
**Week 13**: Give Activity 2
**Week 15**: Give Quiz 4
**Week 18**: Final Exam

**System calculates**:
```
Alampay: FINAL GRADE = 2.0
Algarme: FINAL GRADE = 1.5
```

**Teacher submits final grades to Admin**

---

### End of Semester

**System calculates OVERALL**:
```
Alampay:
  Midterm: 2.2 × 40% = 0.88
  Final:   2.0 × 60% = 1.20
  Overall: 2.08 ≈ 2.0 → PASSED

Algarme:
  Midterm: 1.8 × 40% = 0.72
  Final:   1.5 × 60% = 0.90
  Overall: 1.62 ≈ 1.75 → PASSED
```

---

## 🎯 Purpose of Each Component

### My Classes
**Purpose**: Class management hub
- View all your teaching assignments
- Access student lists
- Setup grading criteria
- Navigate to grade entry
- View submission status

### Midterm Grade
**Purpose**: Track first-half performance
- ✅ Early feedback for students
- ✅ Identify at-risk students
- ✅ Allow time for improvement
- ✅ Partial semester assessment
- ⚠️ Not final - students can still improve

### Final Grade
**Purpose**: Complete semester assessment
- ✅ Second-half performance
- ✅ Final determination
- ✅ Combined with midterm for overall
- ✅ Basis for course completion

### Overall Grade
**Purpose**: Final course grade
- ✅ Appears on transcript
- ✅ Counts toward GPA
- ✅ Determines PASS/FAIL
- ✅ Official record

---

## 🚀 Next Steps for Implementation

To make grade entry fully functional:

1. **Database Migration**
   - Apply new schema with dynamic components
   - Migrate existing data

2. **Server Actions**
   - Create/update grading criteria
   - Add/remove components
   - Save individual scores
   - Calculate grades automatically

3. **UI Integration**
   - Connect spreadsheet to real class data
   - Enable real-time saving
   - Add component management UI
   - Implement Excel export

4. **Workflow Integration**
   - Add grade entry to class detail page
   - Create midterm/final tabs
   - Enable submission workflow
   - Add approval process

---

## 📝 Summary

**My Classes** = Your teaching hub
**Midterm** = First half grades (40% weight)
**Final** = Second half grades (60% weight)
**Overall** = Combined semester grade

**Grade Entry Process**:
1. Setup class and criteria
2. Enter midterm scores → Get midterm grade
3. Submit midterm for approval
4. Enter final scores → Get final grade
5. Submit final for approval
6. System calculates overall grade
7. Student sees complete grade breakdown

---

**Ready to implement the full grade entry system? Let me know and I'll proceed! 🎓**

