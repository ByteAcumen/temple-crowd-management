# 🤝 Collaborator Guide - How to Pull Updates

This guide helps team members sync with the latest project updates.

---

## 📥 For Someone Who Already Has the Project

If your friend already cloned the project before, they just need to **pull** the latest changes:

### Quick Commands

```powershell
# Navigate to project folder
cd D:\temple-crowd-management  # Or wherever they cloned it

# Pull latest changes from GitHub
git pull origin main
```

That's it! ✅ They now have all your updates.

---

## 📦 For Someone Starting Fresh (First Time)

If your friend hasn't cloned the project yet:

### Step 1: Clone the Repository

```powershell
# Navigate to where they want the project
cd D:\Projects  # Or any folder they prefer

# Clone the repository
git clone https://github.com/ByteAcumen/temple-crowd-management.git

# Enter the project
cd temple-crowd-management
```

### Step 2: Start the Project

```powershell
# Install backend dependencies (if not using Docker)
cd backend
npm install
cd ..

# Start everything with Docker (recommended)
docker-compose up -d

# OR use the automated script
.\start-all.ps1

# Test it works
.\test-api.ps1
```

---

## 🔄 Daily Workflow for Collaborators

### Before Starting Work Each Day

```powershell
# 1. Pull latest changes
git pull origin main

# 2. If dependencies changed, reinstall
cd backend
npm install
cd ..

# 3. Restart services
docker-compose restart
# OR
.\start-all.ps1
```

### After Making Changes

```powershell
# 1. Check what changed
git status

# 2. Add your changes
git add .

# 3. Commit with a clear message
git commit -m "feat: Add temple CRUD endpoints"

# 4. Pull latest changes (in case someone else pushed)
git pull origin main

# 5. Push your changes
git push origin main
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Your local changes would be overwritten by merge"

**Problem**: Your friend made changes but didn't commit them, now they can't pull.

**Solution**:
```powershell
# Option A: Save their changes (recommended)
git stash              # Temporarily hide their changes
git pull origin main   # Pull updates
git stash pop          # Bring back their changes

# Option B: Discard their changes (if they don't need them)
git reset --hard HEAD  # ⚠️ This deletes all local changes!
git pull origin main
```

---

### Issue 2: "Merge conflict" after pull

**Problem**: Your friend and you edited the same file.

**Solution**:
```powershell
# 1. Git will mark conflicts in files like this:
# <<<<<<< HEAD
# Your friend's code
# =======
# Your code
# >>>>>>> main

# 2. Open the file and manually fix the conflict
# Keep what's needed, remove the markers

# 3. After fixing, commit the merge
git add .
git commit -m "fix: Resolve merge conflict in <filename>"
git push origin main
```

---

### Issue 3: "Permission denied (publickey)"

**Problem**: Git doesn't have permission to access your GitHub repo.

**Solution**:
```powershell
# Option A: Use HTTPS instead of SSH (simpler)
# Clone with HTTPS URL:
git clone https://github.com/ByteAcumen/temple-crowd-management.git

# Option B: Set up SSH keys (more secure)
# Follow: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

---

## 📱 Notify Team About Updates

After you push important changes, tell your friend:

### Via Message/Slack/WhatsApp:
```
"Hey! I just pushed updates to the project. 
Please run: git pull origin main

New changes:
- Added BEGINNER_GUIDE.md
- Fixed Redis config
- All tests passing now

Let me know if you face any issues!"
```

---

## 🔔 Check for Updates Regularly

Your friend should pull updates **before starting work** each day:

```powershell
# Morning routine
cd D:\temple-crowd-management
git pull origin main

# Check if there are any new changes
git log --oneline -5  # Shows last 5 commits
```

---

## 🎯 Quick Reference Cheat Sheet

| Task | Command |
|------|---------|
| Get latest updates | `git pull origin main` |
| Check what changed | `git status` |
| See commit history | `git log --oneline` |
| Discard local changes | `git reset --hard HEAD` |
| Save changes temporarily | `git stash` |
| Bring back stashed changes | `git stash pop` |

---

## 🆘 Emergency: "I messed up Git!"

If your friend completely breaks their Git setup:

```powershell
# NUCLEAR OPTION (last resort)
# 1. Backup any important changes they made
# 2. Delete the entire folder
# 3. Clone fresh from GitHub
cd D:\
rm -r -force temple-crowd-management
git clone https://github.com/ByteAcumen/temple-crowd-management.git
cd temple-crowd-management
.\start-all.ps1
```

---

## 👥 Best Practices for Team Collaboration

### 1. Pull Before Push (Always!)
```powershell
git pull origin main   # Get latest
git push origin main   # Then push yours
```

### 2. Write Clear Commit Messages
```powershell
# ❌ Bad
git commit -m "fixed stuff"

# ✅ Good
git commit -m "fix: Resolve MongoDB connection issue in production"
```

### 3. Communicate Changes
- Tell team before pushing big changes
- Create branches for experimental features
- Review code before pushing to main

### 4. Use Branches for Big Features (Advanced)
```powershell
# Create a branch for new feature
git checkout -b feature/temple-management

# Work on the feature, commit changes
git add .
git commit -m "feat: Add temple CRUD"

# Push branch to GitHub
git push origin feature/temple-management

# Later, merge to main (or create Pull Request on GitHub)
```

---

## 📞 Need Help?

If your friend has issues:
1. Check this guide first
2. Google the error message
3. Ask in team chat
4. GitHub Docs: https://docs.github.com/

---

**Quick Start for Your Friend**:
```powershell
cd temple-crowd-management
git pull origin main
.\start-all.ps1
```

That's all they need! 🚀
