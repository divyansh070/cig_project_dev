import os
import glob

def fix_api_ts():
    path = "frontend/src/lib/api.ts"
    with open(path, "r") as f:
        content = f.read()
    content = content.replace("const API_URL", "export const API_URL")
    with open(path, "w") as f:
        f.write(content)

def fix_tsx_files():
    files = [
        "frontend/src/app/dashboard/page.tsx",
        "frontend/src/app/face-search/page.tsx",
        "frontend/src/app/event/[id]/page.tsx"
    ]
    for path in files:
        if not os.path.exists(path):
            continue
        with open(path, "r") as f:
            content = f.read()
        
        # update import
        content = content.replace('import { api } from "@/lib/api";', 'import { api, API_URL } from "@/lib/api";')
        # update img src
        content = content.replace('http://localhost:8000', '${API_URL}')
        
        with open(path, "w") as f:
            f.write(content)

def fix_notifications():
    path = "frontend/src/components/NotificationsClient.tsx"
    if not os.path.exists(path):
        return
    with open(path, "r") as f:
        content = f.read()
    
    if "import { API_URL }" not in content:
        content = content.replace('import { useEffect, useState } from "react";', 'import { useEffect, useState } from "react";\nimport { API_URL } from "@/lib/api";')
    
    content = content.replace('const ws = new WebSocket("ws://localhost:8000/notifications/ws");', 
                              'const wsUrl = API_URL.replace("http://", "ws://").replace("https://", "wss://") + "/notifications/ws";\n        const ws = new WebSocket(wsUrl);')
    with open(path, "w") as f:
        f.write(content)

fix_api_ts()
fix_tsx_files()
fix_notifications()
