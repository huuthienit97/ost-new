# Deployment Guide - Member Management System Fixes

## Summary of Changes

### 1. Swagger API Documentation Update
- ✅ Updated production URL from `https://clb-sang-tao.onrender.com` to `https://api.ost.edu.vn`
- ✅ Maintained development server URL for local testing
- ✅ All API endpoints now point to the correct production domain

### 2. Member Management System Fixes
- ✅ Completed transition from departments to divisions
- ✅ Fixed database queries to use `division_id` instead of `department_id`
- ✅ Updated member card display to show division information
- ✅ Fixed schema validation to require `divisionId` for new members
- ✅ Added division support in storage layer

### 3. Database Structure Verification
- ✅ All active members now have proper division assignments
- ✅ Database integrity maintained with 4 total members, all with valid divisions
- ✅ Member creation form now properly validates division selection

## Deployment Steps for VPS

### Step 1: Update Repository
```bash
# Navigate to your project directory on VPS
cd /path/to/your/project

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install
```

### Step 2: Restart Application
```bash
# If using PM2
pm2 restart all

# If using systemd
sudo systemctl restart your-app-service

# If using Docker
docker-compose restart
```

### Step 3: Verify Deployment
1. Visit: `https://api.ost.edu.vn/api-docs`
2. Confirm Swagger documentation loads with correct base URL
3. Test member management functionality:
   - Login to admin panel
   - Navigate to Members section
   - Verify member list loads properly
   - Test adding new member with division selection

## Technical Changes Made

### Updated Files:
- `server/swagger.ts` - Production URL updated
- `server/routes.ts` - Member queries fixed for divisions
- `client/src/components/member-card.tsx` - Display logic updated
- `shared/schema.ts` - Validation schema corrected
- `server/storage.ts` - Division methods added

### Database Verified:
- All members have valid `division_id` values
- No orphaned department references
- Schema consistency maintained

## Rollback Plan
If issues occur, revert to previous commit:
```bash
git log --oneline -5  # View recent commits
git revert <commit-hash>  # Revert problematic commit
```

## Testing Checklist
- [ ] Swagger API documentation accessible at production URL
- [ ] Member list loads without errors
- [ ] New member creation works with division selection
- [ ] Member cards display division information correctly
- [ ] All existing member data preserved

## Support Contact
For deployment assistance or issues, contact the development team with:
- Error logs from application
- Browser console errors (if frontend issues)
- Specific steps to reproduce any problems