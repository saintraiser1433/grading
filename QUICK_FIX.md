# 🔧 Quick Fixes Needed

## Issues Found:

1. **Midterm criteria exceeds 100%** - Likely duplicate criteria in database
2. **No student values showing** - Grade sheet not loading data from database

## Solutions:

### Fix 1: Reset Grading Criteria

Delete existing criteria and recreate:

```bash
# Option 1: Use Prisma Studio (already opened)
# Navigate to GradingCriteria table
# Delete all records for the class
# Then run seed again

# Option 2: Quick reset via console
```

### Fix 2: Load Actual Grades in Component

The enhanced-grades-sheet.tsx needs to:
- Load grade components from database
- Display actual scores instead of empty fields
- Initialize student scores from database

Working on this now...

