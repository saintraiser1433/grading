# 📊 How to View the Grade Entry Spreadsheet

## 🎯 Quick Access

### Option 1: Via Teacher Navigation (Easiest)
1. Login as a **Teacher**
2. Look at the left sidebar navigation
3. Click on **"Grade Entry Preview"**
4. You'll see the Excel-style grade entry interface!

### Option 2: Direct URL
Navigate to: `http://localhost:3000/teacher/grade-entry-preview`

---

## 👀 What You'll See

The preview page shows:
- ✅ **Class Header** - All metadata (instructor, dept head, subject, schedule, etc.)
- ✅ **Grading Criteria Manager** - Showing QUIZZES (40%), CLASS STANDING (20%), MAJOR EXAM (40%)
- ✅ **Grade Entry Table** - Excel-style spreadsheet with:
  - Student information columns
  - Dynamic component columns (Quiz 1, Quiz 2, Activity 1, etc.)
  - Auto-calculated TOTAL, GE (Grade Equivalent), WE (Weighted Equivalent)
  - Final MID GRADE column (1.0-5.0 scale)
  - Color-coded (green = passed, red = failed)
- ✅ **Grading Scale Legend** - 1.0-5.0 conversion table

---

## 📝 Current Preview Features

### Working:
- ✅ Display of class header information
- ✅ Grading categories with percentages
- ✅ Dynamic components (quizzes, activities)
- ✅ Input fields for scores
- ✅ Auto-calculation of totals and grades
- ✅ Visual formatting matching Excel

### Not Yet Connected:
- ⏳ Actual database integration
- ⏳ Saving grades
- ⏳ Loading real student data
- ⏳ Export to Excel functionality

---

## 🚀 Next Steps

This is currently a **PREVIEW/DEMO** component showing the interface design.

To make it fully functional, we need to:
1. ✅ Update database schema (already prepared in `schema-new.prisma`)
2. ⏳ Run database migration
3. ⏳ Create server actions for:
   - Managing departments
   - Managing grading criteria
   - Managing component definitions
   - Saving component scores
   - Calculating grades
4. ⏳ Connect the UI to real data
5. ⏳ Implement export functionality
6. ⏳ Add grade submission workflow

---

## 🎨 Navigation Added

I've added **"Grade Entry Preview"** to the teacher navigation menu with a clipboard icon.

It appears between:
- My Classes
- Grade Entry Preview ← **NEW**
- Grade Submissions

---

## ⚡ Quick Start

```bash
# Make sure your dev server is running
npm run dev

# Then:
# 1. Go to: http://localhost:3000/auth/login
# 2. Login as a teacher (or use seed data teacher account)
# 3. Click "Grade Entry Preview" in the sidebar
# 4. See the interface!
```

---

## 💡 Try It Out!

The preview shows:
- Sample class information (Glan Institute format)
- 2 sample students (Alampay, Wheendel with scores / Algarme, Christy Jane without scores)
- Dynamic grading categories
- Real-time grade calculations
- Excel-style table layout

**Play around with it and let me know what adjustments you'd like!** 🎓

