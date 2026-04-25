#!/bin/bash
# One-click restore script for Project Arjun - Session 3
echo "Restoring workspace files..."
cp MEMORY.md USER.md IDENTITY.md SOUL.md /root/.openclaw/workspace/
mkdir -p /root/.openclaw/workspace/memory
cp memory/*.md /root/.openclaw/workspace/memory/
cp AGENTS.md HEARTBEAT.md TOOLS.md /root/.openclaw/workspace/
cd gods-eye-maharashtra && npm install
echo "Restore complete! Run: npm run dev"
