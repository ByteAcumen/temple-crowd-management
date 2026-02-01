# ⚡ QUICK FIX - Backend Not Responding

## 🎯 Copy-Paste Solution (3 Commands)

**Tell your friend to run these commands in PowerShell:**

```powershell
# 1. Go to project folder
cd D:\temple-crowd-management

# 2. Start everything
.\start-all.ps1

# 3. Test it
.\test-api.ps1
```

**That's it!** ✅

---

## 🔴 If Script Fails - Manual Start

Run each command **one by one**:

```powershell
# Command 1: Start MongoDB
docker run -d --name temple-mongo -p 27017:27017 mongo:latest

# Command 2: Start Redis  
docker run -d --name temple-redis -p 6379:6379 redis:alpine

# Command 3: Go to backend
cd D:\temple-crowd-management\backend

# Command 4: Install packages (first time only)
npm install

# Command 5: Start backend
node src/server.js
```

**Keep this window open!** The backend needs to stay running.

---

## 🧪 Test Backend is Working

Open a **NEW** PowerShell window:

```powershell
cd D:\temple-crowd-management
.\test-api.ps1
```

You should see: **"🎉 All tests passed!"**

---

## ⚠️ Common Errors

### "Port 5000 already in use"
```powershell
netstat -ano | findstr :5000
Stop-Process -Id <PID> -Force
```

### "MongoDB connection failed"
```powershell
docker start temple-mongo
```

### "Redis connection failed"
```powershell
docker start temple-redis
```

---

## 📞 Need More Help?

See full guide: `TROUBLESHOOTING.md`
